import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const [membersCount] = await db.execute(sql`SELECT COUNT(*) as count FROM members;`);
  const [membersMax] = await db.execute(sql`SELECT MAX(id) as max_id FROM members;`);
  
  const [teamCount] = await db.execute(sql`SELECT COUNT(*) as count FROM team_employees;`);
  const [teamMax] = await db.execute(sql`SELECT MAX(id) as max_id FROM team_employees;`);
  
  const [memShipsCount] = await db.execute(sql`SELECT COUNT(*) as count FROM memberships;`);
  const [memShipsMax] = await db.execute(sql`SELECT MAX(id) as max_id FROM memberships;`);
  const [memShipsMaxNum] = await db.execute(sql`SELECT MAX(membership_number) as max_num FROM memberships;`);
  
  const [membersStatus] = await db.execute(sql`SHOW TABLE STATUS WHERE name = 'members';`);

  console.log("MEMBERS: ", membersCount, membersMax);
  console.log("TEAM: ", teamCount, teamMax);
  console.log("MEMBERSHIPS: ", memShipsCount, memShipsMax, memShipsMaxNum);
  console.log("STATUS: ", membersStatus);
  
  process.exit(0);
}
run();
