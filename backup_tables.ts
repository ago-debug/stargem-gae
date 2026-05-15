import 'dotenv/config';
import { db } from './server/db';
import { teamScheduledShifts, teamShiftTemplates } from './shared/schema';
import fs from 'fs';
import path from 'path';

async function backup() {
  console.log('Fetching data...');
  const shifts = await db.select().from(teamScheduledShifts);
  const templates = await db.select().from(teamShiftTemplates);

  const backupData = {
    teamScheduledShifts: shifts,
    teamShiftTemplates: templates
  };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(process.cwd(), `_GAE_SVILUPPO/_CLAUDE/05_allegati/03_GemTeam/gemteam_pre_reimport_${ts}.json`);
  
  fs.writeFileSync(file, JSON.stringify(backupData, null, 2));
  console.log(`Backup completed: ${file}`);
  console.log(`Shifts backed up: ${shifts.length}`);
  console.log(`Templates backed up: ${templates.length}`);
}

backup().catch(console.error).finally(() => process.exit(0));
