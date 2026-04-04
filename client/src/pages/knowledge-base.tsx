import { useState } from "react";
import { BookOpen, ShieldAlert, FileText, CheckCircle2, Shield, Info, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function KnowledgeBase() {
  const [activeCategory, setActiveCategory] = useState<string>("sicurezza e permessi");

  const categories = [
    { id: "sicurezza e permessi", name: "Sicurezza e Permessi", icon: ShieldAlert },
    { id: "generale", name: "Istruzioni Generali", icon: FileText },
    { id: "anagrafica", name: "Gestione Anagrafica", icon: BookOpen }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Knowledge Base</h1>
        <p className="text-sm text-gray-500 mt-1">Scegli una categoria per leggere guide operative e regole aziendali.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 hover:shadow-none">
        <div className="space-y-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeCategory === c.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-white hover:bg-slate-50 text-slate-700 border"}`}
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
                  <span className="text-xs text-slate-500">Ultimo aggiornamento: Oggi</span>
                </div>
                <CardTitle className="text-2xl">Matrice Ufficiale dei Ruoli Aziendali</CardTitle>
                <CardDescription>
                  Guida operativa per comprendere "Chi vede e fa cosa" all'interno del Gestionale StarGem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50/50 p-4 flex items-start gap-3 rounded-lg border border-blue-100">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-900 leading-relaxed">
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
                      <AccordionTrigger className="hover:no-underline hover:bg-slate-50 px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">👑</span>
                          <div>
                            <p className="font-bold text-lg text-slate-900">1. Super Admin</p>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">La Direzione Generale & Proprietà</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100">
                            <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <p className="text-sm text-slate-700"><strong>TOTALE (100%).</strong> Nessuna preclusione.<br/>Gestisce importazioni, elimazioni, log di controllo e creazione di account lavorativi.</p>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50/50 border-red-100">
                            <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <p className="text-sm text-slate-700">Nulla.</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="hover:no-underline hover:bg-slate-50 px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🎩</span>
                          <div>
                            <p className="font-bold text-lg text-slate-900">2. Direttivo</p>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">Manager, Amministratori Delegati</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100">
                            <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>Amministrazione totale (Cassa, Report)</li>
                              <li>Gestione Listini e Sconti</li>
                              <li>Planning e Programmazione Date</li>
                              <li>Risorse Umane e Staff</li>
                            </ul>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50/50 border-red-100">
                            <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>Log e Audit di Sicurezza Sistema</li>
                              <li>Utenti e Permessi (Non può manipolare password o alzare il proprio ruolo)</li>
                              <li>Importazione Massiva e Reset Stagione</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger className="hover:no-underline hover:bg-slate-50 px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">💶</span>
                          <div>
                            <p className="font-bold text-lg text-slate-900">3. Back-Office</p>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">Segreteria Avanzata / Addetti Cassa</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100">
                            <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>Maschera Input, Anagrafica Generale</li>
                              <li>Emissione Nuove Tessere e Iscrizioni</li>
                              <li>Visualizzazione e Modifica Calendario / Planning</li>
                              <li>Incasellamento Soldi (`Lista Pagamenti`)</li>
                              <li>Affitti / Prenotazioni Aule</li>
                            </ul>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50/50 border-red-100">
                            <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Scheda Contabile e Resoconti Globali**</li>
                              <li>**Listini e Quote base** (Non possono cambiare i prezzi alla radice)</li>
                              <li>Gestione dipendenti e Utenti Sistema</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger className="hover:no-underline hover:bg-slate-50 px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">👥</span>
                          <div>
                            <p className="font-bold text-lg text-slate-900">4. Front-Desk</p>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">Reception Base / Smarcamento</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100">
                            <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Controllo Accessi** (per far entrare la gente)</li>
                              <li>**Maschera Input Locale**</li>
                              <li>*Visualizzazione* del Calendario Corsi (per dare informazioni)</li>
                              <li>Inserimento "Note" e "ToDo List" per colleghi</li>
                            </ul>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50/50 border-red-100">
                            <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Tutto il denaro.** Nessun accesso ai Pagamenti.</li>
                              <li>Anagrafica Generale.</li>
                              <li>Non sposta date, non vede listini né bilanci.</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                      <AccordionTrigger className="hover:no-underline hover:bg-slate-50 px-4 rounded-md">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-2xl">🧑‍🏫</span>
                          <div>
                            <p className="font-bold text-lg text-slate-900">5. Staff / Insegnante</p>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">Ruolo Consultivo Dedicato</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="border rounded-md p-3 bg-green-50/50 border-green-100">
                            <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> POTERI ATTIVI</p>
                            <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
                              <li>**Calendario Corsi (Sola Lettura)** (per vedere il proprio orario di lavoro)</li>
                              <li>**Iscritti per Attività** (Per fare l'appello dei soli corsisti propri)</li>
                              <li>Inserisci Nota</li>
                            </ul>
                          </div>
                          <div className="border rounded-md p-3 bg-red-50/50 border-red-100">
                            <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">🚫 COSA GLI VIENE NASCOSTO</p>
                            <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
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

          {activeCategory !== "sicurezza e permessi" && (
            <div className="flex flex-col h-64 items-center justify-center p-8 bg-slate-50 border rounded-lg border-dashed">
              <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Nessun articolo per questa categoria</h3>
              <p className="text-sm text-slate-500 text-center max-w-md mt-2">
                Le guide per la sottocategoria <strong>"{categories.find(c => c.id === activeCategory)?.name}"</strong> verranno inserite a breve dal team tecnico. Torna a visitarci prossimamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
