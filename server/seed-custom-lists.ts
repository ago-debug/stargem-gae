import "dotenv/config";
import { db } from "./db";
import { customLists, customListItems } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedCustomLists() {
    console.log("Seeding system CustomLists (Livello CRM, Provenienza)...");

    try {
        // 1. Provenienza Marketing
        let provList = await db.query.customLists.findFirst({
            where: eq(customLists.systemName, "provenienza_marketing")
        });

        if (!provList) {
            console.log("Creating list: provenienza_marketing");
            await db.insert(customLists).values({
                name: "Canale di Acquisizione",
                systemName: "provenienza_marketing",
                description: "Canali marketing da cui arrivano i clienti",
                isSystem: true
            });
            provList = await db.query.customLists.findFirst({
                where: eq(customLists.systemName, "provenienza_marketing")
            });
        }

        const provItems = ["Web", "Passaparola", "Social", "Altro"];
        for (let i = 0; i < provItems.length; i++) {
            const existingItem = await db.query.customListItems.findFirst({
                where: (items, { and, eq }) => and(eq(items.listId, provList!.id), eq(items.value, provItems[i]))
            });
            if (!existingItem) {
                await db.insert(customListItems).values({
                    listId: provList.id,
                    value: provItems[i],
                    sortOrder: i + 1,
                    active: true
                });
                console.log(`Inserted: ${provItems[i]} into provenienza_marketing`);
            }
        }

        // 2. Livello CRM
        let crmList = await db.query.customLists.findFirst({
            where: eq(customLists.systemName, "livello_crm")
        });

        if (!crmList) {
            console.log("Creating list: livello_crm");
            await db.insert(customLists).values({
                name: "Livello CRM",
                systemName: "livello_crm",
                description: "Tiers di classificazione automatica e manuale clienti",
                isSystem: true
            });
            crmList = await db.query.customLists.findFirst({
                where: eq(customLists.systemName, "livello_crm")
            });
        }

        const crmItems = ["Silver", "Gold", "Platinum", "Diamond"];
        for (let i = 0; i < crmItems.length; i++) {
            const existingItem = await db.query.customListItems.findFirst({
                where: (items, { and, eq }) => and(eq(items.listId, crmList!.id), eq(items.value, crmItems[i]))
            });
            if (!existingItem) {
                await db.insert(customListItems).values({
                    listId: crmList.id,
                    value: crmItems[i],
                    sortOrder: i + 1,
                    active: true
                });
                console.log(`Inserted: ${crmItems[i]} into livello_crm`);
            }
        }

        console.log("Seeding CustomLists completato con successo!");
    } catch (error) {
        console.error("Errore durante il seeding delle CustomLists:", error);
    }
}

seedCustomLists().then(() => process.exit(0)).catch(() => process.exit(1));
