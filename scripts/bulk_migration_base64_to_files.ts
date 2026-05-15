import { db } from "../server/db";
import { members, teamEmployees } from "../shared/schema";
import { isNotNull, isNull, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// BACKUP DB SCRIPT: Prima di lanciare questa migrazione in staging/prod,
// è obbligatorio eseguire mysqldump:
// mysqldump -u <user> -p<pass> <db_name> > /backups/pre_migration_$(date +%F).sql

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "migrated");
const LOG_FILE = path.join(process.cwd(), "migration_base64.log");

function decodeBase64File(base64String: string, memberId: number, prefix: string = "doc"): string {
  // Rimuove il prefisso data:image/png;base64,
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error("Stringa Base64 non valida o formato sconosciuto");
  }

  const mimeType = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  
  let extension = "bin";
  if (mimeType.includes("pdf")) extension = "pdf";
  else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) extension = "jpg";
  else if (mimeType.includes("png")) extension = "png";
  else if (mimeType.includes("heic")) extension = "heic";

  const uuid = randomUUID();
  const dirPath = path.join(UPLOADS_DIR, String(memberId));
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const fileName = `${prefix}_${uuid}.${extension}`;
  const filePath = path.join(dirPath, fileName);
  fs.writeFileSync(filePath, buffer);

  return `/api/files/migrated/${memberId}/${fileName}`;
}

async function run() {
  console.log("🚀 Avvio migrazione bulk Base64 -> File System...");
  const logEntries: any[] = [];
  
  try {
    // ---- 1. Migrazione Members.attachment_metadata ----
    // N.B: Utilizziamo sql crudo o JSON operators in base alle capacità del DB.
    // Qui andiamo a recuperare tutti i record in cui la colonna attachment_metadata non è vuota (ma nel nostro
    // nuovo schema è stata bypassata la dichiarazione, quindi usiamo SQL)
    const membersToMigrate = await db.execute(
      sql`SELECT id, attachment_metadata FROM members WHERE attachment_metadata IS NOT NULL`
    ) as any[];

    console.log(`Trovati ${membersToMigrate[0]?.length || 0} record members con allegati JSON da migrare.`);

    let membersCount = 0;
    for (const record of membersToMigrate[0] || []) {
      const memberId = record.id;
      try {
        let metadata = record.attachment_metadata;
        if (typeof metadata === "string") {
          metadata = JSON.parse(metadata);
        }

        const newAttachments: any[] = [];
        let hasBase64 = false;

        // Se l'allegato è salvato come file crudo array
        if (Array.isArray(metadata)) {
          for (const item of metadata) {
            if (item.url && item.url.startsWith("data:")) {
              const fileUrl = decodeBase64File(item.url, memberId, "attachment");
              newAttachments.push({
                type: item.type || "unknown",
                filename: item.filename || "migrated_file",
                url: fileUrl,
                uploadedAt: new Date().toISOString()
              });
              hasBase64 = true;
            } else {
              newAttachments.push(item);
            }
          }
        }

        if (hasBase64) {
          // Aggiorna il DB tramite query cruda dato che abbiamo modificato lo schema
          await db.execute(sql`
            UPDATE members 
            SET attachments_url = ${JSON.stringify(newAttachments)}, 
                attachment_metadata = NULL 
            WHERE id = ${memberId}
          `);
          membersCount++;
          logEntries.push({ memberId, status: "success", count: newAttachments.length });
        }
      } catch (err: any) {
        logEntries.push({ memberId, status: "error", error: err.message });
      }
    }

    // ---- 2. Migrazione photo_url (avatar) ----
    const photosToMigrate = await db.execute(
      sql`SELECT id, photo_url FROM members WHERE photo_url IS NOT NULL AND photo_url LIKE 'data:%'`
    ) as any[];

    console.log(`Trovati ${photosToMigrate[0]?.length || 0} record members con photo_url Base64 da migrare.`);

    let photosCount = 0;
    for (const record of photosToMigrate[0] || []) {
      const memberId = record.id;
      try {
        const fileUrl = decodeBase64File(record.photo_url, memberId, "avatar");
        await db.execute(sql`
          UPDATE members 
          SET attachments_url = JSON_ARRAY_APPEND(COALESCE(attachments_url, JSON_ARRAY()), '$', CAST(${JSON.stringify({ type: 'avatar', url: fileUrl })} AS JSON)),
              photo_url = NULL
          WHERE id = ${memberId}
        `);
        photosCount++;
        logEntries.push({ memberId, type: "avatar", status: "success" });
      } catch (err: any) {
        logEntries.push({ memberId, type: "avatar", status: "error", error: err.message });
      }
    }

    console.log(`✅ Migrazione completata. ${membersCount} allegati, ${photosCount} avatar convertiti.`);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logEntries, null, 2));

  } catch (error) {
    console.error("❌ ERRORE FATALE IN MIGRAZIONE:", error);
    console.log("⚠️ ROLLBACK STRATEGY: Ricaricare il database usando il dump pre_migration.sql");
  }
  
  process.exit(0);
}

run();
