const fs = require('fs');
const file = 'client/src/pages/scheda-corso.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Headers
content = content.replace(
    /<SortableTableHead sortKey="firstName" currentSort=\{sortConfig\} onSort=\{handleSort\} className="font-semibold text-slate-700 py-4">Nome<\/SortableTableHead>\s*<SortableTableHead sortKey="lastName" currentSort=\{sortConfig\} onSort=\{handleSort\} className="font-semibold text-slate-700 py-4">Cognome<\/SortableTableHead>/g,
    `<SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4">Cognome</SortableTableHead>
                                <SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4">Nome</SortableTableHead>`
);

content = content.replace(
    /<SortableTableHead sortKey="email" currentSort=\{sortConfig\} onSort=\{handleSort\} className="font-semibold text-slate-700 py-4">Email<\/SortableTableHead>/g,
    `<SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4">Email</SortableTableHead>
                                <SortableTableHead sortKey="enrollment_date" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4 text-center">Iscrizione</SortableTableHead>`
);

// 2. Update colspan
content = content.replace(
    /<TableCell colSpan=\{8\} className="text-center py-12 text-slate-500">/g,
    `<TableCell colSpan={9} className="text-center py-12 text-slate-500">`
);

// 3. Update Cells
// First, extract the first name and last name cells
const cellsToReplace = `<TableCell className={cn("font-medium text-slate-900", isSortedColumn("firstName") && "sorted-column-cell")}>
                                                <Link href={\`/membro/\${member_id}\`} className="hover:underline cursor-pointer">
                                                    {first_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("lastName") && "sorted-column-cell")}>
                                                <Link href={\`/membro/\${member_id}\`} className="hover:underline cursor-pointer">
                                                    {last_name}
                                                </Link>
                                            </TableCell>`;

const swappedCells = `<TableCell className={cn("font-medium text-slate-900", isSortedColumn("lastName") && "sorted-column-cell")}>
                                                <Link href={\`/membro/\${member_id}\`} className="hover:underline cursor-pointer">
                                                    {last_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("firstName") && "sorted-column-cell")}>
                                                <Link href={\`/membro/\${member_id}\`} className="hover:underline cursor-pointer">
                                                    {first_name}
                                                </Link>
                                            </TableCell>`;

content = content.replace(cellsToReplace, swappedCells);

// Add enrollment_date variable extraction
content = content.replace(
    /member_id, first_name, last_name, email,/g,
    `member_id, first_name, last_name, email, enrollment_date,`
);

// Insert enrollment_date cell
content = content.replace(
    /<TableCell className=\{cn\("text-slate-600 text-sm", isSortedColumn\("email"\) && "sorted-column-cell"\)\}>\{email \|\| '-'\.<\/TableCell>/g, // this is wrong, I'll match exact
    "" // we will use exact replace below
);

const emailCell = `<TableCell className={cn("text-slate-600 text-sm", isSortedColumn("email") && "sorted-column-cell")}>{email || '-'}</TableCell>`;
const emailPlusDateCell = `<TableCell className={cn("text-slate-600 text-sm", isSortedColumn("email") && "sorted-column-cell")}>{email || '-'}</TableCell>
                                            <TableCell className={cn("text-center text-slate-500 text-xs", isSortedColumn("enrollment_date") && "sorted-column-cell")}>
                                                {enrollment_date ? new Date(enrollment_date).toLocaleString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </TableCell>`;

content = content.replace(emailCell, emailPlusDateCell);

fs.writeFileSync(file, content);
