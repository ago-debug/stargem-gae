const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../client/src/components/CourseDuplicationWizard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add states
content = content.replace(
  'const [closedDays, setClosedDays] = useState<string[]>([]);',
  `const [closedDays, setClosedDays] = useState<string[]>([]);
  
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const [deleteInfo, setDeleteInfo] = useState<{cancellabili: Course[], protetti: Course[]}>({ cancellabili: [], protetti: [] });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");`
);

// Add handleBulkDeleteRequest
const handleDuplicatePattern = 'const handleDuplicate = async () => {';
content = content.replace(handleDuplicatePattern, `
  const handleBulkDeleteRequest = () => {
      const cancellabili: Course[] = [];
      const protetti: Course[] = [];
      
      Array.from(selectedCourseIds).forEach(id => {
          const c = sourceCourses.find(x => x.id === id);
          if (c) {
              if ((c.currentEnrollment || 0) > 0) protetti.push(c);
              else cancellabili.push(c);
          }
      });
      
      setDeleteInfo({ cancellabili, protetti });
      setDeleteConfirmStep(1);
  };

  const handleDuplicate = async () => {`);

// Add button
const buttonPattern = '<Button onClick={handleDuplicate}';
content = content.replace(buttonPattern, `<Button onClick={handleBulkDeleteRequest} variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 min-w-[150px] h-11" disabled={selectedCourseIds.size === 0}>
                Elimina Selezione
            </Button>
            <Button onClick={handleDuplicate}`);

// Add dialog
const dialogEndPattern = '      </DialogContent>\n    </Dialog>\n  );\n}';
content = content.replace(dialogEndPattern, `      </DialogContent>
    </Dialog>

      <Dialog open={deleteConfirmStep > 0} onOpenChange={(open) => { if(!open) setDeleteConfirmStep(0) }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Eliminazione Massiva</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                {deleteConfirmStep === 1 && (
                    <div className="space-y-4">
                        <p>Sei sicuro di voler eliminare <strong>{deleteInfo.cancellabili.length}</strong> corsi?</p>
                        {deleteInfo.protetti.length > 0 && (
                            <div className="text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
                                ⚠️ <strong>{deleteInfo.protetti.length} corsi</strong> hanno iscritti e NON verranno eliminati:
                                <div className="mt-1 text-xs">{deleteInfo.protetti.map(c => c.name).join(', ')}</div>
                            </div>
                        )}
                        <p className="text-red-600 text-sm font-semibold">Questa operazione è IRREVERSIBILE.</p>
                    </div>
                )}
                {deleteConfirmStep === 2 && (
                    <div className="space-y-4">
                        <p className="font-semibold text-red-600">ULTIMA CONFERMA</p>
                        <p>Elimino definitivamente <strong>{deleteInfo.cancellabili.length}</strong> corsi senza iscritti.</p>
                        <div className="space-y-2">
                            <Label>Scrivi ELIMINA per confermare</Label>
                            <Input 
                                value={deleteConfirmText} 
                                onChange={e => setDeleteConfirmText(e.target.value)} 
                                placeholder="ELIMINA"
                            />
                        </div>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmStep(0)}>Annulla</Button>
                {deleteConfirmStep === 1 && (
                    <Button 
                        className="bg-red-600 hover:bg-red-700 text-white" 
                        onClick={() => {
                            if (deleteInfo.cancellabili.length === 0) {
                                toast({ title: "Nessun corso cancellabile", variant: "destructive" });
                                setDeleteConfirmStep(0);
                                return;
                            }
                            setDeleteConfirmText("");
                            setDeleteConfirmStep(2);
                        }}
                    >
                        CONFERMA
                    </Button>
                )}
                {deleteConfirmStep === 2 && (
                    <Button 
                        className="bg-red-600 hover:bg-red-700 text-white" 
                        disabled={deleteConfirmText !== "ELIMINA"}
                        onClick={async () => {
                            try {
                                for (const course of deleteInfo.cancellabili) {
                                    await apiRequest("DELETE", \`/api/courses/\${course.id}\`);
                                }
                                queryClient.invalidateQueries({ queryKey: ['/api/courses'], exact: false });
                                toast({ title: \`\${deleteInfo.cancellabili.length} corsi eliminati\` });
                                setSelectedCourseIds(new Set());
                                setDeleteConfirmStep(0);
                            } catch (error: any) {
                                toast({ title: "Errore durante l'eliminazione", description: error.message, variant: "destructive" });
                            }
                        }}
                    >
                        Sì, elimina definitivamente
                    </Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}`);

fs.writeFileSync(file, content);
