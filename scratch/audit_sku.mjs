import mysql from 'mysql2/promise';
import fs from 'fs';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runAudit() {
  const [courses] = await pool.query(`
    SELECT c.id, c.sku, c.name, c.activity_type, c.season_id, c.active,
           c.start_date, c.end_date,
           (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollments_count
    FROM courses c
  `);

  const results = [];
  const aggregate = {};
  const unmapped = [];
  const ambiguous = [];

  const rules = [
    { name: 'QUOTATESSERA', type: 'membership', test: (sku) => sku && sku.includes('QUOTATESSERA') },
    { name: 'DT (Visite)', type: 'visita_medica', test: (sku) => sku && (sku.includes('DTYURI') || sku.includes('DTNELLA')) },
    { name: 'ALLENAMENTO', type: 'allenamenti', test: (sku) => sku && sku.includes('ALLENAMENTO') },
    { name: 'CAMPUS', type: 'campus', test: (sku) => sku && (sku.includes('CAMPUSS1') || sku.includes('CAMPUSS2') || sku.includes('CAMPUSDANZAS1') || sku.includes('CAMPUSDANZAS2')) },
    { name: 'DOMENICA-A', type: 'domenica_movimento', test: (sku) => sku && sku.endsWith('-A') },
    { name: 'DOMENICA-B', type: 'domenica_movimento', test: (sku) => sku && sku.endsWith('-B') },
    { name: 'DICFESTA', type: 'workshop', test: (sku) => sku && sku.includes('DICFESTA') },
    { name: 'GIFT', type: 'buono_regalo', test: (sku) => sku && sku.includes('GIFT') },
    { name: 'LEZPROVA', type: 'corso', test: (sku) => sku && sku.includes('LEZPROVA') },
    { name: 'LEZINDIVIDUALE', type: 'lezione_individuale', test: (sku) => sku && sku.includes('LEZINDIVIDUALE') },
    { name: 'OPEN', type: 'corso', test: (sku) => sku && sku.includes('OPEN') },
    { name: 'PROV', type: 'corso', test: (sku) => sku && sku.startsWith('PROV') },
    { name: 'WORKSHOP_DATE', type: 'workshop', test: (sku) => sku && (/\d{4}$/.test(sku) || sku.endsWith('WS')) },
    { name: 'DEFAULT', type: 'corso', test: (sku) => true }
  ];

  for (const r of rules) {
    aggregate[r.name] = { matched: 0, enrollments: 0, toMove: 0, alreadyCorrect: 0, courses: [] };
  }

  for (const c of courses) {
    let sku = c.sku ? c.sku.toUpperCase() : '';
    
    // Test for ambiguous matches (matching more than one specific rule)
    const matches = rules.filter(r => r.name !== 'DEFAULT' && r.test(sku));
    if (matches.length > 1) {
      ambiguous.push({ ...c, matches: matches.map(m => m.name) });
      continue;
    }

    // Find first matching rule
    const rule = rules.find(r => r.test(sku));
    if (!rule) {
      unmapped.push(c);
      continue;
    }

    const isCorrect = c.activity_type === rule.type;
    aggregate[rule.name].matched++;
    aggregate[rule.name].enrollments += c.enrollments_count;
    
    if (isCorrect) {
      aggregate[rule.name].alreadyCorrect++;
    } else {
      aggregate[rule.name].toMove++;
      aggregate[rule.name].courses.push({
        id: c.id,
        sku: c.sku,
        name: c.name,
        current_type: c.activity_type,
        new_type: rule.type,
        enrollments: c.enrollments_count
      });
      results.push({
        id: c.id,
        sku: c.sku,
        name: c.name,
        current_type: c.activity_type,
        new_type: rule.type,
        rule_name: rule.name,
        enrollments: c.enrollments_count
      });
    }
  }

  const report = [];
  report.push('# Audit F1-013: Mappatura SKU e activity_type');
  report.push('');
  report.push('## C) Riepilogo Aggregato');
  report.push('| Pattern | Corsi trovati | Enrollments | Già Corretti | Da Spostare |');
  report.push('|---------|---------------|-------------|--------------|-------------|');
  
  let totalToMove = 0;
  let totalEnrollmentsToMove = 0;

  for (const [name, data] of Object.entries(aggregate)) {
    report.push(`| ${name} | ${data.matched} | ${data.enrollments} | ${data.alreadyCorrect} | ${data.toMove} |`);
    totalToMove += data.toMove;
    for (const c of data.courses) {
      totalEnrollmentsToMove += c.enrollments;
    }
  }

  report.push('');
  report.push(`**Totale corsi da aggiornare:** ${totalToMove}`);
  report.push(`**Totale enrollments impattati:** ${totalEnrollmentsToMove}`);
  
  report.push('');
  report.push('## B) Lista DETTAGLIATA candidati a UPDATE');
  report.push('| ID | SKU | Nome | Type Attuale | Nuovo Type | Enrollments |');
  report.push('|----|-----|------|--------------|------------|-------------|');
  for (const r of results) {
    report.push(`| ${r.id} | ${r.sku} | ${r.name} | ${r.current_type} | ${r.new_type} | ${r.enrollments} |`);
  }

  report.push('');
  report.push('## D) Casi Ambigui / Incerti');
  if (ambiguous.length > 0) {
    ambiguous.forEach(a => report.push(`- ID: ${a.id}, SKU: ${a.sku}, Matches: ${a.matches.join(', ')}`));
  } else {
    report.push('Nessun caso ambiguo trovato.');
  }

  report.push('');
  report.push('## Casi Non Mappati (vuoti o null)');
  if (unmapped.length > 0) {
    unmapped.forEach(a => report.push(`- ID: ${a.id}, Name: ${a.name}, SKU: ${a.sku}`));
  } else {
    report.push('Nessun caso non mappato.');
  }

  fs.writeFileSync('/Users/gaetano1/SVILUPPO/StarGem_manager/_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/audit_F1-013_bonifica_sku_pattern_2026_04_29.md', report.join('\\n'));
  
  console.log("Audit completato. Salvato in audit_F1-013_bonifica_sku_pattern_2026_04_29.md");
  console.log("Totale da aggiornare:", totalToMove);
  console.log("Ambigui:", ambiguous.length);
  
  pool.end();
}

runAudit().catch(console.error);
