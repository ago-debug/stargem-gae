import 'dotenv/config';

async function main() {
  const payload = {
    sku: "testGae1234",
    name: "pippo",
    description: null,
    categoryId: 411,
    studioId: 10,
    instructorId: 9484,
    secondaryInstructor1Id: 2490,
    price: "1610.40",
    maxCapacity: null,
    dayOfWeek: "MAR",
    startTime: "08:00",
    endTime: "09:00",
    recurrenceType: "single",
    schedule: null,
    startDate: new Date("2026-04-08"),
    endDate: new Date("2026-04-08"),
    level: null,
    ageGroup: null,
    lessonType: ["vvv2222"],
    numberOfPeople: "44",
    statusTags: ["STATE:ATTIVO"],
    active: true,
    seasonId: 1
  };

  const res = await fetch("http://localhost:5001/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

main().catch(console.error);
