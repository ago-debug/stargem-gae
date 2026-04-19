import "dotenv/config";
async function testFetch() {
  const loginRes = await fetch("http://localhost:5001/api/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin" }) // <--- correct password is admin
  });
  console.log("Login HTTP", loginRes.status);
  const cookies = loginRes.headers.get("set-cookie");
  const sessionCookie = cookies ? cookies.split(";")[0] : "";
  console.log("Cookie ottenuto:", sessionCookie ? "V" : "X");

  const pRes = await fetch("http://localhost:5001/api/gemteam/postazioni", { headers: { "Cookie": sessionCookie } });
  const pText = await pRes.text();
  console.log("POSTAZIONI:", pText.substring(0, 100));
}
testFetch();
