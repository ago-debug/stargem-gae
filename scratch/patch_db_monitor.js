const fs = require('fs');
let file = fs.readFileSync('client/src/pages/db-monitor.tsx', 'utf8');

// Replace Types
file = file.replace(
  `interface DbStat {`,
  `type FlagComment = { id: string; type: 'colonna'|'riga'; table: string; ref: string; reason: string; data?: any };\n\ninterface DbStat {`
);

// Replace State & Logic
file = file.replace(
  `  const { toast } = useToast();
  const [flagDialog, setFlagDialog] = React.useState<{ isOpen: boolean; type: 'colonna'|'riga'; table: string; ref: string; data?: any }>({ isOpen: false, type: 'colonna', table: '', ref: '' });
  const [flagReason, setFlagReason] = React.useState("");

  const flagMutation = useMutation({
    mutationFn: async (payload: any) => await apiRequest("POST", "/api/admin/db-monitor/flag", payload),
    onSuccess: () => {
      toast({ title: "Segnalazione Inviata", description: "Salvata con successo per Antigravity." });
      setFlagDialog(prev => ({ ...prev, isOpen: false }));
      setFlagReason("");
    },
    onError: () => toast({ title: "Errore", description: "Impossibile salvare la segnalazione.", variant: "destructive" })
  });`,
  `  const { toast } = useToast();
  const [flagDialog, setFlagDialog] = React.useState<{ isOpen: boolean; type: 'colonna'|'riga'; table: string; ref: string; data?: any }>({ isOpen: false, type: 'colonna', table: '', ref: '' });
  const [flagReason, setFlagReason] = React.useState("");

  const [localComments, setLocalComments] = React.useState<{pending: FlagComment[], sent: FlagComment[]}>({ pending: [], sent: [] });

  React.useEffect(() => {
    const saved = localStorage.getItem('db_monitor_flags');
    if (saved) {
      try { setLocalComments(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveLocalComments = (newComments: {pending: FlagComment[], sent: FlagComment[]}) => {
    setLocalComments(newComments);
    localStorage.setItem('db_monitor_flags', JSON.stringify(newComments));
  };

  const handleSaveDraft = () => {
    if (!flagReason) return;
    const newComment: FlagComment = {
      id: \`\${flagDialog.table}_\${flagDialog.type}_\${flagDialog.ref}\`,
      type: flagDialog.type,
      table: flagDialog.table,
      ref: flagDialog.ref,
      reason: flagReason,
      data: flagDialog.data
    };
    
    const newPending = localComments.pending.filter(c => c.id !== newComment.id);
    newPending.push(newComment);
    
    saveLocalComments({ ...localComments, pending: newPending });
    setFlagDialog(prev => ({ ...prev, isOpen: false }));
    setFlagReason("");
  };

  const flagBatchMutation = useMutation({
    mutationFn: async (flags: FlagComment[]) => await apiRequest("POST", "/api/admin/db-monitor/flag-batch", { flags }),
    onSuccess: (_, variables) => {
      toast({ title: "Report Inviato", description: \`\${variables.length} commenti salvati per Antigravity.\` });
      
      const newSent = [...localComments.sent];
      for (const pending of variables) {
        if (!newSent.find(s => s.id === pending.id)) {
          newSent.push(pending);
        }
      }
      saveLocalComments({ pending: [], sent: newSent });
    },
    onError: () => toast({ title: "Errore", description: "Impossibile inviare il report.", variant: "destructive" })
  });

  const openFlagDialog = (type: 'colonna'|'riga', table: string, ref: string, data?: any) => {
    const id = \`\${table}_\${type}_\${ref}\`;
    const existing = localComments.pending.find(c => c.id === id) || localComments.sent.find(c => c.id === id);
    setFlagReason(existing ? existing.reason : "");
    setFlagDialog({ isOpen: true, type, table, ref, data });
  };`
);

// Replace button for Columns
file = file.replace(
  `                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 ml-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                    onClick={() => setFlagDialog({ isOpen: true, type: 'colonna', table: stat.table, ref: colName })}
                                    title="Segnala questa colonna ad Antigravity"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                  </Button>`,
  `                                  {(() => {
                                      const commentId = \`\${stat.table}_colonna_\${colName}\`;
                                      const pendingComment = localComments.pending.find(c => c.id === commentId);
                                      const sentComment = localComments.sent.find(c => c.id === commentId);
                                      const commentObj = pendingComment || sentComment;
                                      
                                      const btnClass = pendingComment ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                                        : sentComment ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200 opacity-60' 
                                        : 'text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 opacity-40 hover:opacity-100';

                                      return (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className={\`h-6 w-6 p-0 ml-2 \${btnClass}\`}
                                          onClick={() => openFlagDialog('colonna', stat.table, colName)}
                                          title={commentObj ? commentObj.reason : "Segnala questa colonna ad Antigravity"}
                                        >
                                          <AlertTriangle className="w-3 h-3" />
                                        </Button>
                                      );
                                  })()}`
);

// Find where <TableDataViewer /> is rendered and pass localComments
file = file.replace(
  `<TableDataViewer tableName={expandedTable} stats={stats} onFlag={(ref, data) => setFlagDialog({ isOpen: true, type: 'riga', table: expandedTable, ref, data })} />`,
  `<TableDataViewer tableName={expandedTable} stats={stats} localComments={localComments} onFlag={(ref, data) => openFlagDialog('riga', expandedTable, ref, data)} />`
);

// Add bottom bar
file = file.replace(
  `        </DialogContent>
      </Dialog>
    </div>
  );
}`,
  `        </DialogContent>
      </Dialog>

      {localComments.pending.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t p-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center gap-3 ml-4">
            <div className="bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold shadow-lg">
              {localComments.pending.length}
            </div>
            <span className="text-slate-200 font-medium">
              Hai {localComments.pending.length} segnalazioni in bozza.
            </span>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-500 text-white mr-4 shadow-lg border border-emerald-500/20 font-bold"
            onClick={() => flagBatchMutation.mutate(localComments.pending)}
            disabled={flagBatchMutation.isPending}
          >
            Invia Report ad Antigravity
          </Button>
        </div>
      )}

    </div>
  );
}`
);

// Replace TableDataViewer signature
file = file.replace(
  `function TableDataViewer({ tableName, stats, onFlag }: { tableName: string, stats: DbStat[], onFlag: (ref: string, data: any) => void }) {`,
  `function TableDataViewer({ tableName, stats, localComments, onFlag }: { tableName: string, stats: DbStat[], localComments: {pending: FlagComment[], sent: FlagComment[]}, onFlag: (ref: string, data: any) => void }) {`
);

// Replace button for Rows
file = file.replace(
  `                <TableCell className="px-4 sticky right-0 bg-white dark:bg-slate-950 z-10 border-l text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    onClick={() => onFlag(row.id?.toString() || "riga_" + i, row)}
                    title="Segnala questa riga ad Antigravity"
                  >
                    <AlertTriangle className="w-3 h-3" />
                  </Button>
                </TableCell>`,
  `                <TableCell className="px-4 sticky right-0 bg-white dark:bg-slate-950 z-10 border-l text-center">
                  {(() => {
                    const rowId = row.id?.toString() || "riga_" + i;
                    const commentId = \`\${tableName}_riga_\${rowId}\`;
                    const pendingComment = localComments.pending.find(c => c.id === commentId);
                    const sentComment = localComments.sent.find(c => c.id === commentId);
                    const commentObj = pendingComment || sentComment;
                    
                    const btnClass = pendingComment ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                      : sentComment ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200 opacity-60' 
                      : 'text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 opacity-40 hover:opacity-100';

                    return (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={\`h-7 w-7 p-0 \${btnClass}\`}
                        onClick={() => onFlag(rowId, row)}
                        title={commentObj ? commentObj.reason : "Segnala questa riga ad Antigravity"}
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </Button>
                    );
                  })()}
                </TableCell>`
);

// Replace dialog action
file = file.replace(
  `            <Button 
              className="w-full" 
              disabled={!flagReason || flagMutation.isPending}
              onClick={() => flagMutation.mutate({ ...flagDialog, reason: flagReason })}
            >
              Invia Segnalazione ad Antigravity
            </Button>`,
  `            <Button 
              className="w-full" 
              disabled={!flagReason}
              onClick={handleSaveDraft}
            >
              Salva Bozza Commento
            </Button>`
);

// Replace flagReason value binding to handle enter press and clear
file = file.replace(
  `              <Input 
                value={flagReason} 
                onChange={e => setFlagReason(e.target.value)} 
                placeholder="Inserisci il motivo..."
                autoFocus
              />`,
  `              <Input 
                value={flagReason} 
                onChange={e => setFlagReason(e.target.value)} 
                placeholder="Inserisci il motivo..."
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveDraft();
                }}
              />`
);

fs.writeFileSync('client/src/pages/db-monitor.tsx', file, 'utf8');
