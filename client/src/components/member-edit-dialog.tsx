import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, RotateCcw, Smartphone, User, Phone, Mail, MapPin } from "lucide-react";
import { validateFiscalCode, parseFiscalCode, getPlaceName } from "@/lib/fiscalCodeUtils";
import type { Member, InsertMember } from "@shared/schema";
import { useCFCheck, useEmailCheck, usePhoneCheck } from "@/hooks/useFieldConflictCheck";
import { ConflictBadge } from "@/components/conflict-badge";
import { useLocation, useSearch } from "wouter";

export function MemberEditDialog() {
    const { toast } = useToast();
    const [location, setLocation] = useLocation();
    const search = useSearch();
    const params = new URLSearchParams(search);
    const editMemberId = params.get('editMemberId');

    const [isOpen, setIsOpen] = useState(false);
    const [fiscalCodeError, setFiscalCodeError] = useState<string>("");
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [showParentFields, setShowParentFields] = useState(false);
    const [hasMedicalCert, setHasMedicalCert] = useState(false);
    const [isMinorChecked, setIsMinorChecked] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("none");
    const [cfValue, setCfValue] = useState("");
    const [emailValue, setEmailValue] = useState("");
    const [phoneValue, setPhoneValue] = useState("");

    const dateOfBirthRef = useRef<HTMLInputElement>(null);
    const genderRef = useRef<HTMLSelectElement>(null);
    const placeOfBirthRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editMemberId) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [editMemberId]);

    const handleClose = () => {
        setIsOpen(false);
        const newParams = new URLSearchParams(search);
        newParams.delete('editMemberId');
        const newSearch = newParams.toString();
        setLocation(location + (newSearch ? `?${newSearch}` : ""));
    };

    const { data: member, isLoading } = useQuery<Member>({
        queryKey: ["/api/members", editMemberId],
        queryFn: async () => {
            const res = await fetch(`/api/members/${editMemberId}`, { credentials: "include" });
            if (!res.ok) throw new Error("Utente non trovato");
            return res.json();
        },
        enabled: !!editMemberId,
    });

    const { data: clientCategories } = useQuery<any[]>({
        queryKey: ["/api/client-categories"],
    });

    const { data: subscriptionTypes } = useQuery<any[]>({
        queryKey: ["/api/subscription-types"],
    });

    useEffect(() => {
        if (member) {
            setHasMedicalCert(member.hasMedicalCertificate || false);
            setIsMinorChecked(member.isMinor || false);
            setPhotoPreview(member.photoUrl || null);
            setSelectedCategoryId(member.categoryId?.toString() || "none");
            setCfValue(member.fiscalCode || "");
            setEmailValue(member.email || "");
            setPhoneValue(member.mobile || member.phone || "");

            if (member.dateOfBirth) {
                const dateStr = typeof member.dateOfBirth === 'string' ? member.dateOfBirth : new Date(member.dateOfBirth).toISOString().split('T')[0];
                const age = calculateAge(dateStr);
                setShowParentFields(age < 18 || member.isMinor || false);
            } else {
                setShowParentFields(member.isMinor || false);
            }
        }
    }, [member]);

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<InsertMember>) => {
            await apiRequest("PATCH", `/api/members/${editMemberId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/members"] });
            toast({ title: "Anagrafica aggiornata con successo" });
            handleClose();
        },
        onError: (error: any) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const calculateAge = (dateString: string): number => {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleFiscalCodeChange = (value: string) => {
        const normalized = value.toUpperCase().trim();
        if (normalized.length === 16) {
            if (validateFiscalCode(normalized)) {
                setFiscalCodeError("");
                const parsed = parseFiscalCode(normalized);
                if (parsed) {
                    if (dateOfBirthRef.current && !dateOfBirthRef.current.value) {
                        dateOfBirthRef.current.value = parsed.dateOfBirth;
                        const age = calculateAge(parsed.dateOfBirth);
                        setShowParentFields(age < 18);
                    }
                    if (genderRef.current && !genderRef.current.value) {
                        genderRef.current.value = parsed.gender;
                    }
                    if (placeOfBirthRef.current && !placeOfBirthRef.current.value) {
                        placeOfBirthRef.current.value = getPlaceName(parsed.placeOfBirth || "") || parsed.placeOfBirth || "";
                    }
                }
            } else {
                setFiscalCodeError("Codice fiscale non valido");
            }
        }
    };

    const cfCheck = useCFCheck(cfValue, member?.id);
    const emailCheck = useEmailCheck(emailValue, isMinorChecked, member?.id);
    const phoneCheck = usePhoneCheck(phoneValue, isMinorChecked, member?.id);

    const hasConflicts = (cfCheck.available === false) || 
                         (emailCheck.available === false && !isMinorChecked) || 
                         (phoneCheck.available === false && !isMinorChecked);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: any = {};
        formData.forEach((value, key) => {
            if (key === 'categoryId') {
                data[key] = value === 'none' ? null : parseInt(value as string);
            } else if (key === 'subscriptionTypeId') {
                data[key] = value === '' ? null : parseInt(value as string);
            } else {
                data[key] = value || null;
            }
        });

        data.hasMedicalCertificate = hasMedicalCert;
        data.isMinor = isMinorChecked;
        data.photoUrl = photoPreview;

        updateMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Modifica Rapida Anagrafica - {member?.lastName} {member?.firstName}
                    </DialogTitle>
                    <DialogDescription>
                        Aggiorna i dati anagrafici e i contatti dell'iscritto.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-20 flex justify-center"><RotateCcw className="w-10 h-10 animate-spin text-muted-foreground" /></div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Colonna Foto */}
                            <div className="flex flex-col items-center space-y-4 bg-muted/20 p-4 rounded-xl border border-muted">
                                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-white shadow-md">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                            <Camera className="w-10 h-10 mb-1 opacity-40" />
                                        </div>
                                    )}
                                </div>
                                <Label htmlFor="quick-photo-upload" className="cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/90 transition-colors">
                                    Cambia Foto
                                </Label>
                                <Input
                                    id="quick-photo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setPhotoPreview(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>

                            {/* Dati Base */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Nome</Label>
                                        <Input id="firstName" name="firstName" defaultValue={member?.firstName} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Cognome</Label>
                                        <Input id="lastName" name="lastName" defaultValue={member?.lastName} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="categoryId">Categoria</Label>
                                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Senza Categoria</SelectItem>
                                            {clientCategories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="categoryId" value={selectedCategoryId} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subscriptionTypeId">Tipo Iscrizione</Label>
                                    <Select name="subscriptionTypeId" defaultValue={member?.subscriptionTypeId?.toString() || ""}>
                                        <SelectTrigger><SelectValue placeholder="Seleziona tipo" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Nessuno</SelectItem>
                                            {subscriptionTypes?.map(st => (
                                                <SelectItem key={st.id} value={st.id.toString()}>{st.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fiscalCode">Codice Fiscale</Label>
                                <Input
                                    id="fiscalCode"
                                    name="fiscalCode"
                                    value={cfValue}
                                    className="uppercase font-mono"
                                    onChange={(e) => {
                                        setCfValue(e.target.value.toUpperCase());
                                        handleFiscalCodeChange(e.target.value);
                                    }}
                                />
                                {fiscalCodeError && <p className="text-[10px] text-destructive font-bold">{fiscalCodeError}</p>}
                                <ConflictBadge result={cfCheck} type="cf" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Nascita</Label>
                                <Input
                                    ref={dateOfBirthRef}
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    defaultValue={member?.dateOfBirth ? (typeof member.dateOfBirth === 'string' ? member.dateOfBirth : new Date(member.dateOfBirth).toISOString().split('T')[0]) : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Sesso</Label>
                                <select
                                    ref={genderRef as any}
                                    name="gender"
                                    defaultValue={member?.gender || ""}
                                    className="w-full h-9 rounded-md border border-input px-3 text-sm"
                                >
                                    <option value="">-</option>
                                    <option value="M">M</option>
                                    <option value="F">F</option>
                                </select>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-bold flex items-center gap-2"><Mail className="w-4 h-4" /> Recaliti</h4>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} />
                                    <ConflictBadge result={emailCheck} type="email" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile">Cellulare</Label>
                                    <Input id="mobile" name="mobile" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} />
                                    <ConflictBadge result={phoneCheck} type="telefono" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4" /> Indirizzo</h4>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Indirizzo</Label>
                                    <Input id="address" name="address" defaultValue={member?.address || ""} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="city" className="text-[10px]">Città</Label>
                                        <Input id="city" name="city" defaultValue={member?.city || ""} className="h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="province" className="text-[10px]">Prov</Label>
                                        <Input id="province" name="province" defaultValue={member?.province || ""} className="h-8 uppercase" maxLength={2} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="postalCode" className="text-[10px]">CAP</Label>
                                        <Input id="postalCode" name="postalCode" defaultValue={member?.postalCode || ""} className="h-8" maxLength={5} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="country" className="text-[10px]">Stato</Label>
                                        <Input id="country" name="country" defaultValue={member?.country || "Italia"} className="h-8" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="font-bold flex items-center gap-2 text-sm uppercase text-muted-foreground tracking-wider">Tessera Partecipante</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cardNumber">Numero</Label>
                                    <Input id="cardNumber" name="cardNumber" defaultValue={member?.cardNumber || ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cardIssueDate">Rilascio</Label>
                                    <Input id="cardIssueDate" name="cardIssueDate" type="date" defaultValue={member?.cardIssueDate ? (typeof member.cardIssueDate === 'string' ? member.cardIssueDate : new Date(member.cardIssueDate).toISOString().split('T')[0]) : ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cardExpiryDate">Scadenza</Label>
                                    <Input id="cardExpiryDate" name="cardExpiryDate" type="date" defaultValue={member?.cardExpiryDate ? (typeof member.cardExpiryDate === 'string' ? member.cardExpiryDate : new Date(member.cardExpiryDate).toISOString().split('T')[0]) : ""} />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="font-bold flex items-center gap-2 text-sm uppercase text-muted-foreground tracking-wider">Tessera Ente</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="entityCardType">Ente</Label>
                                    <Select name="entityCardType" defaultValue={member?.entityCardType || ""}>
                                        <SelectTrigger><SelectValue placeholder="Ente" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CSEN">CSEN</SelectItem>
                                            <SelectItem value="ACSI">ACSI</SelectItem>
                                            <SelectItem value="AICS">AICS</SelectItem>
                                            <SelectItem value="UISP">UISP</SelectItem>
                                            <SelectItem value="CSI">CSI</SelectItem>
                                            <SelectItem value="ALTRO">Altro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entityCardNumber">Numero</Label>
                                    <Input id="entityCardNumber" name="entityCardNumber" defaultValue={member?.entityCardNumber || ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entityCardIssueDate">Rilascio</Label>
                                    <Input id="entityCardIssueDate" name="entityCardIssueDate" type="date" defaultValue={member?.entityCardIssueDate ? (typeof member.entityCardIssueDate === 'string' ? member.entityCardIssueDate : new Date(member.entityCardIssueDate).toISOString().split('T')[0]) : ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entityCardExpiryDate">Scadenza</Label>
                                    <Input id="entityCardExpiryDate" name="entityCardExpiryDate" type="date" defaultValue={member?.entityCardExpiryDate ? (typeof member.entityCardExpiryDate === 'string' ? member.entityCardExpiryDate : new Date(member.entityCardExpiryDate).toISOString().split('T')[0]) : ""} />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="space-y-0.5">
                                <h5 className="font-bold text-blue-900 text-sm">Certificato Medico</h5>
                                <p className="text-xs text-blue-700">Abilita per inserire la data di scadenza</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={hasMedicalCert}
                                    onChange={(e) => setHasMedicalCert(e.target.checked)}
                                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                />
                                {hasMedicalCert && (
                                    <Input
                                        name="medicalCertificateExpiry"
                                        type="date"
                                        defaultValue={member?.medicalCertificateExpiry ? (typeof member.medicalCertificateExpiry === 'string' ? member.medicalCertificateExpiry : new Date(member.medicalCertificateExpiry).toISOString().split('T')[0]) : ""}
                                        className="h-9 w-36 bg-white"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="isMinorEdit"
                                checked={isMinorChecked}
                                onChange={(e) => setIsMinorChecked(e.target.checked)}
                                className="w-5 h-5 rounded"
                            />
                            <Label htmlFor="isMinorEdit" className="font-bold cursor-pointer">Partecipante Minorenne</Label>
                        </div>

                        {isMinorChecked && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border mb-6">
                                {/* Madre */}
                                <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-primary border-b pb-1 uppercase">Dati Madre</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input name="motherFirstName" placeholder="Nome" defaultValue={member?.motherFirstName || ""} className="h-8 text-xs" />
                                        <Input name="motherLastName" placeholder="Cognome" defaultValue={member?.motherLastName || ""} className="h-8 text-xs" />
                                    </div>
                                    <Input name="motherFiscalCode" placeholder="Codice Fiscale" defaultValue={member?.motherFiscalCode || ""} className="h-8 text-xs font-mono uppercase" maxLength={16} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input name="motherPhone" placeholder="Tel" defaultValue={member?.motherPhone || ""} className="h-8 text-xs" />
                                        <Input name="motherMobile" placeholder="Cell" defaultValue={member?.motherMobile || ""} className="h-8 text-xs" />
                                    </div>
                                    <Input name="motherEmail" placeholder="Email" defaultValue={member?.motherEmail || ""} className="h-8 text-xs" />
                                </div>
                                {/* Padre */}
                                <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-primary border-b pb-1 uppercase">Dati Padre</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input name="fatherFirstName" placeholder="Nome" defaultValue={member?.fatherFirstName || ""} className="h-8 text-xs" />
                                        <Input name="fatherLastName" placeholder="Cognome" defaultValue={member?.fatherLastName || ""} className="h-8 text-xs" />
                                    </div>
                                    <Input name="fatherFiscalCode" placeholder="Codice Fiscale" defaultValue={member?.fatherFiscalCode || ""} className="h-8 text-xs font-mono uppercase" maxLength={16} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input name="fatherPhone" placeholder="Tel" defaultValue={member?.fatherPhone || ""} className="h-8 text-xs" />
                                        <Input name="fatherMobile" placeholder="Cell" defaultValue={member?.fatherMobile || ""} className="h-8 text-xs" />
                                    </div>
                                    <Input name="fatherEmail" placeholder="Email" defaultValue={member?.fatherEmail || ""} className="h-8 text-xs" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="notes">Note Interne</Label>
                            <Textarea id="notes" name="notes" defaultValue={member?.notes || ""} rows={2} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={handleClose}>Annulla</Button>
                            <Button type="submit" disabled={updateMutation.isPending || hasConflicts} className="min-w-[120px]">
                                {updateMutation.isPending ? <RotateCcw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Salva
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog >
    );
}
