import { db } from "../server/db";
import { dossiers, dossierSteps } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function runTest() {
  console.log("Testing MC2 backend logic...");
  
  // 1. Get a random member using raw query to avoid out of sync columns
  const mems: any[] = await db.execute(sql`SELECT id FROM members LIMIT 1`);
  if (!mems || mems[0]?.length === 0) {
    console.log("No members found. Cannot test.");
    return;
  }
  const memberId = mems[0][0].id;
  
  // 2. Create Dossier manually via logic to simulate what the route does
  const [insertDossier] = await db.insert(dossiers).values({
    memberId,
    dossierType: 'iscrizione_corso',
    status: 'bozza',
    tenantId: '1'
  });
  
  const dossierId = insertDossier.insertId;
  console.log("Created dossier:", dossierId);
  
  // 3. Create Steps
  const requiredSteps = ['anagrafica', 'certificato_medico', 'pagamento', 'tesseramento', 'iscrizione_attivita'];
  for (const step of requiredSteps) {
    await db.insert(dossierSteps).values({
      dossierId,
      stepName: step as any,
      status: 'pending',
      tenantId: '1'
    });
  }
  
  const stepsRes = await db.select().from(dossierSteps).where(eq(dossierSteps.dossierId, dossierId));
  console.log("Steps created:", stepsRes.length);
  
  // 4. Update Step
  await db.update(dossierSteps).set({ status: 'completed' }).where(eq(dossierSteps.id, stepsRes[0].id));
  console.log("Updated step 1 to completed");
  
  // 5. Test complete
  const { validateDossierCompletion } = await import("../server/utils/dossierBusinessRules");
  const val = await validateDossierCompletion(dossierId);
  console.log("Validation result (should fail due to pending steps or missing member fields):", val);
  
  // 6. Delete
  await db.update(dossiers).set({ status: 'annullato' }).where(eq(dossiers.id, dossierId));
  console.log("Dossier deleted (soft)");
  
  process.exit(0);
}

runTest().catch(console.error);
