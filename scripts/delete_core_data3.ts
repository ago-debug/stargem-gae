import { config } from "dotenv";
config();

import { pool } from "../server/db";

async function main() {
    try {
        console.log("Inizio operazione di pulizia massiva del DB (modalità sicura disabilitando FK)...");

        // Disabilitiamo il check delle foreign keys per poter svuotare le tabelle
        await pool.query("SET FOREIGN_KEY_CHECKS = 0;");

        const tablesToClear = [
            "payments",
            "memberships",
            "enrollments",
            "member_packages",
            "member_relationships",
            "attendances",
            "medical_certificates",
            "member_forms_submissions",
            "member_uploads",
            "members"
        ];

        for (const table of tablesToClear) {
            console.log(`- Svuotamento tabella: ${table}...`);
            const [res]: any = await pool.query(`DELETE FROM ${table}`);
            console.log(`  ✓ Record eliminati da ${table}: ${res.affectedRows}`);
        }

        // Riattiviamo il check delle foreign keys
        await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

        console.log("Operazione completata con successo! Dati pronti per la re-importazione.");
        process.exit(0);
    } catch (error) {
        console.error("ERRORE durante la cancellazione:", error);
        // Assicuriamoci di riattivare i check in caso di errore
        try {
            await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
        } catch(e) {}
        process.exit(1);
    }
}

main();
