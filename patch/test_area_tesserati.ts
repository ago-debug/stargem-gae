import { db } from '../server/db';
import { users, members } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/auth';

async function testSetup() {
  const [u] = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
  if (u) {
    const [m] = await db.select().from(members).where(eq(members.userId, u.id.toString())).limit(1);
    if (!m) {
      await db.insert(members).values({
        userId: u.id.toString(),
        firstName: 'Admin',
        lastName: 'Developer',
        email: 'admin@example.com',
        mobile: '12345',
        active: true
      });
    }
    console.log("admin setup done.");
  } else {
    console.log("No admin found");
  }
  process.exit();
}
testSetup();
