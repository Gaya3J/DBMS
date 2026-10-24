import { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabaseClient"
import type { User } from "@supabase/supabase-js"

type Page = "home" | "login" | "signup" | "logout" | "dashboard" | "mentors" | "groups" | "resources" | "schedule" | "mentor-dashboard" | "mentor-requests" | "mentor-students" | "mentor-availability" | "mentor-resources" | "mentor-profile"
type IconName = "arrow" | "bell" | "book" | "calendar" | "check" | "chevron" | "clock" | "close" | "download" | "filter" | "grid" | "group" | "heart" | "home" | "menu" | "message" | "more" | "play" | "plus" | "search" | "spark" | "star" | "target" | "video"

const mentorImages = [
  "https://images.unsplash.com/photo-1662850886700-4ec19bd30d11?auto=format&fit=crop&w=480&q=84",
  "https://images.unsplash.com/photo-1790575188470-99aa698b7a05?auto=format&fit=crop&w=480&q=84",
  "https://images.unsplash.com/photo-1583902449898-3b78e2e8d180?auto=format&fit=crop&w=480&q=84",
  "https://images.unsplash.com/photo-1745197375167-884c1ab268cb?auto=format&fit=crop&w=480&q=84",
  "https://images.unsplash.com/photo-1757744705465-ea08b0ddc38a?auto=format&fit=crop&w=480&q=84",
  "https://images.unsplash.com/photo-1554093466-0954b2674fce?auto=format&fit=crop&w=480&q=84",
]

const mentors = [
  {
    name: "Maya Chen",
    role: "Computer Science",
    school: "Stanford University",
    rating: "4.9",
    sessions: 86,
    skills: ["Python", "Algorithms"],
    image: mentorImages[0],
    available: true,
  },
  {
    name: "Noah Williams",
    role: "Product Designer",
    school: "RISD",
    rating: "4.8",
    sessions: 64,
    skills: ["UI/UX", "Figma"],
    image: mentorImages[1],
    available: true,
  },
  {
    name: "Ethan Brooks",
    role: "Data Science",
    school: "Georgia Tech",
    rating: "5.0",
    sessions: 102,
    skills: ["SQL", "Machine Learning"],
    image: mentorImages[2],
    available: false,
  },
  {
    name: "Leila Patel",
    role: "Software Engineering",
    school: "UC Berkeley",
    rating: "4.9",
    sessions: 73,
    skills: ["React", "Web Development"],
    image: mentorImages[3],
    available: true,
  },
  {
    name: "Julian Reed",
    role: "Business Analytics",
    school: "NYU",
    rating: "4.7",
    sessions: 51,
    skills: ["Excel", "Statistics"],
    image: mentorImages[4],
    available: false,
  },
  {
    name: "Sofia Nguyen",
    role: "Database Systems",
    school: "UT Austin",
    rating: "4.9",
    sessions: 92,
    skills: ["Databases", "PostgreSQL"],
    image: mentorImages[5],
    available: true,
  },
]

const Icon = ({ name, size = 20 }: { name: IconName; size?: number }) => {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
        <path d="M8 7h8M8 11h6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 5-5m-5 5-5-5" />
        <path d="M5 20h14" />
      </>
    ),
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    group: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    message: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
        <path d="m19 14 .8 2.2 2.2.8-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v3M21 12h-3" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m16 10 5-3v10l-5-3Z" />
      </>
    ),
  }
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const Logo = ({
  light = false,
  onClick,
}: {
  light?: boolean
  onClick?: () => void
}) => (
  <button
    className={`logo ${light ? "logo-light" : ""}`}
    onClick={onClick ?? (() => window.scrollTo({ top: 0, behavior: "smooth" }))}
  >
    <span className="logo-mark">
      <span />
      <span />
      <span />
    </span>
    <span>Cognitrade</span>
  </button>
)

const Avatar = ({
  src,
  name,
  small = false,
}: {
  src: string
  name: string
  small?: boolean
}) => (
  <img
    className={`avatar ${small ? "avatar-small" : ""}`}
    src={src}
    alt={`${name} profile`}
  />
)

function Button({
  children,
  kind = "primary",
  icon,
  onClick,
  className = "",
}: {
  children: React.ReactNode
  kind?: "primary" | "secondary" | "ghost" | "light"
  icon?: IconName
  onClick?: () => void
  className?: string
}) {
  return (
    <button className={`btn btn-${kind} ${className}`} onClick={onClick}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

function LoginPage({ go }: { go: (page: Page) => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    if (!email || !password) {
      setError("Enter your email and password to continue.")
      return
    }
    setLoading(true)
    setError("")
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    go("dashboard")
  }

  const signInWithGoogle = async () => {
    setError("")
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (authError) {
      setError(authError.message)
    }
  }

  return (
    <div className="auth-page">
      <main className="auth-form-panel">
        <button className="auth-back" onClick={() => go("home")}>
          <Icon name="arrow" size={16} /> Back to home
        </button>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span className="kicker">WELCOME BACK</span>
            <h2>Sign in to Cognitrade</h2>
            <p>Enter your details to access your workspace.</p>
          </div>
          <div className="social-login">
            <button onClick={signInWithGoogle}>
              <strong>G</strong> Continue with Google
            </button>
          </div>
          <div className="auth-divider">
            <span>or continue with email</span>
          </div>
          <div className="auth-fields">
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError("")
                }}
                placeholder="alex@university.edu"
              />
            </label>
            <label>
              <span>
                Password <button type="button">Forgot password?</button>
              </span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError("")
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(event) => event.key === "Enter" && signIn()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error && <p className="auth-error">{error}</p>}
            <label className="remember-row">
              <input type="checkbox" /> Keep me signed in
            </label>
            <Button className="full-button" onClick={signIn} disabled={loading}>
              {loading ? "Signing in..." : "Sign in"} <Icon name="arrow" size={17} />
            </Button>
          </div>
          <p className="auth-signup">
            New to Cognitrade?{" "}
            <button onClick={() => go("signup")}>Create a free account</button>
          </p>
        </div>
      </main>
    </div>
  )
}

function SignupPage({ go }: { go: (page: Page) => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const createAccount = async () => {
    if (!form.name || !form.email || form.password.length < 6) {
      setError(
        "Complete every field and use at least 6 characters for your password.",
      )
      return
    }
    setLoading(true)
    setError("")
    setSuccess("")
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
        },
      },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }

    if (data?.session) {
      go("dashboard")
    } else {
      setSuccess("Account created! If email confirmation is enabled on your Supabase project, check your inbox to verify your email.")
    }
  }

  return (
    <div className="auth-page signup-page">
      <main className="auth-form-panel signup-form-panel">
        <button className="auth-back" onClick={() => go("home")}>
          <Icon name="arrow" size={16} /> Back to home
        </button>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span className="kicker">GET STARTED</span>
            <h2>Create your account</h2>
            <p>
              Tell us a little about yourself to personalize your workspace.
            </p>
          </div>
          <div className="auth-fields signup-fields">
            <label>
              Full name
              <input
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value })
                  setError("")
                }}
                placeholder="Alex Morgan"
              />
            </label>
            <label>
              University email
              <input
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm({ ...form, email: event.target.value })
                  setError("")
                }}
                placeholder="alex@university.edu"
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => {
                    setForm({ ...form, password: event.target.value })
                    setError("")
                  }}
                  placeholder="At least 6 characters"
                  onKeyDown={(event) =>
                    event.key === "Enter" && createAccount()
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success" style={{ color: "green", fontSize: "0.9rem", margin: "8px 0" }}>{success}</p>}
            <label className="remember-row terms-row">
              <input type="checkbox" defaultChecked /> I agree to the Terms and
              Privacy Policy
            </label>
            <Button className="full-button" onClick={createAccount} disabled={loading}>
              {loading ? "Creating account..." : "Create my account"} <Icon name="arrow" size={17} />
            </Button>
          </div>
          <p className="auth-signup">
            Already have an account?{" "}
            <button onClick={() => go("login")}>Sign in</button>
          </p>
        </div>
      </main>
    </div>
  )
}

function LogoutPage({ go, user }: { go: (page: Page) => void; user?: User | null }) {
  useEffect(() => {
    supabase.auth.signOut()
  }, [])

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there"

  return (
    <div className="logout-page">
      <Logo onClick={() => go("home")} />
      <div className="logout-card">
        <span className="logout-icon">
          <Icon name="check" size={27} />
        </span>
        <span className="kicker">SIGNED OUT</span>
        <h1>See you next time, {displayName}</h1>
        <p>
          You’ve been safely signed out. Your learning progress and mentor
          workspace will be ready when you return.
        </p>
        <Button className="full-button" onClick={() => go("login")}>
          Sign in again
        </Button>
        <button className="text-link logout-home" onClick={() => go("home")}>
          Return to homepage <Icon name="arrow" size={15} />
        </button>
      </div>
    </div>
  )
}

function MentorCard({
  mentor,
  onBook,
  showSchool = true,
}: {
  mentor: typeof mentors[number]
  onBook?: () => void
  showSchool?: boolean
}) {
  const [saved, setSaved] = useState(false)
  return (
    <article className="mentor-card">
      <div className="mentor-card-top">
        <div className="mentor-photo-wrap">
          <img
            className="mentor-photo"
            src={mentor.image}
            alt={`${mentor.name}, ${mentor.role} mentor`}
          />
          <span
            className={`online-dot ${mentor.available ? "is-online" : ""}`}
          />
        </div>
        <button
          className={`icon-button save ${saved ? "saved" : ""}`}
          onClick={() => setSaved(!saved)}
          aria-label={`Save ${mentor.name}`}
        >
          <Icon name="heart" size={19} />
        </button>
      </div>
      <div className="mentor-details">
        <div className="mentor-title-row">
          <h3>{mentor.name}</h3>
          <span className="rating">
            <Icon name="star" size={14} /> {mentor.rating}
          </span>
        </div>
        <p className="role">{mentor.role}</p>
        {showSchool && <p className="school">{mentor.school}</p>}
        <div className="tag-row">
          {mentor.skills.map((skill) => (
            <span className="tag" key={skill}>
              {skill}
            </span>
          ))}
        </div>
        <div className="mentor-footer">
          <span>
            <strong>{mentor.sessions}</strong> sessions
          </span>
          <button className="text-link" onClick={onBook}>
            View profile <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

function PublicHome({ go }: { go: (page: Page) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="public-page">
      <header className="public-header">
        <div className="container nav-inner">
          <Logo light onClick={() => go("home")} />
          <nav className={`public-nav ${mobileOpen ? "open" : ""}`}>
            <button onClick={() => go("mentors")}>Explore mentors</button>
            <button
              onClick={() =>
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How it works
            </button>
            <button>Help</button>
            <button className="login-link" onClick={() => go("login")}>
              Log in
            </button>
            <Button kind="light" onClick={() => go("signup")}>
              Sign Up
            </Button>
          </nav>
          <button
            className="mobile-menu light"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <Icon name={mobileOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-heading-slot">
                <h1 className="hero-title-italic">
                  Learn Together.
                  <br />
                  <span className="fg-inline-italic">Grow Together.</span>
                </h1>
              </div>
              <p>
                Connect with experienced student mentors, exchange knowledge,
                and achieve your learning goals together.
              </p>
              <div className="hero-search">
                <div className="search-field">
                  <Icon name="search" />
                  <input
                    placeholder="What do you want to learn?"
                    aria-label="Search subjects"
                  />
                </div>
                <select aria-label="Select subject">
                  <option>All subjects</option>
                  <option>Computer science</option>
                  <option>Design</option>
                  <option>Business</option>
                </select>
                <Button onClick={() => go("mentors")}>Find a mentor</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="section mentors-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <h2>Find your Mentors</h2>
                <p>
                  Learn from students who understand your goals and can help you
                  take the next step.
                </p>
              </div>
              <Button kind="secondary" onClick={() => go("mentors")}>
                Browse all mentors <Icon name="arrow" size={17} />
              </Button>
            </div>
            <div className="mentor-grid">
              {mentors.slice(0, 4).map((mentor) => (
                <MentorCard
                  mentor={mentor}
                  key={mentor.name}
                  onBook={() => go("mentors")}
                  showSchool={false}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="section how-section" id="how">
          <div className="container">
            <div className="center-heading">
              <span className="kicker">SIMPLE BY DESIGN</span>
              <h2>Good learning starts with connection</h2>
              <p>From “I’m stuck” to “I’ve got it” in three simple steps.</p>
            </div>
            <div className="steps-grid">
              {[
                ["01", "Discover your mentor", "search"],
                ["02", "Book a time that works", "calendar"],
                ["03", "Learn and level up", "spark"],
              ].map(([n, title, icon]) => (
                <article className="step-card" key={n}>
                  <span className="step-number">{n}</span>
                  <span className="step-icon">
                    <Icon name={icon as IconName} />
                  </span>
                  <h3>{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container cta">
          <div>
            <span className="eyebrow">
              <Icon name="spark" size={16} /> Your next breakthrough is closer
              than you think
            </span>
            <h2>Ready to learn differently?</h2>
            <p>
              Join thousands of students sharing knowledge and moving forward
              together.
            </p>
          </div>
          <Button kind="light" onClick={() => go("dashboard")}>
            Start learning free <Icon name="arrow" size={18} />
          </Button>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <Logo onClick={() => go("home")} />
          <p>Peer learning, made human.</p>
          <div>
            <button>Privacy</button>
            <button>Terms</button>
            <button>Contact</button>
          </div>
          <span>© 2026 Cognitrade</span>
        </div>
      </footer>
    </div>
  )
}

const navItems: { page: Page; label: string; icon: IconName }[] = [
  { page: "dashboard", label: "Overview", icon: "home" },
  { page: "mentors", label: "Find mentors", icon: "search" },
  { page: "schedule", label: "My schedule", icon: "calendar" },
  { page: "groups", label: "Study groups", icon: "group" },
  { page: "resources", label: "Resources", icon: "book" },
]

const mentorNavItems: { page: Page; label: string; icon: IconName }[] = [
  { page: "mentor-dashboard", label: "Mentor overview", icon: "grid" },
  { page: "mentor-requests", label: "Session requests", icon: "message" },
  { page: "mentor-students", label: "My students", icon: "group" },
  { page: "mentor-availability", label: "Availability", icon: "calendar" },
  { page: "mentor-resources", label: "Shared resources", icon: "book" },
  { page: "mentor-profile", label: "Mentor profile", icon: "spark" },
]

function AppShell({
  page,
  go,
  children,
}: {
  page: Page
  go: (page: Page) => void
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mentorOpen, setMentorOpen] = useState(false)
  const [mentorSubmitted, setMentorSubmitted] = useState(false)
  const isMentor = page.startsWith("mentor-")
  const activeNav = isMentor ? mentorNavItems : navItems
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Logo
            onClick={() => go(isMentor ? "mentor-dashboard" : "dashboard")}
          />
          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="role-switch" aria-label="Choose workspace">
          <button
            className={!isMentor ? "active" : ""}
            onClick={() => go("dashboard")}
          >
            Learning
          </button>
          <button
            className={isMentor ? "active" : ""}
            onClick={() => go("mentor-dashboard")}
          >
            Mentoring
          </button>
        </div>
        <nav className="side-nav">
          <span className="nav-label">
            {isMentor ? "MENTOR WORKSPACE" : "WORKSPACE"}
          </span>
          {activeNav.map((item) => (
            <button
              key={item.page}
              className={page === item.page ? "active" : ""}
              onClick={() => {
                go(item.page)
                setMobileOpen(false)
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {(item.page === "schedule" ||
                item.page === "mentor-requests") && <b>2</b>}
            </button>
          ))}
        </nav>
        {!isMentor && (
          <div className="mentor-cta">
            <span className="mini-spark">
              <Icon name="spark" size={18} />
            </span>
            <strong>Share what you know</strong>
            <p>Help another student grow.</p>
            <button
              onClick={() => {
                setMentorOpen(true)
                setMobileOpen(false)
              }}
            >
              Become a mentor <Icon name="arrow" size={15} />
            </button>
          </div>
        )}
        <div className={`sidebar-account ${isMentor ? "push-bottom" : ""}`}>
          <button
            className="profile-mini"
            onClick={() => go(isMentor ? "mentor-dashboard" : "dashboard")}
          >
            <Avatar src={mentorImages[5]} name="Alex Morgan" small />
            <span>
              <strong>Alex Morgan</strong>
              <small>{isMentor ? "CS Mentor" : "Student"}</small>
            </span>
            <Icon name="chevron" />
          </button>
          <button className="sidebar-logout" onClick={() => go("logout")}>
            Log out
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="top-search">
            <Icon name="search" size={18} />
            <input placeholder="Search mentors, groups, resources..." />
          </div>
          <div className="header-actions">
            <button className="icon-button notification">
              <Icon name="bell" />
              <span />
            </button>
            <div className="header-divider" />
            <button
              className="header-profile"
              onClick={() => go(isMentor ? "mentor-dashboard" : "dashboard")}
              aria-label="Go to overview"
            >
              <Avatar src={mentorImages[5]} name="Alex Morgan" small />
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      {mobileOpen && (
        <button
          className="scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}
      {mentorOpen && (
        <div className="modal-wrap">
          <button
            className="modal-backdrop"
            onClick={() => setMentorOpen(false)}
            aria-label="Close mentor application"
          />
          <div className="modal mentor-modal">
            <button
              className="modal-close"
              onClick={() => setMentorOpen(false)}
              aria-label="Close mentor application"
            >
              <Icon name="close" />
            </button>
            {mentorSubmitted ? (
              <>
                <span className="modal-icon mentor-success">
                  <Icon name="check" />
                </span>
                <h2>You’re on your way!</h2>
                <p>
                  We’ve saved your interest. The Cognitrade team will help you
                  finish setting up your mentor profile.
                </p>
                <Button
                  className="full-button"
                  onClick={() => {
                    setMentorOpen(false)
                    setMentorSubmitted(false)
                    go("mentor-dashboard")
                  }}
                >
                  Open mentor workspace
                </Button>
              </>
            ) : (
              <>
                <span className="modal-icon">
                  <Icon name="spark" />
                </span>
                <h2>Become a Cognitrade mentor</h2>
                <p>
                  Share your experience, help another student grow, and build
                  your own leadership skills.
                </p>
                <div className="mentor-form">
                  <label>
                    What would you like to mentor?
                    <select defaultValue="">
                      <option value="" disabled>
                        Choose your strongest subject
                      </option>
                      <option>Computer Science</option>
                      <option>Design</option>
                      <option>Data & Analytics</option>
                      <option>Business</option>
                    </select>
                  </label>
                  <label>
                    Your experience
                    <textarea placeholder="Tell us briefly what you can help students with..." />
                  </label>
                </div>
                <Button
                  className="full-button"
                  onClick={() => setMentorSubmitted(true)}
                >
                  Start my application <Icon name="arrow" size={17} />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Dashboard({ go }: { go: (page: Page) => void }) {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">TUESDAY, MAY 20</span>
          <h1>Good morning, Alex</h1>
          <p>Ready to make progress today?</p>
        </div>
        <Button onClick={() => go("mentors")} icon="plus">
          Book a session
        </Button>
      </div>
      <section className="dash-grid">
        <div className="dash-primary">
          <article className="next-session">
            <div className="session-head">
              <span className="kicker light-kicker">UP NEXT</span>
              <span className="status-pill">
                <i /> Starts in 2 hours
              </span>
            </div>
            <div className="session-content">
              <Avatar src={mentorImages[0]} name="Maya Chen" />
              <div>
                <h2>Dynamic Programming Patterns</h2>
                <p>with Maya Chen · Computer Science</p>
                <div className="session-meta">
                  <span>
                    <Icon name="calendar" size={17} /> Today, May 20
                  </span>
                  <span>
                    <Icon name="clock" size={17} /> 2:00–3:00 PM
                  </span>
                </div>
              </div>
            </div>
            <div className="session-actions">
              <Button kind="light" icon="video">
                Join session
              </Button>
              <button className="icon-button on-dark">
                <Icon name="more" />
              </button>
            </div>
          </article>
          <div className="panel-heading">
            <div>
              <h2>Your learning</h2>
              <p>Keep the momentum going</p>
            </div>
            <button className="text-link">
              View all <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="learning-grid">
            <article className="learning-card">
              <span className="learning-icon purple">
                <Icon name="target" />
              </span>
              <div className="progress-heading">
                <strong>Algorithms & Data Structures</strong>
                <span>72%</span>
              </div>
              <p>4 of 6 goals complete</p>
              <div className="progress">
                <span style={{ width: "72%" }} />
              </div>
              <div className="learning-foot">
                <span>Next: Graph algorithms</span>
                <button>
                  <Icon name="chevron" size={16} />
                </button>
              </div>
            </article>
            <article className="learning-card">
              <span className="learning-icon amber">
                <Icon name="book" />
              </span>
              <div className="progress-heading">
                <strong>Modern Web Development</strong>
                <span>45%</span>
              </div>
              <p>3 of 8 goals complete</p>
              <div className="progress amber-progress">
                <span style={{ width: "45%" }} />
              </div>
              <div className="learning-foot">
                <span>Next: React state patterns</span>
                <button>
                  <Icon name="chevron" size={16} />
                </button>
              </div>
            </article>
          </div>
          <div className="panel-heading recommendations-heading">
            <div>
              <h2>Mentors for you</h2>
              <p>Based on your learning goals</p>
            </div>
            <button className="text-link" onClick={() => go("mentors")}>
              Explore more <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="compact-mentors">
            {mentors.slice(1, 4).map((m) => (
              <article key={m.name}>
                <Avatar src={m.image} name={m.name} />
                <div>
                  <h3>{m.name}</h3>
                  <p>{m.role}</p>
                  <span className="rating">
                    <Icon name="star" size={13} /> {m.rating} · {m.sessions}{" "}
                    sessions
                  </span>
                </div>
                <button className="icon-button">
                  <Icon name="chevron" />
                </button>
              </article>
            ))}
          </div>
        </div>
        <aside className="dash-aside">
          <article className="stat-card">
            <div>
              <span className="stat-icon">
                <Icon name="clock" />
              </span>
              <strong>12.5</strong>
              <small>Hours learned</small>
            </div>
            <div>
              <span className="stat-icon coral">
                <Icon name="check" />
              </span>
              <strong>8</strong>
              <small>Sessions complete</small>
            </div>
          </article>
          <article className="calendar-card">
            <div className="card-header">
              <div>
                <h3>May 2026</h3>
                <p>Your learning schedule</p>
              </div>
              <button className="icon-button">
                <Icon name="chevron" />
              </button>
            </div>
            <div className="mini-calendar">
              <div className="weekdays">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="days">
                {Array.from({ length: 35 }, (_, i) => i - 2).map((d, i) => (
                  <span
                    key={i}
                    className={`${d < 1 || d > 31 ? "muted" : ""} ${
                      d === 20 ? "today" : ""
                    } ${[8, 15, 23].includes(d) ? "has-event" : ""}`}
                  >
                    {d < 1 ? 30 + d : d > 31 ? d - 31 : d}
                  </span>
                ))}
              </div>
            </div>
            <div className="calendar-event">
              <span className="event-time">
                2:00
                <br />
                <small>PM</small>
              </span>
              <span className="event-line" />
              <div>
                <strong>Dynamic Programming</strong>
                <small>with Maya Chen</small>
              </div>
            </div>
          </article>
          <article className="streak-card">
            <span className="streak-icon">✦</span>
            <div>
              <strong>5 day learning streak!</strong>
              <p>You’re building a great habit. Keep it going.</p>
            </div>
          </article>
        </aside>
      </section>
    </>
  )
}

function Mentors() {
  const [query, setQuery] = useState("")
  const [subject, setSubject] = useState("All subjects")
  const filtered = useMemo(
    () =>
      mentors.filter(
        (m) =>
          `${m.name} ${m.role} ${m.skills.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (subject === "All subjects" || m.role.includes(subject)),
      ),
    [query, subject],
  )
  const [booking, setBooking] = useState<string | null>(null)
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">MENTOR NETWORK</span>
          <h1>Find your next mentor</h1>
          <p>Discover students ready to share what they know.</p>
        </div>
      </div>
      <div className="filter-bar">
        <div className="large-search">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by skill, course, or mentor..."
          />
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option>All subjects</option>
          <option>Computer Science</option>
          <option>Product Design</option>
          <option>Data Science</option>
          <option>Software Engineering</option>
        </select>
        <Button kind="secondary" icon="filter">
          Filters
        </Button>
      </div>
      <div className="results-heading">
        <p>
          <strong>{filtered.length} mentors</strong> match your interests
        </p>
        <select>
          <option>Recommended</option>
          <option>Top rated</option>
          <option>Most sessions</option>
        </select>
      </div>
      <div className="mentor-grid app-mentor-grid">
        {filtered.map((m) => (
          <MentorCard
            mentor={m}
            key={m.name}
            onBook={() => setBooking(m.name)}
          />
        ))}
      </div>
      {booking && (
        <div className="modal-wrap">
          <button
            className="modal-backdrop"
            onClick={() => setBooking(null)}
            aria-label="Close modal"
          />
          <div className="modal">
            <button className="modal-close" onClick={() => setBooking(null)}>
              <Icon name="close" />
            </button>
            <span className="modal-icon">
              <Icon name="calendar" />
            </span>
            <h2>Meet {booking}</h2>
            <p>
              Choose a session to get started. Your mentor will receive your
              learning goals before you meet.
            </p>
            <div className="slot-grid">
              {["Today · 4:30 PM", "Wed · 10:00 AM", "Thu · 2:00 PM"].map(
                (x) => (
                  <button key={x}>{x}</button>
                ),
              )}
            </div>
            <Button className="full-button" onClick={() => setBooking(null)}>
              Continue to booking
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

function Groups() {
  const groups = [
    {
      title: "Algorithms Study Circle",
      subject: "Computer Science",
      members: 24,
      next: "Today · 5:00 PM",
      color: "lavender",
      images: [0, 1, 2],
    },
    {
      title: "Design Systems Club",
      subject: "Product Design",
      members: 18,
      next: "Wed · 6:30 PM",
      color: "peach",
      images: [3, 4, 5],
    },
    {
      title: "SQL Practice Lab",
      subject: "Data & Analytics",
      members: 31,
      next: "Thu · 4:00 PM",
      color: "mint",
      images: [2, 0, 4],
    },
  ]
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">LEARN WITH OTHERS</span>
          <h1>Your study groups</h1>
          <p>Build consistency and make progress together.</p>
        </div>
        <Button icon="plus">Create a group</Button>
      </div>
      <div className="featured-group">
        <div>
          <span className="eyebrow">
            <Icon name="spark" size={16} /> FEATURED THIS WEEK
          </span>
          <h2>Spring Interview Prep Sprint</h2>
          <p>
            Sharpen your problem-solving skills with daily challenges, peer
            reviews, and two live mock interviews.
          </p>
          <div className="featured-meta">
            <span>
              <Icon name="group" size={17} /> 42 students
            </span>
            <span>
              <Icon name="calendar" size={17} /> May 22–29
            </span>
          </div>
          <Button kind="light">
            Join the sprint <Icon name="arrow" size={17} />
          </Button>
        </div>
        <div className="code-art">
          <span>function growTogether() &#123;</span>
          <span>&nbsp;&nbsp;learn();</span>
          <span>&nbsp;&nbsp;share();</span>
          <span>&nbsp;&nbsp;repeat();</span>
          <span>&#125;</span>
        </div>
      </div>
      <div className="panel-heading">
        <div>
          <h2>Active groups</h2>
          <p>Pick up where you left off</p>
        </div>
        <button className="text-link">
          Discover groups <Icon name="arrow" size={15} />
        </button>
      </div>
      <div className="group-grid">
        {groups.map((group) => (
          <article className={`group-card ${group.color}`} key={group.title}>
            <div className="group-art">
              <Icon name="group" size={30} />
              <span>{group.subject}</span>
            </div>
            <div className="group-body">
              <h3>{group.title}</h3>
              <p>
                Collaborative sessions, shared notes, and weekly practice
                prompts.
              </p>
              <div className="group-info">
                <div className="avatar-stack">
                  {group.images.map((i) => (
                    <img src={mentorImages[i]} alt="" key={i} />
                  ))}
                  <span>+{group.members - 3}</span>
                </div>
                <span>
                  <Icon name="clock" size={15} /> {group.next}
                </span>
              </div>
              <Button kind="secondary">Open group</Button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function Resources() {
  const resources = [
    [
      "The Ultimate DSA Pattern Guide",
      "Guide · 18 min read",
      "Algorithms",
      "book",
      "Maya Chen",
    ],
    [
      "Designing Accessible Interfaces",
      "Video · 32 min",
      "UI/UX",
      "play",
      "Noah Williams",
    ],
    [
      "SQL Window Functions Cheat Sheet",
      "PDF · 8 pages",
      "Databases",
      "download",
      "Sofia Nguyen",
    ],
    [
      "React State: A Mental Model",
      "Guide · 12 min read",
      "Web Development",
      "book",
      "Leila Patel",
    ],
    [
      "Acing Your Technical Interview",
      "Video · 45 min",
      "Career",
      "play",
      "Ethan Brooks",
    ],
    [
      "Statistics for Data Science",
      "PDF · 14 pages",
      "Data Science",
      "download",
      "Julian Reed",
    ],
  ]
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">KNOWLEDGE LIBRARY</span>
          <h1>Resources worth sharing</h1>
          <p>Curated by mentors and learners in the Cognitrade community.</p>
        </div>
        <Button icon="plus">Share a resource</Button>
      </div>
      <div className="resource-hero">
        <div>
          <span className="kicker">EDITOR’S PICK</span>
          <h2>Build a better learning system</h2>
          <p>
            A practical guide to setting goals, remembering more, and making
            your study time count.
          </p>
          <Button kind="light">
            Read the guide <Icon name="arrow" size={17} />
          </Button>
        </div>
        <div className="book-stack">
          <span />
          <span />
          <span />
          <b>
            LEARN
            <br />
            BETTER
          </b>
        </div>
      </div>
      <div className="resource-tabs">
        <button className="active">All resources</button>
        <button>Guides</button>
        <button>Videos</button>
        <button>Cheat sheets</button>
        <button>Saved</button>
      </div>
      <div className="resource-grid">
        {resources.map((r, i) => (
          <article className="resource-card" key={r[0]}>
            <div className={`resource-cover cover-${i + 1}`}>
              <span>
                <Icon name={r[3] as IconName} size={28} />
              </span>
              <small>{r[2]}</small>
            </div>
            <div className="resource-body">
              <p>{r[1]}</p>
              <h3>{r[0]}</h3>
              <div>
                <span>By {r[4]}</span>
                <button className="icon-button">
                  <Icon name="heart" size={18} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function Schedule() {
  const times = [
    "9 AM",
    "10 AM",
    "11 AM",
    "12 PM",
    "1 PM",
    "2 PM",
    "3 PM",
    "4 PM",
  ]
  const days = ["MON 18", "TUE 19", "WED 20", "THU 21", "FRI 22"]
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">YOUR TIME</span>
          <h1>Learning schedule</h1>
          <p>Plan sessions and protect time for your goals.</p>
        </div>
        <Button icon="plus">Book a session</Button>
      </div>
      <div className="schedule-toolbar">
        <div className="toolbar-nav">
          <button>
            <Icon name="chevron" size={18} />
          </button>
          <button className="flip">
            <Icon name="chevron" size={18} />
          </button>
          <strong>May 18–22, 2026</strong>
        </div>
        <div>
          <button className="view-toggle active">Week</button>
          <button className="view-toggle">Month</button>
        </div>
      </div>
      <div className="calendar-layout">
        <div className="week-calendar">
          <div className="week-head">
            <span />
            <>
              {days.map((d, i) => (
                <div className={i === 2 ? "current-day" : ""} key={d}>
                  <span>{d.split(" ")[0]}</span>
                  <strong>{d.split(" ")[1]}</strong>
                </div>
              ))}
            </>
          </div>
          <div className="week-body">
            {times.map((time, row) => (
              <div className="time-row" key={time}>
                <span>{time}</span>
                {days.map((d, col) => (
                  <div className="time-cell" key={d}>
                    {row === 5 && col === 2 && (
                      <article className="cal-block plum">
                        <small>2:00–3:00</small>
                        <strong>Dynamic Programming</strong>
                        <span>with Maya</span>
                      </article>
                    )}
                    {row === 2 && col === 4 && (
                      <article className="cal-block pink">
                        <small>11:00–12:00</small>
                        <strong>Design critique</strong>
                        <span>Group session</span>
                      </article>
                    )}
                    {row === 7 && col === 1 && (
                      <article className="cal-block green">
                        <small>4:00–5:00</small>
                        <strong>SQL Practice Lab</strong>
                        <span>Study group</span>
                      </article>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <aside className="schedule-aside">
          <h3>Upcoming</h3>
          <p>Your next sessions</p>
          {[
            [
              "20",
              "MAY",
              "Dynamic Programming",
              "Today · 2:00 PM",
              mentorImages[0],
            ],
            [
              "22",
              "MAY",
              "Design critique",
              "Friday · 11:00 AM",
              mentorImages[1],
            ],
            [
              "27",
              "MAY",
              "React state patterns",
              "Wednesday · 3:30 PM",
              mentorImages[3],
            ],
          ].map((x) => (
            <article className="upcoming-item" key={x[2]}>
              <div className="date-box">
                <strong>{x[0]}</strong>
                <span>{x[1]}</span>
              </div>
              <div>
                <strong>{x[2]}</strong>
                <span>{x[3]}</span>
              </div>
              <Avatar src={x[4]} name={x[2]} small />
            </article>
          ))}
        </aside>
      </div>
    </>
  )
}

const mentorStudents = [
  {
    name: "Jordan Lee",
    focus: "Data Structures",
    progress: 72,
    sessions: 6,
    image: mentorImages[1],
  },
  {
    name: "Priya Shah",
    focus: "Python Foundations",
    progress: 48,
    sessions: 4,
    image: mentorImages[3],
  },
  {
    name: "Mateo Silva",
    focus: "Technical Interviews",
    progress: 85,
    sessions: 9,
    image: mentorImages[4],
  },
  {
    name: "Emma Wilson",
    focus: "React & Frontend",
    progress: 31,
    sessions: 2,
    image: mentorImages[0],
  },
]

const sessionRequests = [
  {
    id: 1,
    name: "Avery Thompson",
    topic: "Graph traversal and BFS",
    time: "Wed, May 21 · 3:00 PM",
    note: "I understand the basics but get stuck applying BFS to grid problems.",
    image: mentorImages[2],
  },
  {
    id: 2,
    name: "Samira Khan",
    topic: "React state patterns",
    time: "Thu, May 22 · 11:30 AM",
    note: "I would love help deciding when to use context versus local state.",
    image: mentorImages[5],
  },
]

function MentorDashboard({ go }: { go: (page: Page) => void }) {
  return (
    <>
      <div className="page-title mentor-page-title">
        <div>
          <span className="kicker">MENTOR WORKSPACE</span>
          <h1>Welcome back, Alex</h1>
          <p>You’re helping four students make meaningful progress.</p>
        </div>
        <Button
          kind="secondary"
          icon="calendar"
          onClick={() => go("mentor-availability")}
        >
          Edit availability
        </Button>
      </div>
      <div className="mentor-stats">
        {[
          ["12", "Sessions this month", "video", "+3 from April"],
          ["4", "Active students", "group", "2 goals due soon"],
          ["4.9", "Average rating", "star", "Across 38 reviews"],
          ["18h", "Mentoring time", "clock", "This month"],
        ].map(([value, label, icon, detail]) => (
          <article key={label}>
            <span className="mentor-stat-icon">
              <Icon name={icon as IconName} />
            </span>
            <div>
              <strong>{value}</strong>
              <p>{label}</p>
              <small>{detail}</small>
            </div>
          </article>
        ))}
      </div>
      <div className="mentor-dashboard-grid">
        <div>
          <div className="panel-heading mentor-panel-heading">
            <div>
              <h2>New session requests</h2>
              <p>Students waiting to learn with you</p>
            </div>
            <button className="text-link" onClick={() => go("mentor-requests")}>
              View all <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="request-list">
            {sessionRequests.map((request) => (
              <article className="request-card" key={request.id}>
                <Avatar src={request.image} name={request.name} />
                <div className="request-info">
                  <div>
                    <h3>{request.name}</h3>
                    <span>{request.topic}</span>
                  </div>
                  <p>
                    <Icon name="calendar" size={14} /> {request.time}
                  </p>
                </div>
                <div className="request-actions">
                  <Button kind="secondary">Review</Button>
                  <Button>Accept</Button>
                </div>
              </article>
            ))}
          </div>
          <div className="panel-heading mentor-panel-heading">
            <div>
              <h2>Student progress</h2>
              <p>Learning goals across your active students</p>
            </div>
            <button className="text-link" onClick={() => go("mentor-students")}>
              All students <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="mentor-student-list">
            {mentorStudents.slice(0, 3).map((student) => (
              <article key={student.name}>
                <Avatar src={student.image} name={student.name} />
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.focus}</span>
                </div>
                <div className="student-progress">
                  <span>
                    <i style={{ width: `${student.progress}%` }} />
                  </span>
                  <small>{student.progress}%</small>
                </div>
                <button className="icon-button">
                  <Icon name="chevron" size={17} />
                </button>
              </article>
            ))}
          </div>
        </div>
        <aside className="mentor-dashboard-aside">
          <article className="mentor-next-card">
            <div className="card-header">
              <div>
                <span className="kicker">NEXT SESSION</span>
                <h3>Today · 4:00 PM</h3>
              </div>
              <span className="status-pill mentor-live">
                <i /> In 3 hours
              </span>
            </div>
            <div className="mentor-next-student">
              <Avatar src={mentorImages[1]} name="Jordan Lee" />
              <div>
                <strong>Jordan Lee</strong>
                <span>Data Structures · Session 7</span>
              </div>
            </div>
            <div className="session-plan">
              <span>SESSION PLAN</span>
              <strong>Binary trees and traversal</strong>
              <p>
                Review last exercise, compare DFS patterns, and work through two
                practice problems.
              </p>
            </div>
            <Button className="full-button" icon="video">
              Open session room
            </Button>
          </article>
          <article className="mentor-impact">
            <span className="impact-art">
              <Icon name="spark" />
            </span>
            <div>
              <strong>Your impact this semester</strong>
              <p>
                Students have completed <b>27 learning goals</b> with your
                support.
              </p>
            </div>
          </article>
        </aside>
      </div>
    </>
  )
}

function MentorRequests() {
  type RequestStatus = "pending" | "accepted" | "declined" | "past"
  type RequestTab = "pending" | "accepted" | "past"
  const [activeTab, setActiveTab] = useState<RequestTab>("pending")
  const [requests, setRequests] =
    useState<Array<typeof sessionRequests[number] & { status: RequestStatus }>>(
      [
        ...sessionRequests.map((request) => ({
          ...request,
          status: "pending" as const,
        })),
        {
          id: 3,
          name: "Jordan Lee",
          topic: "Binary trees and traversal",
          time: "Fri, May 23 · 4:00 PM",
          note: "I want to strengthen tree traversal before our next practice set.",
          image: mentorImages[1],
          status: "accepted",
        },
        {
          id: 4,
          name: "Mateo Silva",
          topic: "Technical interview practice",
          time: "Mon, May 12 · 1:00 PM",
          note: "A mock interview focused on arrays, hashing, and communication.",
          image: mentorImages[4],
          status: "past",
        },
      ],
    )
  const updateRequest = (id: number, status: "accepted" | "declined") =>
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    )
  const visibleRequests = requests.filter((request) =>
    activeTab === "past"
      ? request.status === "past" || request.status === "declined"
      : request.status === activeTab,
  )
  const tabCount = (tab: RequestTab) =>
    requests.filter((request) =>
      tab === "past"
        ? request.status === "past" || request.status === "declined"
        : request.status === tab,
    ).length
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">INBOX</span>
          <h1>Session requests</h1>
          <p>Review student goals before adding them to your calendar.</p>
        </div>
      </div>
      <div className="request-tabs">
        <button
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          Pending <b>{tabCount("pending")}</b>
        </button>
        <button
          className={activeTab === "accepted" ? "active" : ""}
          onClick={() => setActiveTab("accepted")}
        >
          Accepted <b>{tabCount("accepted")}</b>
        </button>
        <button
          className={activeTab === "past" ? "active" : ""}
          onClick={() => setActiveTab("past")}
        >
          Past requests <b>{tabCount("past")}</b>
        </button>
      </div>
      <div className="detailed-requests">
        {visibleRequests.map((request) => (
          <article key={request.id}>
            <div className="request-person">
              <Avatar src={request.image} name={request.name} />
              <div>
                <h3>{request.name}</h3>
                <p>Computer Science student · 2nd year</p>
              </div>
              {request.status !== "pending" && (
                <span className={`decision-pill ${request.status}`}>
                  <Icon
                    name={request.status === "declined" ? "close" : "check"}
                    size={13}
                  />
                  {request.status === "past" ? "completed" : request.status}
                </span>
              )}
            </div>
            <div className="request-summary">
              <div>
                <span>WANTS HELP WITH</span>
                <strong>{request.topic}</strong>
              </div>
              <div>
                <span>PREFERRED TIME</span>
                <strong>{request.time}</strong>
              </div>
            </div>
            <blockquote>“{request.note}”</blockquote>
            {request.status === "pending" && (
              <div className="detailed-request-actions">
                <Button
                  kind="secondary"
                  onClick={() => updateRequest(request.id, "declined")}
                >
                  Decline
                </Button>
                <Button onClick={() => updateRequest(request.id, "accepted")}>
                  Accept request
                </Button>
              </div>
            )}
          </article>
        ))}
        {visibleRequests.length === 0 && (
          <div className="request-empty">
            <span className="modal-icon">
              <Icon name="message" />
            </span>
            <h3>No requests here yet</h3>
            <p>New session activity will appear in this tab.</p>
          </div>
        )}
      </div>
    </>
  )
}

function MentorStudents() {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">YOUR COMMUNITY</span>
          <h1>My students</h1>
          <p>Track goals, prepare sessions, and celebrate progress.</p>
        </div>
        <Button kind="secondary" icon="message">
          Message all
        </Button>
      </div>
      <div className="student-summary">
        <div>
          <strong>4</strong>
          <span>Active students</span>
        </div>
        <div>
          <strong>27</strong>
          <span>Goals completed</span>
        </div>
        <div>
          <strong>89%</strong>
          <span>Session attendance</span>
        </div>
      </div>
      <div className="mentor-student-grid">
        {mentorStudents.map((student, index) => (
          <article key={student.name}>
            <div className="student-card-head">
              <Avatar src={student.image} name={student.name} />
              <span className={index < 3 ? "active-student" : ""}>
                {index < 3 ? "Active" : "New"}
              </span>
            </div>
            <h3>{student.name}</h3>
            <p>{student.focus}</p>
            <div className="student-card-progress">
              <span>
                <i style={{ width: `${student.progress}%` }} />
              </span>
              <small>{student.progress}% of current goal</small>
            </div>
            <div className="student-card-meta">
              <span>{student.sessions} sessions</span>
              <span>Next: {index % 2 ? "Friday" : "Today"}</span>
            </div>
            <div className="student-card-actions">
              <Button kind="secondary" icon="message">
                Message
              </Button>
              <Button>View plan</Button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function MentorAvailability() {
  const [days, setDays] = useState(["Monday", "Wednesday", "Thursday"])
  const toggleDay = (day: string) =>
    setDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    )
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">YOUR TIME</span>
          <h1>Availability</h1>
          <p>Choose when students can request sessions with you.</p>
        </div>
        <Button>Save availability</Button>
      </div>
      <div className="availability-layout">
        <section className="availability-card">
          <div className="availability-head">
            <div>
              <h2>Weekly hours</h2>
              <p>Set your recurring mentoring schedule.</p>
            </div>
            <span className="timezone">Eastern Time (ET)</span>
          </div>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
            (day) => {
              const active = days.includes(day)
              return (
                <div
                  className={`availability-row ${active ? "enabled" : ""}`}
                  key={day}
                >
                  <button
                    className={`day-toggle ${active ? "on" : ""}`}
                    onClick={() => toggleDay(day)}
                    aria-label={`${active ? "Disable" : "Enable"} ${day}`}
                  >
                    <span />
                  </button>
                  <strong>{day}</strong>
                  {active ? (
                    <>
                      <select
                        defaultValue={
                          day === "Thursday" ? "1:00 PM" : "3:00 PM"
                        }
                      >
                        <option>9:00 AM</option>
                        <option>1:00 PM</option>
                        <option>3:00 PM</option>
                      </select>
                      <span>to</span>
                      <select
                        defaultValue={
                          day === "Thursday" ? "4:00 PM" : "6:00 PM"
                        }
                      >
                        <option>4:00 PM</option>
                        <option>6:00 PM</option>
                        <option>8:00 PM</option>
                      </select>
                      <button className="icon-button">
                        <Icon name="plus" size={16} />
                      </button>
                    </>
                  ) : (
                    <p>Unavailable</p>
                  )}
                </div>
              )
            },
          )}
        </section>
        <aside className="availability-aside">
          <article>
            <span className="learning-icon purple">
              <Icon name="clock" />
            </span>
            <h3>Session preferences</h3>
            <label>
              Default session length
              <select defaultValue="60 minutes">
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>60 minutes</option>
              </select>
            </label>
            <label>
              Minimum notice
              <select defaultValue="24 hours">
                <option>12 hours</option>
                <option>24 hours</option>
                <option>48 hours</option>
              </select>
            </label>
          </article>
          <article className="availability-note">
            <Icon name="calendar" />
            <div>
              <strong>Calendar connected</strong>
              <p>
                Busy times from your personal calendar are automatically
                blocked.
              </p>
            </div>
          </article>
        </aside>
      </div>
    </>
  )
}

function MentorResources() {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">TEACHING LIBRARY</span>
          <h1>Shared resources</h1>
          <p>Keep your most useful guides ready for every session.</p>
        </div>
        <Button icon="plus">Upload resource</Button>
      </div>
      <div className="mentor-resource-banner">
        <div>
          <span className="mini-spark">
            <Icon name="book" />
          </span>
          <div>
            <strong>Build your teaching toolkit</strong>
            <p>
              Resources you add here can be shared directly with students during
              a session.
            </p>
          </div>
        </div>
        <span>6 resources · Shared 24 times</span>
      </div>
      <div className="mentor-resource-list">
        {[
          [
            "Dynamic Programming Pattern Map",
            "PDF · 2.4 MB",
            "Shared 8 times",
            "Algorithms",
          ],
          [
            "Technical Interview Checklist",
            "PDF · 1.1 MB",
            "Shared 6 times",
            "Career",
          ],
          [
            "React State Decision Tree",
            "Image · 860 KB",
            "Shared 5 times",
            "Web",
          ],
          [
            "Python Practice Problems",
            "Document · 12 pages",
            "Shared 5 times",
            "Python",
          ],
        ].map((resource, index) => (
          <article key={resource[0]}>
            <span className={`resource-file file-${index + 1}`}>
              <Icon name="book" />
            </span>
            <div>
              <h3>{resource[0]}</h3>
              <p>
                {resource[1]} · {resource[2]}
              </p>
            </div>
            <span className="tag">{resource[3]}</span>
            <button className="icon-button">
              <Icon name="more" />
            </button>
          </article>
        ))}
      </div>
    </>
  )
}

function MentorProfile() {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="kicker">PUBLIC PRESENCE</span>
          <h1>Mentor profile</h1>
          <p>Show students how you can help them move forward.</p>
        </div>
        <Button>Save changes</Button>
      </div>
      <div className="profile-layout">
        <section className="profile-form-card">
          <div className="profile-photo-row">
            <Avatar src={mentorImages[5]} name="Alex Morgan" />
            <div>
              <strong>Profile photo</strong>
              <p>A friendly, clear photo helps students feel comfortable.</p>
            </div>
            <Button kind="secondary">Change photo</Button>
          </div>
          <div className="profile-form-grid">
            <label>
              Display name
              <input defaultValue="Alex Morgan" />
            </label>
            <label>
              Headline
              <input defaultValue="Computer Science mentor & problem-solving coach" />
            </label>
            <label className="full-field">
              About you
              <textarea defaultValue="I help students turn intimidating computer science concepts into clear, repeatable patterns. My sessions are practical, encouraging, and built around your goals." />
            </label>
            <label>
              Primary expertise
              <select defaultValue="Computer Science">
                <option>Computer Science</option>
                <option>Data Science</option>
                <option>Web Development</option>
              </select>
            </label>
            <label>
              University
              <input defaultValue="University of Michigan" />
            </label>
          </div>
          <div className="expertise-editor">
            <span>SKILLS & TOPICS</span>
            <div>
              {[
                "Data Structures",
                "Algorithms",
                "Python",
                "Technical Interviews",
              ].map((skill) => (
                <button key={skill}>
                  {skill} <Icon name="close" size={12} />
                </button>
              ))}
              <button className="add-skill">
                <Icon name="plus" size={13} /> Add skill
              </button>
            </div>
          </div>
        </section>
        <aside className="profile-preview">
          <span>PROFILE PREVIEW</span>
          <MentorCard
            mentor={{
              ...mentors[0],
              name: "Alex Morgan",
              image: mentorImages[5],
              role: "Computer Science Mentor",
              school: "University of Michigan",
              sessions: 42,
              skills: ["Algorithms", "Python"],
            }}
          />
          <div className="profile-strength">
            <div>
              <strong>Profile strength</strong>
              <span>Excellent</span>
            </div>
            <div className="progress">
              <span style={{ width: "92%" }} />
            </div>
            <p>Complete profiles receive more student requests.</p>
          </div>
        </aside>
      </div>
    </>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>("home")
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const go = (next: Page) => {
    setPage(next)
    window.scrollTo(0, 0)
  }

  if (authLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        Loading...
      </div>
    )
  }

  if (page === "home") return <PublicHome go={go} />
  if (page === "login") return <LoginPage go={go} />
  if (page === "signup") return <SignupPage go={go} />
  if (page === "logout") return <LogoutPage go={go} user={user} />
  return (
    <AppShell page={page} go={go}>
      {page === "dashboard" && <Dashboard go={go} />}
      {page === "mentors" && <Mentors />}
      {page === "groups" && <Groups />}
      {page === "resources" && <Resources />}
      {page === "schedule" && <Schedule />}
      {page === "mentor-dashboard" && <MentorDashboard go={go} />}
      {page === "mentor-requests" && <MentorRequests />}
      {page === "mentor-students" && <MentorStudents />}
      {page === "mentor-availability" && <MentorAvailability />}
      {page === "mentor-resources" && <MentorResources />}
      {page === "mentor-profile" && <MentorProfile />}
    </AppShell>
  )
}
