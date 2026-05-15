import { db } from "../db";
import { sql } from "drizzle-orm";

export async function generateStranieroPlaceholder(): Promise<string> {
  const [res] = await db.execute(sql`SELECT COUNT(*) as cnt FROM members WHERE fiscal_code LIKE 'PLC-STR-%'`);
  const count = (res as any)[0].cnt + 1;
  return `PLC-STR-${String(count).padStart(6, '0')}`;
}
