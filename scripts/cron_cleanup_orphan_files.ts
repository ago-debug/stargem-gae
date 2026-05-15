import fs from "fs";
import path from "path";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const LOG_FILE = path.join(process.cwd(), "cron_cleanup.log");

// Helper ricorsivo per camminare nelle directory
function walkDir(dir: string, callback: (filePath: string) => void) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

async function run() {
  console.log(`[${new Date().toISOString()}] Avvio cron cleanup file orfani...`);
  
  // Raccogliamo tutti gli URL referenziati nel DB
  const referencedUrls = new Set<string>();

  try {
    // Estrae attachments_url (è un array JSON) da members
    const membersAttachments = await db.execute(
      sql`SELECT attachments_url FROM members WHERE attachments_url IS NOT NULL`
    ) as any[];

    for (const record of membersAttachments[0] || []) {
      const arr = typeof record.attachments_url === 'string' ? JSON.parse(record.attachments_url) : record.attachments_url;
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item.url) referencedUrls.add(item.url);
        }
      }
    }

    // Estrae avatar_url da team_employees
    const teamAvatars = await db.execute(
      sql`SELECT avatar_url FROM team_employees WHERE avatar_url IS NOT NULL`
    ) as any[];

    for (const record of teamAvatars[0] || []) {
      if (record.avatar_url) referencedUrls.add(record.avatar_url);
    }

    console.log(`Trovati ${referencedUrls.size} file referenziati nel DB.`);

    const now = Date.now();
    const _24_HOURS_MS = 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    walkDir(UPLOADS_DIR, (filePath) => {
      // Ignora i file di sistema e la cartella members (legacy tessere export) se necessario
      if (filePath.includes('.DS_Store')) return;

      const stats = fs.statSync(filePath);
      const fileAgeMs = now - stats.mtimeMs;

      // Ricostruiamo l'url relativo per confrontarlo col DB
      // Es. /Users/.../uploads/avatar/1/file.png -> /api/files/avatar/1/file.png
      const relativePath = filePath.split("uploads")[1].replace(/\\/g, '/');
      const virtualUrl = `/api/files${relativePath}`;

      if (!referencedUrls.has(virtualUrl) && fileAgeMs > _24_HOURS_MS) {
        console.log(`Eliminazione file orfano: ${filePath}`);
        fs.unlinkSync(filePath);
        deletedCount++;
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] DELETED: ${virtualUrl}\n`);
      }
    });

    console.log(`[${new Date().toISOString()}] Cleanup completato. ${deletedCount} file eliminati.`);
  } catch (error) {
    console.error("Errore durante il cleanup cron:", error);
  }

  process.exit(0);
}

run();
