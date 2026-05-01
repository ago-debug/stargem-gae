import fs from 'fs';

const dbMap = JSON.parse(fs.readFileSync('db_map.json', 'utf8'));

const trashTables = dbMap.filter(t => t.table.includes('_backup_') || t.table.includes('_pre_') || t.table.includes('op1235') || t.table.includes('op4') || t.table.includes('backup_op7_final'));

console.log("Trash Tables:");
trashTables.forEach(t => console.log(`${t.table} - count: ${t.count}`));

const emptyTables = dbMap.filter(t => t.count === 0 && !trashTables.some(tr => tr.table === t.table));
console.log("\nEmpty Tables:");
emptyTables.forEach(t => console.log(`${t.table} - count: ${t.count}`));

const membersTable = dbMap.find(t => t.table === 'members');
console.log("\nMembers Table Columns:");
let varcharCount = 0;
let textCount = 0;
membersTable.columns.forEach(c => {
  if (c.includes('varchar')) varcharCount++;
  if (c.includes('text') || c.includes('longtext')) textCount++;
});
console.log(`VARCHAR: ${varcharCount}, TEXT/LONGTEXT: ${textCount}`);

