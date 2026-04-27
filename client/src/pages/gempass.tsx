import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle2, AlertCircle, CheckCircle, Clock, XCircle, Users } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MembershipRecord {
  id: number;
  memberId: number;
  membershipNumber: string;
  membershipType: string | null;
  seasonCompetence: string | null;
  status: string;
  expiryDate: string | null;
  fee: string | null;
  memberFirstName?: string;
  memberLastName?: string;
  memberFiscalCode?: string;
}

export default function GemPass() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStato, setFilterStato] = useState('all');

  // --- TAB 2 STATES ---
  const [cfSearch, setCfSearch] = useState('');
  const [memberFound, setMemberFound] = useState<any>(null);
  const [isNewMember, setIsNewMember] = useState(false);
  const [formData, setFormData] = useState({
    cognome: '', nome: '', natoA: '', dataNascita: '',
    residenza: '', via: '', civico: '', cap: '',
    codiceFiscale: '', cellulare: '', email: '',
    comeHaiConosciuto: '',
  });
  const [membershipType, setMembershipType] = useState('adulto');
  const [seasonId, setSeasonId] = useState<number>(0);
  const [docs, setDocs] = useState({ regolamento: false, privacy: false, liberatoria: false });
  const [firmato, setFirmato] = useState(false);

  // --- STATI TAB 3: Firme ---
  const [filterDocType, setFilterDocType] = useState('all');
  const [searchDocMember, setSearchDocMember] = useState('');
  const [filterSeasonDoc, setFilterSeasonDoc] = useState('all');

  const firmeQueryKey = filterSeasonDoc === 'all' 
    ? '/api/gempass/firme-all' 
    : `/api/gempass/firme-all?season_id=${filterSeasonDoc}`;
  
  const { data: firme = [] } = useQuery<any[]>({
    queryKey: [firmeQueryKey],
  });

  const filteredFirme = firme.filter((f) => {
    const matchSearch = searchDocMember === '' || 
      (f.memberFirstName && f.memberFirstName.toLowerCase().includes(searchDocMember.toLowerCase())) ||
      (f.memberLastName && f.memberLastName.toLowerCase().includes(searchDocMember.toLowerCase())) ||
      String(f.memberId).includes(searchDocMember);
    const matchTipo = filterDocType === 'all' || f.formType === filterDocType;
    const matchSeason = filterSeasonDoc === 'all' || String(f.seasonId) === filterSeasonDoc;
    return matchSearch && matchTipo && matchSeason;
  });

  // --- STATI TAB RINNOVO TESSERA ---
  const [isRinnovoOpen, setIsRinnovoOpen] = useState(false);
  const [selectedTessera, setSelectedTessera] = useState<any>(null);

  const rinnovaTesseraMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/gempass/tessere/${selectedTessera.id}/rinnova`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Successo', description: 'Tessera rinnovata correttamente per la nuova stagione.' });
      queryClient.invalidateQueries({ queryKey: ['/api/memberships'] });
      setIsRinnovoOpen(false);
      setSelectedTessera(null);
    },
    onError: (err: any) => {
      toast({ title: 'Errore', description: err.message || 'Impossibile rinnovare la tessera', variant: 'destructive' });
    }
  });

  const handleRinnovaClick = (tessera: any) => {
    setSelectedTessera(tessera);
    setIsRinnovoOpen(true);
  };




  // Parent States
  const [tutore1, setTutore1] = useState({
    cognome: '', nome: '', codiceFiscale: '', cellulare: '', email: ''
  });
  const [tutore2, setTutore2] = useState({
    cognome: '', nome: '', codiceFiscale: '', cellulare: '', email: ''
  });
  const [firmaTutore1, setFirmaTutore1] = useState(false);
  const [firmaTutore2, setFirmaTutore2] = useState(false);

  // Queries
  const { data: memberships = [], isLoading } = useQuery<MembershipRecord[]>({
    queryKey: ['/api/memberships'],
  });


  const { data: activeSeasonRaw } = useQuery<any>({
    queryKey: ['/api/seasons/active'],
  });

  // Calculate form seasons for Tab 2
  const formSeasons: any[] = [];
  let s1Code = '2526';
  let s2Code = '2627';
  let endYear1 = 2026;
  let endYear2 = 2027;

  if (activeSeasonRaw) {
    const active = Array.isArray(activeSeasonRaw) ? activeSeasonRaw[0] : activeSeasonRaw;
    if (active) {
      const startY = active.startDate ? new Date(active.startDate).getFullYear() : 2025;
      const endY = active.endDate ? new Date(active.endDate).getFullYear() : startY + 1;
      s1Code = `${String(startY).slice(-2)}${String(endY).slice(-2)}`;
      s2Code = `${String(startY + 1).slice(-2)}${String(endY + 1).slice(-2)}`;
      endYear1 = endY;
      endYear2 = endY + 1;

      formSeasons.push({ id: active.id, name: `Stagione ${startY}-${endY}`, seasonCode: s1Code, endYear: endYear1 });
      formSeasons.push({ id: active.id + 1, name: `Stagione ${startY + 1}-${endY + 1}`, seasonCode: s2Code, endYear: endYear2 });
    }
  }
  
  if (formSeasons.length === 0) {
    formSeasons.push({ id: 1, name: 'Stagione 2025-2026', seasonCode: '2526', endYear: 2026 });
    formSeasons.push({ id: 2, name: 'Stagione 2026-2027', seasonCode: '2627', endYear: 2027 });
  }

  // Initialize seasonId if not set
  useEffect(() => {
    if (seasonId === 0 && formSeasons.length > 0) {
      setSeasonId(formSeasons[0].id);
    }
  }, [formSeasons, seasonId]);

  // Tab 1 UI / Logic methods
  const getComputedStatus = (m: MembershipRecord) => {
    if (m.status === 'suspended') return 'SOSPESA';
    if (m.status === 'expired') return 'SCADUTA';
    if (m.status === 'active') {
      if (m.expiryDate) {
        const daysLeft = differenceInDays(parseISO(m.expiryDate), new Date());
        if (daysLeft <= 30) return 'IN SCADENZA';
      }
      return 'ATTIVA';
    }
    return m.status;
  };

  // --- CALCOLI TAB 4: Statistiche ---
  const statAttive = memberships.filter(m => getComputedStatus(m) === 'ATTIVA').length;
  const statScadenza = memberships.filter(m => getComputedStatus(m) === 'IN SCADENZA').length;
  const statScadute = memberships.filter(m => getComputedStatus(m) === 'SCADUTA').length;
  const statTotale = memberships.length;

  const getStatusBadgeVariant = (computedStatus: string) => {
    switch (computedStatus) {
      case 'ATTIVA': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'IN SCADENZA': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'SCADUTA': return 'bg-red-500 hover:bg-red-600';
      case 'SOSPESA': return 'bg-slate-400 hover:bg-slate-500';
      default: return 'bg-slate-400 hover:bg-slate-500';
    }
  };

  const getTypeBadgeInfo = (membershipType: string | null) => {
    const typeLower = membershipType?.toLowerCase();
    if (typeLower === 'adulto' || typeLower === 'adult') return { label: 'ADU', className: 'bg-blue-500 hover:bg-blue-600 text-white' };
    if (typeLower === 'minore' || typeLower === 'minor') return { label: 'MIN', className: 'bg-purple-500 hover:bg-purple-600 text-white' };
    if (typeLower === 'b2b') return { label: 'B2B', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
    return { label: '—', className: 'bg-slate-300 text-slate-700 hover:bg-slate-400' };
  };

  const filtered = memberships.filter(m => {
    const memberFullName = `${m.memberLastName || ''} ${m.memberFirstName || ''}`.trim();
    
    const matchSearch = !search ||
      m.membershipNumber?.toLowerCase().includes(search.toLowerCase()) ||
      memberFullName.toLowerCase().includes(search.toLowerCase());
      
    const computedStato = getComputedStatus(m);
    const typeLabel = getTypeBadgeInfo(m.membershipType).label;
    
    let matchTipo = true;
    if (filterTipo !== 'all') {
      if (filterTipo === 'adulto' && typeLabel !== 'ADU') matchTipo = false;
      if (filterTipo === 'minore' && typeLabel !== 'MIN') matchTipo = false;
      if (filterTipo === 'b2b' && typeLabel !== 'B2B') matchTipo = false;
    }

    let matchStato = true;
    if (filterStato !== 'all') {
      if (filterStato === 'attiva' && computedStato !== 'ATTIVA') matchStato = false;
      if (filterStato === 'in-scadenza' && computedStato !== 'IN SCADENZA') matchStato = false;
      if (filterStato === 'scaduta' && computedStato !== 'SCADUTA') matchStato = false;
    }

    return matchSearch && matchTipo && matchStato;
  });

  // Tab 2 Functions
  const handleSearchCF = async () => {
    if (!cfSearch.trim()) return;
    try {
      const res = await fetch(`/api/members?search=${cfSearch}`);
      const data = await res.json();
      const membersArray = Array.isArray(data) ? data : (data.members || []);
      const found = membersArray.find((m: any) =>
        m.fiscalCode?.toUpperCase() === cfSearch.toUpperCase()
      );
      if (found) {
        setMemberFound(found);
        setIsNewMember(false);
        setFormData({
          cognome: found.lastName ?? '',
          nome: found.firstName ?? '',
          codiceFiscale: found.fiscalCode ?? '',
          cellulare: found.phone ?? '',
          email: found.email ?? '',
          natoA: '', 
          dataNascita: found.birthDate ? new Date(found.birthDate).toISOString().split('T')[0] : '',
          residenza: '', via: '', civico: '', cap: '',
          comeHaiConosciuto: '',
        });
      } else {
        setMemberFound(null);
        setIsNewMember(true);
        setFormData(prev => ({ ...prev, codiceFiscale: cfSearch.toUpperCase() }));
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Errore API", description: "Impossibile completare la ricerca del CF.", variant: "destructive" });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const targetSeasonInfo = formSeasons.find(s => s.id === seasonId) || formSeasons[0];
  const seasonCode = targetSeasonInfo?.seasonCode || '2526';
  const membershipNumberPreview = memberFound
    ? `${seasonCode}-${String(memberFound.id).padStart(6, '0')}`
    : `${seasonCode}-??????`;

  const canSubmit = formData.cognome && formData.nome && formData.codiceFiscale &&
    formData.cellulare && formData.email && formData.natoA && formData.dataNascita && 
    formData.residenza && formData.via && formData.civico && formData.cap &&
    docs.regolamento && docs.privacy && firmato &&
    (membershipType !== 'minore' || (
      tutore1.cognome && tutore1.nome && tutore1.codiceFiscale &&
      tutore2.cognome && tutore2.nome && tutore2.codiceFiscale &&
      firmaTutore1 && firmaTutore2
    ));

  const createTesseraMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/gempass/tessere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? err.message ?? 'Errore creazione tessera');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: '✅ Tessera creata',
        description: `N. ${data.membershipNumber} — scade il ${
          new Date(data.expiryDate).toLocaleDateString('it-IT')
        }`,
      });
      setFormData({ 
        cognome:'', nome:'', natoA:'', dataNascita:'',
        residenza:'', via:'', civico:'', cap:'',
        codiceFiscale:'', cellulare:'', email:'', comeHaiConosciuto:'' 
      });
      setMemberFound(null);
      setIsNewMember(false);
      setCfSearch('');
      setDocs({ regolamento: false, privacy: false, liberatoria: false });
      setFirmato(false);
      setTutore1({ cognome: '', nome: '', codiceFiscale: '', cellulare: '', email: '' });
      setTutore2({ cognome: '', nome: '', codiceFiscale: '', cellulare: '', email: '' });
      setFirmaTutore1(false);
      setFirmaTutore2(false);
      
      queryClient.invalidateQueries({ queryKey: ['/api/gempass/tessere'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memberships'] });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {
      member_id: memberFound?.id ?? null,
      membership_type: membershipType,
      season_competence: seasonCode,
      season_start_year: targetSeasonInfo ? targetSeasonInfo.endYear - 1 : 2025,
      season_end_year: targetSeasonInfo ? targetSeasonInfo.endYear : 2026,
      anagrafica: memberFound ? null : formData,
      docs_firmati: docs,
      notes: null,
      tutore1: membershipType === 'minore' ? tutore1 : null,
      tutore2: membershipType === 'minore' ? tutore2 : null,
    };
    createTesseraMutation.mutate(payload);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GemPass — Tesseramenti</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestione tessere associative GEOS SSDRL
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-50/50">
            Stagione {formSeasons.length > 0 ? formSeasons[0].name.replace('Stagione ', '') : '2025-2026'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="tessere-attive" className="w-full">
        <TabsList className="w-full justify-start overflow-auto">
          <TabsTrigger value="tessere-attive">Tessere Attive</TabsTrigger>
          <TabsTrigger value="nuova-domanda">Nuova Domanda</TabsTrigger>
          <TabsTrigger value="documenti-firme">Documenti & Firme</TabsTrigger>
          <TabsTrigger value="statistiche">Statistiche</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tessere-attive" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca numero o nome utente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div className="w-full sm:w-[160px]">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Tipo tessera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  <SelectItem value="adulto">Adulto</SelectItem>
                  <SelectItem value="minore">Minore</SelectItem>
                  <SelectItem value="b2b">B2B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[160px]">
              <Select value={filterStato} onValueChange={setFilterStato}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="attiva">Attiva</SelectItem>
                  <SelectItem value="in-scadenza">In Scadenza</SelectItem>
                  <SelectItem value="scaduta">Scaduta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="h-10 px-4 text-sm whitespace-nowrap">
              {filtered.length} tessere
            </Badge>
          </div>

          <div className="border rounded-md bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N. Tessera</TableHead>
                  <TableHead>Utente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Stagione</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nessuna tessera trovata per i filtri selezionati.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((m) => {
                    const memberFullName = `${m.memberLastName || ''} ${m.memberFirstName || ''}`.trim() || `ID: ${m.memberId}`;
                    const typeInfo = getTypeBadgeInfo(m.membershipType);
                    const computedStato = getComputedStatus(m);
                    const statoClass = getStatusBadgeVariant(computedStato);
                    
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.membershipNumber}</TableCell>
                        <TableCell>{memberFullName}</TableCell>
                        <TableCell>
                          <Badge className={typeInfo.className}>{typeInfo.label}</Badge>
                        </TableCell>
                        <TableCell>{m.seasonCompetence || '—'}</TableCell>
                        <TableCell>
                          {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statoClass}>{computedStato}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => console.log('Dettaglio', m.id)}>
                            Dettaglio
                          </Button>
                          {(computedStato === 'SCADUTA' || computedStato === 'IN SCADENZA') && (
                            <Button variant="default" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleRinnovaClick(m)}>
                              Rinnova
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="nuova-domanda" className="mt-4">
          <div className="bg-white border rounded-lg shadow-sm p-6 space-y-8">
            
            {/* SEZIONE A - Ricerca / Lookup */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Sezione A — Ricerca Anagrafica</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-1 flex-1 max-w-sm">
                  <Label>Codice Fiscale</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Inserisci CF per auto-fill..."
                      value={cfSearch}
                      onChange={e => setCfSearch(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchCF();
                        }
                      }}
                      className="uppercase"
                    />
                    <Button onClick={handleSearchCF}>Cerca</Button>
                  </div>
                </div>
              </div>

              {memberFound && (
                 <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-3">
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                   <p className="text-sm font-medium text-emerald-800">
                     Socio trovato in anagrafica: <span className="font-bold">{memberFound.lastName} {memberFound.firstName}</span>. I dati sono stati pre-compilati.
                   </p>
                 </div>
              )}

              {isNewMember && (
                 <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-3">
                   <AlertCircle className="w-5 h-5 text-amber-600" />
                   <p className="text-sm font-medium text-amber-800">
                     Socio non trovato. Verrà creata una nuova anagrafica — compila tutti i campi obbligatori.
                   </p>
                 </div>
              )}
            </div>

            {/* SEZIONE TIPO TESSERATO */}
            <div className="space-y-4 border-t pt-4">
              <h2 className="text-lg font-semibold border-b pb-2">Sezione Tipo Tesserato</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {[
                  { value: 'adulto', label: 'Adulto', sub: '18+ anni — 25€' },
                  { value: 'minore', label: 'Minore', sub: 'Under 18 — 15€' },
                  { value: 'b2b',    label: 'Azienda/Ente', sub: 'B2B — quota da definire' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMembershipType(opt.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      membershipType === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* SEZIONE B - Dati Anagrafici */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Sezione B — Dati Anagrafici</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Cognome <span className="text-red-500">*</span></Label>
                  <Input value={formData.cognome} onChange={e => handleInputChange('cognome', e.target.value)} disabled={!!memberFound} />
                </div>
                <div className="space-y-1">
                  <Label>Nome <span className="text-red-500">*</span></Label>
                  <Input value={formData.nome} onChange={e => handleInputChange('nome', e.target.value)} disabled={!!memberFound} />
                </div>
                <div className="space-y-1">
                  <Label>Nato a <span className="text-red-500">*</span></Label>
                  <Input value={formData.natoA} onChange={e => handleInputChange('natoA', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Data di nascita <span className="text-red-500">*</span></Label>
                  <Input type="date" value={formData.dataNascita} onChange={e => handleInputChange('dataNascita', e.target.value)} disabled={!!(memberFound && formData.dataNascita)} />
                </div>
                <div className="space-y-1">
                  <Label>Residente a (Città) <span className="text-red-500">*</span></Label>
                  <Input value={formData.residenza} onChange={e => handleInputChange('residenza', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Via/Piazza <span className="text-red-500">*</span></Label>
                  <Input value={formData.via} onChange={e => handleInputChange('via', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>N° Civico <span className="text-red-500">*</span></Label>
                  <Input value={formData.civico} onChange={e => handleInputChange('civico', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>CAP <span className="text-red-500">*</span></Label>
                  <Input value={formData.cap} onChange={e => handleInputChange('cap', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Codice Fiscale <span className="text-red-500">*</span></Label>
                  <Input value={formData.codiceFiscale} onChange={e => handleInputChange('codiceFiscale', e.target.value.toUpperCase())} className="uppercase" disabled={!!memberFound} />
                </div>
                <div className="space-y-1">
                  <Label>Cellulare <span className="text-red-500">*</span></Label>
                  <Input value={formData.cellulare} onChange={e => handleInputChange('cellulare', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Come ci hai conosciuti?</Label>
                  <Select value={formData.comeHaiConosciuto} onValueChange={(v) => handleInputChange('comeHaiConosciuto', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona opzione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Passaparola">Passaparola</SelectItem>
                      <SelectItem value="Social media">Social media</SelectItem>
                      <SelectItem value="Volantino/Locandina">Volantino/Locandina</SelectItem>
                      <SelectItem value="Già cliente">Già cliente</SelectItem>
                      <SelectItem value="Passando davanti">Passando davanti</SelectItem>
                      <SelectItem value="Altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* FLUSSO MINORE - DATI GENITORI */}
              {membershipType === 'minore' && (
                <div className="mt-8 space-y-4 border-t pt-6 bg-slate-50/50 p-4 rounded-lg">
                  <h3 className="font-bold text-base text-gray-800">
                    👨‍👩‍👧 Dati Genitori / Tutori Legali <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Campi obbligatori per tesseramento socio minore.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <h4 className="col-span-1 md:col-span-2 font-semibold text-sm text-gray-700 pb-2 border-b">Tutore 1</h4>
                    <div>
                      <Label>Cognome tutore 1 <span className="text-red-500">*</span></Label>
                      <Input value={tutore1.cognome} onChange={e => setTutore1(p => ({ ...p, cognome: e.target.value }))} placeholder="Cognome" />
                    </div>
                    <div>
                      <Label>Nome tutore 1 <span className="text-red-500">*</span></Label>
                      <Input value={tutore1.nome} onChange={e => setTutore1(p => ({ ...p, nome: e.target.value }))} placeholder="Nome" />
                    </div>
                    <div>
                      <Label>Codice Fiscale tutore 1 <span className="text-red-500">*</span></Label>
                      <Input value={tutore1.codiceFiscale} onChange={e => setTutore1(p => ({...p, codiceFiscale: e.target.value.toUpperCase()}))} placeholder="RSSMRA80A01H501Z" className="uppercase" />
                    </div>
                    <div>
                      <Label>Cellulare tutore 1</Label>
                      <Input value={tutore1.cellulare} onChange={e => setTutore1(p => ({ ...p, cellulare: e.target.value }))} placeholder="+39 333 000000" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <Label>Email tutore 1</Label>
                      <Input value={tutore1.email} onChange={e => setTutore1(p => ({ ...p, email: e.target.value }))} placeholder="email@esempio.it" type="email" />
                    </div>

                    {/* Tutore 2 */}
                    <h4 className="col-span-1 md:col-span-2 font-semibold text-sm text-gray-700 mt-6 pb-2 border-b">Tutore 2</h4>
                    <div>
                      <Label>Cognome tutore 2 <span className="text-red-500">*</span></Label>
                      <Input value={tutore2.cognome} onChange={e => setTutore2(p => ({ ...p, cognome: e.target.value }))} placeholder="Cognome" />
                    </div>
                    <div>
                      <Label>Nome tutore 2 <span className="text-red-500">*</span></Label>
                      <Input value={tutore2.nome} onChange={e => setTutore2(p => ({ ...p, nome: e.target.value }))} placeholder="Nome" />
                    </div>
                    <div>
                      <Label>Codice Fiscale tutore 2 <span className="text-red-500">*</span></Label>
                      <Input value={tutore2.codiceFiscale} onChange={e => setTutore2(p => ({...p, codiceFiscale: e.target.value.toUpperCase()}))} placeholder="RSSMRA80A01H501Z" className="uppercase" />
                    </div>
                    <div>
                      <Label>Cellulare tutore 2</Label>
                      <Input value={tutore2.cellulare} onChange={e => setTutore2(p => ({ ...p, cellulare: e.target.value }))} placeholder="+39 333 000000" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <Label>Email tutore 2</Label>
                      <Input value={tutore2.email} onChange={e => setTutore2(p => ({ ...p, email: e.target.value }))} placeholder="email@esempio.it" type="email" />
                    </div>
                  </div>

                  {/* Firma tutori */}
                  <div className="space-y-4 mt-6 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Checkbox id="firma-tutore1" checked={firmaTutore1} onCheckedChange={(v) => setFirmaTutore1(!!v)} />
                      <Label htmlFor="firma-tutore1" className="text-sm font-medium cursor-pointer">
                        Confermo che il Tutore 1 HA FIRMATO la domanda cartacea <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="firma-tutore2" checked={firmaTutore2} onCheckedChange={(v) => setFirmaTutore2(!!v)} />
                      <Label htmlFor="firma-tutore2" className="text-sm font-medium cursor-pointer">
                        Confermo che il Tutore 2 HA FIRMATO la domanda cartacea <span className="text-red-500">*</span>
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SEZIONE C - Stagione e Tipo Tessera */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Sezione C — Stagione Competenza</h2>
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <Select value={String(seasonId)} onValueChange={(v) => setSeasonId(Number(v))}>
                    <SelectTrigger className="w-full max-w-sm">
                      <SelectValue placeholder="Seleziona stagione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formSeasons.map((s) => (
                         <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="mt-4 p-4 bg-slate-50 border rounded-md text-sm space-y-2 max-w-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scadenza naturale tessera:</span>
                      <span className="font-medium">31/08/{targetSeasonInfo ? targetSeasonInfo.endYear : 2026}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assegnazione N° Tessera:</span>
                      <span className="font-bold text-primary">{membershipNumberPreview}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEZIONE D - Documenti Obbligatori */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Sezione D — Consensi Modulo Cartaceo</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="doc-rego" 
                    checked={docs.regolamento}
                    onCheckedChange={(c) => setDocs(p => ({...p, regolamento: c === true}))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="doc-rego" className="font-medium leading-normal cursor-pointer">
                      Accettazione Regolamento Interno GEOS SSDRL <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">Dichiara di conoscere e rispettare le norme statutarie e i regolamenti interni.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="doc-priv" 
                    checked={docs.privacy}
                    onCheckedChange={(c) => setDocs(p => ({...p, privacy: c === true}))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="doc-priv" className="font-medium leading-normal cursor-pointer">
                      Presa visione Privacy GDPR <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">Consenso al trattamento dei dati personali per obblighi istituzionali (Art. 13 DGPR).</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="doc-lib" 
                    checked={docs.liberatoria}
                    onCheckedChange={(c) => setDocs(p => ({...p, liberatoria: c === true}))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="doc-lib" className="font-medium leading-normal cursor-pointer">
                      Liberatoria Foto/Video (Facoltativo)
                    </Label>
                    <p className="text-xs text-muted-foreground">Autorizzazione alla pubblicazione gratuita di immagini/riprese per uso promozionale.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEZIONE E - Firma e Invio */}
            <div className="space-y-4 pt-4">
               <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-lg space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <Checkbox 
                       id="doc-firma" 
                       checked={firmato}
                       onCheckedChange={(c) => setFirmato(c === true)}
                       className="border-emerald-600 data-[state=checked]:bg-emerald-600"
                     />
                     <div className="grid gap-1 leading-none">
                       <Label htmlFor="doc-firma" className="font-bold text-emerald-900 cursor-pointer">
                         Confermo che il socio HA FIRMATO la Domanda Cartacea <span className="text-red-500">*</span>
                       </Label>
                       <p className="text-xs text-emerald-700 font-medium">Validazione digitale del documento: {format(new Date(), 'dd/MM/yyyy')}</p>
                     </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     {memberFound?.dataQualityFlag === 'mancano_dati_obbligatori' ? (
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <div className="cursor-not-allowed">
                               <Button 
                                 disabled
                                 className="bg-primary hover:bg-primary/90 min-w-[200px]"
                               >
                                 Crea Tessera e Iscrivi
                               </Button>
                             </div>
                           </TooltipTrigger>
                           <TooltipContent side="top" className="bg-red-600 text-white font-medium border-red-700">
                             Codice Fiscale mancante — impossibile emettere tessera. Aggiornare l'anagrafica prima di procedere.
                           </TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     ) : (
                       <Button 
                         onClick={handleSubmit} 
                         disabled={!canSubmit || createTesseraMutation.isPending}
                         className="bg-primary hover:bg-primary/90 min-w-[200px]"
                       >
                         {createTesseraMutation.isPending ? 'Creazione in corso...' : 'Crea Tessera e Iscrivi'}
                       </Button>
                     )}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documenti-firme" className="mt-4 border rounded-md min-h-[400px] bg-white">
          <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-end justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Cerca Socio */}
              <div className="flex flex-col max-w-xs space-y-1">
                <Label className="text-xs text-muted-foreground">Cerca Socio (o ID)</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Nome o cognome..." 
                    value={searchDocMember} 
                    onChange={(e) => setSearchDocMember(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* Filtro Tipo */}
              <div className="flex flex-col w-48 space-y-1">
                <Label className="text-xs text-muted-foreground">Tipo Documento</Label>
                <Select value={filterDocType} onValueChange={setFilterDocType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="DOMANDA_TESSERAMENTO">Domanda Tesseramento</SelectItem>
                    <SelectItem value="PRIVACY_ADULTI">Privacy Adulti</SelectItem>
                    <SelectItem value="PRIVACY_MINORI">Privacy Minori</SelectItem>
                    <SelectItem value="LIBERATORIA_VIDEO">Liberatoria Foto/Video</SelectItem>
                    <SelectItem value="REGOLAMENTO">Regolamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Stagione */}
              <div className="flex flex-col w-36 space-y-1">
                <Label className="text-xs text-muted-foreground">Stagione</Label>
                <Select value={filterSeasonDoc} onValueChange={setFilterSeasonDoc}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tutte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    {formSeasons.map((s) => (
                       <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="h-9 px-4 uppercase text-xs font-semibold tracking-wider">
                {filteredFirme.length} record
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
             <Table>
               <TableHeader>
                 <TableRow className="bg-slate-50 hover:bg-slate-50">
                   <TableHead className="w-[80px]">ID</TableHead>
                   <TableHead className="min-w-[200px]">Socio / ID</TableHead>
                   <TableHead>Tipo Documento</TableHead>
                   <TableHead>Versione</TableHead>
                   <TableHead>Stagione</TableHead>
                   <TableHead>Firmato da (Operatore)</TableHead>
                   <TableHead>Data Firma</TableHead>
                   <TableHead className="text-right">Stato</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredFirme.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                       Nessun documento trovato.
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredFirme.map((f) => (
                     <TableRow key={f.id}>
                       <TableCell className="text-xs text-muted-foreground">#{f.id}</TableCell>
                       <TableCell className="font-medium whitespace-nowrap">
                         {f.memberFirstName && f.memberLastName 
                           ? `${f.memberLastName} ${f.memberFirstName}`
                           : `Utente ID: ${f.memberId}`}
                       </TableCell>
                       <TableCell>
                         <Badge variant="outline" className="font-normal bg-slate-100 text-slate-800 border-none">
                           {f.formType.replace('_', ' ')}
                         </Badge>
                       </TableCell>
                       <TableCell className="text-sm text-slate-500 whitespace-nowrap">{f.formVersion}</TableCell>
                       <TableCell className="text-sm">{f.seasonId}</TableCell>
                       <TableCell className="text-sm text-slate-500">Gestore #{f.createdBy}</TableCell>
                       <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                         {f.signedAt ? format(parseISO(f.signedAt), "dd/MM/yyyy HH:mm") : "—"}
                       </TableCell>
                       <TableCell className="text-right">
                         {f.signedAt ? (
                           <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-3">
                             FIRMATO
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none px-3">
                             DA FIRMARE
                           </Badge>
                         )}
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
          </div>
        </TabsContent>

        <TabsContent value="statistiche" className="mt-4 min-h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-3" />
              <div className="text-4xl font-bold text-emerald-700">{statAttive}</div>
              <p className="text-sm font-medium text-emerald-600 mt-1 uppercase tracking-wide">Tessere Attive</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <Clock className="w-8 h-8 text-amber-500 mb-3" />
              <div className="text-4xl font-bold text-amber-700">{statScadenza}</div>
              <p className="text-sm font-medium text-amber-600 mt-1 uppercase tracking-wide">In Scadenza (30 gg)</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <XCircle className="w-8 h-8 text-red-500 mb-3" />
              <div className="text-4xl font-bold text-red-700">{statScadute}</div>
              <p className="text-sm font-medium text-red-600 mt-1 uppercase tracking-wide">Scadute</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
              <Users className="w-8 h-8 text-slate-500 mb-3" />
              <div className="text-4xl font-bold text-slate-700">{statTotale}</div>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Totale Stagione</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Rinnovo Tessera */}
      <Dialog open={isRinnovoOpen} onOpenChange={setIsRinnovoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rinnova Tessera</DialogTitle>
            <DialogDescription>
              Stai per rinnovare la tessera per la prossima stagione.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTessera && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-semibold text-slate-500">Socio:</span>
                <span>{selectedTessera.memberLastName} {selectedTessera.memberFirstName}</span>
                <span className="font-semibold text-slate-500">Tessera Attuale:</span>
                <span>{selectedTessera.membershipNumber} (Scadenza: {selectedTessera.expiryDate ? format(parseISO(selectedTessera.expiryDate), 'dd/MM/yyyy') : '—'})</span>
                <span className="font-semibold text-slate-500">Stagione Rinnovo:</span>
                <span className="font-medium">2026-2027 (2627)</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRinnovoOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => {
                rinnovaTesseraMutation.mutate({
                  season_competence: '2627',
                  season_start_year: 2026,
                  season_end_year: 2027
                });
              }}
              disabled={rinnovaTesseraMutation.isPending}
            >
              {rinnovaTesseraMutation.isPending ? 'Elaborazione...' : 'Conferma Rinnovo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
