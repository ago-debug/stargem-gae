const fs = require('fs');
let content = fs.readFileSync('client/src/components/CourseDuplicationWizard.tsx', 'utf8');

const helpers = `
function getFirstDateForDay(fromDate: string, dayOfWeek: string): string {
  if (!fromDate || !dayOfWeek) return '';
  const dayMap: Record<string, number> = { 'LUN':1,'MAR':2,'MER':3,'GIO':4,'VEN':5,'SAB':6,'DOM':0 };
  const target = dayMap[dayOfWeek];
  const d = new Date(fromDate);
  while (d.getDay() !== target) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split('T')[0];
}

function getLastDateForDay(toDate: string, dayOfWeek: string): string {
  if (!toDate || !dayOfWeek) return '';
  const dayMap: Record<string, number> = { 'LUN':1,'MAR':2,'MER':3,'GIO':4,'VEN':5,'SAB':6,'DOM':0 };
  const target = dayMap[dayOfWeek];
  const d = new Date(toDate);
  while (d.getDay() !== target) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().split('T')[0];
}

function countOccurrences(startDate: string, endDate: string, dayOfWeek: string, closedDays: string[]): number {
  if (!startDate || !endDate || !dayOfWeek) return 0;
  const dayMap: Record<string,number> = { 'LUN':1,'MAR':2,'MER':3,'GIO':4,'VEN':5,'SAB':6,'DOM':0 };
  const target = dayMap[dayOfWeek];
  const closedSet = new Set(closedDays);
  let count = 0;
  const d = new Date(startDate);
  const end = new Date(endDate);
  while (d <= end) {
    if (d.getDay() === target && !closedSet.has(d.toISOString().split('T')[0])) {
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return count;
}

const DAY_ALIASES: Record<string, string[]> = {
  'LUN': ['lun','lunedì','lunedi','monday','mon'],
  'MAR': ['mar','martedì','martedi','tuesday','tue'],
  'MER': ['mer','mercoledì','mercoledi','wednesday','wed'],
  'GIO': ['gio','giovedì','giovedi','thursday','thu'],
  'VEN': ['ven','venerdì','venerdi','friday','fri'],
  'SAB': ['sab','sabato','saturday','sat'],
  'DOM': ['dom','domenica','sunday','sun'],
};

function matchesFilter(course: any, filter: string, instructors: any[]): boolean {
  const f = filter.toLowerCase().trim();
  if (!f) return true;
  if (course.name?.toLowerCase().includes(f)) return true;
  const dayCode = course.dayOfWeek?.toUpperCase();
  const aliases = DAY_ALIASES[dayCode] || [];
  if (aliases.some(a => a.includes(f) || f.includes(a))) return true;
  const instructorName = instructors?.find(i => i.id === course.instructorId)?.lastName || "";
  if (instructorName.toLowerCase().includes(f)) return true;
  return false;
}
`;

content = content.replace('interface CourseDuplicationWizardProps {', helpers + '\ninterface CourseDuplicationWizardProps {');

// Fix search logic
const oldSearch = `  const filteredSourceCourses = useMemo(() => {
    if (!searchFilter.trim()) return sourceCourses;
    const lowerFilter = searchFilter.toLowerCase().trim();
    return sourceCourses.filter(c => {
        const matchName = c.name?.toLowerCase().includes(lowerFilter);
        const matchDay = c.dayOfWeek?.toLowerCase().includes(lowerFilter);
        const matchInstructor = (instructors?.find(i => i.id === c.instructorId)?.lastName || "").toLowerCase().includes(lowerFilter);
        return matchName || matchDay || matchInstructor;
    });
  }, [sourceCourses, searchFilter, instructors]);`;

const newSearch = `  const filteredSourceCourses = useMemo(() => {
    if (!searchFilter.trim()) return sourceCourses;
    return sourceCourses.filter(c => matchesFilter(c, searchFilter, instructors || []));
  }, [sourceCourses, searchFilter, instructors]);`;

content = content.replace(oldSearch, newSearch);

// Add closedDays state
content = content.replace(
  'const [globalEndDate, setGlobalEndDate] = useState("");',
  'const [globalEndDate, setGlobalEndDate] = useState("");\n  const [closedDays, setClosedDays] = useState<string[]>([]);'
);

// Add closedDays fetch
content = content.replace(
  'const effectiveSourceSeasonId = currentSeasonId === "active" ? activeSeasonFallbackId : currentSeasonId;',
  `const effectiveSourceSeasonId = currentSeasonId === "active" ? activeSeasonFallbackId : currentSeasonId;

  React.useEffect(() => {
    if (!targetSeasonId || !globalStartDate || !globalEndDate) return;
    fetch(\`/api/strategic-events/closed-days?from=\${globalStartDate}&to=\${globalEndDate}&seasonId=\${targetSeasonId}\`)
      .then(r => r.json())
      .then(d => {
         if (d.closedDays) setClosedDays(d.closedDays);
      })
      .catch(console.error);
  }, [targetSeasonId, globalStartDate, globalEndDate]);`
);


// Fix global date setting on mount
const oldMountDates = `        const targetSeason = targetSeasons.find(s => s.id.toString() === targetSeasonId);
        if (targetSeason?.startDate && !globalStartDate) {
            const yStart = new Date(targetSeason.startDate).getFullYear();
            setGlobalStartDate(\`\${yStart}-09-01\`);
        }
        if (targetSeason?.endDate && !globalEndDate) {
            const yEnd = new Date(targetSeason.endDate).getFullYear();
            setGlobalEndDate(\`\${yEnd}-06-30\`);
        }`;

const newMountDates = `        const targetSeason = targetSeasons.find(s => s.id.toString() === targetSeasonId);
        if (targetSeason?.startDate && !globalStartDate) {
            const yStart = new Date(targetSeason.startDate).getFullYear();
            setGlobalStartDate(\`\${yStart}-09-01\`);
        }
        if (targetSeason?.endDate && !globalEndDate) {
            const yEnd = new Date(targetSeason.endDate).getFullYear();
            setGlobalEndDate(\`\${yEnd}-06-30\`);
        }`;
// I didn't change globalStartDate here, because globalStartDate represents the START OF THE SEASON, not the start of the specific course. The start of the specific course is handled in payload creation.


// Fix SKU & Dates in the duplicate routine
// Find 'const buildPayloads = (): any[] => {'
content = content.replace(
  'const codeD = courseData.startTime ? String(courseData.startTime).split(":")[0] : "XX";\n      \n      let codeE = "X";\n      if (courseData.categoryId) {\n          const cat = categories.find((c: any) => c.id === courseData.categoryId);\n          if (cat && cat.value) {\n              codeE = String(cat.value).toUpperCase().charAt(0);\n          }\n      }\n\n      const sku = `${codeA}${codeB}${codeC}${codeD}.${codeE}`;',
  'const codeD = courseData.startTime ? String(courseData.startTime).split(":")[0] : "XX";\n      \n      const sku = `${codeA}${codeB}${codeC}${codeD}`;'
);

// We need to apply getFirstDateForDay and getLastDateForDay for EACH payload based on globalStartDate and courseData.dayOfWeek!
const payloadGenOrig = `      const payload = {
          ...originalCourse,
          id: undefined,
          createdAt: undefined,
          sku: sku,
          seasonId: Number(targetSeasonId),
          name: overrides.name ?? originalCourse.name,
          studioId: overrides.studioId !== undefined ? overrides.studioId : originalCourse.studioId,
          startDate: globalStartDate,
          endDate: globalEndDate,
      };`;

const payloadGenNew = `      const specificStartDate = getFirstDateForDay(globalStartDate, courseData.dayOfWeek || "");
      const specificEndDate = getLastDateForDay(globalEndDate, courseData.dayOfWeek || "");
      const totalOccurrences = countOccurrences(specificStartDate, specificEndDate, courseData.dayOfWeek || "", closedDays);

      const payload = {
          ...originalCourse,
          id: undefined,
          createdAt: undefined,
          sku: sku,
          seasonId: Number(targetSeasonId),
          name: overrides.name ?? originalCourse.name,
          studioId: overrides.studioId !== undefined ? overrides.studioId : originalCourse.studioId,
          startDate: specificStartDate,
          endDate: specificEndDate,
          totalOccurrences: totalOccurrences,
      };`;

content = content.replace(payloadGenOrig, payloadGenNew);

fs.writeFileSync('client/src/components/CourseDuplicationWizard.tsx', content);
console.log("Wizard patched");
