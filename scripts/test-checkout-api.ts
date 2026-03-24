import "dotenv/config";
import fetch from "node-fetch";

async function runTest() {
  const baseUrl = "http://localhost:5001";
  
  // Assuming memberId 1 exists. We will use memberId 1
  const basePayload = { memberId: 1, status: "active", notes: "Test API E2E", courseId: 1 };
  
  console.log("Testing STANDARD_COURSE...");
  const res1 = await fetch(`${baseUrl}/api/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...basePayload, participationType: "STANDARD_COURSE" })
  });
  console.log("STANDARD:", await res1.json());
  
  console.log("Testing FREE_TRIAL...");
  const res2 = await fetch(`${baseUrl}/api/enrollments?skipPayment=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...basePayload, participationType: "FREE_TRIAL", targetDate: "2026-06-10" })
  });
  console.log("FREE_TRIAL:", await res2.json());

  console.log("Testing PAID_TRIAL...");
  const res3 = await fetch(`${baseUrl}/api/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...basePayload, participationType: "PAID_TRIAL", targetDate: "2026-06-12" })
  });
  console.log("PAID_TRIAL:", await res3.json());
  
  console.log("Testing SINGLE_LESSON...");
  const res4 = await fetch(`${baseUrl}/api/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...basePayload, participationType: "SINGLE_LESSON", targetDate: "2026-06-14" })
  });
  console.log("SINGLE_LESSON:", await res4.json());
}
runTest();
