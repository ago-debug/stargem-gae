import { db } from "../server/db";
import { enrollments, dossiers, dossierSteps, dossierAuditLog } from "@shared/schema";
import { sql, gte, eq } from "drizzle-orm";

/**
 * MIGRATION RETROATTIVO: MC2 Dossiers
 * Crea pratiche completate per le iscrizioni degli ultimi 12 mesi.
 * ESECUZIONE DA TERMINALE: npx tsx --env-file=.env scripts/dossier_migration_retroactive.ts
 */
async function runRetroactiveMigration() {
  console.log("Inizio migrazione retroattiva dossiers (ultimi 12 mesi)...");
  
  try {
    // 1. Trova enrollments degli ultimi 12 mesi
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentEnrollments = await db.select()
      .from(enrollments)
      .where(gte(enrollments.createdAt, oneYearAgo));
      
    console.log(`Trovate ${recentEnrollments.length} iscrizioni negli ultimi 12 mesi.`);

    let created = 0;
    let skipped = 0;
    
    for (const enrollment of recentEnrollments) {
      // Check idempotenza: se esiste già un dossier con extra_data.source_enrollment_id
      const existingDossier = await db.select()
        .from(dossiers)
        .where(
          sql`JSON_EXTRACT(${dossiers.extraData}, '$.source_enrollment_id') = ${enrollment.id}`
        );

      if (existingDossier.length > 0) {
        skipped++;
        continue;
      }

      // Crea Dossier per iscrizione corso
      const [dossierResult] = await db.insert(dossiers).values({
        memberId: enrollment.memberId,
        dossierType: 'iscrizione_corso',
        status: 'completato',
        completedAt: enrollment.createdAt,
        tenantId: enrollment.tenantId,
        extraData: { source_enrollment_id: enrollment.id }
      });
      
      const dossierId = dossierResult.insertId;

      // Crea gli step e marcali completati
      const requiredSteps = ['anagrafica', 'certificato_medico', 'pagamento', 'tesseramento', 'iscrizione_attivita'];
      
      for (const stepName of requiredSteps) {
        await db.insert(dossierSteps).values({
          dossierId,
          stepName: stepName as any,
          status: 'completed',
          completedAt: enrollment.createdAt,
          tenantId: enrollment.tenantId
        });
      }

      // Audit Log
      await db.insert(dossierAuditLog).values({
        dossierId,
        action: 'completed',
        performedAt: enrollment.createdAt,
        tenantId: enrollment.tenantId,
        details: { note: 'Retroactive migration from enrollment' }
      });

      created++;
    }

    console.log(`Migrazione completata. Creazione dossier: ${created}, Skippati: ${skipped}.`);
    process.exit(0);
  } catch (error) {
    console.error("Errore durante la migrazione retroattiva:", error);
    process.exit(1);
  }
}

// Esegui se chiamato direttamente
runRetroactiveMigration();
