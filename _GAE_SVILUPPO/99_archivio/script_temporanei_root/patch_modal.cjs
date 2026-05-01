const fs = require('fs');
const file = 'client/src/components/CourseUnifiedModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Headers
const headersOld = `<SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>
                <SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort}>Cognome</SortableTableHead>`;
const headersNew = `<SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort}>Cognome</SortableTableHead>
                <SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>`;
content = content.replace(headersOld, headersNew);

// 2. Update Cells
const cellsOld = `<TableCell className={cn("font-medium", isSortedColumn("firstName") && "sorted-column-cell")}>{enrollment.firstName}</TableCell>
                  <TableCell className={cn(isSortedColumn("lastName") && "sorted-column-cell")}>{enrollment.lastName}</TableCell>`;
const cellsNew = `<TableCell className={cn("font-medium", isSortedColumn("lastName") && "sorted-column-cell")}>{enrollment.lastName}</TableCell>
                  <TableCell className={cn(isSortedColumn("firstName") && "sorted-column-cell")}>{enrollment.firstName}</TableCell>`;
content = content.replace(cellsOld, cellsNew);

// 3. Update Link
content = content.replace(/<Link href=\{\`\/anagrafica\/\$\{enrollment.memberId\}\`\}>/g, `<Link href={\`/membro/\${enrollment.memberId}\`}>`);

fs.writeFileSync(file, content);
