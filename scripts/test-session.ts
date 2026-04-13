import fetch from 'node-fetch';

async function run() {
  try {
    const loginRes = await fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'gaechacha@gmail.com', password: 'password' }) // Wait, otp token is 287460 but the password might not be literal 'password'.
    });
  } catch(e) {}
}
