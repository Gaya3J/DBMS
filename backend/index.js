const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
require("dotenv").config();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

const app = express();
const PORT = process.env.PORT || 5000;

// ADD MULTER CONFIGURATION HERE
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
    }

    cb(null, true);
  },
});

// Middleware
app.use(cors());
app.use(express.json());
// Upload mentor profile photo
app.post(
  "/api/mentors/upload-photo",
  upload.single("photo"),
  async (req, res) => {
    try {
      // 1. Get authentication token
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Authentication token is required.",
        });
      }

      const token = authHeader.split(" ")[1];

      // 2. Verify the logged-in user
      const { data: authData, error: authError } =
        await supabase.auth.getUser(token);

      if (authError || !authData.user) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired login session.",
        });
      }

      const user = authData.user;

      // 3. Create Supabase client using this user's token
      const userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        {
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
        }
      );

      // 4. Find the student's database record
      const { data: student, error: studentError } =
        await userSupabase
          .from("student")
          .select("student_id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (studentError) {
        console.error("Student lookup error:", studentError);

        return res.status(500).json({
          success: false,
          message: "Could not verify student profile.",
        });
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "No student profile is linked to this account yet.",
        });
      }

      // 5. Check uploaded image
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a photo.",
        });
      }

      // 6. Generate unique filename
      const extensions = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };

      const extension = extensions[req.file.mimetype];
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

      // 7. Upload to Supabase Storage
      const { error: uploadError } = await userSupabase.storage
        .from("mentor-photos")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("Photo upload error:", uploadError);

        return res.status(500).json({
          success: false,
          message: uploadError.message,
        });
      }

      // 8. Get public image URL
      const { data: publicUrlData } = userSupabase.storage
        .from("mentor-photos")
        .getPublicUrl(filePath);

      const photoUrl = publicUrlData.publicUrl;

      // 9. Save URL in student's record
      const { error: updateError } = await userSupabase
        .from("student")
        .update({
          profile_photo_url: photoUrl,
        })
        .eq("auth_user_id", user.id);

      if (updateError) {
        console.error("Photo URL update error:", updateError);

        return res.status(500).json({
          success: false,
          message: updateError.message,
        });
      }

      // 10. Send response
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

// Test route
app.get("/", (req, res) => {
  res.send("Cognitrade backend is running!");
});

// Test API route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Cognitrade API is working!",
  });
});

app.get("/api/mentors", async (req, res) => {
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
const { data: sessionData, error: sessionError } = await supabase
  .from("mentor_session_statistics")
  .select("mentor_id, total_sessions, average_rating");
  console.log("Session data received:", sessionData);
console.log("Session fetch error:", sessionError);
  if (sessionError) {
  console.error("Session fetch error:", sessionError);

  return res.status(500).json({
    success: false,
    message: "Could not fetch mentor session statistics.",
  });
}

  if (search) {
    const searchTerm = search.toLowerCase();

    const filteredData = (data ?? []).filter((row) => {
      const mentorName =
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.toLowerCase();

      const mentorBio = (row.mentor_bio ?? "").toLowerCase();
      const studentBio = (row.student_bio ?? "").toLowerCase();
      const serviceType = (row.service_type ?? "").toLowerCase();
      const serviceDescription =
        (row.service_description ?? "").toLowerCase();

      return (
        mentorName.includes(searchTerm) ||
        mentorBio.includes(searchTerm) ||
        studentBio.includes(searchTerm) ||
        serviceType.includes(searchTerm) ||
        serviceDescription.includes(searchTerm)
      );
    });

    data.splice(0, data.length, ...filteredData);
  }

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
const statsMap = new Map();

for (const session of sessionData ?? []) {
  statsMap.set(session.mentor_id, {
    totalSessions: Number(session.total_sessions),
    averageRating:
      session.average_rating === null
        ? null
        : Number(session.average_rating),
  });
}
  const mentorMap = new Map();

  for (const row of data ?? []) {
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

    if (row.service_id !== null) {
      mentorMap.get(row.mentor_id).services.push({
        service_id: row.service_id,
        service_type: row.service_type,
        description: row.service_description,
        subject_id: row.subject_id,
      });
    }
  }

 let mentors = Array.from(mentorMap.values());

if (sort === "top_rated") {
  mentors.sort((a, b) => {
    // Mentors without ratings should appear last
    if (a.average_rating === null) return 1;
    if (b.average_rating === null) return -1;

    return b.average_rating - a.average_rating;
  });
}
if (sort === "most_sessions") {
  mentors.sort((a, b) => {
    return b.total_sessions - a.total_sessions;
  });
}

res.json({
  success: true,
  mentors,
});
});
app.get("/api/subjects", async (req, res) => {
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
    subjects: data,
  });
});
app.get("/api/bookings", async (req, res) => {
  try {
    // 1. Verify authentication token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your bookings.",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify logged-in user
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired login session.",
      });
    }

    // 3. Create user-authenticated Supabase client
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      {
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
      }
    );

    // 4. Find the student's database record
    const { data: student, error: studentError } =
      await userSupabase
        .from("student")
        .select("student_id")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    // 5. Fetch this student's bookings
    const { data: bookings, error: bookingError } =
      await userSupabase
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

    // 6. Send bookings
    return res.status(200).json({
      success: true,
      bookings,
    });

  } catch (error) {
    console.error("Get bookings API error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching bookings.",
    });
  }
});
app.post("/api/bookings", async (req, res) => {
  try {
    // 1. Verify authentication token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please log in to book a session.",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify the logged-in user
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired login session.",
      });
    }

    // 3. Create a user-authenticated Supabase client
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      {
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
      }
    );

    // 4. Find the student's database record
    const { data: student, error: studentError } =
      await userSupabase
        .from("student")
        .select("student_id")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    // 5. Get booking details
    const { mentor_id, service_id, scheduled_time, message } = req.body;

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

    // 6. Verify that this service belongs to this mentor
    const { data: service, error: serviceError } =
      await userSupabase
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

    // 7. Save booking in the session table
    const { error: bookingError } = await userSupabase
      .from("session")
      .insert({
        mentor_id: mentorId,
        student_id: student.student_id,
        service_id: serviceId,
        scheduled_time: bookingDate.toISOString(),
        session_status: "pending",
      });

    if (bookingError) {
      console.error("Booking error:", bookingError);

      return res.status(500).json({
        success: false,
        message: "Could not create booking.",
      });
    }

    // 8. Send confirmation
    return res.status(201).json({
      success: true,
      message: "Booking request sent successfully!",
    });

  } catch (error) {
    console.error("Booking API error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the booking.",
    });
  }
});




app.get("/api/mentors/:id", async (req, res) => {
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

  const firstRow = data[0];

  const mentor = {
    mentor_id: firstRow.mentor_id,
    student_id: firstRow.student_id,
    first_name: firstRow.first_name,
    last_name: firstRow.last_name,
    mentor_bio: firstRow.mentor_bio,
    student_bio: firstRow.student_bio,
    profile_photo_url: firstRow.profile_photo_url,
    services: data
      .filter((row) => row.service_id !== null)
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
});
// Handle upload errors
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
      message: err.message,
    });
  }

  next();
});



app.listen(PORT, () => {
  console.log(`Cognitrade backend running at http://localhost:${PORT}`);
});
