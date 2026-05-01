import { useRef } from "react";
import { type Member } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import logoStudioGem from "@assets/logo-Studio-Gem1_page-0001_1761599206626.jpg";

interface MembershipCardProps {
    member: Member;
}

export function MembershipCard({ member }: MembershipCardProps) {
    const { toast } = useToast();
    const cardRef = useRef<HTMLDivElement>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

    useEffect(() => {
        if (member.cardNumber || member.fiscalCode) {
            const data = member.cardNumber || member.fiscalCode || "";
            QRCode.toDataURL(data, {
                width: 400,
                margin: 0,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, (err, url) => {
                if (!err) setQrCodeUrl(url);
            });
        }
    }, [member]);

    const formatDate = (dateInput: any) => {
        if (!dateInput) return "--/--/----";
        try {
            const date = new Date(dateInput);
            return date.toLocaleDateString('it-IT');
        } catch (e) {
            return String(dateInput);
        }
    };

    const downloadPDF = async () => {
        if (!cardRef.current) return;

        try {
            toast({ title: "Generazione PDF...", description: "Cattura immagine in corso." });

            const canvas = await html2canvas(cardRef.current, {
                scale: 4,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                // Essential parameters to capture everything
                windowWidth: 240,
                windowHeight: 400,
                onclone: (document) => {
                    // Optional: force some styles on clone if needed
                }
            });

            const imgData = canvas.toDataURL("image/png", 1.0);
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [54, 85.6]
            });

            pdf.addImage(imgData, "PNG", 0, 0, 54, 85.6);
            pdf.save(`Tessera_${member.lastName}_${member.firstName}.pdf`);

            toast({ title: "PDF Scaricato" });
        } catch (error) {
            console.error("PDF gen error:", error);
            toast({ title: "Errore generazione PDF", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-center p-4 bg-muted/20 rounded-lg overflow-hidden">
                <div
                    ref={cardRef}
                    className="relative w-[220px] h-[360px] bg-white overflow-hidden font-sans border border-gray-100 flex flex-col items-center"
                    style={{ boxSizing: 'border-box' }}
                >
                    {/* Top Red Tab */}
                    <div className="absolute top-0 left-0 right-0 h-3 bg-[#e11d48]"></div>

                    {/* Content Wrapper with increased bottom padding */}
                    <div className="flex flex-col items-center pt-6 pb-8 px-4 w-full h-full">
                        {/* Logo - Reduced Size */}
                        <div className="mb-2 h-7 flex justify-center items-center w-full">
                            <img
                                src={logoStudioGem}
                                alt="Logo"
                                className="h-full object-contain"
                            />
                        </div>

                        {/* Photo - Slightly smaller to save vertical space */}
                        <div className="w-20 h-20 bg-gray-50 border border-gray-100 overflow-hidden mb-2 shadow-inner flex-shrink-0">
                            {member.photoUrl ? (
                                <img src={member.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* QR Code - More compact */}
                        <div className="mb-2 flex-shrink-0">
                            {qrCodeUrl && (
                                <div className="p-1 bg-white border border-gray-50">
                                    <img src={qrCodeUrl} alt="QR" className="w-20 h-20" />
                                </div>
                            )}
                        </div>

                        {/* Info Sections - Stacked tightly */}
                        <div className="w-full flex flex-col space-y-1.5 text-center">
                            {/* Card Details */}
                            <div className="space-y-0.5">
                                <div className="text-[7px] uppercase text-gray-400 font-bold leading-none tracking-tighter italic">Numero Tessera</div>
                                <div className="text-sm font-black text-[#e11d48] leading-none">{member.cardNumber || "--- ---"}</div>

                                <div className="flex justify-center gap-4 mt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[6px] uppercase text-gray-400 font-bold leading-none">Rilascio</span>
                                        <span className="text-[8px] font-bold text-gray-800">{formatDate(member.cardIssueDate)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[6px] uppercase text-gray-400 font-bold leading-none">Scadenza</span>
                                        <span className="text-[8px] font-bold text-[#e11d48]">{formatDate(member.cardExpiryDate)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-[0.5px] bg-gray-100 opacity-50"></div>

                            {/* Identity - Names and CF */}
                            <div className="space-y-1 pb-4">
                                <div>
                                    <div className="text-[7px] uppercase text-gray-400 font-bold leading-none tracking-tighter">Iscritto</div>
                                    <div className="text-xs font-black uppercase text-gray-900 leading-tight">
                                        {member.lastName} {member.firstName}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[7px] uppercase text-gray-400 font-bold leading-none tracking-tighter">Codice Fiscale</div>
                                    <div className="text-[9px] font-mono font-bold uppercase text-gray-600 leading-none">
                                        {member.fiscalCode || "----------------"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4">
                <Button onClick={downloadPDF} className="w-full font-bold bg-[#e11d48] hover:bg-[#be123c] text-white">
                    <Download className="w-4 h-4 mr-2" /> SCARICA TESSERA PDF
                </Button>
            </div>
        </div>
    );
}
