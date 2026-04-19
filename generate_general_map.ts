import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { execSync } from 'child_process';

const STARGEM_DIR = '/Users/gaetano1/SVILUPPO/StarGem_manager';
const OUT_DIR = path.join(STARGEM_DIR, '/tmp');
const SCHEMA_FILE = path.join(STARGEM_DIR, 'shared/schema.ts');
const ROUTES_FILE = path.join(STARGEM_DIR, 'server/routes.ts');
const CLIENT_PAGES_DIR = path.join(STARGEM_DIR, 'client/src/pages');

interface TableInfo {
    tableName: string;
    drizzleName: string;
    rowCount: number;
    module: string;
    purpose: string;
    columns: string[];
    fks: string[];
    routes: Set<string>;
    pages: Set<string>;
    criticity: string;
}

async function run() {
    console.log("Fetching row counts from MariaDB via SSH...");
    let dbOutput = "";
    try {
        dbOutput = execSync(`ssh root@82.165.35.145 "mariadb --defaults-file=/root/.my.cnf stargem_v2 -e 'SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = \\"stargem_v2\\";'"`, { encoding: 'utf-8' });
    } catch (e) {
        console.error("SSH command failed", e);
    }
    
    const rowCounts: Record<string, number> = {};
    if (dbOutput) {
        const lines = dbOutput.trim().split('\n');
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split('\t');
            if (parts.length >= 2) {
                rowCounts[parts[0].trim()] = parseInt(parts[1].trim(), 10) || 0;
            }
        }
    }

    console.log("Parsing schema.ts...");
    const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
    const tableInfoList: TableInfo[] = [];
    
    // Simple regex to match export const camelCaseName = mysqlTable("snake_case_name", { ... });
    const tableRegex = /export const (\w+) = mysqlTable\("([^"]+)",\s*\{([\s\S]*?)\}(?:,\s*\([^)]*\)\s*=>\s*.*)?\);/g;
    
    let match;
    while ((match = tableRegex.exec(schemaContent)) !== null) {
        const drizzleName = match[1];
        const tableName = match[2];
        const columnsBlock = match[3];
        
        let module = "Core";
        if (tableName.startsWith("team_")) module = "GemTeam";
        else if (tableName.startsWith("staff_")) module = "GemStaff";
        else if (tableName.startsWith("carnet_")) module = "Carnet";
        else if (tableName.startsWith("member_")) module = "GemPass";
        else if (tableName.startsWith("gem_")) module = "GemChat";
        else if (tableName.startsWith("booking_")) module = "Booking";
        else if (tableName.startsWith("wc_")) module = "WooCommerce";
        
        const columns: string[] = [];
        const fks: string[] = [];
        const colLines = columnsBlock.split('\n');
        for (const line of colLines) {
            const colMatch = line.match(/^\s*(\w+):\s*(int|varchar|tinyint|smallint|boolean|text|datetime|timestamp|date|decimal|json|mysqlEnum)/);
            if (colMatch) {
                if (columns.length < 8) {
                    columns.push(colMatch[1]);
                }
            }
            if (line.includes("references(() =>")) {
                const refMatch = line.match(/references\(\(\)\s*=>\s*(\w+)\.(\w+)/);
                if (refMatch) {
                    fks.push(`${refMatch[1]}`);
                }
            }
        }
        
        tableInfoList.push({
            tableName,
            drizzleName,
            rowCount: rowCounts[tableName] || 0,
            module,
            purpose: "Dati per " + tableName.replace(/_/g, " "),
            columns,
            fks: [...new Set(fks)],
            routes: new Set(),
            pages: new Set(),
            criticity: "Da verificare"
        });
    }

    for (const tableName of Object.keys(rowCounts)) {
        if (!tableInfoList.find(t => t.tableName === tableName)) {
            if (tableName === '__drizzle_migrations') continue;
            let module = "Legacy/System";
            if (tableName.startsWith("team_")) module = "GemTeam Legacy";
            tableInfoList.push({
                tableName,
                drizzleName: '',
                rowCount: rowCounts[tableName],
                module,
                purpose: "Tabella orfana o non mappata",
                columns: [],
                fks: [],
                routes: new Set(),
                pages: new Set(),
                criticity: "Tabella orfana in schema.ts"
            });
        }
    }

    console.log("Analyzing server/routes.ts mapping...");
    const routesContent = fs.readFileSync(ROUTES_FILE, 'utf-8');
    const routeBlocks = routesContent.split(/app\.(get|post|patch|delete|put)\(/);
    
    for (let i = 1; i < routeBlocks.length; i += 2) {
        const method = routeBlocks[i].toUpperCase();
        const block = routeBlocks[i+1];
        const routeMatch = block.match(/^"([^"]+)"/);
        if (routeMatch) {
            const routePath = routeMatch[1];
            const fullRoute = `${method} ${routePath}`;
            
            for (const table of tableInfoList) {
                if (!table.drizzleName) continue;
                if (block.includes(`schema.${table.drizzleName}`)) {
                    table.routes.add(fullRoute);
                }
            }
        }
    }

    console.log("Analyzing client/src/pages mapping...");
    const traverseDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                traverseDir(fullPath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                for (const table of tableInfoList) {
                    let fileMatches = false;
                    for (const route of table.routes) {
                        const pathPart = route.split(' ')[1].replace(/:[a-zA-Z0-9_]+/g, '');
                        if (content.includes(pathPart)) {
                            fileMatches = true; break;
                        }
                    }
                    if (!fileMatches && table.drizzleName && content.includes(table.drizzleName)) {
                        fileMatches = true;
                    }
                    if (fileMatches) {
                        table.pages.add(file.replace('.tsx', ''));
                    }
                }
            }
        }
    };
    if (fs.existsSync(CLIENT_PAGES_DIR)) traverseDir(CLIENT_PAGES_DIR);

    // Compute Criticity
    for (const t of tableInfoList) {
        let crit = [];
        if (t.routes.size === 0 && t.pages.size === 0 && t.module !== "Legacy/System") crit.push("Nessuna route/UI collegata");
        if (t.rowCount === 0 && t.routes.size === 0) crit.push("Tabella vuota inattiva");
        if (t.rowCount > 0 && t.routes.size === 0) crit.push("Record presenti ma isolati");
        t.criticity = crit.length > 0 ? crit.join(" | ") : "Nessuna";
    }

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const mdPath = "/tmp/mappa.md";
    const xlsxPath = "/tmp/mappa.xlsx";

    // ==========================================
    // GENERATE MARKDOWN
    // ==========================================
    let md = `# MAPPATURA COMPLETA DATABASE STARGEM V2\nData: ${new Date().toISOString().split('T')[0]}\n\n`;

    // SEZIONE A
    md += `## SEZIONE A — Tabella riepilogativa generale\n\n`;
    md += `| Nome Tabella | Record Attuali | Scopo funzionale | Modulo | API Collegata | UI Collegata | Criticità |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    tableInfoList.forEach(t => {
        md += `| ${t.tableName} | ${t.rowCount} | ${t.purpose} | ${t.module} | ${Array.from(t.routes).slice(0,2).join('<br>')} | ${Array.from(t.pages).join(', ')} | ${t.criticity} |\n`;
    });

    // SEZIONE B
    md += `\n## SEZIONE B — Analisi tabelle a zero record\n\n`;
    tableInfoList.filter(t => t.rowCount === 0).forEach(t => {
        const reason = t.routes.size > 0 ? "Funzionalità implementata ma dati non ancora inseriti (Fase futura/Staging)" : "Tabella orfana o funzionalità non attiva/mai completata";
        md += `- **${t.tableName}**: ${reason}. ${t.criticity}\n`;
    });

    // SEZIONE C
    md += `\n## SEZIONE C — Mappa Route → Tabella → Frontend\n\n`;
    const modulesMap = new Set(tableInfoList.map(t => t.module));
    for (const mod of Array.from(modulesMap).sort()) {
        md += `### Modulo: ${mod}\n`;
        const modTables = tableInfoList.filter(t => t.module === mod);
        let hasData = false;
        modTables.forEach(t => {
            if (t.routes.size > 0) {
                hasData = true;
                md += `- **${t.tableName}**: UI [${Array.from(t.pages).join(', ') || 'Script/Postman'}] → API [${Array.from(t.routes).join(', ')}] → DB\n`;
            }
        });
        if (!hasData) md += `- Nessun tracciamento API/UI attivo identificato per questo modulo.\n`;
        md += `\n`;
    }

    // SEZIONE D
    md += `## SEZIONE D — Criticità e anomalie rilevate\n\n`;
    md += `Questa sezione isola le componenti fuori standard identificati dall'ast di TypeScript.\n\n`;
    const critTables = tableInfoList.filter(t => t.criticity !== "Nessuna");
    critTables.forEach(t => {
        md += `- **${t.tableName}**: ${t.criticity}\n`;
    });

    // Trovare invalid FK
    // Creare mappa nomi tabelle drizzleName -> tableName
    const dToT: Record<string, string> = {};
    tableInfoList.forEach(t => dToT[t.drizzleName] = t.tableName);

    md += `\n**Analisi Foreign Keys:**\n`;
    tableInfoList.forEach(t => {
        t.fks.forEach(fk => {
            if (!tableInfoList.find(x => x.drizzleName === fk) && fk !== 'unknown') {
                md += `- Tabella \`${t.tableName}\` ha una FK a schema.\`${fk}\` che non mappa o è opaca.\n`;
            }
        });
    });

    // SEZIONE E
    md += `\n## SEZIONE E — Relazioni tra moduli\n\n`;
    md += `Individua quali costrutti superano i boundaries del proprio silo.\n\n`;
    tableInfoList.forEach(t => {
        t.fks.forEach(fk => {
            const targetTable = tableInfoList.find(x => x.drizzleName === fk);
            if (targetTable && targetTable.module !== t.module) {
                md += `- [${t.module}] \`${t.tableName}\` → [${targetTable.module}] \`${targetTable.tableName}\`\n`;
            }
        });
    });

    fs.writeFileSync(mdPath, md, 'utf-8');

    // ==========================================
    // GENERATE EXCEL
    // ==========================================
    const dataForExcel = tableInfoList.map(t => ({
        "Nome Tabella": t.tableName,
        "Record Attuali": t.rowCount,
        "Scopo funzionale": t.purpose,
        "Modulo di appartenenza": t.module,
        "Principale Route API": Array.from(t.routes).slice(0, 3).join('\n'),
        "Pagina Frontend collegata": Array.from(t.pages).join(', ') || 'Nessuna',
        "Relazioni FK": t.fks.join(', '),
        "Criticità rilevate": t.criticity
    })).sort((a,b) => a["Modulo di appartenenza"].localeCompare(b["Modulo di appartenenza"]));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    worksheet['!cols'] = [
        {wch: 35}, {wch: 15}, {wch: 40}, {wch: 20}, {wch: 50}, {wch: 30}, {wch: 30}, {wch: 30}
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Overview Generale");
    XLSX.writeFile(workbook, xlsxPath);

    const ds1 = fs.statSync(mdPath).size;
    const ds2 = fs.statSync(xlsxPath).size;

    console.log(`\nFinito!`);
    console.log(`Markdown: ${mdPath} (${Math.round(ds1/1024)} KB)`);
    console.log(`Excel:    ${xlsxPath} (${Math.round(ds2/1024)} KB)`);
}

run().catch(console.error);
