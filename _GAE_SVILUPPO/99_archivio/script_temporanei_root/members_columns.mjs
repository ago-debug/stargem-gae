import fs from 'fs';
const dbMap = JSON.parse(fs.readFileSync('db_map.json', 'utf8'));
const membersTable = dbMap.find(t => t.table === 'members');
const varcharCols = membersTable.columns.filter(c => c.includes('varchar')).map(c => c.split(' ')[0]);
console.log(varcharCols.join(', '));
