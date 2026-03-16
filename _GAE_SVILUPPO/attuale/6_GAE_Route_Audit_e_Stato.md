# Audit Route e Stato Mappatura (Aggiornato Blocco 4)

Questo documento traccia la coerenza completa del routing dell'applicazione CourseManager, distinguendo in maniera netta i **nomi ufficiali di prodotto (UI)** dagli slug tecnici e dai componenti legacy. La classificazione dello stato rispetta la seguente semantica:
- **canonico**: route principale, nome e componente definitivi.
- **legacy tollerato**: alias o route vecchia usata tecnicamente per non spaccare link/bookmark.
- **placeholder**: pagina "in allestimento", non una 404.
- **da riallineare**: route con disallineamento UI / Concetto da sistemare in futuro.
- **candidato a eliminazione futura**: route tecnica o duplicato destinato al purge.

## 1. Segreteria Operativa

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Dashboard | `/` | `Dashboard` | canonico | Route principale operativa |
| Dashboard | `/dashboard` | `Dashboard` | legacy tollerato | Alias di `/` |
| Maschera Input | `/maschera-input` | `MascheraInputGenerale` | canonico | Modale rapida entry (Allineato Source of Truth) |
| Anagrafica Generale | `/anagrafica-generale` | `Members` | canonico | Tabella iscritti globale |
| Tessere e Certificati Medici | `/tessere-certificati` | `Memberships` | canonico | Motore Tessere |
| *Nessun UI* | `/tessere` | *Redirect* | legacy tollerato | Redirect pulito a `/tessere-certificati` |
| Generazione Tessere | `/generazione-tessere` | `CardGenerator` | canonico | Tool batch tessere |
| Controllo Accessi | `/accessi` | `AccessControl` | canonico | Scanner ingressi desk |

## 2. Amministrazione & Cassa

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Lista Pagamenti | `/pagamenti` | `Payments` | canonico | Storico transazioni (Allineato Modale UI) |
| Scheda Contabile | `/scheda-contabile` | `AccountingSheet` | canonico | Estratto conto utente |
| Report e Statistiche | `/report` | `Reports` | canonico | Motore data estrazione |

## 3. Attività e Didattica

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Attività | `/attivita` | `Attivita` | canonico | Hub padre STI |
| Iscritti per Attività | `/iscritti_per_attivita` | `IscrittiPerAttivita` | canonico | Presenze e tab globali |
| Categorie Attività | `/categorie-attivita` | `ActivityCategories` | canonico | Gestione alberature |
| Calendario Attività | `/calendario-attivita` | `CalendarPage` | canonico | Area per inserimento orario (Single-Entry Modal limitata a 10 attività day-by-day e Box a 5-righe). Aggiunte indicazioni di instradamento inverso (Vai alla Scheda) nei form modifica. Implementato Collision-Layout e Frontend Time-Conflict Blocker. |
| Planning | `/planning` | `Planning` | canonico | Mappa Strategica Multi-Stagione (Set-Ago). Evidenzia Oggi e Mese Corrente. Implementa il modale Bozza (Chiude/Ferie/Extra) e routing Corsi verso il calendario. |
| Studios / Sale | `/studios` | `Studios` | canonico | Gestione risorse fisiche |
| Affitti | `/prenotazioni-sale` | `StudioBookings` | da riallineare | **Attività ufficiale** (Nome UI definitivo). URL e componente legacy tecnico ("sale") da pulire. |
| Affitto Studio Medico | `/affitto-studio` | `StubAffittoStudio` (Wrapper) | placeholder | Sotto-caso / Modulo specifico futuro collegato ad "Affitti". |
| Eventi Esterni | `/attivita/servizi` | `BookingServices` | canonico | **Attività ufficiale**. Nome UI ormai consolidato; `/servizi` e `BookingServices` sono solo gli slug/componenti tecnici storici. Le vecchie chiamate "Servizi Extra" / "Prenotabili" non esistono più. |
| Merchandising | `/attivita/merchandising` | `StubMerchandising` (Wrapper) | placeholder | **Attività ufficiale** 100%. Momentaneamente su Stub/Placeholder ma gode degli stessi asset delle altre attività. |

### 3.1 Viste Dettaglio e Routing Interno (Attività e Didattica)

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| *Nessun UI* | `/corsi` | *Redirect* | legacy tollerato | Redirect pulito a `/attivita/corsi` |
| Dettaglio Corso | `/attivita/corsi` | `Courses` | canonico | Vera parent route STI per i corsi |
| *Nessun UI* | `/workshops` | *Redirect* | legacy tollerato | Redirect pulito a `/attivita/workshops` |
| Dettaglio Workshop | `/attivita/workshops` | `Workshops` | canonico | Vera parent route STI per workshops |
| Categorie Eventi Esterni | `/categorie-eventi-esterni` | `BookingServiceCategories` | canonico | Nome UI corretto. Slug corretto ad `/eventi-esterni` per distacco da legacy `servizi`. |
| Categorie Prove a Pagamento | `/categorie-prove-pagamento` | `PaidTrialsCategories` | canonico | Componente autonomo ma collegato ad `api/categories`. |
| Categorie Prove Gratuite | `/categorie-prove-gratuite` | `FreeTrialsCategories` | canonico | Componente autonomo ma collegato ad `api/categories`. |
| Categorie Lezioni Singole | `/categorie-lezioni-singole` | `SingleLessonsCategories` | canonico | Componente autonomo ma collegato ad `api/categories`. |
| Categorie Affitti | `/categorie-affitti` | `RentalsCategories` | canonico | Componente autonomo ma collegato ad `api/booking-service-categories`. |
| Categorie Merchandising | `/categorie-merchandising` | `StubCategorieMerchandising` | placeholder | Architettura categorie nativa per il nuovo modulo Attività. |
| Schede Legacy (Varie) | `/scheda-corso`, ecc. | `SchedaCorso`, `SchedaWorkshop`, ecc. | legacy tollerato | Vecchie schede agganciate a params in attesa di redesign |
| Viste Interne (Varie) | `/attivita/prove-pagamento`, ecc. | `PaidTrials`, `FreeTrials`, ecc. | legacy tollerato | Componenti isolati che andranno fusi in un'unica master view |
| Eventi Esterni (Orfana) | `/booking-services` | `BookingServices` | candidato a eliminazione futura | Orfana storicizzata dismessa dalla root, ri-inglobata correttamente in `/attivita/servizi`. |

## 4. Risorse Umane e Team

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Staff e Insegnanti | `/staff` | `Instructors` | canonico | Organico del centro |
| Inserisci Nota | `/inserisci-nota` | `NoteTeam` | canonico | Gestione compiti rapidi front-desk |
| Commenti Team | `/commenti` | `Commenti` | canonico | Ex "commenti log". Uniformato ufficiale |
| ToDo List | `/todo-list` | `TodoList` | canonico | Bacheca task condivisa |
| Knowledge Base | `/knowledge-base` | `StubKnowledgeBase` (Wrapper) | placeholder | Modulo Wiki aziendale in costruzione |

## 5. Configurazioni / Sistema

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Listini e Quote | `/listini` | `PriceLists` | canonico | Tool principale listini pricing (Allineato Source of Truth) |
| Listini (Legacy DB) | `/listini-old` | `ListiniHome` | candidato a eliminazione futura | Reliquia logica JSON, da sopprimere |
| Promo e Sconti | `/promo-sconti` | `StubPromoSconti` (Wrapper) | placeholder | Gestore rules couponing in allestimento |
| Pannello Admin Globale | `/admin` | `AdminPanel` | canonico | Impostazioni applicative core |
| Elenchi Custom | `/elenchi` | `Elenchi` | canonico | Lookup tables customizzabili |
| Importazione Dati | `/importa` | `ImportData` | canonico | Batch uploader da CSV |
| Utenti e Permessi | `/utenti-permessi` | `UtentiPermessi` | canonico | Controllo accessi dipendenti |
| Storico Eliminazioni | `/audit-logs` | `AuditLogs` | canonico | Soft-delete recycle bin |
| Reset Stagione | `/reset-stagione` | `ResetStagione` | canonico | Svuotamento anno accademico |
| StarGem Copilot | `/copilot` | `StubCopilot` (Wrapper) | placeholder | Modulo assistente virtuale AI integrato |
| View Lista Abbandonata | `/attivita-a-lista` | `StubAttivitaLista` (Wrapper) | candidato a eliminazione futura | Route sperimentale non completata |

## 6. Route Orfane & Tecniche Sconnesse

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| *Nessuno* | `/test-gae` | *(Variabile)* | candidato a eliminazione futura | Tool di collaudo sviluppatore. Nessun link UI |
| *Nessuno* | `*` (Es: `/pippo`) | `NotFound` | canonico | Route di Fallback puro 404 (Alert Giallo) totalmente disaccoppiata dagli Stub in allestimento |
