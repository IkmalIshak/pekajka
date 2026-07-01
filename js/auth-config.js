// ===== EDIT THESE TWO THINGS =====

// 1. Your Google OAuth Client ID (from Google Cloud Console -> Credentials)
const GOOGLE_CLIENT_ID = "99876814836-i4hm08pabd27o54spfm1mnk5bpulsk56.apps.googleusercontent.com";

// 2. Emails allowed to access the protected pages
const ALLOWED_EMAILS = [
  "ikmalishak0803@gmail.com",
  "another.person@gmail.com"
];

// ===== Don't need to touch below this line =====

const AUTH_STORAGE_KEY = "site_auth_user";

function isEmailAllowed(email) {
  return ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

function saveAuthUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function getAuthUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Decode the JWT Google gives us to read the email/name out of it
function decodeJwt(token) {
  const payload = token.split(".")[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded);
}
