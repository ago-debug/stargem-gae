import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Database, 
  FileSpreadsheet, 
  AlertTriangle,
  UserCheck,
  CheckCircle2
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface StoriaProvenienzaTabProps {
  memberId: number;
}

export default function StoriaProvenienzaTab({ memberId }: StoriaProvenienzaTabProps) {
  const { data: member, isLoading: isLoadingMember } = useQuery<any>({
    queryKey: [`/api/members/${memberId}`],
  });

  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery<any[]>({
    queryKey: [`/api/members/${memberId}/audit-log`],
  });

  if (isLoadingMember || isLoadingLogs) {
    return <div className="p-8 text-center text-muted-foreground">Caricamento storico...</div>;
  }

  if (!member) {
    return <div className="p-8 text-center text-muted-foreground">Membro non trovato.</div>;
  }

  const legacyData = typeof member.extraData === "string" 
    ? JSON.parse(member.extraData) 
    : (member.extraData || {});
    
  const dataQualityFlags = typeof member.dataQualityFlag === "string"
    ? JSON.parse(member.dataQualityFlag)
    : (member.dataQualityFlag || {});

  const hasAthena = member.athenaId || Object.keys(legacyData).some(k => k.startsWith("athena_"));
  const hasMaster = member.legacyMasterId || Object.keys(legacyData).some(k => k.startsWith("master_"));
  const isImported = member.importedBy || member.importedLotto;

  return (
    <div className="space-y-6">
      
      {/* FLAGS DI QUALITÀ DATI */}
      {Object.keys(dataQualityFlags).length > 0 && (
        <Card className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-orange-700">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Segnalazioni Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dataQualityFlags.missingFiscalCode && (
                 <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-100">
                   👶 Minore senza CF / CF Mancante
                 </Badge>
              )}
              {dataQualityFlags.placeholderFiscalCode && (
                 <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-100">
                   🌍 CF Estero / Placeholder
                 </Badge>
              )}
              {dataQualityFlags.invalidFiscalCode && (
                 <Badge variant="outline" className="border-red-300 text-red-700 bg-red-100">
                   ⚠️ CF Malformato
                 </Badge>
              )}
              {dataQualityFlags.hasConflict && (
                 <Badge variant="outline" className="border-red-300 text-red-700 bg-red-100">
                   ⚔️ Conflitto Anagrafico Rilevato
                 </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SEZIONE PROVENIENZA IMPORT */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Database className="mr-2 h-5 w-5 text-muted-foreground" />
              Sorgente Dati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isImported ? (
              <>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Importato da Lotto:</span>
                  <span className="font-medium">{member.importedLotto || "Lotto Sconosciuto"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Data Importazione:</span>
                  <span className="font-medium">
                    {member.importedAt ? format(new Date(member.importedAt), "dd/MM/yyyy HH:mm") : "N/D"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Operatore:</span>
                  <span className="font-medium">{member.importedBy || "Sistema"}</span>
                </div>
                {member.importedSourceRowIndex && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Riga CSV Originale:</span>
                    <span className="font-mono text-xs bg-muted px-1 rounded">#{member.importedSourceRowIndex}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <UserCheck className="h-8 w-8 text-green-500 mb-2" />
                <p className="font-medium">Inserimento Diretto</p>
                <p className="text-xs text-muted-foreground">Creazione nativa tramite gestionale StarGem</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEZIONE LEGACY ATHENA E MASTER */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileSpreadsheet className="mr-2 h-5 w-5 text-muted-foreground" />
              Dati Storici Legacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasAthena && !hasMaster && (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Nessun dato storico legacy associato.
              </p>
            )}

            {hasAthena && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm border-b pb-1 text-blue-600">🏛️ Sistema Athena</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {member.athenaId && (
                    <>
                      <div className="text-muted-foreground">Athena ID:</div>
                      <div className="font-mono font-medium">{member.athenaId}</div>
                    </>
                  )}
                  {Object.entries(legacyData)
                    .filter(([k]) => k.startsWith("athena_"))
                    .map(([k, v]) => (
                      <React.Fragment key={k}>
                        <div className="text-muted-foreground capitalize">{k.replace("athena_", "").replace(/_/g, " ")}:</div>
                        <div className="font-medium truncate" title={String(v)}>{String(v)}</div>
                      </React.Fragment>
                    ))}
                </div>
              </div>
            )}

            {hasMaster && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm border-b pb-1 text-purple-600">📊 Foglio Master</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {member.legacyMasterId && (
                    <>
                      <div className="text-muted-foreground">Master ID:</div>
                      <div className="font-mono font-medium">{member.legacyMasterId}</div>
                    </>
                  )}
                  {Object.entries(legacyData)
                    .filter(([k]) => k.startsWith("master_"))
                    .map(([k, v]) => (
                      <React.Fragment key={k}>
                        <div className="text-muted-foreground capitalize">{k.replace("master_", "").replace(/_/g, " ")}:</div>
                        <div className="font-medium truncate" title={String(v)}>{String(v)}</div>
                      </React.Fragment>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEZIONE AUDIT TRAIL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <History className="mr-2 h-5 w-5 text-muted-foreground" />
            Audit Trail (Cronologia Modifiche)
          </CardTitle>
          <CardDescription>Tracciamento delle operazioni effettuate su questo profilo.</CardDescription>
        </CardHeader>
        <CardContent>
          {!auditLogs || auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-6 border rounded-lg bg-muted/20">
              Nessun log di audit trovato per questo utente.
            </p>
          ) : (
            <Accordion type="single" collapsible defaultValue="recent">
              <AccordionItem value="recent" className="border-0">
                <AccordionTrigger className="py-2 hover:no-underline rounded bg-muted/30 px-4 mb-2">
                  <div className="flex items-center text-sm font-semibold">
                    Ultime {Math.min(auditLogs.length, 10)} Operazioni
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                      {auditLogs.map((log: any, idx: number) => (
                        <div key={idx} className="relative pl-6 pb-4 last:pb-0 border-l-2 border-muted ml-2">
                          <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary/60" />
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm">
                              {log.action === "INSERT" ? "Inserimento" : log.action === "UPDATE" ? "Modifica" : "Eliminazione"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.performedAt), "dd MMM yyyy, HH:mm", { locale: it })}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Effettuato da: <span className="font-medium text-foreground">{log.performedBy || "Sistema"}</span>
                          </div>
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div className="mt-2 bg-muted/30 rounded p-2 text-xs font-mono">
                              {Object.entries(log.changes).map(([field, values]: [string, any]) => (
                                <div key={field} className="grid grid-cols-[100px_1fr] gap-2 mb-1 last:mb-0">
                                  <span className="text-muted-foreground">{field}:</span>
                                  <span className="truncate">
                                    <span className="line-through text-red-500/70 mr-1">{String(values.old ?? "null")}</span>
                                    → <span className="text-green-600 dark:text-green-400">{String(values.new ?? "null")}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
