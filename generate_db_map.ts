import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { execSync } from 'child_process';

const STARGEM_DIR = '/Users/gaetano1/SVILUPPO/StarGem_manager';
const OUT_DIR = path.join(STARGEM_DIR, '_GAE_SVILUPPO');
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
    routes: string[];
    pages: string[];
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
        
        // Extract columns
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
            // detect relations roughly
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
            purpose: "Dati di base per " + tableName.replace(/_/g, " "),
            columns,
            fks: [...new Set(fks)],
            routes: [],
            pages: []
        });
    }

    // Include tables found in DB but not directly cleanly matched in regex
    for (const tableName of Object.keys(rowCounts)) {
        if (!tableInfoList.find(t => t.tableName === tableName)) {
            // Ignore system tables
            if (tableName === '__drizzle_migrations') continue;
            let module = "Core/Unknown";
            if (tableName.startsWith("team_")) module = "GemTeam";
            tableInfoList.push({
                tableName,
                drizzleName: '',
                rowCount: rowCounts[tableName],
                module,
                purpose: "Generata esternamente o legacy",
                columns: ['da verificare'],
                fks: [],
                routes: [],
                pages: []
            });
        }
    }

    console.log("Analyzing server/routes.ts mapping...");
    const routesContent = fs.readFileSync(ROUTES_FILE, 'utf-8');
    
    // Split routes by app.get/post/patch/delete
    const routeBlocks = routesContent.split(/app\.(get|post|patch|delete|put)\(/);
    const routesByKeyword: Record<string, Set<string>> = {};
    
    for (let i = 1; i < routeBlocks.length; i += 2) {
        const method = routeBlocks[i].toUpperCase();
        const block = routeBlocks[i+1];
        const routeMatch = block.match(/^"([^"]+)"/);
        if (routeMatch) {
            const routePath = routeMatch[1];
            const fullRoute = `${method} ${routePath}`;
            
            // Check which drizzle schema names appear in this block
            for (const table of tableInfoList) {
                if (!table.drizzleName) continue;
                if (block.includes(`schema.${table.drizzleName}`)) {
                    if (!routesByKeyword[table.tableName]) routesByKeyword[table.tableName] = new Set();
                    routesByKeyword[table.tableName].add(fullRoute);
                }
            }
        }
    }

    console.log("Analyzing client/src/pages mapping...");
    const pagesByKeyword: Record<string, Set<string>> = {};
    const traverseDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                traverseDir(fullPath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                // Check if any of the routes assigned to a table are fetched here
                for (const table of tableInfoList) {
                    const routes = routesByKeyword[table.tableName] || new Set();
                    let fileMatches = false;
                    for (const route of routes) {
                        const pathPart = route.split(' ')[1].replace(/:[a-zA-Z0-9_]+/g, ''); // rough
                        if (content.includes(pathPart)) {
                            fileMatches = true;
                            break;
                        }
                    }
                    if (!fileMatches && table.drizzleName && content.includes(table.drizzleName)) {
                        fileMatches = true;
                    }
                    
                    if (fileMatches) {
                        if (!pagesByKeyword[table.tableName]) pagesByKeyword[table.tableName] = new Set();
                        pagesByKeyword[table.tableName].add(file.replace('.tsx', ''));
                    }
                }
            }
        }
    };
    if (fs.existsSync(CLIENT_PAGES_DIR)) traverseDir(CLIENT_PAGES_DIR);

    // Merge everything
    const dataForExcel = tableInfoList.map(t => {
        const routes = routesByKeyword[t.tableName] ? Array.from(routesByKeyword[t.tableName]).slice(0, 3).join(', ') + (routesByKeyword[t.tableName].size > 3 ? '...' : '') : 'Nessuna/Generale';
        const pages = pagesByKeyword[t.tableName] ? Array.from(pagesByKeyword[t.tableName]).join(', ') : 'N/A';
        
        return {
            "Nome tabella": t.tableName,
            "Record attuali": t.rowCount,
            "Scopo / descrizione funzionale": t.purpose,
            "Modulo di appartenenza": t.module,
            "Principali colonne (max 8)": t.columns.join(', '),
            "Route API collegate (se esistono)": routes,
            "Pagina frontend collegata": pages,
            "Relazioni con altre tabelle (FK)": t.fks.join(', ') || 'Nessuna',
            "Note / migliorie possibili": "Schema verificato"
        };
    }).sort((a,b) => {
        if (a["Modulo di appartenenza"] !== b["Modulo di appartenenza"]) {
            return a["Modulo di appartenenza"].localeCompare(b["Modulo di appartenenza"]);
        }
        return a["Nome tabella"].localeCompare(b["Nome tabella"]);
    });

    console.log("Generating Excel file...");
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    
    // Formatting columns width
    const wscols = [
        {wch: 35}, // Nome tabella
        {wch: 15}, // Record
        {wch: 40}, // Scopo
        {wch: 20}, // Modulo
        {wch: 50}, // Colonne
        {wch: 40}, // Route API
        {wch: 30}, // Frontend
        {wch: 30}, // Relazioni
        {wch: 25}  // Note
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mappa Database");

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const outFileName = `MAPPA_DB_STARGEM_${dateStr}.xlsx`;
    const outPath = path.join(OUT_DIR, outFileName);

    XLSX.writeFile(workbook, outPath);
    console.log(`Finito! Excel salvato in: ${outPath}`);
}

run().catch(console.error);
