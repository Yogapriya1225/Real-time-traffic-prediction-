const API_URL = 'http://127.0.0.1:5000';

// Check auth state on page load for navbar setup
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('traffic_user'));
    
    const loginBtn = document.getElementById('nav-login-btn');
    const registerBtn = document.getElementById('nav-register-btn');
    const dashboardBtn = document.getElementById('nav-dashboard-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');

    if (user && user.user_id) {
        if(loginBtn) loginBtn.classList.add('hidden');
        if(registerBtn) registerBtn.classList.add('hidden');
        if(dashboardBtn) dashboardBtn.classList.remove('hidden');
        if(logoutBtn) {
            logoutBtn.classList.remove('hidden');
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('traffic_user');
                window.location.href = 'index.html';
            });
        }
    }
});

// Register handling
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                errorDiv.classList.add('hidden');
                successDiv.classList.remove('hidden');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                errorDiv.textContent = data.error || 'Registration failed';
                errorDiv.classList.remove('hidden');
            }
        } catch (err) {
            errorDiv.textContent = 'Server connection error';
            errorDiv.classList.remove('hidden');
        }
    });
}

// Login handling
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                errorDiv.classList.add('hidden');
                // Save to local storage
                localStorage.setItem('traffic_user', JSON.stringify({
                    user_id: data.user_id,
                    username: data.username
                }));
                window.location.href = 'dashboard.html';
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.classList.remove('hidden');
            }
        } catch (err) {
            errorDiv.textContent = 'Server connection error';
            errorDiv.classList.remove('hidden');
        }
    });
}
