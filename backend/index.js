const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
require("dotenv").config();

// Environment configuration with sensible fallbacks
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vupafdebdodndrclxjhb.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_RekbjwNkjt2Q8_PIw9FSUw_bQ-z0y-v";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Admin client (bypasses RLS when service_role key is supplied)
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

const app = express();
const PORT = process.env.PORT || 5000;

// Multer configuration for profile photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
    }

    cb(null, true);
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Create an authenticated Supabase client for a specific user token
function getUserSupabase(token) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Helper: Authenticate request bearer token
async function authenticateRequest(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required.",
    });
    return null;
  }

  const token = authHeader.split(" ")[1];

  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData?.user) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired login session.",
    });
    return null;
  }

  const user = authData.user;
  const userSupabase = getUserSupabase(token);
  // Prefer admin client if service role key is configured to avoid client RLS policy recursion
  const dbClient = supabaseAdmin || userSupabase;

  return { user, token, userSupabase, dbClient };
}

// Helper: Find or auto-provision student record for an authenticated user
async function getOrCreateStudent(dbClient, authUser) {
  // 1. Try finding existing student record by auth_user_id
  const { data: existingStudent, error: findError } = await dbClient
    .from("student")
    .select("student_id, auth_user_id, first_name, last_name, email, profile_photo_url")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (findError) {
    console.error("Find student error:", findError);
    if (findError.code === "42P17") {
      throw new Error(
        "Database RLS policy error: Infinite recursion on 'student' table. In your Supabase SQL Editor, run: ALTER TABLE student DISABLE ROW LEVEL SECURITY; or add SUPABASE_SERVICE_ROLE_KEY to backend/.env."
      );
    }
  }

  if (existingStudent) {
    return existingStudent;
  }

  // 2. If no student record exists, create one from user metadata
  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "Student";

  const nameParts = fullName.trim().split(/\s+/);
  const firstName = authUser.user_metadata?.first_name || nameParts[0] || "Student";
  const lastName =
    authUser.user_metadata?.last_name ||
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

  const { data: createdStudent, error: insertError } = await dbClient
    .from("student")
    .insert({
      auth_user_id: authUser.id,
      first_name: firstName,
      last_name: lastName,
      email: authUser.email,
    })
    .select("student_id, auth_user_id, first_name, last_name, email, profile_photo_url")
    .maybeSingle();

  if (insertError) {
    console.error("Auto-provision student error:", insertError.message);
    if (insertError.code === "42P17") {
      throw new Error(
        "Database RLS policy error: Infinite recursion on 'student' table. In your Supabase SQL Editor, run: ALTER TABLE student DISABLE ROW LEVEL SECURITY; or add SUPABASE_SERVICE_ROLE_KEY to backend/.env."
      );
    }
    return null;
  }

  return createdStudent;
}

// --- Health and Root Routes ---

app.get("/", (req, res) => {
  res.send("Cognitrade backend is running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Cognitrade API is working!",
    timestamp: new Date().toISOString(),
  });
});

// --- Subjects Route ---

app.get("/api/subjects", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("subject")
      .select("subject_id, subject_name")
      .order("subject_name");

    if (error) {
      console.error("Subjects fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Could not fetch subjects.",
      });
    }

    res.json({
      success: true,
      subjects: data || [],
    });
  } catch (err) {
    console.error("Subjects API error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch subjects.",
    });
  }
});

// --- Mentors Routes ---

app.get("/api/mentors", async (req, res) => {
  try {
    const search = req.query.q?.trim();
    const subjectId = req.query.subject_id;
    const sort = req.query.sort || "recommended";

    let query = supabase
      .from("mentor_public_profiles")
      .select(`
        mentor_id,
        student_id,
        first_name,
        last_name,
        mentor_bio,
        student_bio,
        service_id,
        service_type,
        service_description,
        subject_id,
        profile_photo_url
      `)
      .order("mentor_id");

    if (subjectId) {
      query = query.eq("subject_id", Number(subjectId));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Mentors query error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // Fetch session statistics safely (do not fail endpoint if stats view is empty/errored)
    const { data: sessionData, error: sessionError } = await supabase
      .from("mentor_session_statistics")
      .select("mentor_id, total_sessions, average_rating");

    if (sessionError) {
      console.warn("Session statistics fetch warning:", sessionError.message);
    }

    const statsMap = new Map();
    for (const session of sessionData ?? []) {
      statsMap.set(session.mentor_id, {
        totalSessions: Number(session.total_sessions || 0),
        averageRating:
          session.average_rating === null || session.average_rating === undefined
            ? null
            : Number(session.average_rating),
      });
    }

    // Filter by search query if provided
    let rows = data || [];
    if (search) {
      const searchTerm = search.toLowerCase();
      rows = rows.filter((row) => {
        const mentorName = `${row.first_name ?? ""} ${row.last_name ?? ""}`.toLowerCase();
        const mentorBio = (row.mentor_bio ?? "").toLowerCase();
        const studentBio = (row.student_bio ?? "").toLowerCase();
        const serviceType = (row.service_type ?? "").toLowerCase();
        const serviceDescription = (row.service_description ?? "").toLowerCase();

        return (
          mentorName.includes(searchTerm) ||
          mentorBio.includes(searchTerm) ||
          studentBio.includes(searchTerm) ||
          serviceType.includes(searchTerm) ||
          serviceDescription.includes(searchTerm)
        );
      });
    }

    // Group rows by mentor_id to aggregate services
    const mentorMap = new Map();
    for (const row of rows) {
      if (!mentorMap.has(row.mentor_id)) {
        const stats = statsMap.get(row.mentor_id) ?? {
          totalSessions: 0,
          averageRating: null,
        };

        mentorMap.set(row.mentor_id, {
          mentor_id: row.mentor_id,
          student_id: row.student_id,
          first_name: row.first_name,
          last_name: row.last_name,
          mentor_bio: row.mentor_bio,
          student_bio: row.student_bio,
          profile_photo_url: row.profile_photo_url,
          total_sessions: stats.totalSessions,
          average_rating: stats.averageRating,
          services: [],
        });
      }

      if (row.service_id !== null && row.service_id !== undefined) {
        mentorMap.get(row.mentor_id).services.push({
          service_id: row.service_id,
          service_type: row.service_type,
          description: row.service_description,
          subject_id: row.subject_id,
        });
      }
    }

    let mentors = Array.from(mentorMap.values());

    // Sort mentors
    if (sort === "top_rated") {
      mentors.sort((a, b) => {
        if (a.average_rating === null && b.average_rating === null) return 0;
        if (a.average_rating === null) return 1;
        if (b.average_rating === null) return -1;
        return b.average_rating - a.average_rating;
      });
    } else if (sort === "most_sessions") {
      mentors.sort((a, b) => (b.total_sessions || 0) - (a.total_sessions || 0));
    }

    res.json({
      success: true,
      mentors,
    });
  } catch (err) {
    console.error("Get mentors API error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to load mentors.",
    });
  }
});

app.get("/api/mentors/:id", async (req, res) => {
  try {
    const mentorId = Number(req.params.id);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID",
      });
    }

    const { data, error } = await supabase
      .from("mentor_public_profiles")
      .select(`
        mentor_id,
        student_id,
        first_name,
        last_name,
        mentor_bio,
        student_bio,
        service_id,
        service_type,
        service_description,
        subject_id,
        profile_photo_url
      `)
      .eq("mentor_id", mentorId);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
        mentorId,
      });
    }

    // Get statistics
    const { data: statsData } = await supabase
      .from("mentor_session_statistics")
      .select("total_sessions, average_rating")
      .eq("mentor_id", mentorId)
      .maybeSingle();

    const firstRow = data[0];
    const mentor = {
      mentor_id: firstRow.mentor_id,
      student_id: firstRow.student_id,
      first_name: firstRow.first_name,
      last_name: firstRow.last_name,
      mentor_bio: firstRow.mentor_bio,
      student_bio: firstRow.student_bio,
      profile_photo_url: firstRow.profile_photo_url,
      total_sessions: statsData?.total_sessions ? Number(statsData.total_sessions) : 0,
      average_rating:
        statsData?.average_rating !== undefined && statsData?.average_rating !== null
          ? Number(statsData.average_rating)
          : null,
      services: data
        .filter((row) => row.service_id !== null && row.service_id !== undefined)
        .map((row) => ({
          service_id: row.service_id,
          service_type: row.service_type,
          description: row.service_description,
          subject_id: row.subject_id,
        })),
    };

    res.json({
      success: true,
      mentor,
    });
  } catch (err) {
    console.error("Get mentor by id error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to load mentor details.",
    });
  }
});

// --- Profile Photo Upload ---

app.post(
  "/api/mentors/upload-photo",
  upload.single("photo"),
  async (req, res) => {
    try {
      const authResult = await authenticateRequest(req, res);
      if (!authResult) return;
      const { user, userSupabase, dbClient } = authResult;

      const student = await getOrCreateStudent(dbClient, user);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Could not find or create student profile.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a photo.",
        });
      }

      const extensions = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };

      const extension = extensions[req.file.mimetype] || "jpg";
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await userSupabase.storage
        .from("mentor-photos")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: uploadError.message,
        });
      }

      const { data: publicUrlData } = userSupabase.storage
        .from("mentor-photos")
        .getPublicUrl(filePath);

      const photoUrl = publicUrlData.publicUrl;

      const { error: updateError } = await userSupabase
        .from("student")
        .update({ profile_photo_url: photoUrl })
        .eq("student_id", student.student_id);

      if (updateError) {
        console.error("Photo URL update error:", updateError);
        return res.status(500).json({
          success: false,
          message: updateError.message,
        });
      }

      return res.json({
        success: true,
        message: "Profile photo uploaded successfully!",
        photo_url: photoUrl,
        student_id: student.student_id,
      });
    } catch (error) {
      console.error("Upload route error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Something went wrong.",
      });
    }
  }
);

// --- Bookings / Sessions Routes ---

// GET: Fetch the logged-in student's bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const authResult = await authenticateRequest(req, res);
    if (!authResult) return;
    const { user, userSupabase, dbClient } = authResult;

    let student;
    try {
      student = await getOrCreateStudent(dbClient, user);
    } catch (studentErr) {
      return res.status(500).json({
        success: false,
        message: studentErr.message,
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    // Fetch this student's sessions directly
    const { data: bookings, error: bookingError } = await dbClient
      .from("session")
      .select(`
        session_id,
        mentor_id,
        student_id,
        service_id,
        scheduled_time,
        session_status,
        meeting_link,
        rating_by_student,
        review_by_student
      `)
      .eq("student_id", student.student_id)
      .order("scheduled_time", { ascending: false });

    if (bookingError) {
      console.error("Fetch bookings error:", bookingError);
      return res.status(500).json({
        success: false,
        message: "Could not fetch bookings.",
      });
    }

    // Enrich bookings with mentor and service details from mentor_public_profiles
    const enrichedBookings = await Promise.all(
      (bookings || []).map(async (booking) => {
        let mentorName = "Mentor";
        let serviceName = "Session";

        // Lookup mentor and service
        const { data: mentorData } = await userSupabase
          .from("mentor_public_profiles")
          .select("first_name, last_name, service_type")
          .eq("mentor_id", booking.mentor_id)
          .eq("service_id", booking.service_id)
          .maybeSingle();

        if (mentorData) {
          mentorName = `${mentorData.first_name || ""} ${mentorData.last_name || ""}`.trim() || "Mentor";
          serviceName = mentorData.service_type || "Mentoring Session";
        } else {
          // Fallback: lookup by mentor_id alone
          const { data: fallbackMentor } = await userSupabase
            .from("mentor_public_profiles")
            .select("first_name, last_name, service_type")
            .eq("mentor_id", booking.mentor_id)
            .limit(1)
            .maybeSingle();

          if (fallbackMentor) {
            mentorName = `${fallbackMentor.first_name || ""} ${fallbackMentor.last_name || ""}`.trim() || "Mentor";
            serviceName = fallbackMentor.service_type || "Mentoring Session";
          }
        }

        return {
          ...booking,
          mentor_name: mentorName,
          service_name: serviceName,
        };
      })
    );

    return res.status(200).json({
      success: true,
      bookings: enrichedBookings,
    });
  } catch (error) {
    console.error("Get bookings API error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching bookings.",
    });
  }
});

// POST: Create a new booking
app.post("/api/bookings", async (req, res) => {
  try {
    const authResult = await authenticateRequest(req, res);
    if (!authResult) return;
    const { user, userSupabase, dbClient } = authResult;

    let student;
    try {
      student = await getOrCreateStudent(dbClient, user);
    } catch (studentErr) {
      return res.status(500).json({
        success: false,
        message: studentErr.message,
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const { mentor_id, service_id, scheduled_time } = req.body;

    if (!mentor_id || !service_id || !scheduled_time) {
      return res.status(400).json({
        success: false,
        message: "Mentor, service, date and time are required.",
      });
    }

    const mentorId = Number(mentor_id);
    const serviceId = Number(service_id);
    const bookingDate = new Date(scheduled_time);

    if (
      !Number.isInteger(mentorId) ||
      mentorId <= 0 ||
      !Number.isInteger(serviceId) ||
      serviceId <= 0 ||
      Number.isNaN(bookingDate.getTime()) ||
      bookingDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid booking details and a future date.",
      });
    }

    // Verify service belongs to selected mentor
    const { data: service, error: serviceError } = await userSupabase
      .from("mentor_public_profiles")
      .select("service_id")
      .eq("mentor_id", mentorId)
      .eq("service_id", serviceId)
      .maybeSingle();

    if (serviceError || !service) {
      return res.status(400).json({
        success: false,
        message: "This service does not belong to the selected mentor.",
      });
    }

    // Generate meeting link
    const meetingCode = `${crypto.randomBytes(3).toString("hex")}-${crypto.randomBytes(3).toString("hex")}`;
    const meetingLink = `https://meet.google.com/${meetingCode}`;

    const { data: newSession, error: bookingError } = await userSupabase
      .from("session")
      .insert({
        mentor_id: mentorId,
        student_id: student.student_id,
        service_id: serviceId,
        scheduled_time: bookingDate.toISOString(),
        session_status: "pending",
        meeting_link: meetingLink,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking error:", bookingError);
      return res.status(500).json({
        success: false,
        message: "Could not create booking.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Booking request sent successfully!",
      booking: newSession,
    });
  } catch (error) {
    console.error("Booking API error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the booking.",
    });
  }
});

// PATCH: Cancel a booking (by student)
app.patch("/api/bookings/:id/cancel", async (req, res) => {
  try {
    const authResult = await authenticateRequest(req, res);
    if (!authResult) return;
    const { user, userSupabase, dbClient } = authResult;

    let student;
    try {
      student = await getOrCreateStudent(dbClient, user);
    } catch (studentErr) {
      return res.status(500).json({
        success: false,
        message: studentErr.message,
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    // Update only this student's pending booking
    const { data: booking, error: bookingError } = await userSupabase
      .from("session")
      .update({ session_status: "cancelled" })
      .eq("session_id", bookingId)
      .eq("student_id", student.student_id)
      .eq("session_status", "pending")
      .select("session_id, session_status")
      .maybeSingle();

    if (bookingError) {
      console.error("Cancel booking error:", bookingError);
      return res.status(500).json({
        success: false,
        message: "Could not cancel booking.",
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found, does not belong to you, or is no longer pending.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully!",
      booking,
    });
  } catch (error) {
    console.error("Cancel booking API error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while cancelling the booking.",
    });
  }
});

// PATCH: Rate and review a booking
app.patch("/api/bookings/:id/review", async (req, res) => {
  try {
    const authResult = await authenticateRequest(req, res);
    if (!authResult) return;
    const { user, userSupabase, dbClient } = authResult;

    let student;
    try {
      student = await getOrCreateStudent(dbClient, user);
    } catch (studentErr) {
      return res.status(500).json({
        success: false,
        message: studentErr.message,
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const bookingId = Number(req.params.id);
    const { rating, review } = req.body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5.",
      });
    }

    const { data: booking, error } = await userSupabase
      .from("session")
      .update({
        rating_by_student: numericRating,
        review_by_student: review?.trim() || null,
      })
      .eq("session_id", bookingId)
      .eq("student_id", student.student_id)
      .select("session_id, rating_by_student, review_by_student")
      .maybeSingle();

    if (error || !booking) {
      return res.status(400).json({
        success: false,
        message: "Could not update review.",
      });
    }

    return res.json({
      success: true,
      message: "Thank you for submitting your review!",
      booking,
    });
  } catch (error) {
    console.error("Review booking error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit review.",
    });
  }
});

// --- Wishlist Routes ---

// GET: Fetch the logged-in student's wishlist
app.get("/api/wishlist", async (req, res) => {
  try {
    const authResult = await authenticateRequest(req, res);
    if (!authResult) return;
    const { user, userSupabase, dbClient } = authResult;

    let student;
    try {
      student = await getOrCreateStudent(dbClient, user);
    } catch (studentErr) {
      return res.status(500).json({
        success: false,
        message: studentErr.message,
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const { data: saved, error: wishlistError } = await userSupabase
      .from("wishlist")
      .select("mentor_id")
      .eq("student_id", student.student_id);

    if (wishlistError) throw wishlistError;

    const mentorIds = (saved || []).map((item) => item.mentor_id);

    if (mentorIds.length === 0) {
      return res.json({
        success: true,
        wishlist: [],
        mentors: [],
      });
    }

    const { data: profiles, error: profileError } = await supabase
      .from("mentor_public_profiles")
      .select("*")
      .in("mentor_id", mentorIds);

    if (profileError) throw profileError;

    // Fetch session statistics for saved mentors
    const { data: sessionData } = await supabase
      .from("mentor_session_statistics")
      .select("mentor_id, total_sessions, average_rating")
      .in("mentor_id", mentorIds);

    const statsMap = new Map();
    for (const session of sessionData ?? []) {
      statsMap.set(session.mentor_id, {
        totalSessions: Number(session.total_sessions || 0),
        averageRating:
          session.average_rating === null || session.average_rating === undefined
            ? null
            : Number(session.average_rating),
      });
    }

    const mentorMap = new Map();

    for (const row of profiles || []) {
      if (!mentorMap.has(row.mentor_id)) {
        const stats = statsMap.get(row.mentor_id) ?? {
          totalSessions: 0,
          averageRating: null,
        };

        mentorMap.set(row.mentor_id, {
          mentor_id: row.mentor_id,
          student_id: row.student_id,
          first_name: row.first_name,
          last_name: row.last_name,
          mentor_bio: row.mentor_bio,
          student_bio: row.student_bio,
          profile_photo_url: row.profile_photo_url,
          total_sessions: stats.totalSessions,
          average_rating: stats.averageRating,
          services: [],
        });
      }

      if (row.service_id !== null && row.service_id !== undefined) {
        mentorMap.get(row.mentor_id).services.push({
          service_id: row.service_id,
          service_type: row.service_type,
          description: row.service_description,
          subject_id: row.subject_id,
        });
      }
    }

    const mentorList = Array.from(mentorMap.values());
    return res.json({
      success: true,
      wishlist: mentorList,
      mentors: mentorList,
    });
  } catch (error) {
    console.error("Fetch wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not fetch wishlist.",
    });
  }
});

// POST: Add a mentor to the wishlist
app.post("/api/wishlist", async (req, res) => {
  try {
    const authResult = await authenticateRequest(req, res);
    if (!authResult) return;
    const { user, userSupabase, dbClient } = authResult;

    let student;
    try {
      student = await getOrCreateStudent(dbClient, user);
    } catch (studentErr) {
      return res.status(500).json({
        success: false,
        message: studentErr.message,
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const mentorId = Number(req.body.mentor_id);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID.",
      });
    }

    const { error: insertError } = await dbClient.from("wishlist").insert({
      student_id: student.student_id,
      mentor_id: mentorId,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "This mentor is already in your wishlist.",
        });
      }
      throw insertError;
    }

    return res.status(201).json({
      success: true,
      message: "Mentor added to wishlist!",
    });
  } catch (error) {
    console.error("Add wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not save mentor.",
    });
  }
});

// DELETE: Remove a mentor from the wishlist
app.delete("/api/wishlist/:mentorId", async (req, res) => {
  try {
    const authResult = await authenticateRequest(req, res);
    if (!authResult) return;
    const { user, userSupabase, dbClient } = authResult;

    let student;
    try {
      student = await getOrCreateStudent(dbClient, user);
    } catch (studentErr) {
      return res.status(500).json({
        success: false,
        message: studentErr.message,
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const mentorId = Number(req.params.mentorId);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID.",
      });
    }

    const { data: deleted, error: deleteError } = await dbClient
      .from("wishlist")
      .delete()
      .eq("student_id", student.student_id)
      .eq("mentor_id", mentorId)
      .select("mentor_id");

    if (deleteError) throw deleteError;

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mentor was not found in your wishlist.",
      });
    }

    return res.json({
      success: true,
      message: "Mentor removed from wishlist!",
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not remove mentor.",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be smaller than 2 MB."
          : err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }

  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Cognitrade backend running at http://localhost:${PORT}`);
});
