import { useState } from "react";
import { BookOpen, ShieldAlert, FileText, CheckCircle2, Shield, Info, ArrowRight, IdCard, GitMerge, Coins, Ticket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function KnowledgeBase() {
  const [activeCategory, setActiveCategory] = useState<string>("sicurezza e permessi");

  const categories = [
    { id: "sicurezza e permessi", name: "Sicurezza e Permessi", icon: ShieldAlert },
    { id: "generale", name: "Istruzioni Generali", icon: FileText },
    { id: "anagrafica", name: "Gestione Anagrafica", icon: BookOpen },
    { id: "gempass", name: "Logica GemPass & CRM", icon: IdCard },
    { id: "quote-promo", name: "Logica Quote e Promo", icon: Coins }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground mt-1">Scegli una categoria per leggere guide operative e regole aziendali.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 hover:shadow-none">
        <div className="space-y-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeCategory === c.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-background hover:bg-muted text-foreground/80 border"}`}
            >
              <c.icon className="w-4 h-4" />
              {c.name}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-4">
          {activeCategory === "sicurezza e permessi" && (
            <Card className="border-t-4 border-t-primary shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" /> Ufficiale</Badge>
                  <span className="text-xs text-muted-foreground">Ultimo aggiornamento: Oggi</span>
                </div>
                <CardTitle className="text-2xl">Matrice Ufficiale dei Ruoli Aziendali</CardTitle>
                <CardDescription>
                  Guida operativa per comprendere "Chi vede e fa cosa" all'interno del Gestionale StarGem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 flex items-start gap-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-900 dark:text-blue-300 leading-relaxed">
                    <p className="font-semibold mb-1">Come funzionano i Permessi (Security by Design)</p>
                    <p>Il gestionale maschera automaticamente le aree non abilitate. Se a un dipendente è bloccato l'accesso alla sezione "Incassi" o "Configurazioni", queste spariranno fisicamente dallo schermo e dal menu di sinistra, impedendo ogni tentazione o errore umano.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    I 5 Livelli di Qualifica <ArrowRight className="w-4 h-4 text-slate-400" />
                  </h3>
                  
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-3">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">👑</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">1. Super Admin</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">La Direzione Generale & Proprietà</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100 dark:border-green-900/50">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <p className="text-sm text-foreground/80"><strong>TOTALE (100%).</strong> Nessuna preclusione.<br/>Gestisce importazioni, elimazioni, log di controllo e creazione di account lavorativi.</p>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <p className="text-sm text-foreground/80">Nulla.</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🎩</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">2. Direttivo</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Manager, Amministratori Delegati</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100 dark:border-green-900/50">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>Amministrazione totale (Cassa, Report)</li>
                              <li>Gestione Listini e Sconti</li>
                              <li>Planning e Programmazione Date</li>
                              <li>Risorse Umane e Staff</li>
                            </ul>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>Log e Audit di Sicurezza Sistema</li>
                              <li>Utenti e Permessi (Non può manipolare password o alzare il proprio ruolo)</li>
                              <li>Importazione Massiva e Reset Stagione</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">💶</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">3. Back-Office</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Segreteria Avanzata / Addetti Cassa</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100 dark:border-green-900/50">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>Maschera Input, Anagrafica Generale</li>
                              <li>Emissione Nuove Tessere e Iscrizioni</li>
                              <li>Visualizzazione e Modifica Calendario / Planning</li>
                              <li>Incasellamento Soldi (`Lista Pagamenti`)</li>
                              <li>Affitti / Prenotazioni Aule</li>
                            </ul>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Scheda Contabile e Resoconti Globali**</li>
                              <li>**Listini e Quote base** (Non possono cambiare i prezzi alla radice)</li>
                              <li>Gestione dipendenti e Utenti Sistema</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">👥</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">4. Front-Desk</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Reception Base / Smarcamento</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100 dark:border-green-900/50">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Controllo Accessi** (per far entrare la gente)</li>
                              <li>**Maschera Input Locale**</li>
                              <li>*Visualizzazione* del Calendario Corsi (per dare informazioni)</li>
                              <li>Inserimento "Note" e "ToDo List" per colleghi</li>
                            </ul>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Tutto il denaro.** Nessun accesso ai Pagamenti.</li>
                              <li>Anagrafica Generale.</li>
                              <li>Non sposta date, non vede listini né bilanci.</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🧑‍🏫</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">5. Staff / Insegnante</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Ruolo Consultivo Dedicato</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100 dark:border-green-900/50">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Calendario Corsi (Sola Lettura)** (per vedere il proprio orario di lavoro)</li>
                              <li>**Iscritti per Attività** (Per fare l'appello dei soli corsisti propri)</li>
                              <li>Inserisci Nota</li>
                            </ul>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Il 90% dell'Azienda**. Dalla contabilità all'anagrafica globale, ai listini, fino alle comunicazioni private del team.</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === "gempass" && (
            <Card className="border-t-4 border-t-amber-500 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><GitMerge className="w-3 h-3 mr-1" /> Architettura di Sistema</Badge>
                  <span className="text-xs text-muted-foreground">Ultimo aggiornamento: Oggi</span>
                </div>
                <CardTitle className="text-2xl">Flusso GemPass & Integrazione CRM</CardTitle>
                <CardDescription>
                  Regole architetturali per la gestione dei Tesseramenti, Certificati Medici e interazione con l'Anagrafica.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3 rounded-lg border border-amber-100 dark:border-amber-900/50">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
                    <p className="font-semibold mb-1">AG-RULE-0002: La Maschera Input è il centro del sistema</p>
                    <p>Il modulo GemPass non è un'entità di inserimento dati a sé stante. L'unica e sola "Source of Truth" del gestionale risiede nella Maschera Input (CRM). Ogni modifica o inserimento di una tessera DEVE passare per l'anagrafica del socio.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🗼</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">Il GemPass è una "Torre di Controllo"</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Ruolo in Read-Only</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                          La pagina <strong>GemPass — Tesseramenti</strong> serve esclusivamente per "fare la guardia". Consente alla segreteria di filtrare le tessere in scadenza, vedere chi ha il certificato medico rosso e avere un colpo d'occhio rapido sulla conformità legale della palestra. Non serve a inserire i dati.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🌉</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">Il Tasto "Dettaglio" (Il Ponte)</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Navigazione al CRM</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                          Cliccando su <strong>Dettaglio</strong> (o sul nome dell'utente), il sistema NON deve aprire un piccolo popup limitato. Il pulsante funge da teletrasporto: reindirizza l'operatore direttamente alla <strong>Maschera Input</strong> del socio. 
                          <br /><br />
                          <strong>Perché?</strong> Perché una tessera irregolare implica quasi sempre il bisogno di verificare altri dati: se ha firmato la Privacy (Allegati), se ha pagato (Contabilità), o i contatti per chiamarlo.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">⏳</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">Le 4 Combinazioni del Tesseramento</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Gestione date e scadenze</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                          Il sistema calcola la data di scadenza (sempre al <strong>31 Agosto</strong>) in base all'incrocio di due parametri fondamentali selezionabili dal desk (<strong>Tipo</strong> e <strong>Competenza</strong>):
                        </p>
                        <div className="space-y-3 mt-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                            <p className="font-bold text-sm text-foreground">1. Nuovo + Corrente</p>
                            <p className="text-xs text-muted-foreground mt-1">Socio alla prima iscrizione a metà anno. La tessera viene generata per l'anno in corso e scadrà il <strong>31 Agosto della stagione attuale</strong>.</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                            <p className="font-bold text-sm text-foreground">2. Rinnovo + Corrente</p>
                            <p className="text-xs text-muted-foreground mt-1">Vecchio socio che rinnova in ritardo o rientra durante l'anno. Il sistema mantiene la continuità associativa e fa scadere la tessera il <strong>31 Agosto della stagione attuale</strong>.</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                            <p className="font-bold text-sm text-foreground">3. Nuovo + Successiva</p>
                            <p className="text-xs text-muted-foreground mt-1">Nuovo cliente che si iscrive "in anticipo" a fine anno sportivo (es. promo Maggio/Giugno). Viene garantita la copertura per l'anno successivo. Scadenza al <strong>31 Agosto dell'anno prossimo</strong>.</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                            <p className="font-bold text-sm text-foreground">4. Rinnovo + Successiva</p>
                            <p className="text-xs text-muted-foreground mt-1">Rinnovo classico "Early Bird" di fine anno per un socio già attivo. Viene registrata l'iscrizione per l'anno che sta per iniziare. Scadenza al <strong>31 Agosto dell'anno prossimo</strong>.</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🔄</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">Logica "Rinnovo Rapido" (Upsell)</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Automazione di rinnovo</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                          L'azione <strong>Rinnova</strong> reindirizza l'operatore alla Maschera Input del socio in modalità "Pre-Armata":
                        </p>
                        <ul className="text-sm text-foreground/80 space-y-2 mt-3 list-disc ml-4">
                          <li>La <em>Competenza</em> scala automaticamente alla stagione successiva.</li>
                          <li>Il <em>Tipo</em> diviene automaticamente "Rinnovo".</li>
                          <li>Al salvataggio, il backend (<code>syncMembershipFromMember</code>) fissa automaticamente la data di scadenza al <strong>31 Agosto</strong>.</li>
                          <li>Viene generato un carrello virtuale pronto da saldare per la quota tessera.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === "quote-promo" && (
            <Card className="border-t-4 border-t-emerald-500 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><Coins className="w-3 h-3 mr-1" /> Architettura Prezzi</Badge>
                  <span className="text-xs text-muted-foreground">Ultimo aggiornamento: Oggi</span>
                </div>
                <CardTitle className="text-2xl">Gestione Quote, Open e Promozioni</CardTitle>
                <CardDescription>
                  Hub centrale per Listini, Abbonamenti (Open) e Regole di Sconto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-start gap-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                  <Info className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-emerald-900 dark:text-emerald-300 leading-relaxed">
                    <p className="font-semibold mb-1">Hub Centralizzato (Integrazione Globale)</p>
                    <p>Qualsiasi quota, pacchetto Open o Promozione creata nel modulo "Quote e Promo" viene automaticamente distribuita in tutto il gestionale. Quando sei in Maschera Input per un pagamento, il carrello legge in tempo reale questi dati e applica le scadenze e le logiche di cumulabilità create qui.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">📦</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">Pacchetti OPEN e Abbonamenti</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Gestione prodotti multi-accesso</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2 font-semibold">I pacchetti "Open" NON sono Corsi e NON vanno inseriti nel modulo Corsi/Calendario.</p>
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                          I pacchetti (come "Open Danza", "Open Fitness") sono <strong>Prodotti Commerciali</strong>. Vanno creati nell'Hub Quote e Promo sotto la scheda "Carnet attivi" o "Listino Prezzi".
                        </p>
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 border rounded-md">
                          <p className="font-bold text-sm">Flusso Corretto di Vendita:</p>
                          <ol className="text-sm space-y-2 mt-2 list-decimal ml-4">
                            <li><strong>Acquisto:</strong> In Maschera Input, vendi al cliente l'Abbonamento Open e incassi l'importo totale.</li>
                            <li><strong>Iscrizione:</strong> Successivamente, iscrivi l'allievo ai singoli corsi reali a cui vuole partecipare. Dato che ha già il pacchetto Open, il costo dell'iscrizione al corso sarà 0€ (o coperto dall'Open).</li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-1b">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🔗</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">Il Prezzo del Corso vs Il Prodotto Commerciale</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Come si parlano i database?</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                          Esiste una chiara distinzione tra <strong>L'Infrastruttura Fisica</strong> (i Corsi) e i <strong>Prodotti Commerciali</strong> (Quote e Promo).
                        </p>
                        <ul className="text-sm text-foreground/80 space-y-3 mt-3 list-disc ml-4">
                          <li><strong>Il Prezzo nel Modale Corso:</strong> Quando crei o duplichi un Corso e inserisci un "Prezzo" in quel modale, stai creando una vendita <em>stand-alone</em> (ad es. un Workshop singolo a 10€ slegato da tutto). Per i corsi normali (Danza, Fitness), <strong>quel campo deve restare vuoto</strong>.</li>
                          <li><strong>Collegamento a Quota:</strong> Sempre nel modale del Corso, avrai la possibilità di collegarlo a una Quota fissa creata in `/quote-promo`. Questo indica al sistema che per iscriversi a quel corso bisogna acquistare quella precisa Quota.</li>
                          <li><strong>Logica Open Danza:</strong> Se il cliente compra "Open Danza" a 1300€ (Prodotto in Quote e Promo), il sistema registra nel suo profilo un semaforo verde. Quando poi andrai a iscriverlo fisicamente al corso "Afro-Dancehall", il gestionale controllerà le categorie del corso e dell'Open, vedrà che c'è compatibilità, e valuterà l'iscrizione a 0€.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🏷️</span>
                          <div>
                            <p className="font-bold text-lg text-foreground">Promozioni e Scadenze</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">Sconti, validità e cumulabilità</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                          La scheda "Promo e convenzioni" ti permette di creare codici sconto in % o a valore fisso. 
                        </p>
                        <ul className="text-sm text-foreground/80 space-y-2 mt-3 list-disc ml-4">
                          <li><strong>Date Limite:</strong> Le promo possono avere un "Valido Da" e un "Valido A" (es. da domani a fine maggio). Dal giorno successivo alla scadenza, il sistema mostrerà la targhetta rossa <Badge variant="destructive" className="px-1 py-0 h-4 text-[10px]">SCADUTO</Badge> e bloccherà l'utilizzo del codice nei pagamenti.</li>
                          <li><strong>Limiti di utilizzo:</strong> Puoi impostare "Usi Massimi" (es. "Sconto valido per i primi 100").</li>
                          <li><strong>No Open:</strong> Se flaggato, il sistema impedirà di applicare lo sconto per l'acquisto di Pacchetti Open.</li>
                          <li><strong>No Cumulabile:</strong> Se flaggato, lo sconto annulla altri sconti presenti nel carrello.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory !== "sicurezza e permessi" && activeCategory !== "gempass" && activeCategory !== "quote-promo" && (
            <div className="flex flex-col h-64 items-center justify-center p-8 bg-muted border rounded-lg border-dashed">
              <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Nessun articolo per questa categoria</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                Le guide per la sottocategoria <strong>"{categories.find(c => c.id === activeCategory)?.name}"</strong> verranno inserite a breve dal team tecnico. Torna a visitarci prossimamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
