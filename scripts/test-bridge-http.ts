import express from "express";
import { getUnifiedActivitiesPreview, getUnifiedActivityById, getUnifiedEnrollmentsPreview } from "../server/services/unifiedBridge";
import http from "http";

async function run() {
  const app = express();
  app.use(express.json());

  // Mount the exact same handlers as routes.ts but without auth block for local CLI testing
  app.get("/api/activities-unified-preview", async (req, res) => {
    try {
      const data = await getUnifiedActivitiesPreview(req);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/activities-unified-preview/:type/:id", async (req, res) => {
    try {
      const data = await getUnifiedActivityById(req);
      if (!data) return res.status(404).json({ error: "Not found" });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/enrollments-unified-preview", async (req, res) => {
    try {
      const data = await getUnifiedEnrollmentsPreview(req);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, () => resolve(true)));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`Test server running on port ${port}...`);

  try {
    console.log("\n=== 1. TEST ACTIVITIES PREVIEW HTTP ===");
    const resActs = await fetch(`${baseUrl}/api/activities-unified-preview`);
    const activities = await resActs.json();
    console.log(`Status: ${resActs.status}`);
    console.log(`Total Records: ${activities.length}`);

    const breakdown = { courses: 0, workshops: 0, rentals: 0, campus: 0, sunday_activities: 0, recitals: 0, mapped_unknown: 0 };
    for (const a of activities) {
      if (typeof breakdown[a.legacy_source_type as keyof typeof breakdown] !== "undefined") {
        breakdown[a.legacy_source_type as keyof typeof breakdown]++;
      } else {
        breakdown.mapped_unknown++;
      }
    }
    console.log("Silo Breakdown:", breakdown);

    console.log("\n=== SHAPE VERIFICATION ===");
    const typesToTest = ["courses", "workshops", "rentals", "recitals"];
    typesToTest.forEach(type => {
      const s = activities.find((a: any) => a.legacy_source_type === type);
      if (s) {
        console.log(`\nSample [${type}]:`);
        const keys = ["id", "legacy_source_type", "legacy_source_id", "activity_family", "activity_type", "title", "season_id", "status", "visibility"];
        keys.forEach(k => {
          let note = "";
          if (s[k] === null) note = "(NULL)";
          else if (typeof s[k] === "undefined") note = "(MISSING!)";
          else if (k === "id" && String(s[k]).includes("_")) note = "(Generated Virtual ID)";
          else if (k === "season_id") note = `(Resolved: ${s[k]})`;
          else if (s.legacy_source_type === "rentals" && k === "visibility" && s[k] === "private") note = "(Forced Fallback)";
          else if (s.legacy_source_type === "rentals" && k === "title" && s[k] === "Affitto Sala") note = "(Forced Dedotto)";
          
          console.log(`  - ${k}: ${s[k]} ${note}`);
        });
      }
    });

    console.log("\n=== 2. TEST SINGLE ACTIVITY PREVIEW HTTP ===");
    const testId = activities[0]?.legacy_source_id;
    const testType = activities[0]?.legacy_source_type;
    if (testId && testType) {
      const resSingle = await fetch(`${baseUrl}/api/activities-unified-preview/${testType}/${testId}`);
      const single = await resSingle.json();
      console.log(`Lookup /api/activities-unified-preview/${testType}/${testId} -> Status: ${resSingle.status}`);
      console.log(`Found ID: ${single.id}, Title: ${single.title}`);
    }

    // Rentals Single
    const testRental = activities.find((a: any) => a.legacy_source_type === "rentals");
    if (testRental) {
      const resRental = await fetch(`${baseUrl}/api/activities-unified-preview/rentals/${testRental.legacy_source_id}`);
      const singleRental = await resRental.json();
      console.log(`Lookup rentals -> Status: ${resRental.status}, Found Title: ${singleRental.title || 'Affitto Sala'}`);
    }

    console.log("\n=== 3. TEST ENROLLMENTS PREVIEW HTTP ===");
    const resEnr = await fetch(`${baseUrl}/api/enrollments-unified-preview`);
    const enrollments = await resEnr.json();
    console.log(`Status: ${resEnr.status}, Total Records: ${enrollments.length}`);

    const enrBreakdown: Record<string, number> = {};
    enrollments.forEach((e: any) => {
      const targetTyp = String(e.activity_unified_id).split("_")[0] || "unknown";
      enrBreakdown[targetTyp] = (enrBreakdown[targetTyp] || 0) + 1;
    });
    console.log("Aggregate Sources mapped by ID Prefix:", enrBreakdown);
    
    if (enrollments.length > 0) {
      console.log("\nShape Details (Enrollment):");
      console.log(enrollments[0]);
    }

    console.log("\n=== 4. EXTREME ROBUSTNESS TEST ===");
    const resBad = await fetch(`${baseUrl}/api/activities-unified-preview/non_existent/999999`);
    console.log(`Bad Request (non_existent) -> Status expected 404: ${resBad.status}`);
    
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 500);
  } catch (err) {
    console.error("Test failed:", err);
    server.close();
    process.exit(1);
  }
}

run();
