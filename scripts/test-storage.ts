import "dotenv/config";
import { storage } from "../server/storage";
import { db } from "../server/db";
import { enrollments, payments } from "../shared/schema";
import { desc } from "drizzle-orm";

async function runStorageTest() {
  const memberId = 2488;
  const courseId = 397;
  
  // Test Active Season retrieval as done in routes.ts
  const activeSeason = await storage.getActiveSeason();
  console.log("Active Season Retrieved:", activeSeason?.id);
  
  // 1. STANDARD COURSE
  const data1 = { memberId, courseId, participationType: "STANDARD_COURSE", status: "active", notes: "Test Storage 1", seasonId: activeSeason?.id };
  const e1 = await storage.createEnrollment(data1 as any);
  console.log("Created STANDARD:", { id: e1.id, participationType: e1.participationType, seasonId: e1.seasonId });

  // 2. FREE TRIAL
  const data2 = { memberId, courseId, participationType: "FREE_TRIAL", status: "active", targetDate: new Date("2026-06-10"), notes: "Test Storage 2", seasonId: activeSeason?.id };
  const e2 = await storage.createEnrollment(data2 as any);
  console.log("Created FREE_TRIAL:", { id: e2.id, participationType: e2.participationType, targetDate: e2.targetDate, seasonId: e2.seasonId });

  // 3. PAID TRIAL
  const data3 = { memberId, courseId, participationType: "PAID_TRIAL", status: "active", targetDate: new Date("2026-06-12"), notes: "Test Storage 3", seasonId: activeSeason?.id };
  const e3 = await storage.createEnrollment(data3 as any);
  console.log("Created PAID_TRIAL:", { id: e3.id, participationType: e3.participationType, targetDate: e3.targetDate, seasonId: e3.seasonId });

  // 4. SINGLE LESSON
  const data4 = { memberId, courseId, participationType: "SINGLE_LESSON", status: "active", targetDate: new Date("2026-06-14"), notes: "Test Storage 4", seasonId: activeSeason?.id };
  const e4 = await storage.createEnrollment(data4 as any);
  console.log("Created SINGLE_LESSON:", { id: e4.id, participationType: e4.participationType, targetDate: e4.targetDate, seasonId: e4.seasonId });

  // Verify DB directly
  const recent = await db.select().from(enrollments).orderBy(desc(enrollments.id)).limit(4);
  console.log("\n--- DB VERIFICATION ---");
  console.log(recent.map(r => ({ id: r.id, mode: r.participationType, targetDate: r.targetDate ? r.targetDate.toISOString().split('T')[0] : null, seasonId: r.seasonId })));
  
  process.exit(0);
}

runStorageTest().catch(console.error);
