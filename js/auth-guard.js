// Include this AFTER auth-config.js on every page you want to protect.
// If the visitor isn't signed in / not on the allowed list, they get sent to login.html.

(function () {
  const user = getAuthUser();

  if (!user || !isEmailAllowed(user.email)) {
    clearAuthUser();
    // Remember where they were trying to go, so login.html can send them back
    sessionStorage.setItem("redirect_after_login", window.location.href);
    window.location.href = "login.html";
  }
})();
