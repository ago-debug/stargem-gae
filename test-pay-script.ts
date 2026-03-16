import { db } from "./server/db";
import { storage } from "./server/storage";
import { memberships, payments, members } from "@shared/schema";
import { eq } from "drizzle-orm";

async function simulateCheckout() {
    console.log("--- MOCK CHECKOUT PAYLOAD ---");
    const memberData = {
        firstName: "Test",
        lastName: "Atomicity",
        fiscalCode: "TSTTMC80A01H501M",
        email: "test@atom.com",
        phone: "111222333",
        gender: "M" as const, // Fix for TypeScript enum/const
        participantType: "allievo",
        createdBy: "System",
        tessereMetadata: {
            membershipType: "NUOVO",
            seasonCompetence: "CORRENTE",
            pagamento: new Date().toISOString(),
            quota: 25
        }
    };

    const paymentItems: any[] = [{
        tempId: "membership_fee",
        referenceKey: "TSTTMC80A01H501M",
        amount: "25",
        type: "membership",
        quotaDescription: "Quota Tessera",
        status: "paid",
        processed: false
    }];

    // 1. Upsert Member
    console.log("1. Creazione Utente Mock...");
    let member = await storage.createMember(memberData as any);
    console.log(`✅ Utente creato. ID assegnato: ${member.id}`);

    // 1.5 Tesseramento (Replica logica Maschera Input)
    console.log("2. Creazione Tessera tramite Multiplexer...");
    // @ts-ignore
    const { buildMembershipPayload } = await import("./server/utils/season.ts");
    const payloadData = buildMembershipPayload(
        member.id, "NUOVO", "CORRENTE", new Date(), 25
    );

    const newlyCreated = await storage.createMembership(payloadData);
    console.log(`✅ Tessera inserita in DB. ID assegnato: ${newlyCreated.id}`);

    // INIEZIONE IN RAM (Il cuore del nostro matcher)
    if (paymentItems && Array.isArray(paymentItems)) {
        const referenceKeyMatch = member.id?.toString() || memberData.fiscalCode;
        const tesseraPayment = paymentItems.find(p => p.tempId === "membership_fee" && (p.referenceKey === referenceKeyMatch || !p.referenceKey));
        if (tesseraPayment) {
            tesseraPayment.membershipId = newlyCreated.id;
            console.log(`🔗 Iniezione RAM eseguita: membershipId ${newlyCreated.id} iniettato nel paymentItem!`);
        }
    }

    // 3. Salvataggio Pagamento
    console.log("3. Salvataggio Pagamenti con Protezione Anti-Orfani...");
    for (const paymentData of paymentItems) {
        if (!paymentData.processed) {
            const hasValidRelation = paymentData.membershipId;
            if (!hasValidRelation && paymentData.tempId !== "membership_fee") {
                 throw new Error("Salvataggio bloccato: Impossibile salvare un pagamento orfano senza alcuna attività associata.");
            }
            const payment = await storage.createPayment({
                ...paymentData,
                memberId: member.id,
                createdById: 1, // Admin fittizio
            });
            console.log(`✅ Pagamento salvato. ID Payment: ${payment.id} -> fk membershipId: ${payment.membershipId}`);
            paymentData.processed = true;
        }
    }

    console.log("\n--- RISULTATO LETTURA DATABASE REALTIME ---");
    const dbPayments = await db.select().from(payments).where(eq(payments.memberId, member.id));
    console.log("Pagamenti trovati per l'utente test:");
    console.table(dbPayments.map(p => ({
        payment_id: p.id, 
        amount: p.amount, 
        linked_membership_id: p.membershipId, 
        type: p.type 
    })));

    // Pulizia
    console.log("\n4. Rollback dati finti...");
    await db.delete(payments).where(eq(payments.memberId, member.id));
    await db.delete(memberships).where(eq(memberships.memberId, member.id));
    await db.delete(members).where(eq(members.id, member.id));
    console.log("✅ Rollback eseguito. Arrivederci.");
    process.exit(0);
}

simulateCheckout().catch(err => {
    console.error("ERRORE FATALE:", err);
    process.exit(1);
});
