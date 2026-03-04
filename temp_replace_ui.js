const fs = require('fs');
const file = './client/src/pages/maschera-input-generale.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Aggiungo le query base
const baseQueriesToAdd = `
  // Extra activities base fetch
  const { data: paidTrials } = useQuery<any[]>({ queryKey: ["/api/paid-trials"] });
  const { data: freeTrials } = useQuery<any[]>({ queryKey: ["/api/free-trials"] });
  const { data: singleLessons } = useQuery<any[]>({ queryKey: ["/api/single-lessons"] });
  const { data: sundayActivities } = useQuery<any[]>({ queryKey: ["/api/sunday-activities"] });
  const { data: trainings } = useQuery<any[]>({ queryKey: ["/api/trainings"] });
  const { data: individualLessons } = useQuery<any[]>({ queryKey: ["/api/individual-lessons"] });
  const { data: campusActivities } = useQuery<any[]>({ queryKey: ["/api/campus-activities"] });
  const { data: recitals } = useQuery<any[]>({ queryKey: ["/api/recitals"] });
  const { data: vacationStudies } = useQuery<any[]>({ queryKey: ["/api/vacation-studies"] });

  const renderGenericEnrollmentList = (
    enrollments: any[] | undefined,
    baseData: any[] | undefined,
    mutation: any,
    emptyMessage: string,
    listTitle: string,
    entityLabel: string,
    foreignKey: string
  ) => {
    if (!selectedMemberId) {
      return (
        <div className="text-center p-4 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          Seleziona un membro per gestire {entityLabel}
        </div>
      );
    }
    if (!enrollments || enrollments.length === 0) {
      return <p className="text-sm text-muted-foreground italic p-2">{emptyMessage}</p>;
    }
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{listTitle}</Label>
          {enrollments.map((e: any) => {
            const assoc = baseData?.find((item: any) => item.id === e[foreignKey]);
            const hasDetails = e.details && e.details.length > 0;
            return (
              <div key={e.id} className="grid grid-cols-[140px_180px_240px_1fr_auto] items-center p-2.5 bg-muted/20 border rounded-md group hover:bg-muted/40 transition-colors gap-3">
                <div className="font-bold text-sm truncate" title={assoc?.name}>{assoc?.name || 'Attività non trovata'}</div>
                <div className="font-medium text-[11px] text-slate-900 truncate" title={assoc?.sku || undefined}>{assoc?.sku}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                  <span>Registrata il: {new Date(e.enrollmentDate || e.createdAt || new Date()).toLocaleDateString('it-IT')}</span>
                </div>
                <div className="flex items-center gap-1 overflow-hidden flex-1">
                  {hasDetails && e.details.map((detStr: string, idx: number) => {
                    const color = enrollmentDetails?.find((d: any) => d.name === detStr)?.color;
                    return <EnrollmentDetailBadge key={idx} name={detStr} color={color} className="h-5 py-0.5 px-2 text-[10px] truncate max-w-[120px]" />;
                  })}
                </div>
                <div className="flex items-center justify-end gap-3 pl-2">
                  <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className={e.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-[10px] h-5' : 'text-[10px] h-5'}>
                    {e.status === 'active' ? 'Attiva' : e.status || '?'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { if (confirm("Rimuovere questa riga?")) mutation.mutate(e.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
`;
content = content.replace(
  /const { data: workshops } = useQuery<any\[\]>\({ queryKey: \["\/api\/workshops"\] }\);/,
  `const { data: workshops } = useQuery<any[]>({ queryKey: ["/api/workshops"] });\n${baseQueriesToAdd}`
);

// 2. Definizione delle sostituzioni
const replacements = [
  {
    startMatch: /\{\/\* PROVE A PAGAMENTO \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m,
    endMatch: /\{\/\* PROVE GRATUITE \*\/\}/,
    replacement: `
              {renderGenericEnrollmentList(memberPtEnrollments, paidTrials, removePtEnrollmentMutation, "Nessuna prova a pagamento registrata.", "Prove a Pagamento Registrate", "le prove a pagamento", "paidTrialId")}
            </div>
            
            `
  },
  {
    startMatch: /\{\/\* PROVE GRATUITE \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m,
    endMatch: /\{\/\* LEZIONI SINGOLE \*\/\}/,
    replacement: `
              {renderGenericEnrollmentList(memberFtEnrollments, freeTrials, removeFtEnrollmentMutation, "Nessuna prova gratuita registrata.", "Prove Gratuite Registrate", "le prove gratuite", "freeTrialId")}
            </div>

            `
  },
  {
    startMatch: /\{\/\* LEZIONI SINGOLE \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m,
    endMatch: /\{\/\* WORKSHOP \*\/\}/,
    replacement: `
              {renderGenericEnrollmentList(memberSlEnrollments, singleLessons, removeSlEnrollmentMutation, "Nessuna lezione singola registrata.", "Lezioni Singole Registrate", "le lezioni singole", "singleLessonId")}
            </div>

            `
  },
  {
    startMatch: /\{\/\* DOMENICHE IN MOVIMENTO \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m,
    endMatch: /\{\/\* ALLENAMENTI \*\/\}/,
    replacement: `
              {renderGenericEnrollmentList(memberSaEnrollments, sundayActivities, removeSaEnrollmentMutation, "Nessuna domenica in movimento registrata.", "Domeniche in Movimento Registrate", "le domeniche in movimento", "sundayActivityId")}
            </div>

            `
  },
  {
    startMatch: /\{\/\* ALLENAMENTI \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m,
    endMatch: /\{\/\* LEZIONI INDIVIDUALI \*\/\}/,
    replacement: `
              {renderGenericEnrollmentList(memberTrEnrollments, trainings, removeTrEnrollmentMutation, "Nessun allenamento registrato.", "Allenamenti Registrati", "gli allenamenti", "trainingId")}
            </div>

            `
  },
  {
    startMatch: /\{\/\* LEZIONI INDIVIDUALI \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m,
    endMatch: /\{\/\* CAMPUS \*\/\}/,
    replacement: `
              {renderGenericEnrollmentList(memberIlEnrollments, individualLessons, removeIlEnrollmentMutation, "Nessuna lezione individuale registrata.", "Lezioni Individuali Registrate", "le lezioni individuali", "individualLessonId")}
            </div>

            `
  },
  {
    startMatch: /\{\/\* CAMPUS \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m,
    endMatch: /\{\/\* SAGGI \*\/\}/,
    replacement: `
              {renderGenericEnrollmentList(memberCaEnrollments, campusActivities, removeCaEnrollmentMutation, "Nessun campus registrato.", "Campus Registrati", "i campus", "campusActivityId")}
            </div>

            `
  },
  {
    startMatch: /\{\/\* SAGGI \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m,
    endMatch: /\{\/\* VACANZE STUDIO \*\/\}/,
    replacement: `
              {renderGenericEnrollmentList(memberReEnrollments, recitals, removeReEnrollmentMutation, "Nessun saggio registrato.", "Saggi Registrati", "i saggi", "recitalId")}
            </div>

            `
  },
];

// Execute replacements
for (const r of replacements) {
  const matchStart = content.match(r.startMatch);
  if (!matchStart) continue;
  
  const startIndex = matchStart.index + matchStart[0].length;
  const matchEnd = content.substring(startIndex).match(r.endMatch);
  if (!matchEnd) continue;
  
  const endIndex = startIndex + matchEnd.index;
  
  content = content.substring(0, startIndex) + r.replacement + content.substring(endIndex);
}

// L'ultima: VACANZE STUDIO
const vsMatchStart = content.match(/\{\/\* VACANZE STUDIO \*\/\}\s*<div>\s*<h3([\s\S]*?)<\/h3>/m);
if (vsMatchStart) {
  const startIndex = vsMatchStart.index + vsMatchStart[0].length;
  // Cerchiamo la chiusura del blocco div Attività (CardContent o altro blocco)
  // Il modo piu semplice è cercare la prossima Card o chiusura CardContent
  const endMatch = content.substring(startIndex).match(/<\/CardContent>/);
  if (endMatch) {
     const endIndex = startIndex + endMatch.index - 20; // safe un po' prima
     // In realta' per Vacanze Studio la grid chiude e poi ci sono un  paio di div. 
     // Facciamo un replace normale col regex per il blocco grid di vacanze studio
  }
}

// Vacanze Studio custom regex per maggiore precisione
content = content.replace(
  /(\{\/\* VACANZE STUDIO \*\/\}\s*<div>\s*<h3[\s\S]*?<\/h3>)\s*<div className="grid[\s\S]*?<\/div>\s*<\/div>/m,
  `$1\n              {renderGenericEnrollmentList(memberVsEnrollments, vacationStudies, removeVsEnrollmentMutation, "Nessuna vacanza studio registrata.", "Vacanze Studio Registrate", "le vacanze studio", "vacationStudyId")}\n            </div>`
);


fs.writeFileSync(file, content);
console.log('Fatto');
