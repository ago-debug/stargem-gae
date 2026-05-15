import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as fs from 'fs';

async function main() {
  try {
    const file = fs.readFileSync('migrations/_mc3_pagamenti_relazionali.sql', 'utf8');
    const statements = file.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const stmt of statements) {
      console.log("Executing:", stmt.slice(0, 50) + "...");
      await db.execute(sql.raw(stmt));
    }
    console.log("Migration completata con successo!");
    process.exit(0);
  } catch (err) {
    console.error("Errore migrazione:", err);
    process.exit(1);
  }
}
main();
