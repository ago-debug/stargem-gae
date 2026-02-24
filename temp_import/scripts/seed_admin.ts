import { db } from "../server/db";
import { users } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
    console.log("Seeding admin user...");
    const hashedPassword = await hashPassword("admin");

    await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
    });

    console.log("Admin user created: admin / admin");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
