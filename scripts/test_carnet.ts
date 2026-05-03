import "dotenv/config";
import { storage } from "../server/storage";
async function run() {
  try {
    const res = await storage.getCarnetWallets({});
    console.log(res);
  } catch (e: any) {
    console.error("Crash:", e.message, e.stack);
  }
  process.exit(0);
}
run();
