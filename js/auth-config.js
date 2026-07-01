// ===== CONFIGURATION =====
const GOOGLE_CLIENT_ID = "99876814836-i4hm08pabd27o54spfm1mnk5bpulsk56.apps.googleusercontent.com";

const ALLOWED_EMAILS = [
    "ikmalishak0803@gmail.com",
    "another.person@gmail.com"
];

const AUTH_STORAGE_KEY = "site_auth_user";

// ===== HELPER FUNCTIONS =====
function isEmailAllowed(email) {
    return ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

function saveAuthUser(user) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function getAuthUser() {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

function clearAuthUser() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function decodeJwt(token) {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
}