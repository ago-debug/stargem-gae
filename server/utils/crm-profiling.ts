import { db } from "../db";
import { members, payments, enrollments } from "../../shared/schema";
import { and, gte, desc, eq, sql } from "drizzle-orm";
import { CRM_CONFIG, getScoreFromThresholds, getRecencyScore } from "../../shared/crm-config";
export async function calculateCrmProfileForMember(memberId: number) {
  // 1. Fetch member
  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) throw new Error("Member not found");

  // Skip if override is active
  if (member.crmProfileOverride) {
    return member;
  }

  // 1. Spesa Recente (Ultimi 12 mesi) - Peso MAX: 40
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

  let monetaryScore = getScoreFromThresholds(totalSpent, CRM_CONFIG.SPESA_THRESHOLDS);

  // 2. Continuità / Frequenza - Peso MAX: 25
  const numPayments = memberPayments.length;
  let frequencyScore = getScoreFromThresholds(numPayments, CRM_CONFIG.FREQUENZA_THRESHOLDS);

  // 3. Numero Attività / Servizi acquistati - Peso MAX: 20
  const activeLegacyEnrollments = await db.select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.memberId, memberId),
        eq(enrollments.status, "active")
      )
    );

  const totalActiveEnrollments = activeLegacyEnrollments.length;

  let activityScore = getScoreFromThresholds(totalActiveEnrollments, CRM_CONFIG.ATTIVITA_THRESHOLDS);

  // 4. Recency (Attività Recente) - Peso MAX: 15
  let recencyScore = 0;
  let lastActivityDate: Date | null = null;
  if (memberPayments.length > 0) {
    memberPayments.sort((a, b) => new Date(b.paidDate || 0).getTime() - new Date(a.paidDate || 0).getTime());
    lastActivityDate = new Date(memberPayments[0].paidDate || 0);
  }
  
  if (lastActivityDate) {
    const monthsSinceLastActivity = (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    recencyScore = getRecencyScore(monthsSinceLastActivity, CRM_CONFIG.RECENCY_THRESHOLDS);
  }

  // Neo-iscritto check
  let isNew = false;
  if (member.insertionDate) {
    const monthsSinceInsertion = (new Date().getTime() - new Date(member.insertionDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceInsertion <= 3) isNew = true;
  }

  const totalScore = monetaryScore + frequencyScore + activityScore + recencyScore;
  
  let crmLevel = CRM_CONFIG.LEVELS.SILVER.label;
  let reason = `Score: ${totalScore} (Spesa: ${monetaryScore}, Freq: ${frequencyScore}, Attività: ${activityScore}, Recency: ${recencyScore})`;

  if (totalScore >= CRM_CONFIG.LEVELS.DIAMOND.minScore) crmLevel = CRM_CONFIG.LEVELS.DIAMOND.label;
  else if (totalScore >= CRM_CONFIG.LEVELS.PLATINUM.minScore) crmLevel = CRM_CONFIG.LEVELS.PLATINUM.label;
  else if (totalScore >= CRM_CONFIG.LEVELS.GOLD.minScore) crmLevel = CRM_CONFIG.LEVELS.GOLD.label;
  else {
    crmLevel = CRM_CONFIG.LEVELS.SILVER.label;
    if (isNew) {
      reason += " - Neo-Iscritto";
    }
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
