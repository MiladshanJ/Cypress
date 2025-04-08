async function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const email = document.getElementById('reg-email').value;
    
    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
    });
    
    const result = await response.json();
    document.getElementById('message').textContent = result.message;

    if (result.message === 'Registration successful' && result.redirect) {
        localStorage.setItem('username', username);
        window.location.href = result.redirect;
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    document.getElementById('message').textContent = result.message;

    if (result.message === 'Login successful' && result.redirect) {
        localStorage.setItem('username', username);
        window.location.href = result.redirect;
    }
}