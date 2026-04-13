import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, Mail, Calendar as CalendarIcon, Info, MailWarning, Phone, Banknote, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function GemStaffMe() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const userRole = user?.role?.toLowerCase() || "";
  const isAllowed = userRole === "insegnante" || userRole === "admin" || userRole === "direzione" || userRole === "master";

  // Auth Guard
  if (!isAllowed) {
    return <Redirect to="/gemstaff" />;
  }

  // 1. Dati Personali
  const { data: meDataRaw, isLoading: isMeLoading, isError: isMeError } = useQuery({
    queryKey: ["/api/gemstaff/me"],
    retry: false
  });
  const meData = meDataRaw as any;


  const memberId = meData?.memberId || 0;

  // 2. Presenze
  const { data: presenzeData, isLoading: isPresenzeLoading } = useQuery({
    queryKey: [`/api/gemstaff/presenze/${memberId}/${selectedMonth}/${selectedYear}`],
    enabled: !!memberId,
  });

  // 3. Documenti (Compliance)
  const { data: complianceDataRaw, isLoading: isComplianceLoading } = useQuery({
    queryKey: [`/api/gemstaff/compliance/${memberId}`],
    enabled: !!memberId,
  });
  const complianceData = complianceDataRaw as any;


  // 4. Cedolino
  const { data: payslipData, isLoading: isPayslipLoading } = useQuery({
    queryKey: [`/api/gemstaff/payslips/${memberId}/${selectedMonth}/${selectedYear}`],
    enabled: !!memberId,
  });

  if (isMeLoading) {
    return <div className="p-8 space-y-4 max-w-5xl mx-auto"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (isMeError || !meData) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <MailWarning className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 text-lg">Profilo non trovato</AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            Non siamo riusciti a localizzare il tuo profilo insegnante. Contatta la segreteria per risolvere il problema.
            <div className="mt-4">
              <Button onClick={() => window.location.href = "mailto:segreteria@studiogem.it"} variant="outline" className="bg-white">
                Contatta la segreteria
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const presenzeArray = Array.isArray(presenzeData) ? presenzeData : [];
  const totOreMes = presenzeArray.reduce((acc: number, pres: any) => acc + (Number(pres.ore) || 0), 0);

  const payslip = payslipData && !Array.isArray(payslipData) ? payslipData : (Array.isArray(payslipData) ? payslipData[0] : null);

  const complianceItems = [
    { key: "curriculum", label: "Curriculum Vitae" },
    { key: "document_id", label: "Documento Identità" },
    { key: "tax_code", label: "Codice Fiscale / Tessera Sanitaria" },
    { key: "medical_cert", label: "Certificato Medico in corso di validità" },
    { key: "contract", label: "Contratto di Collaborazione Sportiva o P.IVA" },
    { key: "antimafia", label: "Estratto conto penalità (antimafia)" }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 w-full max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Ciao {meData.firstName} 👋
            <Badge variant="outline" className="bg-primary/10 text-primary uppercase">{userRole}</Badge>
          </h1>
          <p className="text-muted-foreground mt-2">Il tuo spazio personale</p>
        </div>
        <div className="flex gap-2 bg-secondary p-1 rounded-md">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] bg-background border-none">
              <SelectValue placeholder="Mese" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 12}).map((_, i) => (
                <SelectItem key={i+1} value={(i+1).toString()}>{format(new Date(2025, i, 1), "MMMM", { locale: it })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] bg-background border-none">
              <SelectValue placeholder="Anno" />
            </SelectTrigger>
            <SelectContent>
              {["2024", "2025", "2026"].map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CARD 1: DATI PERSONALI */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-blue-500" /> Dati Personali
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Nome</div>
                <div className="font-medium">{meData.firstName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cognome</div>
                <div className="font-medium">{meData.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium flex items-center gap-2">
                  <Mail className="w-3 h-3 text-slate-400" /> {meData.email || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Telefono</div>
                <div className="font-medium flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-400" /> {meData.phone || "-"}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-muted-foreground">Specializzazione</div>
                <div className="font-medium">{meData.specialization || "Non specificata"}</div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <a href="mailto:segreteria@studiogem.it">
                  <Mail className="w-4 h-4 mr-2" /> Contatta la segreteria
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: IL MIO CEDOLINO */}
        <Card className="shadow-sm border-slate-200 overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="w-5 h-5 text-green-600" /> Il Mio Cedolino
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-center">
            {isPayslipLoading ? (
               <Skeleton className="h-32 w-full" />
            ) : !payslip ? (
              <div className="text-center text-slate-500 py-8">
                <Banknote className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                Nessun cedolino registrato per {format(new Date(2025, parseInt(selectedMonth)-1, 1), "MMMM", {locale: it})} {selectedYear}.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-slate-700">Competenze Mensili</div>
                  <Badge variant={payslip.status === "PAGATO" ? "default" : (payslip.status === "CONFERMATO" ? "secondary" : "outline")}>
                    {payslip.status || "BOZZA"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center divide-x">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Ore Totali</div>
                    <div className="text-2xl font-semibold">{payslip.totalHours || totOreMes || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Tariffa Media</div>
                    <div className="text-2xl font-semibold">€{payslip.hourlyRate || "0.00"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Totale Netto</div>
                    <div className="text-2xl font-semibold text-green-600">€{payslip.totalAmount || "0.00"}</div>
                  </div>
                </div>

                {(!payslip.status || payslip.status === 'BOZZA') && (
                  <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      Il cedolino è in elaborazione. Verrà confermato dalla segreteria nei prossimi giorni.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* RIGA 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CARD 2: LE MIE PRESENZE */}
        <Card className="shadow-sm border-slate-200 flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b flex-none">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="w-5 h-5 text-indigo-500" /> Le Mie Presenze
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            {isPresenzeLoading ? (
              <div className="p-6"><Skeleton className="h-32 w-full" /></div>
            ) : presenzeArray.length === 0 ? (
              <div className="text-center text-slate-500 py-12 px-4">
                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                Nessuna presenza registrata in questo mese.
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead>Data</TableHead>
                      <TableHead>Corso</TableHead>
                      <TableHead className="text-center">Ore</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presenzeArray.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(p.date), "dd MMM yy", { locale: it })}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{p.courseName || p.notes || "-"}</TableCell>
                        <TableCell className="text-center">{p.hours || p.ore || 0}</TableCell>
                        <TableCell>
                           <Badge variant={p.status === 'CONFERMATO' ? 'default' : 'outline'} className={p.status === 'CONFERMATO' ? 'bg-green-600' : ''}>
                             {p.status || 'IN ATTESA'}
                           </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="p-4 bg-slate-50 border-t flex justify-end">
                   <div className="font-semibold text-slate-700 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-slate-400" /> Totale Mese: <span className="text-lg">{totOreMes} ore</span>
                   </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CARD 3: I MIEI DOCUMENTI */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="w-5 h-5 text-purple-500" /> Documenti e Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isComplianceLoading ? (
               <Skeleton className="h-48 w-full" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complianceItems.map((item) => {
                  const val = complianceData?.[item.key];
                  const hasDoc = !!val;
                  return (
                    <div key={item.key} className={`border rounded-lg p-4 flex flex-col justify-between h-full bg-card transition-colors ${hasDoc ? 'border-green-200 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                      <div className="flex items-start justify-between">
                         <div className="text-sm font-medium pr-2">{item.label}</div>
                         <div className="mt-0.5">
                           {hasDoc ? <FileCheck className="w-4 h-4 text-green-500 flex-shrink-0" /> : <div className="w-2 h-2 rounded-full bg-red-400 mt-1 flex-shrink-0" />}
                         </div>
                      </div>
                      <div className="mt-3 text-xs font-semibold">
                         {hasDoc ? (
                           <span className="text-green-600">CARICATO</span>
                         ) : (
                           <span className="text-red-500">MANCANTE</span>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
