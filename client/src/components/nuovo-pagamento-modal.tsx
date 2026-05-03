import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown, X, Plus, Trash2, Calculator, ShoppingCart, User as UserIcon, CreditCard, Banknote, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { MultiSelectEnrollmentDetails } from "@/components/multi-select-enrollment-details";
import { PaymentModuleConnector } from "@/components/PaymentModuleConnector";
import { PaymentInvoiceDetails } from "@/components/payments/PaymentInvoiceDetails";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { getActiveActivities } from "@/config/activities";
import type { Member, PriceList, Course, Quote, PriceListItem } from "@shared/schema";
import { PriceTag } from "@/components/price-tag";
import { CartTableRow } from "@/components/payments/CartTableRow";

export function NuovoPagamentoModal({
    isOpen,
    onClose,
    defaultMemberId,
    defaultIncludeTessera = false,
    editingPayment
}: {
    isOpen: boolean;
    onClose: () => void;
    defaultMemberId?: number | null;
    defaultIncludeTessera?: boolean;
    editingPayment?: any;
}) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const searchString = useSearch();

    // === STATO CLIENTE ===
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [memberSearchOpen, setMemberSearchOpen] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    // Bootstrap selected member if passed
    useEffect(() => {
        if (isOpen) {
            if (defaultMemberId) {
                console.log("NuovoPagamentoModal opened with defaultMemberId:", defaultMemberId);
                setSelectedMemberId(defaultMemberId.toString());
            } else if (!selectedMemberId) {
                setSelectedMemberId("");
                setSelectedMember(null);
            }
        }
    }, [isOpen, defaultMemberId]);

    // Fetch the default member details if we have an ID but not the object
    useEffect(() => {
        if (selectedMemberId && (!selectedMember || selectedMember.id.toString() !== selectedMemberId)) {
            fetch(`/api/members/${selectedMemberId}`).then(r => r.json()).then(data => {
                if (data && data.id) {
                    console.log("Fetched member data for NuovoPagamentoModal:", data);
                    setSelectedMember(data);
                }
            }).catch(e => console.error(e));
        }
    }, [selectedMemberId, selectedMember]);

    // === STATO CARRELLO (GRIGLIA) ===
    const [cartRows, setCartRows] = useState<any[]>([{ id: Date.now().toString(), activityType: "", skus: [], periodId: "", basePrice: 0, participationType: "STANDARD_COURSE", targetDate: "", discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
    const [includeTessera, setIncludeTessera] = useState(defaultIncludeTessera);

    // Sync includeTessera with default when modal opens
    useEffect(() => {
        if (isOpen) {
            setIncludeTessera(defaultIncludeTessera);
        }
    }, [isOpen, defaultIncludeTessera]);
    const [includeProva, setIncludeProva] = useState(false);

    // === STATO MODALE CHECKOUT INFERIORE ===
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("contanti");
    const [paymentNotes, setPaymentNotes] = useState("");

    // === DATI DAL SERVER ===
    const { data: searchedMembersData } = useQuery<{ members: Member[], total: number }>({
        queryKey: [`/api/members?search=${encodeURIComponent(memberSearchQuery)}`],
        enabled: memberSearchQuery.length >= 3,
    });
    const searchedMembers = searchedMembersData?.members || [];

    const { data: priceLists } = useQuery<PriceList[]>({ queryKey: ["/api/price-lists"] });
    const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
    const { data: quotes } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });
    const { data: courseQuotesGrid } = useQuery<any[]>({ queryKey: ["/api/course-quotes-grid", "active"], queryFn: async () => { const res = await fetch(`/api/course-quotes-grid?seasonId=active`); return res.ok ? res.json() : []; } });

    // API per Dettaglio Quote & Servizi e Dropdowns
    const { data: payments } = useQuery<any[]>({ queryKey: ["/api/payments", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/payments?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: enrollments } = useQuery<any[]>({ queryKey: ["/api/enrollments?type=corsi", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/enrollments?type=corsi&memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: workshopEnrollments } = useQuery<any[]>({ queryKey: ["/api/workshop-enrollments", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/workshop-enrollments?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: workshops } = useQuery<any[]>({ queryKey: ["/api/workshops"] });
    const { data: paidTrials } = useQuery<any[]>({ queryKey: ["/api/paid-trials"] });
    const { data: freeTrials } = useQuery<any[]>({ queryKey: ["/api/free-trials"] });
    const { data: singleLessons } = useQuery<any[]>({ queryKey: ["/api/single-lessons"] });
    const { data: sundayActivities } = useQuery<any[]>({ queryKey: ["/api/sunday-activities"] });
    const { data: trainings } = useQuery<any[]>({ queryKey: ["/api/trainings"] });
    const { data: individualLessons } = useQuery<any[]>({ queryKey: ["/api/individual-lessons"] });
    const { data: campusActivities } = useQuery<any[]>({ queryKey: ["/api/campus-activities"] });
    const { data: recitals } = useQuery<any[]>({ queryKey: ["/api/recitals"] });
    const { data: vacationStudies } = useQuery<any[]>({ queryKey: ["/api/vacation-studies"] });
    const { data: studios } = useQuery<any[]>({ queryKey: ["/api/studios"] });
    const { data: bookingServices } = useQuery<any[]>({ queryKey: ["/api/booking-services"] });
    const { data: studioBookings } = useQuery<any[]>({ queryKey: ["/api/studio-bookings", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/studio-bookings?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: membershipsDataList } = useQuery<any[]>({ queryKey: ["/api/memberships", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/memberships?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });

    const safeArray = (d: any) => Array.isArray(d) ? d : (d?.data || []);
    const memberPayments = safeArray(payments).filter((p: any) => p.memberId === Number(selectedMemberId));
    const memberEnrollments = safeArray(enrollments).filter((e: any) => e.memberId === Number(selectedMemberId));
    const memberWorkshopEnrollments = safeArray(workshopEnrollments).filter((e: any) => e.memberId === Number(selectedMemberId));
    const memberStudioBookings = safeArray(studioBookings).filter((b: any) => b.memberId === Number(selectedMemberId));
    const memberMemberships = safeArray(membershipsDataList).filter((m: any) => m.memberId === Number(selectedMemberId));

    const calculatedDebts = !selectedMemberId ? [] : [
        ...memberEnrollments.map((e: any) => {
            const course = courses?.find(c => c.id === e.courseId);
            const total = parseFloat(course?.price || "0");
            const paid = memberPayments.filter((p: any) => p.enrollmentId === e.id && (p.status === 'paid' || p.status === 'completed')).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
            return { id: `course-${e.id}`, description: course?.name ? `${course.name} (Scuola)` : 'Corso', date: e.createdAt, type: 'course', total, paid, remaining: Math.max(0, total - paid) };
        }),
        ...memberWorkshopEnrollments.map((e: any) => {
            const workshop = workshops?.find(w => w.id === e.workshopId);
            const total = parseFloat(workshop?.price || "0");
            const paid = memberPayments.filter((p: any) => p.workshopEnrollmentId === e.id && (p.status === 'paid' || p.status === 'completed')).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
            return { id: `workshop-${e.id}`, description: `${workshop?.name || 'Workshop'} (Evento)`, date: e.createdAt, type: 'workshop', total, paid, remaining: Math.max(0, total - paid) };
        }),
        ...memberStudioBookings.map((b: any) => {
            const total = parseFloat(b.amount || "0");
            const paid = memberPayments.filter((p: any) => p.bookingId === b.id && (p.status === 'paid' || p.status === 'completed')).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
            return { id: `service_booking-${b.id}`, description: `${b.title || 'Affitto Sala'} (Servizio)`, date: b.createdAt, type: 'service_booking', total, paid, remaining: Math.max(0, total - paid) };
        }),
        ...memberMemberships.map((m: any) => {
            const total = parseFloat(m.fee || "0");
            const paid = memberPayments.filter((p: any) => p.membershipId === m.id && (p.status === 'paid' || p.status === 'completed')).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
            return { id: `membership-${m.id}`, description: `Quota Tessera (${m.membershipNumber || 'N/A'})`, date: m.createdAt, type: 'membership', total, paid, remaining: Math.max(0, total - paid) };
        }).filter((item: any) => !(item.description.includes('-temp') && item.remaining === 0))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const isLoadingDebts = !payments || !enrollments || !courses;

    // Delete Pending Debt (Admin Only)
    const deletePendingDebtMutation = useMutation({
        mutationFn: async ({ type, id }: { type: string; id: number }) => {
            let endpoint = "";
            switch (type) {
                case "course": endpoint = `/api/enrollments/${id}`; break;
                case "workshop": endpoint = `/api/workshop-enrollments/${id}`; break;
                case "service_booking": endpoint = `/api/studio-bookings/${id}`; break;
                case "membership": endpoint = `/api/memberships/${id}`; break;
                default: throw new Error(`Tipo debito sconosciuto: ${type}`);
            }
            await apiRequest("DELETE", endpoint);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
            queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
            toast({ title: "Debito annullato", description: "L'iscrizione/tessera pendente è stata rimossa dal sistema." });
        },
        onError: (error: Error) => {
            toast({ title: "Errore durante l'annullamento", description: error.message, variant: "destructive" });
        }
    });

    const handleDeleteDebt = (e: React.MouseEvent, type: string, idString: string) => {
        e.stopPropagation();
        const id = parseInt(idString.split('-')[1]);
        if (confirm("Sei sicuro di voler eliminare questa voce da pagare? Questa operazione annullerà del tutto l'iscrizione/tessera dal database e NON è reversibile.")) {
            deletePendingDebtMutation.mutate({ type, id });
        }
    };

    // Auto-load specific debt from URL if present
    useEffect(() => {
        if (isOpen && calculatedDebts.length > 0) {
            const urlParams = new URLSearchParams(searchString);
            const payDebt = urlParams.get('payDebt');
            const debtType = urlParams.get('debtType');

            if (payDebt && debtType) {
                const targetDebt = calculatedDebts.find((d: any) => d.id === `${debtType}-${payDebt}`);
                if (targetDebt && targetDebt.remaining > 0.01) {
                    // Check if not already in cart
                    if (!cartRows.some(r => r.isDebt && r.skus && r.skus[0] === targetDebt.id)) {
                        // We use a functional state update to avoid dependency cycles with addCartRow if possible,
                        // but since addCartRow is memoized or we can just call it, let's do it directly.
                        setCartRows(prev => {
                            if (prev.some(r => r.isDebt && r.skus && r.skus[0] === targetDebt.id)) return prev;
                            const newRow = {
                                id: Date.now().toString() + Math.random().toString(),
                                activityType: "saldo_debito",
                                skus: [targetDebt.id],
                                periodId: "N/A",
                                basePrice: targetDebt.remaining,
                                discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: targetDebt.remaining,
                                paymentNotes: [], enrollmentDetails: [],
                                isDebt: true,
                                debtDescription: targetDebt.description
                            };
                            return [...prev, newRow];
                        });

                        // Clean up URL to prevent re-adding on subsequent renders
                        urlParams.delete('payDebt');
                        urlParams.delete('debtType');
                        const newSearch = urlParams.toString();
                        const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
                        // Avoid full reload by using History API to silently clean URL
                        window.history.replaceState(null, '', newUrl);
                    }
                }
            }
        }
    }, [isOpen, calculatedDebts, searchString, cartRows]);

    // === ORCHESTRATORE PAGAMENTO ===
    const checkoutMutation = useMutation({
        mutationFn: async (checkoutData: { paymentMethod: string, paymentNotes: string, isPaid: boolean }) => {
            if (!selectedMemberId) throw new Error("Seleziona prima un cliente.");

            // Processiamo riga per riga per creare pagamenti collegati
            for (const row of cartRows) {
                if (row.isDebt) {
                    // E.g. debt.id = "course-12" or "service_booking-15"
                    const firstDash = row.skus[0].indexOf('-');
                    const type = row.skus[0].substring(0, firstDash);
                    const idStr = row.skus[0].substring(firstDash + 1);
                    const parsedId = parseInt(idStr);

                    const paymentPayload: any = {
                        memberId: parseInt(selectedMemberId),
                        amount: parseFloat(row.subtotal).toString(),
                        paymentMethod: checkoutData.paymentMethod,
                        type: type,
                        status: checkoutData.isPaid ? "paid" : "pending",
                        notes: `Saldo debito pregresso. ${checkoutData.paymentNotes || ''}`,
                        quotaDescription: row.debtDescription,
                        period: "Custom",
                        paidDate: new Date().toISOString()
                    };

                    if (type === "course") paymentPayload.enrollmentId = parsedId;
                    else if (type === "workshop") paymentPayload.workshopEnrollmentId = parsedId;
                    else if (type === "service_booking" || type === "booking") paymentPayload.bookingId = parsedId;
                    else if (type === "membership") paymentPayload.membershipId = parsedId;

                    if (parseFloat(row.subtotal) > 0) {
                        await apiRequest("POST", "/api/payments", paymentPayload);
                    }
                } else if (row.skus.length > 0) {
                    // Nuova Iscrizione
                    const parsedId = parseInt(row.skus[0]);
                    const baseNotes = `Iscr. Automatica Calcolatore (Listino: ${row.periodId})`;
                    const basePayload = { memberId: parseInt(selectedMemberId), status: "attivo", notes: baseNotes };

                    const paymentPayload: any = {
                        memberId: parseInt(selectedMemberId),
                        amount: parseFloat(row.subtotal).toString(),
                        paymentMethod: checkoutData.paymentMethod,
                        status: checkoutData.isPaid ? "paid" : "pending",
                        notes: `Checkout Immediato. ${checkoutData.paymentNotes || ""}`,
                        quotaDescription: "Checkout Unificato (Calcolatore)",
                        period: "Custom",
                        paidDate: new Date().toISOString()
                    };

                    const createEnrollmentAndPay = async (endpoint: string, payload: any, entityKey: string, pTypeVal: string) => {
                        const res = await apiRequest("POST", `${endpoint}?skipPayment=true`, payload);
                        const data = await res.json();
                        paymentPayload[entityKey] = data.id;
                        paymentPayload.type = pTypeVal;
                        if (parseFloat(row.subtotal) > 0) {
                            await apiRequest("POST", "/api/payments", paymentPayload);
                        }
                    };

                    switch (row.activityType) {
                        case 'workshop':
                            await createEnrollmentAndPay("/api/workshop-enrollments", { ...basePayload, workshopId: parsedId }, "workshopEnrollmentId", "workshop");
                            break;
                        case 'prove-pagamento':
                            await createEnrollmentAndPay("/api/paid-trial-enrollments", { ...basePayload, paidTrialId: parsedId }, "paidTrialEnrollmentId", "paid_trial");
                            break;
                        case 'prove-gratuite':
                            await createEnrollmentAndPay("/api/free-trial-enrollments", { ...basePayload, freeTrialId: parsedId }, "freeTrialEnrollmentId", "free_trial");
                            break;
                        case 'lezioni-singole':
                            await createEnrollmentAndPay("/api/single-lesson-enrollments", { ...basePayload, singleLessonId: parsedId }, "singleLessonEnrollmentId", "single_lesson");
                            break;
                        case 'domeniche-movimento':
                            await createEnrollmentAndPay("/api/sunday-activity-enrollments", { ...basePayload, sundayActivityId: parsedId }, "sundayActivityEnrollmentId", "sunday_activity");
                            break;
                        case 'allenamenti':
                            await createEnrollmentAndPay("/api/training-enrollments", { ...basePayload, trainingId: parsedId }, "trainingEnrollmentId", "training");
                            break;
                        case 'lezioni-individuali':
                            await createEnrollmentAndPay("/api/individual-lesson-enrollments", { ...basePayload, individualLessonId: parsedId }, "individualLessonEnrollmentId", "individual_lesson");
                            break;
                        case 'campus':
                            await createEnrollmentAndPay("/api/campus-enrollments", { ...basePayload, campusActivityId: parsedId }, "campusEnrollmentId", "campus");
                            break;
                        case 'saggi':
                            await createEnrollmentAndPay("/api/recital-enrollments", { ...basePayload, recitalId: parsedId }, "recitalEnrollmentId", "recital");
                            break;
                        case 'vacanze-studio':
                            await createEnrollmentAndPay("/api/vacation-study-enrollments", { ...basePayload, vacationStudyId: parsedId }, "vacationStudyEnrollmentId", "vacation_study");
                            break;
                        case 'affitti':
                            await createEnrollmentAndPay("/api/studio-bookings", { ...basePayload, studioId: parsedId, bookingDate: new Date().toISOString(), startTime: "12:00", endTime: "13:00", amount: row.basePrice.toString() }, "bookingId", "service_booking");
                            break;
                        case 'servizi':
                        case 'merchandising':
                            // Vendita Diretta (Merchandising o Eventi Esterni / Booking Services) che non usa tabelle di Enrollment specifiche
                            paymentPayload.type = row.activityType === 'merchandising' ? "other" : "service_booking";
                            paymentPayload.notes = `${row.activityType === 'merchandising' ? 'Merchandising' : 'Servizio Esterno'} - (SKU ID: ${parsedId || 'N/A'}). ${paymentPayload.notes}`;
                            if (parseFloat(row.subtotal) > 0) {
                                await apiRequest("POST", "/api/payments", paymentPayload);
                            }
                            break;
                        case 'corsi':
                        default:
                            if (row.participationType === 'FREE_TRIAL') {
                                const payload = { ...basePayload, participationType: row.participationType, targetDate: row.targetDate, courseId: parsedId };
                                await apiRequest("POST", `/api/enrollments?skipPayment=true`, payload);
                            } else if (row.participationType === 'PAID_TRIAL' || row.participationType === 'SINGLE_LESSON') {
                                const payload = { ...basePayload, participationType: row.participationType, targetDate: row.targetDate, courseId: parsedId };
                                await createEnrollmentAndPay("/api/enrollments", payload, "enrollmentId", row.participationType === 'SINGLE_LESSON' ? 'single_lesson' : 'paid_trial');
                            } else {
                                const payload = { ...basePayload, participationType: "STANDARD_COURSE", courseId: parsedId };
                                await createEnrollmentAndPay("/api/enrollments", payload, "enrollmentId", "course");
                            }
                            break;
                    }
                }
            }

            // === INTEGRAZIONE TESSERA AUTO-GEN ===
            if (includeTessera) {
                // Determine season and new/renewal
                const paymentDate = new Date();
                
                // Logic based on Phase 2 Standard: Expiration is ALWAYS August 31st of the season.
                // Se siamo tra Gennaio e Luglio, la tessera scade il 31/08 dell'anno corrente.
                // Se siamo tra Agosto e Dicembre, la tessera scade il 31/08 dell'anno successivo.
                const currentMonth = paymentDate.getMonth(); // 0-indexed (0=Jan, 7=Aug)
                const currentYear = paymentDate.getFullYear();
                
                // Calcolo Competenza Corrente (di default). Se siamo in "Early Bird" (Maggio/Giugno), 
                // in un sistema più complesso ci sarebbe il toggle. Per ora, il default sicuro è l'anno sportivo attuale.
                const expiryYear = currentMonth >= 7 ? currentYear + 1 : currentYear;
                const expiryDateStr = `${expiryYear}-08-31T23:59:59.000Z`;
                
                const seasonStartYear = expiryYear - 1;
                const seasonEndYear = expiryYear;
                const seasonCompetence = `${seasonStartYear}-${seasonEndYear}`; // e.g. 2025-2026

                // Try to find if user already has an old active membership (for renewal vs nuovo)
                const hasExistingMembership = memberMemberships && memberMemberships.length > 0;
                
                // Construct logic for season prefix (e.g., 2025 -> 2526)
                const currentYearShort = seasonStartYear.toString().slice(2);
                const nextYearShort = seasonEndYear.toString().slice(2);
                const seasonPrefix = `${currentYearShort}${nextYearShort}`;
                const memberIdPrefix = String(selectedMemberId || "0000001").padStart(6, '0');
                const generatedMembershipNumber = `${seasonPrefix}-${memberIdPrefix}`;

                // Create the Membership core entry
                const membershipPayload = {
                    memberId: parseInt(selectedMemberId),
                    membershipNumber: generatedMembershipNumber,
                    barcode: generatedMembershipNumber,
                    issueDate: paymentDate.toISOString(),
                    expiryDate: expiryDateStr,
                    type: "annual",
                    fee: "25.00",
                    status: "active",
                    seasonCompetence: seasonCompetence,
                    nuovoRinnovo: hasExistingMembership ? "rinnovo" : "nuovo"
                };

                const tesseraRes = await apiRequest("POST", "/api/memberships?skipPayment=true", membershipPayload);
                const tesseraData = await tesseraRes.json();

                // Create the Payment logging
                const tesseraPaymentPayload = {
                    memberId: parseInt(selectedMemberId),
                    amount: "25.00",
                    paymentMethod: checkoutData.paymentMethod,
                    type: "membership",
                    status: checkoutData.isPaid ? "paid" : "pending",
                    notes: `Creato da Checkout Unificato. ${checkoutData.paymentNotes || ''}`,
                    quotaDescription: "Quota Tessera",
                    period: "Custom",
                    paidDate: paymentDate.toISOString(),
                    membershipId: tesseraData.id
                };

                await apiRequest("POST", "/api/payments", tesseraPaymentPayload);
            }

            if (includeProva) {
                // Aggiungiamo solo una riga negativa/rimborso per bilanciare i conti (se necessario al DB).
                // Altrimenti, viene solo stornato dal conto finale visivo. Registriamo lo storno.
                const provaPaymentPayload = {
                    memberId: parseInt(selectedMemberId),
                    amount: "-20.00",
                    paymentMethod: checkoutData.paymentMethod,
                    type: "other",
                    status: checkoutData.isPaid ? "paid" : "pending",
                    notes: `Sconto Lezione Prova stornato dal Checkout Unificato. ${checkoutData.paymentNotes || ''}`,
                    quotaDescription: "Sconto Lezione di Prova",
                    period: "Custom",
                    paidDate: new Date().toISOString()
                };
                await apiRequest("POST", "/api/payments", provaPaymentPayload);
            }
        },
        onSuccess: () => {
            toast({ title: "Checkout completato", description: "Iscrizioni e pagamento salvati con successo. ✅" });
            setCartRows([{ id: Date.now().toString(), activityType: "", skus: [], periodId: "", basePrice: 0, participationType: "STANDARD_COURSE", targetDate: "", discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
            setIncludeTessera(false);
            setIncludeProva(false);
            setPaymentNotes("");
            setIsCheckoutOpen(false);
            onClose(); // Close the modal upon successful checkout
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
        },
        onError: (err: Error) => {
            toast({ title: "Errore durante il Checkout", description: err.message, variant: "destructive" });
        }
    });

    const addCartRow = (debt?: any) => {
        if (debt) {
            // Check if already in cart
            if (cartRows.some(r => r.isDebt && r.skus && r.skus[0] === debt.id)) {
                toast({ title: "Debito già nel carrello", variant: "default" });
                return;
            }
            setCartRows([...cartRows, {
                id: Date.now().toString(),
                activityType: "saldo_debito",
                skus: [debt.id],
                periodId: "N/A",
                basePrice: debt.remaining,
                participationType: "STANDARD_COURSE",
                targetDate: "",
                discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: debt.remaining,
                paymentNotes: [], enrollmentDetails: [],
                isDebt: true,
                debtDescription: debt.description
            }]);
        } else {
            setCartRows([...cartRows, { id: Date.now().toString(), activityType: "", skus: [], periodId: "", basePrice: 0, participationType: "STANDARD_COURSE", targetDate: "", discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
        }
    };

    const removeCartRow = (id: string) => {
        setCartRows(cartRows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, field: string, value: any) => {
        setCartRows((prevCartRows) => prevCartRows.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                const base = parseFloat(updated.basePrice) || 0;
                const s1 = parseFloat(updated.discountPercent1) || 0;
                const s2 = parseFloat(updated.discountPercent2) || 0;
                const dAmount = parseFloat(updated.discountAmount) || 0;
                const stage1 = base * (1 - (s1 / 100));
                updated.subtotal = Math.max(0, (stage1 * (1 - (s2 / 100))) - dAmount);
                return updated;
            }
            return r;
        }));
    };

    const updateRowBatch = (id: string, updates: Record<string, any>) => {
        setCartRows((prevCartRows) => prevCartRows.map(r => {
            if (r.id === id) {
                const updated = { ...r, ...updates };
                const base = parseFloat(updated.basePrice) || 0;
                const s1 = parseFloat(updated.discountPercent1) || 0;
                const s2 = parseFloat(updated.discountPercent2) || 0;
                const dAmount = parseFloat(updated.discountAmount) || 0;
                const stage1 = base * (1 - (s1 / 100));
                updated.subtotal = Math.max(0, (stage1 * (1 - (s2 / 100))) - dAmount);
                return updated;
            }
            return r;
        }));
    };

    const validatePromoCode = async (rowId: string, code: string, basePrice: number, activityType: string) => {
        if (!code || !selectedMemberId || basePrice <= 0) return;
        
        updateRowBatch(rowId, { promoCodeStatus: 'validating' });
        
        try {
            const res = await apiRequest("POST", "/api/promo-rules/validate", {
                code,
                amount: basePrice,
                activityType: activityType || "all",
                memberId: parseInt(selectedMemberId)
            });
            
            const data = await res.json();
            
            if (data.valid) {
                 updateRowBatch(rowId, {
                     promoCodeStatus: 'valid',
                     promoCodeMessage: 'Codice valido',
                     discountAmount: data.discountAmount,
                     discountCode: code
                 });
            } else {
                 updateRowBatch(rowId, {
                     promoCodeStatus: 'invalid',
                     promoCodeMessage: data.reason || 'Codice non valido',
                     discountAmount: 0
                 });
            }
        } catch (e) {
            updateRowBatch(rowId, {
                promoCodeStatus: 'error',
                promoCodeMessage: 'Verifica non disponibile',
                discountAmount: 0
            });
        }
    };

    const totalCart = cartRows.reduce((sum, r) => sum + (parseFloat(r.subtotal) || 0), 0);
    const tesseraValue = includeTessera ? 25 : 0;
    const provaValue = includeProva ? -20 : 0;
    const grandTotal = totalCart + tesseraValue + provaValue;

    const totalInSospeso = calculatedDebts.reduce((sum: number, d: any) => sum + (d.remaining || 0), 0);
    const totalPaid = memberPayments.filter((p: any) => p.status === 'paid' || p.status === 'completed').reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className="max-w-[1400px] w-[95vw] h-[95vh] overflow-y-auto bg-slate-100 dark:bg-slate-800/50 p-0 border-0"
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Calculator className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Nuovo Pagamento</h2>
                            <p className="text-sm text-muted-foreground hidden sm:block">Gestione Checkout Unificato e Carrello Iscrizioni</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="w-full p-4 md:px-8 md:py-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* COLONNA SINISTRA: SELEZIONE E CHECKOUT */}
                        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                            <Card className="shadow-sm border-t-4 border-t-primary">
                                <CardHeader className="pb-3 bg-muted/20">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <UserIcon className="w-5 h-5 text-primary" /> Intestatario
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-2 relative">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cerca Anagrafica Cliente</Label>
                                        <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={memberSearchOpen}
                                                    className="w-full justify-between font-normal h-12 bg-background border shadow-sm"
                                                >
                                                    {selectedMember ? (
                                                        <div className="flex flex-col items-start overflow-hidden">
                                                            <span className="font-bold truncate text-base">{selectedMember.lastName} {selectedMember.firstName}</span>
                                                            <span className="text-xxs text-muted-foreground uppercase">{selectedMember.fiscalCode || 'No CF'}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Cerca per cognome, nome o CF...</span>
                                                    )}
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {selectedMemberId && (
                                                            <div
                                                                role="button"
                                                                className="p-1 hover:bg-slate-200 rounded-md z-50 cursor-pointer transition-colors"
                                                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                                onClick={(e) => {
                                                                    e.preventDefault(); e.stopPropagation();
                                                                    setSelectedMemberId("");
                                                                    setSelectedMember(null);
                                                                    setMemberSearchQuery("");
                                                                    setMemberSearchOpen(false);
                                                                    setCartRows([{ id: Date.now().toString(), activityType: "", skus: [], periodId: "", basePrice: 0, participationType: "STANDARD_COURSE", targetDate: "", discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
                                                                    setIncludeTessera(false);
                                                                    setIncludeProva(false);
                                                                    setPaymentMethod("contanti");
                                                                    setPaymentNotes("");
                                                                }}
                                                            >
                                                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                            </div>
                                                        )}
                                                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                                    </div>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" align="start">
                                                <Command shouldFilter={false}>
                                                    <CommandInput
                                                        placeholder="Digita (min. 3 caratteri)..."
                                                        value={memberSearchQuery}
                                                        onValueChange={setMemberSearchQuery}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            {memberSearchQuery.length < 3
                                                                ? "Inserisci almeno 3 caratteri per cercare"
                                                                : "Nessun partecipante trovato"}
                                                        </CommandEmpty>
                                                        {memberSearchQuery.length >= 3 && (
                                                            <CommandGroup>
                                                                {searchedMembers.map((member) => (
                                                                    <CommandItem
                                                                        key={member.id}
                                                                        value={member.id.toString()}
                                                                        onSelect={() => {
                                                                            setSelectedMemberId(member.id.toString());
                                                                            setSelectedMember(member);
                                                                            setMemberSearchOpen(false);
                                                                            setMemberSearchQuery("");
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", selectedMemberId === member.id.toString() ? "opacity-100 text-primary" : "opacity-0")} />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold">{member.lastName} {member.firstName}</span>
                                                                            {member.fiscalCode && (
                                                                                <span className="text-xxs text-muted-foreground">{member.fiscalCode}</span>
                                                                            )}
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md bg-stone-50 border-stone-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5" /> Riepilogo Cassa
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Totale Corsi/Quote</span>
                                        <span className="font-medium">€ {totalCart.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Quota Tessera</span>
                                        <span className="font-medium">€ {tesseraValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-red-600">
                                        <span>Lezione Prova</span>
                                        <span className="font-medium">€ {provaValue.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-3 border-t-2 border-dashed border-stone-300 flex justify-between items-center">
                                        <span className="font-bold text-lg">TOTALE DA PAGARE</span>
                                        <span className="font-black text-2xl text-green-700">€ {grandTotal.toFixed(2)}</span>
                                    </div>

                                    <Button
                                        className="w-full h-12 text-lg font-bold mt-4 shadow-lg hover:shadow-xl transition-all"
                                        variant="default"
                                        disabled={!selectedMemberId || grandTotal === 0}
                                        onClick={() => setIsCheckoutOpen(true)}
                                    >
                                        PROCEDI AL PAGAMENTO
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* COLONNA DESTRA: TAVOLO CARRELLO E EXTRA */}
                        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                            {selectedMemberId && (
                                <div className="border border-border shadow-sm bg-background p-4 rounded-lg">
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-center gap-3 shadow-sm">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                                <Check className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xxxs font-bold uppercase tracking-widest opacity-80 text-green-800 dark:text-green-400 mb-0.5">Totale Versato</p>
                                                <p className="text-xl font-black text-green-700">€{totalPaid.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-center gap-3 shadow-sm">
                                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                                                <ChevronsUpDown className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xxxs font-bold uppercase tracking-widest opacity-80 text-rose-800 mb-0.5">Residuo da Pagare</p>
                                                <p className="text-xl font-black text-rose-600">€{totalInSospeso.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b">
                                    <div>
                                        <CardTitle className="text-xl">Dettaglio Quote e Servizi</CardTitle>
                                        <CardDescription>Aggiungi i corsi e calcola il preventivo incrociando i listini.</CardDescription>
                                    </div>
                                    <Button onClick={addCartRow} className="gold-3d-button gap-2">
                                        <Plus className="w-4 h-4" /> Nuovo Pagamento
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-4 bg-muted/50">
                                    <div className="space-y-6">
                                        {cartRows.map((row, idx) => (
                                            <CartTableRow
                                                key={row.id}
                                                row={row}
                                                courses={courses || []}
                                                workshops={workshops || []}
                                                paidTrials={paidTrials || []}
                                                freeTrials={freeTrials || []}
                                                singleLessons={singleLessons || []}
                                                sundayActivities={sundayActivities || []}
                                                trainings={trainings || []}
                                                individualLessons={individualLessons || []}
                                                campusActivities={campusActivities || []}
                                                recitals={recitals || []}
                                                vacationStudies={vacationStudies || []}
                                                studios={studios || []}
                                                bookingServices={bookingServices || []}
                                                priceLists={priceLists || []}
                                                quotes={quotes || []}
                                                courseQuotesGrid={courseQuotesGrid || []}
                                                updateRow={updateRow}
                                                updateRowBatch={updateRowBatch}
                                                removeCartRow={removeCartRow}
                                                index={idx}
                                                validatePromoCode={validatePromoCode}
                                            />
                                        ))}

                                        {cartRows.length === 0 && (
                                            <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                                                Nessun corso inserito. Clicca su "Nuovo Pagamento" per iniziare.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="shadow-sm bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-blue-900 dark:text-blue-300">1 QUOTA TESSERA</h3>
                                            <p className="text-xs text-blue-700/70">Aggiungi quota associazione obbligatoria (+€25.00)</p>
                                        </div>
                                        <Button variant={includeTessera ? "default" : "outline"} onClick={() => setIncludeTessera(!includeTessera)}>
                                            {includeTessera ? "Aggiunta (OK)" : "Inserisci Tessera"}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-red-900">1 LEZIONE DI PROVA</h3>
                                            <p className="text-xs text-red-700/70">Sottrae una lezione pagata dalla retta (-€20.00)</p>
                                        </div>
                                        <Button variant={includeProva ? "destructive" : "outline"} onClick={() => setIncludeProva(!includeProva)}>
                                            {includeProva ? "Sottratta (OK)" : "Sottrai Prova"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <PaymentInvoiceDetails />

                            <Accordion type="single" collapsible className="w-full bg-background border border-border shadow-sm rounded-lg px-4 mt-8">
                                <AccordionItem value="storico-debiti" className="border-b-0">
                                    <AccordionTrigger className="hover:no-underline text-sm font-bold text-muted-foreground uppercase tracking-widest py-4">
                                        Cosa desideri pagare? (Storico)
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        {!selectedMemberId ? (
                                            <div className="p-4 rounded-md bg-muted text-center text-sm text-muted-foreground italic">
                                                Nessun debito pendente per questo cliente. Procedi inserendo i dati manualmente.
                                            </div>
                                        ) : isLoadingDebts ? (
                                            <div className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md w-full border border-border"></div>
                                        ) : calculatedDebts && calculatedDebts.length > 0 ? (
                                            <div className="border rounded-md divide-y overflow-hidden shadow-sm bg-background">
                                                {calculatedDebts.map((debt: any, idx: number) => (
                                                    <div key={debt.id || idx} onClick={() => {
                                                        if (debt.remaining > 0.01) {
                                                            addCartRow(debt);
                                                        }
                                                    }} className={cn("p-4 transition-colors relative flex justify-between items-center group", debt.remaining > 0.01 ? "hover:bg-muted cursor-pointer" : "opacity-75")}>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-foreground text-sm">{debt.description}</span>
                                                            <span className="text-xxs text-muted-foreground uppercase">{debt.date ? new Date(debt.date).toLocaleDateString('it-IT') : ""} - {debt.type}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div>
                                                                {debt.remaining <= 0.01 ? (
                                                                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xxs font-bold tracking-wide uppercase border border-green-200">PAGATO</div>
                                                                ) : debt.paid > 0.01 ? (
                                                                    <div className="bg-black text-white px-3 py-1 rounded-full text-xxs font-bold tracking-wide uppercase text-center flex flex-col leading-none">
                                                                        <span>Da pagare: €{debt.remaining.toFixed(2)}</span>
                                                                        <span className="text-xxxs text-orange-300">Parziale</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-black text-white px-3 py-1 rounded-full text-xxs font-bold tracking-wide uppercase">Da pagare: €{debt.remaining.toFixed(2)}</div>
                                                                )}
                                                            </div>
                                                            {user?.role === 'admin' && debt.remaining > 0.01 && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={(e) => handleDeleteDebt(e, debt.type, debt.id)}
                                                                    className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:bg-red-950/20 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                    title="Annulla ed elimina voce pendente dal Database"
                                                                    disabled={deletePendingDebtMutation.isPending}
                                                                >
                                                                    {deletePendingDebtMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-md bg-muted text-center text-sm text-muted-foreground italic">
                                                Tutti i pagamenti risultano saldati.
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                        </div>
                    </div>
                </div>

                {/* === DIALOG CHECKOUT INNER === */}
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <PaymentModuleConnector
                            basePrice={grandTotal}
                            itemName={`Incasso: ${selectedMember?.lastName} ${selectedMember?.firstName}`}
                            onPaymentComplete={(data) => {
                                // Provide default to avoid undefined behavior, pass directly into mutate
                                const notes = data.receiptNumber ? `Ricevuta: ${data.receiptNumber}` : "";
                                setPaymentMethod(data.paymentMethod);
                                setPaymentNotes(notes);
                                checkoutMutation.mutate({
                                    paymentMethod: data.paymentMethod || "",
                                    paymentNotes: notes,
                                    isPaid: data.isPaid
                                });
                            }}
                            onCancel={() => setIsCheckoutOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}

