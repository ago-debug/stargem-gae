import "dotenv/config";
import { db, pool } from "../server/db";
import { paymentNotes, enrollmentDetails } from "../shared/schema";

const missingPaymentNotes = [
    "A/B",
    "B/B BPM",
    "Bancomat BPM",
    "Bancomat Poste",
    "C/C BPM",
    "C/C online Poste",
    "C/C Poste",
    "Contanti",
    "Satispay online",
    "Satispay sede",
    "Scalapay online",
    "Scalapay sede",
    "Welfare FitPrime",
    "Welfare Pellegrini",
    "Welfare Wai",
    "Welfare Wellhub",
    "xpay",
    "xpay_applepay",
    "xpay_fastcheckout",
    "xpay_googlepay"
];

const missingEnrollmentDetails = [
    "deve pagare D",
    "deve pagare U",
    "iscritto Donna",
    "iscritto Uomo",
    "lezione welfare",
    "prova Donna",
    "prova pagata D",
    "prova pagata U",
    "prova Uomo",
    "tessera"
];

async function seed() {
    console.log("Seeding missing Elenchi items...");

    // Insert payment notes
    let sortOrder = 100;
    for (const name of missingPaymentNotes) {
        try {
            await db.insert(paymentNotes).values({
                name,
                color: null,
                sortOrder: sortOrder++,
                active: true
            }).onDuplicateKeyUpdate({ set: { active: true } });
            console.log(`Inserted payment note: ${name}`);
        } catch (error: any) {
            if (error.code !== "ER_DUP_ENTRY") {
                console.error(`Failed to insert ${name}:`, error);
            } else {
                console.log(`Already exists: ${name}`);
            }
        }
    }

    // Insert enrollment details
    sortOrder = 100;
    for (const name of missingEnrollmentDetails) {
        try {
            await db.insert(enrollmentDetails).values({
                name,
                color: null,
                sortOrder: sortOrder++,
                active: true
            }).onDuplicateKeyUpdate({ set: { active: true } });
            console.log(`Inserted enrollment detail: ${name}`);
        } catch (error: any) {
            if (error.code !== "ER_DUP_ENTRY") {
                console.error(`Failed to insert ${name}:`, error);
            } else {
                console.log(`Already exists: ${name}`);
            }
        }
    }

    console.log("Done seeding.");
    await pool.end();
}

seed().catch(console.error);
