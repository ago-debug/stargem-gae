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

        // Elimino dati con vincolo restrict per sbloccare la cancellazione dei members
        console.log("3. Pulizia tabelle dipendenti (restrict)...");
        await pool.query("DELETE FROM member_forms_submissions");
        await pool.query("DELETE FROM member_uploads");
        await pool.query("DELETE FROM gem_messages"); // Dipende da conversations
        await pool.query("DELETE FROM gem_conversations");
        await pool.query("DELETE FROM instructor_agreements");
        await pool.query("DELETE FROM team_employees");

        // Elimino i membri (questo causerà il CASCADE su enrollments, presenze, etc.)
        console.log("4. Eliminazione Partecipanti (Members)...");
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
