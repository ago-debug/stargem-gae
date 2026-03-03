import { db, pool } from './server/db';
import { courseQuotesGrid } from '@shared/schema';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const itemsToInsert = [
            {
                activityType: 'corsi',
                category: 'ADULTI',
                description: '1 corso adulti',
                details: 'prova',
                corsiWeek: 1,
                sortOrder: 0,
                monthsData: { Settembre: { quota: 1000, lezioni: null } },
            },
            {
                activityType: 'corsi',
                category: 'BAMBINI',
                description: '4 lezioni',
                details: 'ssdsdf',
                corsiWeek: 1,
                sortOrder: 1,
                monthsData: { Settembre: { quota: 400, lezioni: null } },
            }
        ];

        console.log("Inserting 2 rows...");
        await db.insert(courseQuotesGrid).values(itemsToInsert);
        console.log("Done.");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
