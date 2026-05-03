import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceTag } from "@/components/price-tag";
import { getActiveActivities } from "@/config/activities";
import { MultiSelectEnrollmentDetails } from "@/components/multi-select-enrollment-details";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { apiRequest } from "@/lib/queryClient";
import type { PriceList, Course, Quote, PriceListItem } from "@shared/schema";

// === SUBCOMPONENTE RIGA CARRELLO (Per gestire l'auto-fetch del Listino Selezionato) ===
export function CartTableRow({
    row, courses, workshops, paidTrials, freeTrials, singleLessons,
    sundayActivities, trainings, individualLessons, campusActivities,
    recitals, vacationStudies, studios, bookingServices, priceLists, quotes,
    updateRow, updateRowBatch, removeCartRow, index, validatePromoCode
}: {
    row: any, courses: Course[], workshops: any[], paidTrials: any[],
    freeTrials: any[], singleLessons: any[], sundayActivities: any[],
    trainings: any[], individualLessons: any[], campusActivities: any[],
    recitals: any[], vacationStudies: any[], studios: any[], bookingServices: any[],
    priceLists: PriceList[], quotes: Quote[], updateRow: any,
    updateRowBatch: any, removeCartRow: any, index: number, validatePromoCode: any
}) {
    const { data: listinoItems } = useQuery<PriceListItem[]>({
        queryKey: [`/api/price-lists/${row.periodId}/items`],
        enabled: !!row.periodId,
    });

    // Tracking the last combo to prevent overriding manual user edits on basePrice
    const [lastAutoPricedCombo, setLastAutoPricedCombo] = useState<string>("");

    useEffect(() => {
        if (row.periodId && row.skus && row.skus.length > 0 && Array.isArray(listinoItems)) {
            const entityId = parseInt(row.skus[0]);
            let entityType = "course";
            switch (row.activityType) {
                case "corsi": 
                    if (row.participationType === 'SINGLE_LESSON') entityType = "single_lesson";
                    else if (row.participationType === 'PAID_TRIAL') entityType = "paid_trial";
                    else entityType = "course";
                    break;
                case "workshop": entityType = "workshop"; break;
                case "prove-pagamento": entityType = "paid_trial"; break;
                case "prove-gratuite": entityType = "free_trial"; break;
                case "lezioni-singole": entityType = "single_lesson"; break;
                case "domeniche-movimento": entityType = "sunday_activity"; break;
                case "allenamenti": entityType = "training"; break;
                case "lezioni-individuali": entityType = "individual_lesson"; break;
                case "campus": entityType = "campus_activity"; break;
                case "saggi": entityType = "recital"; break;
                case "vacanze-studio": entityType = "vacation_study"; break;
                case "affitti": entityType = "booking_service"; break; // Sale mapping old system
                case "servizi": entityType = "booking_service"; break; // Eventi esterni
            }

            const item = listinoItems.find(i => i.entityType === entityType && i.entityId === entityId);

            const currentCombo = `${row.periodId}-${row.activityType}-${entityId}-${row.participationType || 'STANDARD_COURSE'}`;

            if (row.activityType === "corsi" && row.participationType === 'FREE_TRIAL') {
                 if (lastAutoPricedCombo !== currentCombo) {
                     updateRow(row.id, 'basePrice', 0);
                     setLastAutoPricedCombo(currentCombo);
                 }
            } else if (item && lastAutoPricedCombo !== currentCombo) {
                let finalPrice = parseFloat((item.price as string) || "0");
                if (item.quoteId && quotes.length) {
                    const q = quotes.find(qt => qt.id === item.quoteId);
                    if (q) finalPrice = parseFloat((q.amount as string) || "0");
                }
                if (!isNaN(finalPrice)) {
                    updateRow(row.id, 'basePrice', finalPrice);
                    setLastAutoPricedCombo(currentCombo);
                }
            } else if (!item && row.activityType === "corsi" && lastAutoPricedCombo !== currentCombo) {
                // FALLBACK: If not found in price list, try fallback to master DB course price
                const courseMaster = courses.find(c => c.id === entityId);
                if (courseMaster && courseMaster.price !== null) {
                     let finalPrice = parseFloat(courseMaster.price as string);
                     if (!isNaN(finalPrice)) {
                         updateRow(row.id, 'basePrice', finalPrice);
                         setLastAutoPricedCombo(currentCombo);
                     }
                }
            }
        }
    }, [row.skus, row.periodId, listinoItems, row.activityType, row.participationType, courses, quotes.length, row.id, lastAutoPricedCombo]);

    const currentCatalog = useMemo(() => {
        let catalog: any[] = [];
        let entityType = "course";

        switch (row.activityType) {
            case "corsi": 
                catalog = courses || []; 
                if (row.participationType === 'SINGLE_LESSON') entityType = "single_lesson";
                else if (row.participationType === 'PAID_TRIAL') entityType = "paid_trial";
                else entityType = "course";
                break;
            case "workshop": catalog = workshops || []; entityType = "workshop"; break;
            case "prove-pagamento": catalog = paidTrials || []; entityType = "paid_trial"; break;
            case "prove-gratuite": catalog = freeTrials || []; entityType = "free_trial"; break;
            case "lezioni-singole": catalog = singleLessons || []; entityType = "single_lesson"; break;
            case "domeniche-movimento": catalog = sundayActivities || []; entityType = "sunday_activity"; break;
            case "allenamenti": catalog = trainings || []; entityType = "training"; break;
            case "lezioni-individuali": catalog = individualLessons || []; entityType = "individual_lesson"; break;
            case "campus": catalog = campusActivities || []; entityType = "campus_activity"; break;
            case "saggi": catalog = recitals || []; entityType = "recital"; break;
            case "vacanze-studio": catalog = vacationStudies || []; entityType = "vacation_study"; break;
            case "affitti": catalog = studios || []; entityType = "booking_service"; break; // "Affitti" maps to the rooms catalog
            case "servizi": catalog = bookingServices || []; entityType = "booking_service"; break; // "Eventi Esterni" maps to specific external services
            case "merchandising": catalog = []; break; // Placeholder manuale 
            default: catalog = courses || []; break;
        }

        // Filtro Logica di Dipendenza: Applica incrocio stretto con Listino Selezionato
        if (listinoItems && listinoItems.length > 0 && row.periodId) {
            const validIdsForThisType = listinoItems
                .filter(li => li.entityType === entityType)
                .map(li => li.entityId);
            
            catalog = catalog.filter(c => validIdsForThisType.includes(c.id));
        }

        // Filtro Sicurezza: Nascondi esplicitamente voci inattive o di "test"
        catalog = catalog.filter(c => c.active !== false && !(c.name || c.title || "").toLowerCase().includes("test"));

        return catalog;
    }, [row.activityType, row.periodId, row.participationType, listinoItems, courses, workshops, paidTrials, freeTrials, singleLessons, sundayActivities, trainings, individualLessons, campusActivities, recitals, vacationStudies, studios, bookingServices]);

    if (row.isDebt) {
        return (
            <div className="bg-muted p-4 rounded-lg border shadow-sm relative flex gap-4 pr-14">
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:bg-red-950/20" onClick={() => { if (confirm("Rimuovere questa riga dal carrello?")) removeCartRow(row.id); }}>
                    <Trash2 className="w-5 h-5" />
                </Button>
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4 border-b pb-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground text-lg">Saldo Debito Pregresso</h4>
                            <p className="text-sm text-muted-foreground">{row.debtDescription}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1">
                            <Label className="text-xs text-foreground/80 font-bold">Importo da Saldare *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                className="h-10 text-lg font-bold bg-background"
                                value={row.basePrice || ""}
                                onChange={(e) => {
                                    updateRow(row.id, 'basePrice', e.target.value);
                                    updateRow(row.id, 'subtotal', e.target.value); // Sync subtotal directly for debts
                                }}
                            />
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-muted-foreground mr-3 uppercase">Subtotale Riga:</span>
                            <span className="text-2xl font-black text-green-700">€ {(parseFloat(row.subtotal) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background p-4 rounded-lg border shadow-sm relative flex gap-4 pr-14">
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:bg-red-950/20"
                onClick={() => { if (confirm("Rimuovere questa riga dal carrello?")) removeCartRow(row.id); }}
            >
                <Trash2 className="w-5 h-5" />
            </Button>

            <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr_2fr_0.8fr_2fr_1fr] gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-foreground/80 truncate font-bold">Listino *</Label>
                        <Select value={row.periodId} onValueChange={(val) => {
                            updateRowBatch(row.id, { periodId: val, activityType: '', skus: [], basePrice: 0 });
                        }}>
                            <SelectTrigger className="h-9 bg-yellow-50/50 border-yellow-200">
                                <SelectValue placeholder="Periodo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {priceLists?.map(pl => (
                                    <SelectItem key={pl.id} value={pl.id.toString()}>{pl.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className={cn("text-xs truncate font-bold", !row.periodId ? "text-slate-400" : "text-foreground/80")}>Attività *</Label>
                        <Select disabled={!row.periodId} value={row.activityType || ""} onValueChange={(val) => {
                            updateRowBatch(row.id, { activityType: val, skus: [], basePrice: 0 });
                        }}>
                            <SelectTrigger className={cn("h-9 border-border", !row.periodId ? "bg-slate-100 dark:bg-slate-800 opacity-50" : "bg-muted")}>
                                <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                            <SelectContent>
                                {getActiveActivities().map((act) => (
                                    <SelectItem key={act.id} value={act.id}>
                                        {act.labelUI}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className={cn("text-xs truncate font-bold", !row.activityType ? "text-slate-400" : "text-foreground/80")}>SKU / Dettaglio Attività *</Label>
                        <Select disabled={!row.activityType} value={(row.skus && row.skus[0]) || ""} onValueChange={(val) => {
                            updateRow(row.id, 'skus', [val]);
                        }}>
                            <SelectTrigger className={cn("h-9 border-border", !row.activityType ? "bg-slate-100 dark:bg-slate-800 opacity-50" : "bg-background")}>
                                <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                            <SelectContent>
                                {currentCatalog?.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        <span className="font-semibold text-foreground">{c.name || c.title}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-foreground/80 truncate font-bold">Q.tà</Label>
                        <Input type="number" className="h-9 bg-muted text-center" value="1" readOnly />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-foreground/80 truncate font-bold">Descrizione Quota</Label>
                        <Input className="h-9 bg-muted" placeholder="Manuale..." />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-foreground/80 truncate font-bold">Totale Quota *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                              type="number"
                              step="0.01"
                              className="h-9 bg-muted font-bold w-1/2"
                              value={row.basePrice || ""}
                              onChange={(e) => updateRow(row.id, 'basePrice', e.target.value)}
                              placeholder="0"
                          />
                          {row.activityType && (
                            <div className="flex items-center gap-1 text-xxs text-muted-foreground whitespace-nowrap w-1/2">
                              Suggerimento:
                              <PriceTag
                                category={row.activityType === 'corsi' ? 'adulti' : row.activityType}
                                courseCount={1}
                              />
                            </div>
                          )}
                        </div>
                    </div>
                </div>

                {row.activityType === 'corsi' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4 mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <div className="space-y-1">
                            <Label className="text-xs text-blue-800 dark:text-blue-300 truncate font-bold">Modalità Partecipazione</Label>
                            <Select value={row.participationType || "STANDARD_COURSE"} onValueChange={(val) => {
                                updateRowBatch(row.id, { 
                                    participationType: val,
                                    basePrice: val === 'FREE_TRIAL' ? 0 : row.basePrice 
                                });
                            }}>
                                <SelectTrigger className="h-9 bg-background border-blue-200">
                                    <SelectValue placeholder="Standard" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STANDARD_COURSE">Iscrizione Standard</SelectItem>
                                    <SelectItem value="FREE_TRIAL">Prova Gratuita</SelectItem>
                                    <SelectItem value="PAID_TRIAL">Prova a Pagamento</SelectItem>
                                    <SelectItem value="SINGLE_LESSON">Lezione Singola</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {['FREE_TRIAL', 'PAID_TRIAL', 'SINGLE_LESSON'].includes(row.participationType) && (
                            <div className="space-y-1">
                                <Label className="text-xs text-blue-800 dark:text-blue-300 truncate font-bold">Data Lezione/Prova *</Label>
                                <Input
                                    type="date"
                                    className="h-9 bg-background border-blue-200"
                                    value={row.targetDate || ""}
                                    onChange={(e) => updateRow(row.id, 'targetDate', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-emerald-700 truncate">Cod. Promo</Label>
                        <Input className="h-9 bg-emerald-50 dark:bg-emerald-950/20 font-mono text-xs uppercase" placeholder="COD. PERSONALE" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-emerald-700 truncate">Valore</Label>
                        <Input type="number" className="h-9 bg-emerald-50 dark:bg-emerald-950/20 text-right" placeholder="€ 0.00" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-emerald-700 truncate">% Promo</Label>
                        <Input type="number" step="0.01" className="h-9 bg-emerald-50 dark:bg-emerald-950/20 text-right" placeholder="%" value={row.discountPercent2 || ""} onChange={(e) => updateRow(row.id, 'discountPercent2', e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                           <Label className="text-xs text-blue-700 truncate">Cod. Sconto</Label>
                           {row.promoCodeStatus === 'valid' && <Badge variant="outline" className="h-4 text-xxxs px-1 bg-green-50 text-green-700 border-green-200" title={row.promoCodeMessage}>VALIDO</Badge>}
                           {row.promoCodeStatus === 'invalid' && <Badge variant="destructive" className="h-4 text-xxxs px-1" title={row.promoCodeMessage}>NON VALIDO</Badge>}
                           {row.promoCodeStatus === 'error' && <Badge variant="outline" className="h-4 text-xxxs px-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 border-amber-200 dark:border-amber-900/50" title={row.promoCodeMessage}>ERRORE</Badge>}
                           {row.promoCodeStatus === 'validating' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                        </div>
                        <Input 
                           className="h-9 bg-blue-50 dark:bg-blue-950/20 font-mono text-xs uppercase" 
                           placeholder="COD. CAMPAGNA" 
                           value={row.discountCode || ""} 
                           onChange={(e) => updateRow(row.id, 'discountCode', e.target.value)} 
                           onBlur={() => validatePromoCode(row.id, row.discountCode, row.basePrice, row.activityType)}
                           onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                   e.preventDefault();
                                   validatePromoCode(row.id, row.discountCode, row.basePrice, row.activityType);
                               }
                           }}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-blue-700 truncate">Valore</Label>
                        <Input type="number" className="h-9 bg-blue-50 dark:bg-blue-950/20 text-right text-green-700 font-bold" placeholder="€ 0.00" value={row.discountAmount || ""} readOnly />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-blue-700 truncate">% Sconto</Label>
                        <Input type="number" step="0.01" className="h-9 bg-blue-50 dark:bg-blue-950/20 text-right" placeholder="%" value={row.discountPercent1 || ""} onChange={(e) => updateRow(row.id, 'discountPercent1', e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <MultiSelectEnrollmentDetails
                            selectedDetails={row.enrollmentDetails || []}
                            onChange={(vals) => updateRow(row.id, 'enrollmentDetails', vals)}
                        />
                    </div>
                    <div className="space-y-1 mt-1">
                        <MultiSelectPaymentNotes
                            selectedNotes={row.paymentNotes || []}
                            onChange={(vals) => updateRow(row.id, 'paymentNotes', vals)}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
                    <div className="text-right">
                        <span className="text-xs font-bold text-muted-foreground mr-3 uppercase">Subtotale Riga:</span>
                        <span className="text-lg font-black text-green-700">€ {(parseFloat(row.subtotal) || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
