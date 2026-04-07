async function testApi() {
  const payload = {
    name: "Allenamento BotAI",
    lessonType: ["Cardio", "Pesistica"],
    seasonId: 3, 
    dayOfWeek: "LUN",
    startTime: "10:00",
    endTime: "11:00",
    statusTags: ["STATE:ATTIVO"],
    active: true,
    sku: "BOT-TEST-001"
  };

  try {
    const res = await fetch("http://localhost:5001/api/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testApi();
