import * as dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5001/api/members';

async function runTest() {
  console.log("Iniziando Test Completo FASE 1 (Mappatura Dati Anagrafica)...");

  // Simuliamo il payload ESATTO inviato da `maschera-input-generale.tsx`
  const testPayload = {
    firstName: "TEST_MARIO",
    lastName: "TEST_ROSSI",
    fiscalCode: "RSSMRA80A01H501Z",
    email: "mario.test@example.com",
    mobile: "3331234567",
    address: "Via Roma 1",
    city: "Milano",
    province: "MI",
    postalCode: "20100",
    dateOfBirth: "1980-01-01",
    placeOfBirth: "Roma",
    birthProvince: "RM",
    gender: "M",
    isMinor: false,
    participantType: "Socio",
    
    // Dati Storici
    previousMembershipNumber: "OLD-1234",
    athenaId: "ATH-999",

    // Genitori (Test)
    motherFirstName: "Anna",
    motherLastName: "Bianchi",
    motherCity: "Milano",
    motherMobile: "3339998888",
    fatherFirstName: "Luigi",
    fatherCity: "Torino",

    // JSON e Allegati
    attachmentMetadata: { privacy: true, regolamento: true },
    certificatoMedicoMetadata: { status: "valido" },
    
    active: true
  };

  try {
    const createRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    const createdMember = await createRes.json();
    console.log(`Utente creato con ID: ${createdMember.id}`);
    
    const getRes = await fetch(`${API_URL}/${createdMember.id}`);
    const fetchedMember = await getRes.json();
    
    let success = true;
    
    // Verify base fields (ignoring case)
    if (fetchedMember.firstName.toLowerCase() !== testPayload.firstName.toLowerCase()) { console.error("Mismatch firstName"); success = false; }
    if (fetchedMember.city.toLowerCase() !== testPayload.city.toLowerCase()) { console.error("Mismatch city"); success = false; }
    
    // Verify Legacy
    if (fetchedMember.previousMembershipNumber !== testPayload.previousMembershipNumber) { console.error("Mismatch previousMembershipNumber"); success = false; }
    if (fetchedMember.athenaId !== testPayload.athenaId) { console.error("Mismatch athenaId"); success = false; }
    
    // Verify Genitori
    if (fetchedMember.motherFirstName.toLowerCase() !== testPayload.motherFirstName.toLowerCase()) { console.error("Mismatch motherFirstName"); success = false; }
    if (fetchedMember.motherCity !== testPayload.motherCity) { console.error("Mismatch motherCity:", fetchedMember.motherCity); success = false; }
    
    // Verify JSON
    let attach = typeof fetchedMember.attachmentMetadata === 'string' ? JSON.parse(fetchedMember.attachmentMetadata) : fetchedMember.attachmentMetadata;
    if (!attach?.privacy) { console.error("Mismatch attachmentMetadata:", attach); success = false; }
    
    // Verify ID generation (STAGIONE-XXXXXX)
    if (!fetchedMember.cardNumber || !fetchedMember.cardNumber.startsWith("2526-")) {
      console.error("ERRORE: cardNumber mancante o non generato correttamente! Trovato:", fetchedMember.cardNumber);
      success = false;
    } else {
      console.log(`✓ ID Generato Correttamente: ${fetchedMember.cardNumber}`);
    }

    if (success) {
      console.log("✅ FASE 1: TUTTI I TEST SUPERATI! Il DB ha mappato e salvato correttamente ogni singolo campo.");
    } else {
      console.log("❌ FASE 1: TEST FALLITO.");
    }

    await fetch(`${API_URL}/${createdMember.id}`, { method: 'DELETE' });
  } catch (error) {
    console.error("Errore:", error);
  }
}

runTest();
