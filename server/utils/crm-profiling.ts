import { db } from "../db";
import { members, payments, enrollments } from "../../shared/schema";
import { and, gte, desc, eq, sql } from "drizzle-orm";

export async function calculateCrmProfileForMember(memberId: number) {
  // 1. Fetch member
  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) throw new Error("Member not found");

  // Skip if override is active
  if (member.crmProfileOverride) {
    return member;
  }

  // Calculate Monetary (Last 12 months paid)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const memberPayments = await db.select()
    .from(payments)
    .where(
      and(
        eq(payments.memberId, memberId),
        eq(payments.status, "paid"),
        gte(payments.paidDate, oneYearAgo)
      )
    );

  const totalSpent = memberPayments.reduce((acc, p) => acc + parseFloat(p.amount?.toString() || "0"), 0);

  let monetaryScore = 0;
  if (totalSpent >= 1000) monetaryScore = 50;
  else if (totalSpent >= 500) monetaryScore = 30;
  else if (totalSpent >= 150) monetaryScore = 15;
  else if (totalSpent > 0) monetaryScore = 5;

  const activeLegacyEnrollments = await db.select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.memberId, memberId),
        eq(enrollments.status, "active")
      )
    );

  const totalActiveEnrollments = activeLegacyEnrollments.length;

  let frequencyScore = 0;
  if (totalActiveEnrollments >= 3) frequencyScore = 30;
  else if (totalActiveEnrollments === 2) frequencyScore = 20;
  else if (totalActiveEnrollments === 1) frequencyScore = 10;

  // Calculate Recency 
  let recencyScore = 0;
  let lastActivityDate: Date | null = null;
  if (memberPayments.length > 0) {
    // Sort descending
    memberPayments.sort((a, b) => new Date(b.paidDate || 0).getTime() - new Date(a.paidDate || 0).getTime());
    lastActivityDate = new Date(memberPayments[0].paidDate || 0);
  }
  
  if (lastActivityDate) {
    const monthsSinceLastActivity = (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceLastActivity <= 1) recencyScore = 20;
    else if (monthsSinceLastActivity <= 3) recencyScore = 10;
    else if (monthsSinceLastActivity <= 6) recencyScore = 5;
    else recencyScore = 0;
  }

  // Is neo-iscritto?
  let isNew = false;
  if (member.insertionDate) {
    const monthsSinceInsertion = (new Date().getTime() - new Date(member.insertionDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceInsertion <= 3) isNew = true;
  }

  const totalScore = monetaryScore + frequencyScore + recencyScore;
  
  let crmLevel = "SILVER";
  let reason = `Score: ${totalScore} (Spesa: ${totalSpent}€, Attività: ${totalActiveEnrollments})`;

  if (totalScore >= 100) crmLevel = "DIAMOND";
  else if (totalScore >= 80) crmLevel = "PLATINUM";
  else if (totalScore >= 50) crmLevel = "GOLD";
  else if (isNew) {
    crmLevel = "SILVER";
    reason = "Neo-Iscritto (Score < 50)";
  }

  // Update DB
  await db.update(members)
    .set({
      crmProfileLevel: crmLevel,
      crmProfileScore: totalScore,
      crmProfileReason: reason
    })
    .where(eq(members.id, memberId));

  return { level: crmLevel, score: totalScore, reason };
}

export async function recalculateAllActiveMembers() {
  const activeMembers = await db.select().from(members).where(eq(members.active, true));
  let updatedCount = 0;
  for (const m of activeMembers) {
    if (!m.crmProfileOverride) {
      await calculateCrmProfileForMember(m.id);
      updatedCount++;
    }
  }
  return updatedCount;
}
