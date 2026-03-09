import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Member } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, IdCard, CheckSquare, Square, Download, Smartphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function CardGenerator() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [previewMember, setPreviewMember] = useState<Member | null>(null);
    const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
    const bulkContainerRef = useRef<HTMLDivElement>(null);

    const { data: membersData, isLoading } = useQuery<{ members: Member[]; total: number }>({
        queryKey: ["/api/members", { page: 1, pageSize: 1000, search: debouncedSearch }],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: "1",
                pageSize: "1000",
                search: debouncedSearch,
            });
            const res = await fetch(`/api/members?${params}`);
            if (!res.ok) throw new Error("Failed to fetch members");
            return res.json();
        }
    });

    const members = membersData?.members || [];
    const selectedMembers = members.filter(m => selectedMemberIds.has(m.id));

    const toggleSelectAll = () => {
        if (selectedMemberIds.size === members.length && members.length > 0) {
            setSelectedMemberIds(new Set());
        } else {
            setSelectedMemberIds(new Set(members.map(m => m.id)));
        }
    };

    const toggleSelectMember = (id: number) => {
        const next = new Set(selectedMemberIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedMemberIds(next);
    };

    const handleBulkDownload = async () => {
        if (selectedMembers.length === 0) return;

        setIsGeneratingBulk(true);
        toast({ title: "Generazione Massiva", description: `Preparazione di ${selectedMembers.length} tessere...` });

        try {
            // Give time for the hidden elements to render
            await new Promise(resolve => setTimeout(resolve, 2000));

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [54, 85.6]
            });

            const cardElements = bulkContainerRef.current?.querySelectorAll('.bulk-card-item');
            if (!cardElements || cardElements.length === 0) {
                throw new Error("Elementi card non trovati nel DOM per la cattura");
            }

            for (let i = 0; i < cardElements.length; i++) {
                const element = cardElements[i] as HTMLElement;

                // Wait for any images inside this specific element to load
                const images = Array.from(element.querySelectorAll('img'));
                await Promise.all(images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve; // Continue even if an image fails
                    });
                }));

                const canvas = await html2canvas(element, {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff",
                    windowWidth: 240,
                    windowHeight: 400
                });

                const imgData = canvas.toDataURL("image/png", 1.0);

                if (i > 0) pdf.addPage([54, 85.6], "portrait");
                pdf.addImage(imgData, "PNG", 0, 0, 54, 85.6);

                if (i % 5 === 0 && i > 0) {
                    toast({ title: "Generazione Massiva", description: `Elaborazione: ${i}/${selectedMembers.length}...` });
                }
            }

            pdf.save(`Tessere_Soci_Bulk_${new Date().getTime()}.pdf`);
            toast({ title: "Completato!", description: "Il PDF multi-pagina è stato scaricato." });
        } catch (error) {
            console.error("Bulk PDF error:", error);
            toast({ title: "Errore", description: "Si è verificato un errore durante la generazione massiva. Riprova.", variant: "destructive" });
        } finally {
            setIsGeneratingBulk(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold italic tracking-tighter">Generazione Tessere</h1>
                    <p className="text-muted-foreground">Gestione ed esportazione massiva delle tessere soci (PDF Multi-pagina)</p>
                </div>
                <IdCard className="w-10 h-10 text-[#e11d48] opacity-20" />
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Cerca iscritti per cognome, nome o CF..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 border-2 focus-visible:ring-[#e11d48]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={toggleSelectAll}
                                size="sm"
                                className="h-10 px-4 border-2"
                            >
                                {selectedMemberIds.size === members.length && members.length > 0 ? (
                                    <> <Square className="w-4 h-4 mr-2" /> Deseleziona Tutti </>
                                ) : (
                                    <> <CheckSquare className="w-4 h-4 mr-2" /> Seleziona Tutti </>
                                )}
                            </Button>
                            <Button
                                disabled={selectedMemberIds.size === 0 || isGeneratingBulk}
                                size="sm"
                                onClick={handleBulkDownload}
                                className="h-10 px-6 bg-[#e11d48] hover:bg-[#be123c] shadow-md font-bold text-white transition-all transform hover:scale-105"
                            >
                                {isGeneratingBulk ? (
                                    <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando... </>
                                ) : (
                                    <> <Download className="w-4 h-4 mr-2" /> Genera PDF ({selectedMemberIds.size}) </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden bg-white shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-12 text-center">Sel.</TableHead>
                                    <TableHead>Cognome e Nome</TableHead>
                                    <TableHead>N. Tessera</TableHead>
                                    <TableHead>Codice Fiscale</TableHead>
                                    <TableHead className="text-right">Azione</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                ) : members.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nessun iscritto trovato per la ricerca "{searchQuery}"</TableCell></TableRow>
                                ) : (
                                    members.map((member) => (
                                        <TableRow key={member.id} className="hover:bg-muted/5 transition-colors">
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={selectedMemberIds.has(member.id)}
                                                    onCheckedChange={() => toggleSelectMember(member.id)}
                                                    className="border-2 data-[state=checked]:bg-[#e11d48]"
                                                />
                                            </TableCell>
                                            <TableCell className="font-bold">{member.lastName} {member.firstName}</TableCell>
                                            <TableCell className="font-mono text-[#e11d48] text-sm">{member.cardNumber || "--"}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{member.fiscalCode}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setPreviewMember(member);
                                                        setIsPreviewDialogOpen(true);
                                                    }}
                                                    className="font-bold text-xs hover:bg-[#e11d48]/10 hover:text-[#e11d48]"
                                                >
                                                    <Smartphone className="w-4 h-4 mr-2" />
                                                    ANTEPRIMA
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Container per Generazione Massiva - Tecnincamente visibile ma fuori schermo */}
            <div
                ref={bulkContainerRef}
                className="fixed"
                style={{
                    left: '-2000px',
                    top: '0',
                    width: '300px',
                    opacity: '1',
                    pointerEvents: 'none',
                    zIndex: -100
                }}
            >
                {isGeneratingBulk && selectedMembers.map(member => (
                    <div key={member.id} className="bulk-card-item mb-10 bg-white">
                        <MembershipCardInternal member={member} />
                    </div>
                ))}
            </div>

            <MembershipCardDialog
                member={previewMember}
                isOpen={isPreviewDialogOpen}
                onOpenChange={setIsPreviewDialogOpen}
            />
        </div>
    );
}

const logoStarGem = "/logo_stargem.png";
import QRCode from "qrcode";

function MembershipCardInternal({ member }: { member: Member }) {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

    useEffect(() => {
        if (member.cardNumber || member.fiscalCode) {
            const data = member.cardNumber || member.fiscalCode || "";
            QRCode.toDataURL(data, { width: 400, margin: 0 }, (err, url) => {
                if (!err) setQrCodeUrl(url);
            });
        }
    }, [member]);

    const formatDate = (date: any) => {
        if (!date) return "--/--/----";
        return new Date(date).toLocaleDateString('it-IT');
    };

    return (
        <div className="relative w-[220px] h-[360px] bg-white overflow-hidden font-sans border border-gray-100 flex flex-col items-center">
            <div className="absolute top-0 left-0 right-0 h-3 bg-[#e11d48]"></div>
            <div className="flex flex-col items-center pt-6 pb-8 px-4 w-full h-full">
                <div className="mb-2 h-7 flex justify-center items-center w-full">
                    <img src={logoStarGem} alt="Logo" className="h-full object-contain" />
                </div>
                <div className="w-20 h-20 bg-gray-50 border border-gray-100 overflow-hidden mb-2 shadow-inner">
                    {member.photoUrl && <img src={member.photoUrl} alt="Foto" className="w-full h-full object-cover" />}
                </div>
                <div className="mb-2">
                    {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-20 h-20" />}
                </div>
                <div className="w-full text-center space-y-1.5">
                    <div className="space-y-0.5">
                        <div className="text-[7px] uppercase text-gray-400 font-bold">Numero Tessera</div>
                        <div className="text-sm font-black text-[#e11d48]">{member.cardNumber || "--- ---"}</div>
                        <div className="flex justify-center gap-4 mt-1">
                            <div className="flex flex-col">
                                <span className="text-[6px] uppercase text-gray-400 font-bold">Rilascio</span>
                                <span className="text-[8px] font-bold">{formatDate(member.cardIssueDate)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[6px] uppercase text-gray-400 font-bold">Scadenza</span>
                                <span className="text-[8px] font-bold text-[#e11d48]">{formatDate(member.cardExpiryDate)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-[0.5px] bg-gray-100 opacity-50"></div>
                    <div className="space-y-1 pb-4">
                        <div>
                            <div className="text-[7px] uppercase text-gray-400 font-bold">Cliente / Associato</div>
                            <div className="text-[10px] font-black uppercase leading-tight">{member.lastName} {member.firstName}</div>
                        </div>
                        <div>
                            <div className="text-[7px] uppercase text-gray-400 font-bold">Codice Fiscale</div>
                            <div className="text-[9px] font-mono font-bold uppercase text-gray-600">{member.fiscalCode || "--- --- ---"}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MembershipCard } from "@/components/membership-card";

function MembershipCardDialog({
    isOpen,
    onOpenChange,
    member
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
}) {
    if (!member) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white border-2">
                <DialogHeader className="border-b pb-4 mb-4">
                    <DialogTitle className="text-2xl font-black italic tracking-tighter">Anteprima Card</DialogTitle>
                    <DialogDescription>
                        Visualizzazione card di {member.lastName} {member.firstName}
                    </DialogDescription>
                </DialogHeader>

                <MembershipCard member={member} />

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full font-bold">
                        CHIUDI
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
