import { getUnifiedActivitiesPreview, getUnifiedEnrollmentsPreview } from "../server/services/unifiedBridge";
import { type Request } from "express";

async function run() {
  try {
    console.log("=== STI BRIDGE API DIAGNOSTIC ===");
    console.log("Testing getUnifiedActivitiesPreview...");
    const reqMock = {} as Request;
    
    const activities = await getUnifiedActivitiesPreview(reqMock);
    console.log(`Aggregated Activities Count: ${activities.length}`);
    
    const ids = activities.map(a => a.id);
    const uniqueIds = new Set(ids);
    console.log(`Unique Virtual IDs: ${uniqueIds.size} / ${ids.length}`);
    if (uniqueIds.size !== ids.length) {
      console.error("COLLISION DETECTED in Activities!");
    } else {
      console.log("NO COLLISIONS. IDs are globally unique across silos.");
    }
    
    if (activities.length > 0) {
      console.log("Shape of first aggregated activity:");
      console.log(activities[0]);
    }

    console.log("\nTesting getUnifiedEnrollmentsPreview...");
    const enrollments = await getUnifiedEnrollmentsPreview(reqMock);
    console.log(`Aggregated Enrollments Count: ${enrollments.length}`);
    
    const enrIds = enrollments.map(e => e.id);
    const enrUniqueIds = new Set(enrIds);
    console.log(`Unique Virtual IDs: ${enrUniqueIds.size} / ${enrIds.length}`);
    if (enrUniqueIds.size !== enrIds.length) {
      console.error("COLLISION DETECTED in Enrollments!");
    } else {
      console.log("NO COLLISIONS. Enrollment IDs are globally unique across silos.");
    }

    if (enrollments.length > 0) {
      console.log("Shape of first aggregated enrollment:");
      console.log(enrollments[0]);
    }
    
    console.log("\nDiagnostics Complete.");
    process.exit(0);
  } catch (error) {
    console.error("Diagnostics failed:", error);
    process.exit(1);
  }
}

run();
