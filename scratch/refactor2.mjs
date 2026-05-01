import fs from 'fs';

const filePath = '/Users/gaetano1/SVILUPPO/StarGem_manager/client/src/pages/iscritti_per_attivita.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the sort syntax at line 245
content = content.replace(
  /\}\)\.sort\(\(a, b\) => \{\n    const dateA = new Date\(a\.startDate \|\| a\.createdAt \|\| 0\)\.getTime\(\);\n    const dateB = new Date\(b\.startDate \|\| b\.createdAt \|\| 0\)\.getTime\(\);\n  \}\)\.sort\(\(a, b\) => \{/g,
  `}).sort((a, b) => {`
);

// 2. Add sortedSeasons inside the component since it's missing (it was probably placed in the wrong spot or didn't match)
if (!content.includes('const sortedSeasons =')) {
  // Let's place it right after `const { data: seasons } = useQuery`
  content = content.replace(
    /const \{ data: seasons \} = useQuery<any\[\]>\(\{ queryKey: \["\/api\/seasons"\] \}\);/,
    `const { data: seasons } = useQuery<any[]>({ queryKey: ["/api/seasons"] });\n\n  const sortedSeasons = [...(seasons || [])].sort((a: any, b: any) => {\n    if (a.active && !b.active) return -1;\n    if (!a.active && b.active) return 1;\n    return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();\n  });`
  );
}

fs.writeFileSync(filePath, content);
console.log("Fixes applied to iscritti_per_attivita.tsx");
