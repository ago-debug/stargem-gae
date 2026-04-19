import { db } from './server/db.js';
import { users } from './server/schema.js';

async function getUsers() {
    const allUsers = await db.select().from(users);
    console.log(allUsers.map(u => `${u.id}: ${u.username} (${u.role})`).join('\n'));
    process.exit(0);
}
getUsers();
