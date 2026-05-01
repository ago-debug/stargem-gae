const fs = require('fs');
const file = 'client/src/pages/scheda-corso.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add genderFilter state
content = content.replace(
  /const \[location, setLocation\] = useLocation\(\);/,
  `const [location, setLocation] = useLocation();
    const [genderFilter, setGenderFilter] = useState<"all" | "M" | "F">("all");`
);

// 2. Count gender and create handlers
content = content.replace(
  /const enrolledMembersData = \(enrolledMembersRaw \|\| \[\]\)\.map\(\(data: any\) => \{/,
  `const donneCount = enrolledMembersRaw?.filter(m => m.gender === 'F').length || 0;
    const uominiCount = enrolledMembersRaw?.filter(m => m.gender === 'M').length || 0;

    const enrolledMembersData = (enrolledMembersRaw || []).map((data: any) => {`
);

// 3. Filter the data
content = content.replace(
  /const sortedEnrolledMembersData = sortItems\(enrolledMembersData, getSortValue\);/,
  `const filteredEnrolledMembersData = genderFilter === "all" ? enrolledMembersData : enrolledMembersData.filter((data: any) => data.gender === genderFilter);
    const sortedEnrolledMembersData = sortItems(filteredEnrolledMembersData, getSortValue);`
);

// 4. Add the buttons to the header row.
// Look for where presenzeTotal, certScaduti are rendered, and add them at the end.
content = content.replace(
  /<Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1\.5">\s*🔁 \{rimanenti\} rimanenti\s*<\/Badge>\s*<\/>\s*\)}/,
  `<Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                                        🔁 {rimanenti} rimanenti
                                    </Badge>
                                </>
                            )}
                            <button 
                                onClick={() => setGenderFilter(prev => prev === "F" ? "all" : "F")}
                                className={\`text-sm font-medium px-3 py-1 rounded transition-colors \${genderFilter === "F" ? "bg-pink-100 text-pink-700 ring-1 ring-pink-400" : "bg-pink-50 text-pink-600 hover:bg-pink-100"}\`}
                            >
                                Donne {donneCount}
                            </button>
                            <button 
                                onClick={() => setGenderFilter(prev => prev === "M" ? "all" : "M")}
                                className={\`text-sm font-medium px-3 py-1 rounded transition-colors \${genderFilter === "M" ? "bg-blue-100 text-blue-700 ring-1 ring-blue-400" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}\`}
                            >
                                Uomini {uominiCount}
                            </button>`
);

fs.writeFileSync(file, content);
