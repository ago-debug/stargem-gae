import fetch from 'node-fetch'; // tsx will polyfill or we can just use native Node fetch
async function testEndpoint() {
    const url = 'http://localhost:5001/api/members?page=1&pageSize=5&status=inactive&gender=M';
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("API Response:", data);
    } catch (err) {
        console.error("HTTP Error:", err);
    }
}
testEndpoint();
