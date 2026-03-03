import "dotenv/config";
import { db } from "./db";
import { paymentNotes, enrollmentDetails } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedElenchi() {
    console.log("Seeding lists for Dettaglio Iscrizione and Note Pagamenti...");

    const notePagamenti = [
        { name: "Welfare", color: "#4ade80", active: true },
        { name: "xpay", color: "#60a5fa", active: true },
        { name: "Contanti", color: "#f87171", active: true },
        { name: "acconto", color: "#facc15", active: true },
        { name: "saldo", color: "#c084fc", active: true },
        { name: "bonifico", color: "#2dd4bf", active: true },
        { name: "pos", color: "#fb923c", active: true },
        { name: "POS sede estiva", color: "#a78bfa", active: true },
        { name: "assegno", color: "#9ca3af", active: true }
    ];

    const dettaglioIscrizione = [
        { name: "Iscritto Donna", color: "#f472b6", active: true },
        { name: "deve pagare D/U", color: "#fb7185", active: true },
        { name: "lezione welfare", color: "#818cf8", active: true },
        { name: "tessera", color: "#34d399", active: true },
        { name: "certificato assente", color: "#f87171", active: true },
        { name: "rinnovo", color: "#a3e635", active: true },
        { name: "sconto fratelli", color: "#fbbf24", active: true }
    ];

    try {
        // Note Pagamenti
        for (const nota of notePagamenti) {
            const existing = await db.select().from(paymentNotes).where(eq(paymentNotes.name, nota.name));
            if (existing.length === 0) {
                await db.insert(paymentNotes).values(nota);
                console.log(`Inserita Nota Pagamento: ${nota.name}`);
            } else {
                console.log(`Nota Pagamento esistente: ${nota.name}`);
            }
        }

        // Dettaglio Iscrizione
        for (const dettaglio of dettaglioIscrizione) {
            const existing = await db.select().from(enrollmentDetails).where(eq(enrollmentDetails.name, dettaglio.name));
            if (existing.length === 0) {
                await db.insert(enrollmentDetails).values(dettaglio);
                console.log(`Inserito Dettaglio Iscrizione: ${dettaglio.name}`);
            } else {
                console.log(`Dettaglio Iscrizione esistente: ${dettaglio.name}`);
            }
        }

        console.log("Seeding completato!");
    } catch (error) {
        console.error("Errore durante il seeding:", error);
    }
}

seedElenchi().then(() => process.exit(0)).catch(() => process.exit(1));
