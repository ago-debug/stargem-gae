import { config } from "dotenv";
config();

import { pool } from "../server/db";

async function main() {
    try {
        console.log("Inizio operazione di pulizia massiva del DB...");

        // Elimino prima i pagamenti
        console.log("1. Eliminazione Pagamenti...");
        const [resPayments]: any = await pool.query("DELETE FROM payments");
        console.log(`✓ Pagamenti eliminati: ${resPayments.affectedRows}`);

        // Elimino le tessere
        console.log("2. Eliminazione Tessere (Memberships)...");
        const [resMemberships]: any = await pool.query("DELETE FROM memberships");
        console.log(`✓ Tessere eliminate: ${resMemberships.affectedRows}`);

        // Elimino i membri (questo causerà il CASCADE su enrollments, presenze, etc.)
        console.log("3. Eliminazione Partecipanti (Members)...");
        const [resMembers]: any = await pool.query("DELETE FROM members");
        console.log(`✓ Partecipanti eliminati: ${resMembers.affectedRows}`);

        console.log("Operazione completata con successo! Dati pronti per la re-importazione.");
        process.exit(0);
    } catch (error) {
        console.error("ERRORE durante la cancellazione:", error);
        process.exit(1);
    }
}

main();
