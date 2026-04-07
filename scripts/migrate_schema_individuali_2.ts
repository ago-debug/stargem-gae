import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Adding member_packages table...");
  try {
    const rawSql = `
      CREATE TABLE \`member_packages\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`member_id\` int NOT NULL,
        \`package_code\` varchar(50) NOT NULL,
        \`package_type\` varchar(50) NOT NULL,
        \`total_uses\` int NOT NULL,
        \`used_uses\` int NOT NULL DEFAULT 0,
        \`price_paid\` decimal(10,2),
        \`notes\` text,
        \`active\` boolean DEFAULT true,
        \`created_at\` timestamp DEFAULT (now()),
        \`updated_at\` timestamp DEFAULT (now()),
        CONSTRAINT \`member_packages_id\` PRIMARY KEY(\`id\`)
      );
    `;
    await db.execute(sql.raw(rawSql));
    console.log("Table created.");

    await db.execute(sql.raw(`ALTER TABLE \`member_packages\` ADD CONSTRAINT \`member_packages_member_id_members_id_fk\` FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON DELETE no action ON UPDATE no action;`));
    console.log("FK created.");
  } catch(e) { console.log(e.message); }
  
  process.exit(0);
}
run();
