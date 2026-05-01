import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { users } from '/Users/gaetano1/SVILUPPO/StarGem_manager/shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/auth';

async function reset() {
  try {
     const h = await hashPassword("Bot2026!");
     await db.update(users).set({ password: h }).where(eq(users.username, "botAI"));
     console.log("BotAI resetted");
  } catch(e) {
     console.error(e);
  }
  process.exit();
}
reset();
