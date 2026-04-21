import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { courses } from "../server/schema";
import { desc } from "drizzle-orm";

async function run() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'stargem_v2'
    });
    const db = drizzle(connection);
    const res = await db.select({
        id: courses.id,
        name: courses.name,
        seasonId: courses.seasonId,
        dayOfWeek: courses.dayOfWeek,
        startDate: courses.startDate,
        endDate: courses.endDate,
        active: courses.active
    }).from(courses).orderBy(desc(courses.id)).limit(3);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}
run();
