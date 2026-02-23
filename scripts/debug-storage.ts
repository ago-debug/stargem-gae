
import { storage } from "../server/storage";

async function main() {
    console.log("Testing getMembersPaginated...");
    try {
        const res = await storage.getMembersPaginated(1, 10, "maria");
        console.log("Total:", res.total);
        console.log("Members found:", res.members.length);
        if (res.members.length > 0) {
            console.log("First member sample:");
            console.log(JSON.stringify(res.members[0], null, 2));
        } else {
            console.log("No members found for 'maria'");
        }
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
