const fs = require('fs');
let content = fs.readFileSync('client/src/components/CourseSingleDuplicateModal.tsx', 'utf8');

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
`;

content = content.replace('export function CourseSingleDuplicateModal', helpers + '\nexport function CourseSingleDuplicateModal');

content = content.replace(
  'const [endTime, setEndTime] = useState<string>("");',
  'const [endTime, setEndTime] = useState<string>("");\n  const [closedDays, setClosedDays] = useState<string[]>([]);\n  const [totalOccurrences, setTotalOccurrences] = useState<number>(0);'
);

content = content.replace(
  '// Recalculate values when season changes\n  useEffect(() => {',
  `// Fetch closed days when season or dates change
  useEffect(() => {
    if (!seasonId || !startDate || !endDate) return;
    fetch(\`/api/strategic-events/closed-days?from=\${startDate}&to=\${endDate}&seasonId=\${seasonId}\`)
      .then(r => r.json())
      .then(d => {
         if (d.closedDays) setClosedDays(d.closedDays);
      })
      .catch(console.error);
  }, [seasonId, startDate, endDate]);

  // Recalculate occurrences
  useEffect(() => {
    if (startDate && endDate && dayOfWeek) {
        setTotalOccurrences(countOccurrences(startDate, endDate, dayOfWeek, closedDays));
    } else {
        setTotalOccurrences(0);
    }
  }, [startDate, endDate, dayOfWeek, closedDays]);

  // Recalculate values when season changes
  useEffect(() => {`
);

content = content.replace(
  'const calculatedSku = `${codeA}${codeB}${codeC}${codeD}.${codeE}`;',
  'const calculatedSku = `${codeA}${codeB}${codeC}${codeD}`;'
);

const oldDateCalc = `      if (selectedSeason?.startDate) {
          const seasonStartYear = new Date(selectedSeason.startDate).getFullYear();
          setStartDate(\`\${seasonStartYear}-09-01\`);
      }
      if (selectedSeason?.endDate) {
          const seasonEndYear = new Date(selectedSeason.endDate).getFullYear();
          setEndDate(\`\${seasonEndYear}-06-30\`);
      }`;

const newDateCalc = `      if (selectedSeason?.startDate && dayOfWeek) {
          const seasonStartYear = new Date(selectedSeason.startDate).getFullYear();
          setStartDate(getFirstDateForDay(\`\${seasonStartYear}-09-01\`, dayOfWeek));
      }
      if (selectedSeason?.endDate && dayOfWeek) {
          const seasonEndYear = new Date(selectedSeason.endDate).getFullYear();
          setEndDate(getLastDateForDay(\`\${seasonEndYear}-06-30\`, dayOfWeek));
      }`;

content = content.replace(oldDateCalc, newDateCalc);

const handleDuplicateOriginal = `  const handleDuplicate = () => {
     if (!seasonId) return toast({ title: "Seleziona", description: "Seleziona una stagione", variant: "destructive"});
     if (!course) return;

     // 0. Controllo Congruenza Data Inizio e Giorno Settimana
     if (startDate && dayOfWeek && dayOfWeek !== "none") {
         const dObj = new Date(\`\${startDate}T12:00:00\`);
         const dayIdx = dObj.getDay() === 0 ? 6 : dObj.getDay() - 1;
         const isMatchingDay = WEEKDAYS[dayIdx].id === dayOfWeek;
         
         if (!isMatchingDay) {
             const chosenDayObj = WEEKDAYS.find(w => w.id === dayOfWeek);
             const wrongDayObj = WEEKDAYS[dayIdx];
             return toast({
                 title: "Data di Inizio incompatibile",
                 description: \`La ricorrenza è impostata di \${chosenDayObj?.label}, ma la Data Inizio inserita cade di \${wrongDayObj?.label}. Seleziona la data corretta sul calendario!\`,
                 variant: "destructive",
                 duration: 6000
             });
         }
     }

     // 1. Controllo conflitti Frontend-side
     const newStart = timeToMinutes(startTime);
     const newEnd = timeToMinutes(endTime) || newStart + 60;`;

const handleDuplicateNew = `  const handleDuplicate = () => {
     if (!seasonId) return toast({ title: "Seleziona", description: "Seleziona una stagione", variant: "destructive"});
     if (!course) return;

     // 1. Controllo conflitti Frontend-side
     const newStart = timeToMinutes(startTime);
     const newEnd = timeToMinutes(endTime) || newStart + 60;`;

content = content.replace(handleDuplicateOriginal, handleDuplicateNew);

const payloadOriginal = `     const payload = {
         name: course.name,
         activityType: course.activityType || "course",
         categoryId: course.categoryId,
         seasonId: Number(seasonId),
         instructorId: course.instructorId,
         studioId: course.studioId,
         sku: sku,
         startDate: startDate,
         endDate: endDate,
         dayOfWeek: dayOfWeek,
         startTime: startTime,
         endTime: endTime,
     };`;

const payloadNew = `     const payload = {
         ...course,
         id: undefined,
         createdAt: undefined,
         sku: sku,
         seasonId: Number(seasonId),
         startDate: startDate,
         endDate: endDate,
         dayOfWeek: dayOfWeek,
         startTime: startTime,
         endTime: endTime,
         totalOccurrences: totalOccurrences,
     };`;

content = content.replace(payloadOriginal, payloadNew);

content = content.replace(
  '</DialogHeader>',
  '</DialogHeader>\n          {totalOccurrences > 0 && (<div className="bg-blue-50 text-blue-700 text-sm font-semibold p-2 rounded flex items-center gap-2">📅 {totalOccurrences} lezioni previste ({totalOccurrences} settimane operative al netto delle festività)</div>)}'
);

// We need to trigger start date re-calculation when dayOfWeek changes!
// Actually, if dayOfWeek changes, the seasonId useEffect will trigger because we include dayOfWeek in dependency array? Let's add an explicit effect.
const daySync = `
  useEffect(() => {
     if (dayOfWeek && seasonId) {
         const selectedSeason = seasons?.find(s => s?.id?.toString() === seasonId);
         if (selectedSeason?.startDate) {
             const seasonStartYear = new Date(selectedSeason.startDate).getFullYear();
             setStartDate(getFirstDateForDay(\`\${seasonStartYear}-09-01\`, dayOfWeek));
         }
         if (selectedSeason?.endDate) {
             const seasonEndYear = new Date(selectedSeason.endDate).getFullYear();
             setEndDate(getLastDateForDay(\`\${seasonEndYear}-06-30\`, dayOfWeek));
         }
     }
  }, [dayOfWeek]);
`;
content = content.replace('// Recalculate occurrences', daySync + '\n  // Recalculate occurrences');


fs.writeFileSync('client/src/components/CourseSingleDuplicateModal.tsx', content);
console.log("Done");
