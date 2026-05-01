import fs from 'fs';

const dbMap = JSON.parse(fs.readFileSync('db_map.json', 'utf8'));

// Filter out backup tables
const realTables = dbMap.filter(t => !t.table.includes('_backup_') && !t.table.includes('_pre_') && !t.table.includes('op1235') && !t.table.includes('op4'));

// Categorize tables
const categories = {
  'Anagrafica & CRM': ['members', 'cities', 'provinces', 'member_relationships', 'cli_cats', 'marketing_campaigns', 'automation_rules'],
  'Attività & Corsi': ['courses', 'studios', 'seasons', 'studio_bookings', 'strategic_events'],
  'Iscrizioni & Tessere': ['enrollments', 'memberships', 'medical_certificates', 'member_forms_submissions'],
  'Contabilità & Cassa': ['payments', 'quotes', 'cost_centers', 'carnet_wallets', 'payment_methods', 'promo_rules', 'inventory_items', 'stock_movements'],
  'HR & Staff': ['users', 'staff_presenze', 'payslips', 'team_employees', 'team_scheduled_shifts', 'team_activity_types'],
  'Sistema & Log': ['custom_lists', 'custom_list_items', 'system_configs', 'user_activity_logs', 'user_session_segments', 'todos', 'team_notes', 'team_comments', 'express_sessions']
};

let md = `Aggiornato al: 2026-04-28 11:50

# 📊 MAPPA DATI E FRONTEND — MASTER FILE

Questo file unificato sostituisce i precedenti D, D2 e D3. Contiene:
1. Lo **Stato Reale del DB** (Record esatti e Checklist)
2. La **Mappa Completa delle Colonne** (Dizionario Dati)
3. La **Mappa Frontend ↔ Database** (Stato delle integrazioni UI)

---

## 1. STATO DB REALE (Volumi e Checklist)

*Conteggi estratti in tempo reale dal database MySQL di produzione (IONOS) il 28/04/2026.*

### 1.1 Volumi per Gruppo Logico

`;

for (const [catName, tables] of Object.entries(categories)) {
  const catTables = realTables.filter(t => tables.includes(t.table));
  if (catTables.length === 0) continue;
  
  md += `#### ${catName}\n`;
  md += `| Tabella | Record Attuali |\n|---|---|\n`;
  for (const t of catTables) {
    md += `| \`${t.table}\` | **${t.count.toLocaleString('it-IT')}** |\n`;
  }
  md += `\n`;
}

md += `### 1.2 Checklist Migliorie (DB & Dati)

**✅ Completate:**
- [x] Bonifica Anagrafica e Tessere (recuperati record storici persi).
- [x] Migrazione a Single Table Inheritance (STI) per \`courses\`.
- [x] Standardizzazione campi JSON (es. \`internalTags\`, \`statusTags\`) e risoluzione bug UI (` + "`" + `.map is not a function` + "`" + `).
- [x] Standardizzazione filtri UI (es. filtro Gender per U/M/D/F/DONNA/UOMO risolto in frontend).

**⏳ Da Fare:**
- [ ] Implementare logica di archiviazione per le sessioni utente (\`user_session_segments\`) che crescono rapidamente.
- [ ] Normalizzare \`participation_type\` nelle iscrizioni.
- [ ] Aggiungere metadati operativi ai \`payments\` in UI (\`operator_name\`, \`source\`).

---

## 2. MAPPA COMPLETA DB E COLONNE (Dizionario Dati)

Elenco esatto e completo delle tabelle attive in produzione e dei loro campi strutturali.

`;

for (const [catName, tables] of Object.entries(categories)) {
  const catTables = realTables.filter(t => tables.includes(t.table));
  if (catTables.length === 0) continue;
  
  md += `### 🗄️ Gruppo: ${catName}\n\n`;
  
  for (const t of catTables) {
    md += `#### Tabella: \`${t.table}\` (Record: ${t.count})\n`;
    md += "```text\n";
    t.columns.forEach(col => {
      md += `- ${col}\n`;
    });
    md += "```\n\n";
  }
}

// Any uncategorized tables?
const categorizedTableNames = Object.values(categories).flat();
const uncategorized = realTables.filter(t => !categorizedTableNames.includes(t.table));
if (uncategorized.length > 0) {
  md += `### 🗄️ Altre Tabelle (Non Assegnate)\n\n`;
  for (const t of uncategorized) {
    md += `#### Tabella: \`${t.table}\` (Record: ${t.count})\n`;
    md += "```text\n";
    t.columns.forEach(col => {
      md += `- ${col}\n`;
    });
    md += "```\n\n";
  }
}

md += `---

## 3. MAPPA FRONTEND ↔ DATABASE (Stato Attuale)

Mappatura logica tra le schermate dell'applicativo e le tabelle del database.

### 3.1 Anagrafica Generale
**File:** \`client/src/pages/members.tsx\` | **URL:** \`/anagrafica\`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| first_name, last_name, email, mobile, fiscal_code, crm_profile_level | members | ✅ | Completamente mappati |
| data_quality_flag | members | ❌ | Nascosto, utile sbloccare per admin |

### 3.2 GemPass & Tesseramenti
**File:** \`client/src/pages/gempass.tsx\`, \`memberships.tsx\`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| membership_number, expiry_date, status | memberships | ✅ | |
| first_name, last_name | members | ✅ | (JOIN) |
| barcode, issue_date, fee | memberships | ❌ | Da aggiungere in UI |

### 3.3 Gestione Corsi & Iscritti
**File:** \`client/src/pages/courses.tsx\`, \`scheda-corso.tsx\`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| name, day_of_week, start_time, instructor_id | courses | ✅ | |
| status_tags, internal_tags | courses | ✅ | Standardizzati con checkmark/badge UI |
| total_occurrences | courses | ✅ | Usato per "effettuate / rimanenti" |
| participation_type | enrollments | ⚠️ | Da aggiungere |

### 3.4 Contabilità
**File:** \`client/src/pages/accounting-sheet.tsx\`, \`payments.tsx\`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| amount, type, status, paid_date, payment_method | payments | ✅ | |
| operator_name, source, total_quota, deposit | payments | ⚠️ | Urgente da aggiungere in UI per Audit veloce |

### 3.5 Planning Strategico e GemTeam
**File:** \`client/src/pages/planning.tsx\`, \`gemteam.tsx\`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| category_id, active | courses | ✅ | Colori e opacità visiva |
| shift_start, shift_end, postazione_id | team_scheduled_shifts | ✅ | Layout a griglia settimanale implementato |

### 3.6 Checklist Lavori UI da Terminare
- [ ] Aggiungere colonne \`operator_name\` e \`source\` nella tabella /pagamenti.
- [ ] Includere \`data_quality_flag\` nella vista anagrafica dettagliata (profilo admin).
- [ ] Rendere visibile \`barcode\` e \`fee\` nel Modale GemPass.
`;

fs.writeFileSync('_GAE_SVILUPPO/attuale/D_2026_04_28_1150_Mappa_Dati_e_Frontend.md', md);
console.log('Generato file D_2026_04_28_1150_Mappa_Dati_e_Frontend.md');
