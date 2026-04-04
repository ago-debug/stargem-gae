import "dotenv/config";
import { db } from "../server/db";
import { userRoles } from "@shared/schema";
import { notInArray } from "drizzle-orm";

async function run() {
  const keepers = ["Super Admin", "Direttivo", "Back-Office", "Front-Desk", "Staff / Insegnante"];
  
  await db.delete(userRoles).where(notInArray(userRoles.name, keepers));
  console.log("Old roles deleted.");
  
  process.exit(0);
}
run();
