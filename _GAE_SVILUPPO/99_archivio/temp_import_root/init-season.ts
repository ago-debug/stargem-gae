import { storage } from "./server/storage";

async function init() {
    const active = await storage.getActiveSeason();
    if (!active) {
        console.log("No active season found. Creating default 'Stagione 2024/2025'...");
        await storage.createSeason({
            name: "Stagione 2024/2025",
            description: "Stagione corrente inizializzata automaticamente",
            startDate: new Date("2024-09-01"),
            endDate: new Date("2025-07-31"),
            active: true
        });
        console.log("Season created.");
    } else {
        console.log("Active season already exists:", active.name);
    }
    process.exit(0);
}

init().catch(err => {
    console.error(err);
    process.exit(1);
});
