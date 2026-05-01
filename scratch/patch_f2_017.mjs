import fs from 'fs';

let content = fs.readFileSync('client/src/pages/iscritti_per_attivita.tsx', 'utf8');

// 1. States
content = content.replace(
  /  const \[searchQueryLI, setSearchQueryLI\] = useState\(""\);\n  const \[, setLocation\] = useLocation\(\);/g,
  `  const [searchQueryLI, setSearchQueryLI] = useState("");
  const [searchQueryCampus, setSearchQueryCampus] = useState("");
  const [selectedSeasonIdCampus, setSelectedSeasonIdCampus] = useState<string>("");
  const [showConcludedSeasonsCampus, setShowConcludedSeasonsCampus] = useState(false);
  const [expandedCampus, setExpandedCampus] = useState<string[]>([]);
  const [, setLocation] = useLocation();`
);

// 2. filteredCampus
content = content.replace(
  /  const filteredLezioniIndividuali = Array\.isArray\(individualLessons\)/g,
  `  const filteredCampus = Array.isArray(campusActivities) ? (campusActivities as any[]).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQueryCampus.toLowerCase()) ||
      c.sku?.toLowerCase().includes(searchQueryCampus.toLowerCase());

    if (!matchesSearch) return false;

    if (!showConcludedSeasonsCampus) {
      const fallbackSeasonId = seasons?.find((s: any) => s.active)?.id?.toString() || "";
      const effectiveSeasonId = selectedSeasonIdCampus || fallbackSeasonId;
      const targetSeasonId = effectiveSeasonId === "all" ? null : parseInt(effectiveSeasonId);
      const campusSeasonId = c.seasonId || seasons?.find((s: any) => s.active)?.id;
      if (targetSeasonId && campusSeasonId !== targetSeasonId) return false;
    }

    if (showOnlyWithEnrollments) {
      return caEnrollments && caEnrollments.filter(e => e.courseId === c.id && (e.status === 'active' || !e.status)).length > 0;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  }) : [];

  const filteredLezioniIndividuali = Array.isArray(individualLessons)`
);

// 3. Header Counter
content = content.replace(
  /    case 'lezioni-individuali': \{/g,
  `    case 'campus': {
      const activeCampus = filteredCampus.filter(c => c.active);
      if (activeCampus.length > 0) {
        const activeEnrolls = activeCampus.reduce((acc, c) => acc + (caEnrollments?.filter(e => e.courseId === c.id && (e.status === 'active' || !e.status)).length || 0), 0);
        headerCounterText = \`\${activeCampus.length} attivi / \${filteredCampus.length} totali \\u00B7 \${activeEnrolls} iscritti\`;
      } else {
        const totalEnrolls = filteredCampus.reduce((acc, c) => acc + (caEnrollments?.filter(e => e.courseId === c.id && (e.status === 'active' || !e.status)).length || 0), 0);
        headerCounterText = \`\${filteredCampus.length} campus \\u00B7 \${totalEnrolls} iscritti\`;
      }
      break;
    }
    case 'lezioni-individuali': {`
);

// 4. Fallback filter
content = content.replace(
  /&& i\.id !== "lezioni-individuali"\)\.map\(\(item\) => \{/g,
  `&& i.id !== "lezioni-individuali" && i.id !== "campus").map((item) => {`
);

fs.writeFileSync('client/src/pages/iscritti_per_attivita.tsx', content, 'utf8');
console.log("Replacements up to 4 done.");
