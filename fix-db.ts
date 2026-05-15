import { db } from './server/db.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function fix() {
  try {
    try {
      await db.execute(sql`ALTER TABLE team_employees ADD COLUMN avatar_url VARCHAR(500);`);
      console.log('Added avatar_url to team_employees');
    } catch (e: any) {
      console.log('avatar_url probably exists:', e.message);
    }
    
    try {
      await db.execute(sql`ALTER TABLE members ADD COLUMN attachments_url JSON;`);
      console.log('Added attachments_url to members');
    } catch (e: any) {
      console.log('attachments_url probably exists:', e.message);
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fix();
