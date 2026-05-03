import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Download, Banknote, CalendarDays, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCrmForm } from "@/components/crm/CrmFormContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Building, User } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function TabRicevute() {
  const { selectedMemberId, formData } = useCrmForm();

  const { data: memberPayments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/payments", "member", selectedMemberId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", pageSize: "100", memberId: String(selectedMemberId) });
      const res = await fetch(`/api/payments?${params}`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento pagamenti");
      }
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!selectedMemberId,
  });

  const [isGeneratingId, setIsGeneratingId] = useState<number | null>(null);

  const handleGeneratePDF = async (payment: any, docType: 'R' | 'S' | 'F') => {
    setIsGeneratingId(payment.id);
    try {
      const doc = new jsPDF();
      
      const isTessera = payment.type === 'membership';
      const prefix = `2526-${docType}`; 
      const receiptNumber = payment.id.toString().padStart(6, '0');
      const fullReceiptNo = `${prefix}${receiptNumber}`;
      
      const docTitle = docType === 'F' ? 'FATTURA N.' : 'RICEVUTA N.';

      // --- LOGO ---
      const img = new Image();
      img.src = "/logo-studio-gem.jpg";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      
      if (img.width) {
        doc.addImage(img, "JPEG", 14, 10, 40, 20);
      }

      // --- INTESTAZIONE STUDIO GEM ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Studio Gem - GEOS ssdrl", 14, 38);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Corso Di Porta Vigentina 35 (sede legale ed operativa)", 14, 43);
      doc.text("20122 Milano", 14, 48);
      doc.text("P.I. e C.F.: 09305930969", 14, 53);
      doc.text("Cod. SDI: KRRH6B9 | REA: 2082224", 14, 58);

      // --- DATI RICEVUTA ---
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${docTitle} ${fullReceiptNo}`, 120, 38);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data Emissione: ${new Date().toLocaleDateString('it-IT')}`, 120, 44);
      doc.text(`Data Pagamento: ${new Date(payment.paidDate || new Date()).toLocaleDateString('it-IT')}`, 120, 49);

      // --- DATI CLIENTE ---
      doc.setDrawColor(200);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 65, 182, 30, 3, 3, "FD");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Intestato a:", 18, 72);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const clientName = `${formData.nome || ""} ${formData.cognome || ""}`.trim() || "Cliente Non Specificato";
      const clientCF = formData.codiceFiscale || formData.cfGen1 || "C.F. Non Specificato";
      const clientAddress = `${formData.indirizzo || ""}, ${formData.citta || ""} (${formData.provincia || ""})`.trim();
      
      doc.text(clientName, 18, 78);
      doc.text(`Codice Fiscale: ${clientCF}`, 18, 84);
      if (clientAddress.length > 5) doc.text(clientAddress, 18, 90);

      // --- TABELLA DETTAGLI ---
      const hasReference = isTessera ? payment.membershipNumber : payment.courseName;
      const refText = hasReference ? (isTessera ? `Tessera N. ${hasReference}` : `Corso: ${hasReference}`) : "";
      
      autoTable(doc, {
        startY: 105,
        head: [['Descrizione', 'Riferimento', 'Metodo Pag.', 'Importo']],
        body: [
          [
            payment.description || "Pagamento Servizi / Quota Istituzionale", 
            refText || "-",
            payment.paymentMethod === 'cash' ? 'Contanti' : payment.paymentMethod === 'pos' ? 'POS' : payment.paymentMethod === 'bank_transfer' ? 'Bonifico' : (payment.paymentMethod || 'Non specificato'),
            `Euro ${parseFloat(payment.amount).toFixed(2)}`
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
      });

      // --- TOTALE ---
      const finalY = (doc as any).lastAutoTable.finalY || 130;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TOTALE PAGATO:", 130, finalY + 15);
      doc.text(`Euro ${parseFloat(payment.amount).toFixed(2)}`, 182, finalY + 15, { align: "right" });

      // --- FOOTER / FIRMA ---
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("Il presente documento ha valore di quietanza di pagamento.", 14, finalY + 40);
      
      doc.setFont("helvetica", "normal");
      doc.text("_________________________", 140, finalY + 45);
      doc.text("Firma o Timbro (Studio Gem)", 140, finalY + 50);

      // Salva il file
      doc.save(`Ricevuta_${fullReceiptNo}_${clientName.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setIsGeneratingId(null);
    }
  };

  return (
    <Card id="ricevute" className="scroll-mt-32">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="w-5 h-5 text-green-600" />
          Ricevute e Contabilità
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!selectedMemberId ? (
          <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
            Salva o seleziona un partecipante per visualizzare le ricevute
          </div>
        ) : isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !memberPayments || memberPayments.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
            Nessun pagamento registrato per questo utente.
          </div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead>Causale (Riferimento)</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberPayments.map((payment) => {
                  const isTessera = payment.type === 'membership';
                  const hasReference = isTessera ? payment.membershipNumber : payment.courseName;
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('it-IT') : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{payment.description || "-"}</span>
                          <span className="text-xs text-muted-foreground">
                            {hasReference ? (
                              isTessera ? `Tessera N. ${hasReference}` : `Corso: ${hasReference}`
                            ) : "Nessun Riferimento Flat"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isTessera ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-widest text-[10px]">Quota Tessera</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[10px]">Corso / Servizio</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">
                        €{parseFloat(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'paid' || payment.status === 'completed' || payment.status === 'COMPLETED' ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">Pagato</Badge>
                        ) : (
                          <Badge variant="destructive">Da Pagare</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-2" 
                              disabled={(payment.status !== 'paid' && payment.status !== 'completed' && payment.status !== 'COMPLETED') || isGeneratingId === payment.id}
                            >
                              {isGeneratingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                              PDF
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handleGeneratePDF(payment, 'R')} className="cursor-pointer">
                              <Building className="w-4 h-4 mr-2 text-blue-600" /> 
                              <span>Ricevuta Istituzionale (2526-R)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGeneratePDF(payment, 'S')} className="cursor-pointer">
                              <User className="w-4 h-4 mr-2 text-emerald-600" /> 
                              <span>Ricevuta Semplice (2526-S)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGeneratePDF(payment, 'F')} className="cursor-pointer">
                              <FileText className="w-4 h-4 mr-2 text-amber-600" /> 
                              <span>Fattura (2526-F)</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
