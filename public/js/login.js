document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('auth', 'true');
            window.location.href = '/index.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (err) {
        alert('An error occurred during login.');
    }
});
