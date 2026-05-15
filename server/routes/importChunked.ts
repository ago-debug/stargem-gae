import { type Express } from "express";
import { db } from "../db";
import * as schema from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { generateStranieroPlaceholder } from "../utils/cfPlaceholder";

export function registerImportChunkedRoutes(app: Express) {
  app.post("/api/import/chunked", async (req, res) => {
    try {
      const { chunk_index, total_chunks, batch_id, records, fieldMapping, entityType } = req.body;
      const entity = entityType || 'members';
      
      if (entity !== 'members') {
        return res.status(400).json({ message: "Solo l'entità members è supportata per questo endpoint (Lotto 1)." });
      }

      if (!records || !Array.isArray(records)) {
        return res.status(400).json({ message: "Nessun record passato nel chunk." });
      }
      
      const mapping = typeof fieldMapping === 'string' ? JSON.parse(fieldMapping) : fieldMapping;
      const performedBy = (req.user as any)?.id || 'botAI';
      
      // Load existing members for deduplication
      const allMembers = await db.select().from(schema.members);
      const memberLookup = new Map<string, any>();
      for (const m of allMembers) {
        if (m.fiscalCode) memberLookup.set(m.fiscalCode.toUpperCase(), m);
      }
      
      let imported = 0; let updated = 0; let skipped = 0;
      const chunkErrors: any[] = [];
      const skippedRecords: any[] = [];
      
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        // row is an array of strings like ["val1", "val2"]
        
        try {
          const memberData: any = {};
          const extraData: any = {};
          
          for (const [field, colIndex] of Object.entries(mapping)) {
            if (colIndex !== null && colIndex !== undefined && (colIndex as number) >= 0) {
              let value = row[colIndex as number]?.trim();
              if (value === undefined || value === "") continue;
              
              if (["dateOfBirth", "cardIssueDate", "cardExpiryDate", "entityCardIssueDate", "entityCardExpiryDate", "medicalCertificateExpiry"].includes(field)) {
                const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (match) memberData[field] = new Date(`${match[3]}-${match[2]}-${match[1]}`);
                else memberData[field] = new Date(value);
              } else if (field === "gender") {
                memberData[field] = value.toUpperCase() === 'M' || value.toUpperCase() === 'UOMO' ? 'M' : 'F';
              } else {
                memberData[field] = value;
              }
            }
          }
          
          for(let j=0; j<row.length; j++) {
            let mapped = false;
            for(const colIndex of Object.values(mapping)) { if(colIndex === j) mapped = true; }
            if(!mapped && row[j]) extraData[`col_${j}`] = row[j];
          }
          
          const dataQualityFlag: any = {};
          
          let cf = memberData.fiscalCode ? memberData.fiscalCode.toUpperCase() : null;
          if (!cf) {
            const country = (memberData.country || '').toLowerCase();
            const cittadinanza = (memberData.nationality || '').toLowerCase();
            const isEster = (country && country !== 'italia' && country !== 'italy') || (cittadinanza && cittadinanza !== 'italiana');
            
            if (isEster) {
              cf = await generateStranieroPlaceholder();
              dataQualityFlag.cf_placeholder = true;
            } else if (memberData.dateOfBirth) {
              const age = new Date().getFullYear() - memberData.dateOfBirth.getFullYear();
              if (age < 18) {
                cf = null;
                dataQualityFlag.minore_senza_cf = true;
              }
            }
          } else {
            if (cf.length !== 16) {
               dataQualityFlag.cf_malformato = true;
            }
          }
          memberData.fiscalCode = cf;
          memberData.extraData = Object.keys(extraData).length > 0 ? extraData : null;
          memberData.importedLotto = 'lotto1_anagrafica';
          memberData.importedSourceRowIndex = i + 1; // within chunk
          memberData.importedBy = performedBy;
          memberData.importedAt = new Date();
          
          let existingMember = cf ? memberLookup.get(cf) : null;
          
          if (existingMember) {
             const updatedData: any = {};
             for (const key of Object.keys(memberData)) {
               if(['extraData','importedLotto','importedSourceRowIndex','importedBy','importedAt', 'fiscalCode'].includes(key)) continue;
               const fileVal = memberData[key];
               const dbVal = existingMember[key];
               
               if (fileVal) {
                 if (!dbVal) {
                   updatedData[key] = fileVal; 
                 } else if (String(fileVal) !== String(dbVal)) {
                   dataQualityFlag.has_conflict = true;
                     await db.insert(schema.auditLogs).values({
                       entityId: existingMember.id,
                       entityType: 'members',
                       action: 'UPDATE',
                       details: JSON.stringify({ field: key, old: dbVal, new: fileVal }),
                       performedBy: performedBy
                     });
                 }
               }
             }
             if (Object.keys(updatedData).length > 0 || Object.keys(dataQualityFlag).length > 0) {
                if (Object.keys(dataQualityFlag).length > 0) {
                    updatedData.dataQualityFlag = dataQualityFlag;
                }
                await db.update(schema.members).set(updatedData).where(eq(schema.members.id, existingMember.id));
                updated++;
             }
          } else {
             memberData.dataQualityFlag = Object.keys(dataQualityFlag).length > 0 ? dataQualityFlag : null;
             memberData.active = true;
             await db.insert(schema.members).values(memberData);
             if (cf) memberLookup.set(cf, memberData); // Add to local map to prevent duplicates within same import
             imported++;
          }
          
        } catch (e: any) {
          chunkErrors.push({ row: i, message: e.message });
          skippedRecords.push({ rowData: row, error: e.message });
          skipped++;
        }
      }
      
      if (batch_id) {
        let currentErrors = [];
        try {
          const [existingBatch] = await db.select().from(schema.importBatches).where(eq(schema.importBatches.batchId, batch_id));
          if (existingBatch) {
            currentErrors = existingBatch.errorsLog ? (existingBatch.errorsLog as any[]) : [];
            await db.update(schema.importBatches).set({
              completedChunks: (existingBatch.completedChunks || 0) + 1,
              recordsImported: (existingBatch.recordsImported || 0) + imported,
              recordsSkipped: (existingBatch.recordsSkipped || 0) + skipped,
              recordsUpdated: (existingBatch.recordsUpdated || 0) + updated,
              errorsLog: [...currentErrors, ...skippedRecords]
            }).where(eq(schema.importBatches.batchId, batch_id));
          } else {
            await db.insert(schema.importBatches).values({
              batchId: batch_id,
              totalChunks: total_chunks,
              completedChunks: 1,
              recordsImported: imported,
              recordsSkipped: skipped,
              recordsUpdated: updated,
              errorsLog: skippedRecords
            });
          }
        } catch (dbErr: any) {
          console.error("Batch update error:", dbErr);
        }
      }
      
      return res.json({ success: true, inserted: imported, updated, skipped, errors: chunkErrors });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/import/batch/:batch_id/skipped", async (req, res) => {
    try {
      const { batch_id } = req.params;
      const [batch] = await db.select().from(schema.importBatches).where(eq(schema.importBatches.batchId, batch_id));
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      const errorsLog: any[] = (batch.errorsLog as any[]) || [];
      if (errorsLog.length === 0) {
        return res.status(200).send("No skipped records");
      }
      
      // Convert to CSV
      // Might need to just build raw CSV
      let csvContent = "row_index,error_reason,original_row_data\n";
      for (const err of errorsLog) {
        csvContent += `"${err.row}","${err.error}","${(err.rowData || []).join(';')}"\n`;
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=skipped_${batch_id}.csv`);
      res.send(csvContent);
    } catch (e: any) {
       return res.status(500).json({ message: e.message });
    }
  });
}
