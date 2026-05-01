import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const res = await db.execute(sql`
    SELECT te.id as employee_id, m.first_name, m.last_name 
    FROM team_employees te
    JOIN members m ON m.id = te.member_id
    ORDER BY m.first_name
  `);
  
  const employees = res[0] as any[];
  console.log("MAPPA DIPENDENTI DAL DB:");
  
  const excelNames = ["ALEXANDRA", "DIEGO", "ELISA", "ESTEFANY", "GAETANO", "GIUDITTA", "JASIR", "JOEL", "KEVIN", "MASSI", "NURA", "SANTO", "SARA", "STEFANO", "ZOILA"];
  
  console.log("EXCEL_NAME -> DB_EMPLOYEE_ID | DB_FIRST_NAME DB_LAST_NAME");
  for (const name of excelNames) {
     let match = employees.find(e => {
       // Match per nome (il db può avere nomi lunghi come MASSIMILIANO VALENTINO, quindi usiamo un check parziale)
       const fn = (e.first_name || '').toUpperCase();
       const exN = name.toUpperCase();
       return fn.includes(exN) || exN.includes(fn) || (exN === 'MASSI' && fn.startsWith('MASSIMILIANO'));
     });
     
     if (match) {
        console.log(`${name.padEnd(10)} -> ID: ${match.employee_id} | ${match.first_name} ${match.last_name}`);
     } else {
        console.log(`${name.padEnd(10)} -> NON TROVATO NEL DB (Escluso dall'import)`);
     }
  }
  process.exit(0);
}
run();
