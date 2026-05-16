import {API_URL} from '/env.js'

// --------------------------------------------------------------
//   AUTHENTICATION with VISUAL ERROR FEEDBACK
//   - Empty fields → red border + "Please enter your login/password"
//   - User not found → red border under login + "User not found"
//   - Wrong password → red border under password + "Wrong password"
//   - No alert popups, everything inline
// --------------------------------------------------------------
const TOKEN_KEY = "pill_reminder_token";
const USER_KEY = "pill_reminder_user";
const USERS_STORAGE = "pill_reminder_users";
const SESSION_STORAGE_KEY = "pill_reminder_session";
const ACTIVE_USER_KEY = "pill_reminder_active_user";

// Helper: get all users
function getUsers() {
    const raw = localStorage.getItem(USERS_STORAGE);
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch(e) {
        return {};
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_STORAGE, JSON.stringify(users));
}

// Seed demo users (login = "demo" or "demo@example.com", password "demo123")
function seedDemoUsers() {
    const users = getUsers();
    let changed = false;

    if (!users["demo"]) {
        users["demo"] = {
            id: "demo",
            login: "demo",
            password: "demo123",
            name: "Demo User",
            email: "demo@pillcare.com"
        };
        changed = true;
    }

    if (!users["demo@pillcare.com"]) {
        users["demo@pillcare.com"] = {
            id: "demo_email",
            login: "demo@pillcare.com",
            password: "demo123",
            name: "Demo User",
            email: "demo@pillcare.com"
        };
        changed = true;
    }

    if (changed) saveUsers(users);
}

// Find user by login string (case-insensitive)
function findUserByLogin(loginInput) {
    const users = getUsers();
    const normalizedInput = loginInput.trim().toLowerCase();

    for (const key in users) {
        const user = users[key];
        if (user.login && user.login.toLowerCase() === normalizedInput) return user;
        if (key.toLowerCase() === normalizedInput) return user;
    }
    return null;
}

// --- VISUAL ERROR HANDLING ---
function clearAllErrors() {
    const loginWrapper = document.getElementById('loginWrapper');
    const passwordWrapper = document.getElementById('passwordWrapper');
    loginWrapper.classList.remove('error');
    passwordWrapper.classList.remove('error');

    // Reset error messages to default empty-field messages
    const loginErrorDiv = document.getElementById('loginError');
    const passwordErrorDiv = document.getElementById('passwordError');
    if (loginErrorDiv) loginErrorDiv.innerHTML = '⚠️ Please enter your login';
    if (passwordErrorDiv) passwordErrorDiv.innerHTML = '⚠️ Please enter your password';
}

function showEmptyFieldError(field) {
    if (field === 'login') {
        const wrapper = document.getElementById('loginWrapper');
        const errorDiv = document.getElementById('loginError');
        wrapper.classList.add('error');
        errorDiv.innerHTML = '⚠️ Please enter your login';
    } else if (field === 'password') {
        const wrapper = document.getElementById('passwordWrapper');
        const errorDiv = document.getElementById('passwordError');
        wrapper.classList.add('error');
        errorDiv.innerHTML = '⚠️ Please enter your password';
    }
}

function showUserNotFoundError() {
    // Clear any previous errors first
    const loginWrapper = document.getElementById('loginWrapper');
    const passwordWrapper = document.getElementById('passwordWrapper');
    const loginErrorDiv = document.getElementById('loginError');
    const passwordErrorDiv = document.getElementById('passwordError');

    // Reset password error to default (but we'll only highlight login)
    passwordWrapper.classList.remove('error');
    passwordErrorDiv.innerHTML = '⚠️ Please enter your password';

    // Show error on login field only
    loginWrapper.classList.add('error');
    loginErrorDiv.innerHTML = '❌ User not found';
}

function showWrongPasswordError() {
    const loginWrapper = document.getElementById('loginWrapper');
    const passwordWrapper = document.getElementById('passwordWrapper');
    const loginErrorDiv = document.getElementById('loginError');
    const passwordErrorDiv = document.getElementById('passwordError');

    // Login field is valid (user exists), so remove its error if any
    loginWrapper.classList.remove('error');
    loginErrorDiv.innerHTML = '⚠️ Please enter your login';

    // Show error on password field
    passwordWrapper.classList.add('error');
    passwordErrorDiv.innerHTML = '❌ Wrong password';
}

// Reset error messages to default (keep visual state but change text)
function resetErrorMessagesToDefault() {
    const loginErrorDiv = document.getElementById('loginError');
    const passwordErrorDiv = document.getElementById('passwordError');
    if (loginErrorDiv && !loginErrorDiv.innerHTML.includes('User not found')) {
        // Only reset if it's not a specific error we want to preserve?
        // Better to reset fully, but we'll handle in flows
    }
}

// Check if a field is empty
function isEmpty(value) {
    return !value || value.trim() === '';
}

// Core login logic with specific visual errors
async function performLoginWithVisualFeedback(loginStr, password) {
    // Clear all previous errors first
    clearAllErrors();

    let hasEmptyError = false;

    // 1. Check empty login
    if (isEmpty(loginStr)) {
        showEmptyFieldError('login');
        hasEmptyError = true;
    }

    // 2. Check empty password
    if (isEmpty(password)) {
        showEmptyFieldError('password');
        hasEmptyError = true;
    }

    if (hasEmptyError) {
        return false; // Stop, fields are highlighted with empty errors
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                login: loginStr,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.error === "Incorrect password") {
                showWrongPasswordError();
            } else {
                const loginWrapper = document.getElementById('loginWrapper');
                const loginErrorDiv = document.getElementById('loginError');
                loginWrapper.classList.add('error');
                loginErrorDiv.innerHTML = `❌ ${data.error || "Login error"}`;
            }

            return false;
        }

        const sessionData = {
            login: data.user.login,
            name: data.user.login,
            loggedInAt: Date.now()
        };

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, data.user.login);
        localStorage.setItem(ACTIVE_USER_KEY, data.user.login);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));

        window.location.href = "/index";
        return true;
    } catch(e) {
        const loginWrapper = document.getElementById('loginWrapper');
        const loginErrorDiv = document.getElementById('loginError');
        loginWrapper.classList.add('error');
        loginErrorDiv.innerHTML = '❌ Server is not available';
        return false;
    }
}

// Auto-redirect if already logged in
function redirectIfAlreadyLoggedIn() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
        window.location.href = "/index";
    }
}

// Real-time error clearing when user starts typing
function attachRealtimeCleanup() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const loginWrapper = document.getElementById('loginWrapper');
    const passwordWrapper = document.getElementById('passwordWrapper');
    const loginErrorDiv = document.getElementById('loginError');
    const passwordErrorDiv = document.getElementById('passwordError');

    // Clear login field error when user types
    usernameInput.addEventListener('input', () => {
        if (loginWrapper.classList.contains('error')) {
            // Remove error class
            loginWrapper.classList.remove('error');
            // Reset to default empty message
            loginErrorDiv.innerHTML = '⚠️ Please enter your login';
        }
        if (passwordWrapper.classList.contains('error') && passwordErrorDiv.innerHTML === '❌ Wrong password') {
            // If user modifies login after wrong password, clear password error too (because credentials combo changes)
            passwordWrapper.classList.remove('error');
            passwordErrorDiv.innerHTML = '⚠️ Please enter your password';
        }
    });

    // Clear password field error when user types
    passwordInput.addEventListener('input', () => {
        if (passwordWrapper.classList.contains('error')) {
            passwordWrapper.classList.remove('error');
            passwordErrorDiv.innerHTML = '⚠️ Please enter your password';
        }
        // If user types in password after "user not found" error, we don't auto-clear login error
        // That's fine, but we can also optionally clear login error if it's "User not found" and login field unchanged?
        // Better: keep as is, user needs to fix login manually
    });
}

// Document ready
document.addEventListener("DOMContentLoaded", () => {
    seedDemoUsers();
    redirectIfAlreadyLoggedIn();
    attachRealtimeCleanup();

    const usernameInput = document.getElementById("loginUsername");
    const passwordInput = document.getElementById("loginPassword");
    const signinButton = document.getElementById("doSigninBtn");

    const handleSignIn = async () => {
        const loginValue = usernameInput.value;
        const passwordValue = passwordInput.value;
        await performLoginWithVisualFeedback(loginValue, passwordValue);
    };

    signinButton.addEventListener("click", handleSignIn);

    // Enter key triggers sign in
    usernameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSignIn();
    });
    passwordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSignIn();
    });
});