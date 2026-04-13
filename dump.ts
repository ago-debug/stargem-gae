import "dotenv/config";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const user = process.env.DB_USER!;
const pass = process.env.DB_PASSWORD!;
const host = process.env.DB_HOST!;
const port = process.env.DB_PORT!;
const db = process.env.DB_NAME!;

const d = new Date();
const dateStr = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + "_" + String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0');

const backupsDir = path.join(process.cwd(), "backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}
const file = path.join(backupsDir, `gemteam_F1-002_${dateStr}.sql`);

console.log("Dumping to:", file);

try {
  // we add --column-statistics=0 because gtid-purged is off
  execSync(`mysqldump --column-statistics=0 -u ${user} -p${pass} -h ${host} -P ${port} ${db} > ${file}`, { stdio: 'inherit' });
  const stats = fs.statSync(file);
  console.log("Backup completato con successo.");
  console.log("Size:", (stats.size / 1024 / 1024).toFixed(2), "MB");
  console.log("Path:", file);
} catch (e) {
  console.error("Backup fallito", e);
}
