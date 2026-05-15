import { db } from "../db";
import { dossiers, dossierSteps, members, memberships, medicalCertificates, memberRelationships, payments, type Dossier } from "@shared/schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import { differenceInYears } from "date-fns";

export async function checkMembershipValid(memberId: number, seasonId?: number): Promise<boolean> {
  // Controlla se c'è una tessera attiva (qui semplificato: basta una membership che non è cancellata o che rientra in season)
  const ms = await db.select().from(memberships)
    .where(eq(memberships.memberId, memberId));
  return ms.length > 0;
}

export async function checkMedicalCertValid(memberId: number, targetDate: Date = new Date()): Promise<boolean> {
  const certs = await db.select().from(medicalCertificates)
    .where(eq(medicalCertificates.memberId, memberId))
    .orderBy(desc(medicalCertificates.expiryDate));
  
  if (certs.length === 0) return false;
  
  const latestCert = certs[0];
  const expiry = new Date(latestCert.expiryDate);
  return expiry >= targetDate;
}

export async function checkTutoriPresent(memberId: number): Promise<boolean> {
  const rels = await db.select().from(memberRelationships)
    .where(eq(memberRelationships.memberId, memberId));
  return rels.length > 0;
}

export async function checkPaymentPaid(paymentId: number): Promise<boolean> {
  const pay = await db.select().from(payments)
    .where(eq(payments.id, paymentId));
  if (pay.length === 0) return false;
  return pay[0].status === 'completed' || pay[0].status === 'paid';
}

export async function validateDossierCompletion(dossierId: number): Promise<{ok: boolean, errors: string[]}> {
  const errors: string[] = [];
  
  const dossierRes = await db.select().from(dossiers).where(eq(dossiers.id, dossierId));
  if (dossierRes.length === 0) {
    return { ok: false, errors: ["Dossier not found"] };
  }
  const dossier = dossierRes[0];
  
  const steps = await db.select().from(dossierSteps).where(eq(dossierSteps.dossierId, dossierId));
  
  // 1. Verifica che tutti gli step creati siano completati o skippati
  for (const step of steps) {
    if (step.status === 'pending' || step.status === 'blocked') {
      errors.push(`Step ${step.stepName} non è completato (stato: ${step.status})`);
    }
  }

  // 2. Business rules hard-coded in base al tipo di dossier
  const memberRes = await db.select().from(members).where(eq(members.id, dossier.memberId));
  if (memberRes.length === 0) {
    return { ok: false, errors: ["Member not found"] };
  }
  const member = memberRes[0];
  
  const isMinor = differenceInYears(new Date(), new Date(member.dateOfBirth || new Date())) < 18;

  if (isMinor) {
    const hasTutori = await checkTutoriPresent(member.id);
    if (!hasTutori) {
      errors.push("Il socio è minorenne, è richiesto l'inserimento di almeno un tutore (member_relationships).");
    }
  }

  if (dossier.dossierType === 'iscrizione_corso') {
    const isMembershipValid = await checkMembershipValid(member.id);
    if (!isMembershipValid) {
      errors.push("L'iscrizione ai corsi richiede una tessera (membership) valida.");
    }
    
    const isCertValid = await checkMedicalCertValid(member.id);
    if (!isCertValid) {
      errors.push("L'iscrizione ai corsi richiede un certificato medico non scaduto.");
    }
  }

  if (dossier.dossierType === 'rinnovo') {
    // Se c'è uno step "pagamento" potremmo verificarlo, oppure verificare i payments del membro.
  }
  
  return { ok: errors.length === 0, errors };
}
