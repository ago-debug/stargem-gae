import fs from 'fs';
const raw = fs.readFileSync('step1_003.json', 'utf-8');
const blocks = raw.split('--- QUERY ');

for (let i=1; i<blocks.length; i++) {
  const parts = blocks[i].split('\n');
  const title = parts[0];
  const jsonStr = parts.slice(1).join('\n').trim();
  if (!jsonStr) continue;
  try {
    const data = JSON.parse(jsonStr);
    if (title.includes('1:')) {
      console.log(`\n### 1: I 32 QUOTATESSERA orfani`);
      data.forEach(d => console.log(`- ${d.last_name} ${d.first_name} [${d.fiscal_code || 'No CF'}]`));
    }
  } catch(e) {}
}
