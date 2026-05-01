import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== STEP 2: INSTRUCTOR AGREEMENTS (WRITING TO DB) ===");

  await db.execute(sql`
    INSERT INTO instructor_agreements 
      (tenant_id, member_id, agreement_type, base_monthly_amount, spese_mensili, payment_mode, studio_id, schedule_notes) 
    VALUES
    (1, 1786, 'flat_monthly', 1350, 0, 'fattura', 7, 'Studio 25'),
    (1, 9504, 'flat_monthly', 150, 20, 'bonifico', null, 'Studio 05'),
    (1, 9498, 'pack_hours', 110, 0, 'bonifico', null, '10ore=110'),
    (1, 2336, 'pack_hours', 200, 0, 'bonifico', null, '10lez(1.5h)=200'),
    (1, 1923, 'pack_hours', 200, 0, 'bonifico', null, '10lez(1.5h)=200'),
    (1, 9529, 'pack_hours', 110, 0, 'bonifico', null, '10ore=110');
  `);

  console.log("Accordi Inseriti.");

  process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
