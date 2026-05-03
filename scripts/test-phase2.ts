import * as dotenv from 'dotenv';
dotenv.config();
import { db } from '../server/db';
import { members, memberships, medicalCertificates } from '../shared/schema';
import { eq } from 'drizzle-orm';

const API_URL = 'http://localhost:5001/api/members';

async function runTestPhase2() {
  console.log("Iniziando Test Completo FASE 2 (GemPass e Certificati Medici)...");

  // Simuliamo il payload ESATTO inviato da `maschera-input-generale.tsx` nella sezione "Tessere e Certificati"
  const testPayload = {
    firstName: "TEST_GEMPASS",
    lastName: "ROSSI",
    fiscalCode: "RSSGMP80A01H501K",
    cardNumber: "2526-009999",
    
    // Tessere Metadata JSON
    tessereMetadata: {
      quota: "45.00",
      pagamento: "2026-05-01",
      membershipType: "NUOVO",
      seasonCompetence: "CORRENTE",
      tesseraEnte: "CSEN",
      scadenzaTesseraEnte: "2026-12-31"
    },
    
    // Certificato Medico Metadata JSON
    hasMedicalCertificate: true,
    certificatoMedicoMetadata: {
      dataScadenza: "2026-10-15",
      dataRinnovo: "2025-10-15",
      rilasciatoDa: "Dott. Bianchi",
      pagamento: "40",
      aNoi: "15",
      tipo: "agonistico"
    },
    
    active: true
  };

  try {
    console.log("1. Creazione Utente con Tessere e Certificato...");
    const createRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (!createRes.ok) {
      console.error("Errore creazione API:", await createRes.text());
      return;
    }
    const createdMember = await createRes.json();
    console.log(`Utente creato con ID: ${createdMember.id}`);
    
    console.log("2. Verifica Tabelle Relazionali (memberships, medical_certificates)...");
    
    const [activeMembership] = await db.select().from(memberships).where(eq(memberships.memberId, createdMember.id));
    const [activeCert] = await db.select().from(medicalCertificates).where(eq(medicalCertificates.memberId, createdMember.id));

    let success = true;

    // Check Membership
    if (!activeMembership) {
      console.error("❌ ERRORE: Nessuna membership creata!");
      success = false;
    } else {
      console.log("Membership Trovata:", activeMembership);
      if (activeMembership.fee !== "45.00") { console.error("Mismatch Quota Tessera"); success = false; }
      if (activeMembership.entityCardNumber !== "CSEN") { console.error("Mismatch Tessera Ente (Trovato:", activeMembership.entityCardNumber, ")"); success = false; }
      
      const expiryStr = activeMembership.expiryDate instanceof Date ? activeMembership.expiryDate.toISOString() : String(activeMembership.expiryDate);
      if (!expiryStr.includes("08-31") && !expiryStr.includes("Aug 31")) {
        console.error(`❌ ERRORE Scadenza: Non è il 31 Agosto! Trovato: ${expiryStr}`);
        success = false;
      }
    }

    if (!activeCert) {
      console.error("❌ ERRORE: Nessun certificato medico creato!");
      success = false;
    } else {
      console.log("Certificato Medico Trovato:", activeCert);
      if (activeCert.doctorName !== "Dott. Bianchi") { console.error("Mismatch Rilasciato Da"); success = false; }
      if (!activeCert.notes?.includes("A Noi: €15")) { console.error("Mismatch Note JSON"); success = false; }
    }

    if (success) {
      console.log("✅ FASE 2: TEST GEMPASS E CERTIFICATI SUPERATI! Il DB genera le righe relazionali perfette.");
    } else {
      console.log("❌ FASE 2: TEST FALLITO.");
    }

    await fetch(`${API_URL}/${createdMember.id}`, { method: 'DELETE' });
    console.log("Utente di test rimosso dal DB.");

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("Errore:", error);
    process.exit(1);
  }
}

runTestPhase2();
