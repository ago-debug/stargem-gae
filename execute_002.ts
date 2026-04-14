import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log("--- ESECUZIONE INTERVENTI DB F1-002 ---");

    // 1. Inserimento ruolo operator
    console.log("1. Insert 'operator' (clonando permesso Back-Office ID=6)");
    const [q1] = await db.execute(sql`
      INSERT INTO user_roles (name, description, permissions)
      SELECT 'operator', 'Operatore Staff — accesso operativo base. Assegnabile a Back-Office o Front-Desk dal PM.', permissions
      FROM user_roles
      WHERE id = 6
    `);
    console.log("Completato:", q1.affectedRows, "righe inserite.");

    // 2. Inserimento ruolo admin
    console.log("\n2. Insert 'admin'");
    const [q2] = await db.execute(sql`
      INSERT INTO user_roles (name, description, permissions)
      VALUES ('admin', 'Amministratore sistema — accesso tecnico completo.', '{"*":"write"}')
    `);
    console.log("Completato:", q2.affectedRows, "righe inserite.");

    // 3. Rename "Staff / Insegnante"
    console.log("\n3. Rename 'Staff / Insegnante' to 'insegnante'");
    const [q3] = await db.execute(sql`
      UPDATE user_roles
      SET name = 'insegnante', description = 'Ruolo consultivo per docenti e personal trainer.'
      WHERE name = 'Staff / Insegnante'
    `);
    console.log("Completato:", q3.affectedRows, "righe modificate.");

    // 5. Verifica finale
    console.log("\n5. SELECT id, name FROM user_roles ORDER BY name;");
    const [q5] = await db.execute(sql`SELECT id, name FROM user_roles ORDER BY name`);
    console.table(q5);

    process.exit(0);
  } catch (error) {
    console.error("DB Error:", error);
    process.exit(1);
  }
}

run();
