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
    console.log(`\n### ${title.trim()} (Totale: ${data.length})`);
    
    if (title.includes('1:')) {
      data.forEach(d => console.log(`- ${d.last_name} ${d.first_name} [${d.fiscal_code || 'No CF'}] - Iscr. ${d.enrollment_date?.split('T')[0]}`));
    }
    if (title.includes('2:')) {
      data.forEach(d => console.log(`- ${d.last_name} ${d.first_name} [SKU: ${d.sku}] - Iscr. ${d.enrollment_date?.split('T')[0]}`));
    }
    if (title.includes('3:')) {
      data.slice(0, 30).forEach(d => console.log(`- ${d.sku} ("${d.nome_corso}"): ${d.tot_iscrizioni} iscrizioni`));
      if(data.length > 30) console.log(`... e altri ${data.length - 30} record.`);
    }
  } catch(e) {
    console.log("Errore parse JSON per", title);
  }
}
