import fs from 'fs';

let content = fs.readFileSync('client/src/pages/iscritti_per_attivita.tsx', 'utf8');

// 1. Add States
content = content.replace(
  /const \[searchQueryDM, setSearchQueryDM\] = useState\(""\);\n  const \[, setLocation\] = useLocation\(\);/g,
  `const [searchQueryDM, setSearchQueryDM] = useState("");
  const [expandedLezioniIndividuali, setExpandedLezioniIndividuali] = useState<string[]>([]);
  const [selectedSeasonIdLI, setSelectedSeasonIdLI] = useState<string>("active");
  const [showConcludedSeasonsLI, setShowConcludedSeasonsLI] = useState(false);
  const [searchQueryLI, setSearchQueryLI] = useState("");
  const [, setLocation] = useLocation();`
);

// 2. Add filteredLezioniIndividuali
content = content.replace(
  /  const filteredDomeniche = Array\.isArray\(sundayActivities\)/g,
  `  const filteredLezioniIndividuali = Array.isArray(individualLessons) ? (individualLessons as any[]).filter(li => {
    const matchesSearch = li.name.toLowerCase().includes(searchQueryLI.toLowerCase()) ||
      li.sku?.toLowerCase().includes(searchQueryLI.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro Stagione
    if (!showConcludedSeasonsLI) {
      const targetSeasonId = selectedSeasonIdLI === "active" ? activeSeason?.id : parseInt(selectedSeasonIdLI);
      const liSeasonId = li.seasonId || activeSeason?.id;
      if (targetSeasonId && liSeasonId !== targetSeasonId) return false;
    }

    if (showOnlyWithEnrollments) {
      return lezioniIndividualiEnrollments && lezioniIndividualiEnrollments.filter(e => e.courseId === li.id && (e.status === 'active' || !e.status)).length > 0;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    return dateB - dateA; // Ordine decrescente
  }) : [];

  const filteredDomeniche = Array.isArray(sundayActivities)`
);

// 3. Add switch case
content = content.replace(
  /    case 'domeniche-movimento': \{/g,
  `    case 'lezioni-individuali': {
      const activeLi = filteredLezioniIndividuali.filter(l => l.active);
      if (activeLi.length > 0) {
        const activeEnrolls = activeLi.reduce((acc, l) => acc + (lezioniIndividualiEnrollments?.filter(e => e.courseId === l.id && (e.status === 'active' || !e.status)).length || 0), 0);
        headerCounterText = \`\${activeLi.length} attivi / \${filteredLezioniIndividuali.length} totali \\u00B7 \${activeEnrolls} iscritti\`;
      } else {
        const totalEnrolls = filteredLezioniIndividuali.reduce((acc, l) => acc + (lezioniIndividualiEnrollments?.filter(e => e.courseId === l.id && (e.status === 'active' || !e.status)).length || 0), 0);
        headerCounterText = \`\${filteredLezioniIndividuali.length} lezioni \\u00B7 \${totalEnrolls} iscritti\`;
      }
      break;
    }
    case 'domeniche-movimento': {`
);

// 4. Modify fallback loop exclusion
content = content.replace(
  /&& i\.id !== "domeniche-movimento"\)\.map\(\(item\) => \{/g,
  `&& i.id !== "domeniche-movimento" && i.id !== "lezioni-individuali").map((item) => {`
);

fs.writeFileSync('client/src/pages/iscritti_per_attivita.tsx', content, 'utf8');
console.log("Replacements up to 4 done.");
