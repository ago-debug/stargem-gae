import { db } from "./server/db";

async function main() {
    const lists = await db.query.custom_lists.findMany();
    const categoriesList = lists.find(l => l.name === "Categorie");
    
    if (categoriesList) {
        const items = await db.query.custom_list_items.findMany();
        const cats = items.filter(i => i.listId === categoriesList.id);
        console.log("Categories found:");
        cats.forEach(c => console.log(`- ID: ${c.id} | Name: ${c.name}`));
    }
    process.exit(0);
}
main().catch(console.error);
