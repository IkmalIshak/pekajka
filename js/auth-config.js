// ===== CONFIGURATION =====
const GOOGLE_CLIENT_ID = "99876814836-i4hm08pabd27o54spfm1mnk5bpulsk56.apps.googleusercontent.com";

const ALLOWED_EMAILS = [
    "ikmalishak0803@gmail.com",
    "isnamaku@gmail.com",
    "naziruddin@ipgm.edu.my"
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

function isAuthenticatedUser() {
    const user = getAuthUser();
    return !!user && isEmailAllowed(user.email);
}

function configureLoginLinks() {
    const links = Array.from(document.querySelectorAll('a[href="logmasuk.html"], a[href="login.html"]'));

    links.forEach((link) => {
        if (link.dataset.authHandled) return;

        link.dataset.authHandled = 'true';

        if (isAuthenticatedUser()) {
            link.href = '#';
            link.setAttribute('aria-disabled', 'true');
            link.classList.add('auth-link-disabled');
            link.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
            });

            if (link.textContent.trim().toLowerCase().includes('log masuk')) {
                link.textContent = 'Sudah Log Masuk';
            }
        }
    });
}

function decodeJwt(token) {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
}

document.addEventListener('DOMContentLoaded', configureLoginLinks);
window.addEventListener('load', configureLoginLinks);