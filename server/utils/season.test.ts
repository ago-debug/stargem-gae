import {
  resolveMembershipSeason,
  generateMembershipNumber,
  generateBarcode,
} from "./season";

/**
 * Manual Test Suite per la validazione assoluta delle utilities Tessere.
 * Eseguibile via: npx tsx server/utils/season.test.ts
 */
function runTests() {
  let passed = 0;
  let failed = 0;

  function assertEqual(testName: string, actual: any, expected: any) {
    // JSON.stringify helps comparing Date objects by emitting ISO strings
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr === expStr) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      console.error(`   Esperto: ${expStr}`);
      console.error(`   Ricevuto: ${actStr}`);
      failed++;
    }
  }

  console.log("--- ESECUZIONE TEST CASI LIMITE: SEZIONE TESSERE ---\n");

  // CASO 1: 31 Agosto con CORRENTE (Deve morire lo stesso giorno)
  const c1_date = new Date(2025, 7, 31, 10, 0, 0); // 31 Ago 2025
  const c1_res = resolveMembershipSeason(c1_date, "CORRENTE");
  assertEqual("1. 31 Agosto [CORRENTE]", 
    { start: c1_res.seasonStartYear, end: c1_res.seasonEndYear, exp_y: c1_res.expiryDate.getFullYear(), exp_m: c1_res.expiryDate.getMonth() + 1, exp_d: c1_res.expiryDate.getDate() },
    { start: 2024, end: 2025, exp_y: 2025, exp_m: 8, exp_d: 31 }
  );

  // CASO 2: 1 Settembre con CORRENTE (Nasce oggi, muore ad Agosto prossimo)
  const c2_date = new Date(2025, 8, 1, 10, 0, 0); // 1 Set 2025
  const c2_res = resolveMembershipSeason(c2_date, "CORRENTE");
  assertEqual("2. 1 Settembre [CORRENTE]", 
    { start: c2_res.seasonStartYear, end: c2_res.seasonEndYear, exp_y: c2_res.expiryDate.getFullYear(), exp_m: c2_res.expiryDate.getMonth() + 1, exp_d: c2_res.expiryDate.getDate() },
    { start: 2025, end: 2026, exp_y: 2026, exp_m: 8, exp_d: 31 }
  );

  // CASO 3: Maggio con SUCCESSIVA (Acquista prevendita per l'anno agonistico che verrà)
  const c3_date = new Date(2025, 4, 15, 10, 0, 0); // 15 Mag 2025
  const c3_res = resolveMembershipSeason(c3_date, "SUCCESSIVA");
  assertEqual("3. Maggio [SUCCESSIVA]", 
    { start: c3_res.seasonStartYear, end: c3_res.seasonEndYear, exp_y: c3_res.expiryDate.getFullYear(), exp_m: c3_res.expiryDate.getMonth() + 1, exp_d: c3_res.expiryDate.getDate() },
    { start: 2025, end: 2026, exp_y: 2026, exp_m: 8, exp_d: 31 }
  );

  // CASO 4: Ottobre con CORRENTE (Pieno regime)
  const c4_date = new Date(2024, 9, 10, 10, 0, 0); // 10 Ott 2024
  const c4_res = resolveMembershipSeason(c4_date, "CORRENTE");
  assertEqual("4. Ottobre [CORRENTE]", 
    { start: c4_res.seasonStartYear, end: c4_res.seasonEndYear, exp_y: c4_res.expiryDate.getFullYear(), exp_m: c4_res.expiryDate.getMonth() + 1, exp_d: c4_res.expiryDate.getDate() },
    { start: 2024, end: 2025, exp_y: 2025, exp_m: 8, exp_d: 31 }
  );

  // CASO 5: Gennaio con CORRENTE (Iscrizione di metà anno agonistico)
  const c5_date = new Date(2025, 0, 15, 10, 0, 0); // 15 Gen 2025
  const c5_res = resolveMembershipSeason(c5_date, "CORRENTE");
  assertEqual("5. Gennaio [CORRENTE]", 
    { start: c5_res.seasonStartYear, end: c5_res.seasonEndYear, exp_y: c5_res.expiryDate.getFullYear(), exp_m: c5_res.expiryDate.getMonth() + 1, exp_d: c5_res.expiryDate.getDate() },
    { start: 2024, end: 2025, exp_y: 2025, exp_m: 8, exp_d: 31 }
  );

  // --- MEMBER NUMBERS ---

  // CASO 6: Generazione Number id Piccolo
  const num_small = generateMembershipNumber(7, 2024, 2025);
  assertEqual("6. Member Numb (Id Piccolo)", num_small, "2425-0007");

  // CASO 7: Generazione Number id Grande
  const num_large = generateMembershipNumber(14502, 2024, 2025);
  assertEqual("7. Member Numb (Id Grande)", num_large, "2425-14502");

  // CASO 8: Generazione Barcode
  const bc = generateBarcode("2526-0850");
  assertEqual("8. Barcode (Trattini rimossi)", bc, "T25260850");

  console.log(`\nRisultato Finale: ${passed} Passati, ${failed} Falliti`);
  if (failed > 0) process.exit(1);
}

runTests();
