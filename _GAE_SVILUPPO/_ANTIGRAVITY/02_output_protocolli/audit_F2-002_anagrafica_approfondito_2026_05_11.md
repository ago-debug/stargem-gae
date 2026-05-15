---
aggiornato: 2026-05-12T00:15
ultima_verifica_vs_codice: 2026-05-12T00:15
validita_prevista: 14 giorni
fonti_verificate: [codebase client/]
---

# Audit F2-002: Mappatura Monolite Anagrafica (Maschera Input)

Questo documento analizza in profondità il monolite frontend legato alla Maschera Input Generale e all'area Anagrafica, ponendo le basi per un futuro spacchettamento.

## A. Mappa a blocchi `maschera-input-generale.tsx`
Il file `maschera-input-generale.tsx` pesa circa 2012 righe e agisce da "Motore" per l'intero CRM. Di seguito la struttura a blocchi logici:
- **Righe 1-144**: Import (librerie, hooks, componenti), configurazioni (come `AttivitaKey`), Typescript Interfaces (`AllegatiState`, `BottomSectionsState`, `GiftItem`) e Stati Default.
- **Righe 145-800**: Corpo di `MascheraInputGeneraleContent`. Contiene gli hooks custom (`useCFCheck`, `useBarcodeScanner`), la definizione locale di stati secondari (`payments`, `corsiDB`), e le Queries React Query (`useQuery` per corsi, pagamenti, abbonamenti). Contiene anche funzioni calcolate come il coloratore degli input (`getInputClassName`) e il decodificatore del CF.
- **Righe 801-1149**: Gestione URL (auto-load membro tramite `useEffect`), Logica di Search List con debounce, e il mastodontico `handleSelectMember` (usato per reidratare i complessi stati del Form UI quando si seleziona un utente dal DB, popolando JSON allegati, tessere, moduli di attività).
- **Righe 1150-1300**: `handleSave` e `saveMutation` (ovvero il costruttore del payload gigante che converte le centinaia di campi del form React in un unico oggetto per l'endpoint `POST /api/maschera-generale/save`).
- **Righe 1300-1480**: Computazione Validità (`isFormValid`), gestione Modali di creazione ricevute copia-incolla e logiche CRUD parziali sui `payments`.
- **Righe 1481-1640**: UI puro: Header Sticky fisso, Pulsantiera fissa superiore (ExportWizard, Pulisci, Salva, Nuovo), e "ScrollSpy" di Navigazione Tab/Ancore.
- **Righe 1640-1980**: Il vero e proprio Body Form. Diviso per "Card" / sezioni (Intestazione, Pagamenti) e import dei Tab children (`TabAnagrafica`, `TabAllegati`, `TabGift`, ecc.).
- **Righe 1980-2012**: L'entrypoint `MascheraInputGenerale` che si limita ad avvolgere tutto dentro `CrmFormProvider`.

## B. CrmFormContext (state + consumer)
Lo stato globale del CRM è accentrato in `client/src/components/crm/CrmFormContext.tsx` (~400 righe).
- **Schema State Condiviso**: 
  - `formData` (FormDataState, oltre 80 campi flat stringa).
  - `dirtyFields` (per gestire la logica "campo giallo" se appena editato, "campo verde" se salvato/precaricato, "campo rosso" se obbligatorio).
  - `allegati` (AllegatiState, configurazione dei PDF/Documenti richiesti e consegnati).
  - `bottomSectionsData` (Tessere, CertificatoMedico, Gift).
  - `attivitaCorso`, `attivitaCodice`, `attivitaEnrollmentDetails` (Iscrizioni live in editing).
- **Punti di consumo**: Quasi ogni componente dentro `components/crm/` importa e chiama `useCrmForm()` per interfacciarsi a questo mega-oggetto.
- **Flusso Provider → consumer**: L'Input in UI chiama `handleChange(field, value)` (dal Context) -> il Context aggiorna `setFormData` + `setDirtyFields` -> scatena un Rerender a cascata su tutti i componenti che ascoltano il Context -> il Context salva tutto in `sessionStorage` in background. Quando si clicca Salva, `maschera-input-generale.tsx` recupera i dati del Context per inviarli.

## C. Tab e validazioni
- **Tab Esistenti**:
  - `TabAnagrafica`: Dati utente, contatti, indirizzo. Se minorenne, aggancia dati Genitore 1 e 2.
  - `TabAllegati`: Switch fisici e meta-dati per Privacy, Regolamento, Detrazione fiscale, ecc.
  - `TabGift`: Array di buoni regalo, rimborsi/note credito.
  - `TabIscrizioni`: Lista visuale (Tabella) per mostrare i corsi attualmente attivi e le assenze.
  - `TabRicevute`: Storico dei pagamenti inseriti e stato (Saldato/Sospeso).
  - `TabMarketing`: Flag marketing / consensi opt-in privacy.
  - `TabTessere`: Dettagli abbonamenti (AICS/CONI, tipologia, num, validità).
  - `TabTutori`: Contatti emergenza.
- **Validazioni Zod**: **Assente**. Non vi è l'ombra di uno Schema Validation formale come Zod né un framework come `react-hook-form`. La validazione è artigianale (`isFormValid`) basata su costrutti IF hardcoded che verificano campi obbligatori o chiamano custom hook come `useCFCheck`.
- **Criticità**: Qualsiasi modifica in un campo text ("A") fa saltare tutto l'albero scatenando re-render pesantissimi poiché `CrmFormContext` è troppo largo e non splittato. Il check della form validity è sincrono su ogni re-render.

## D. State machine wizard + payload
- **State machine wizard**: Inesistente. Non è un wizard "step by step". I tab sono finti, in realtà è una long-page con scroll anchor (si clicca il tab e la pagina scorre con `scrollToSection()`).
- **Validazioni che bloccano**: Il tasto "Salva" si disabilita (`disabled={!isFormValid || hasConflicts}`) se mancano Nome, Cognome, CF, Email, Telefono, i dati genitore (per i minorenni), oppure in presenza di conflitti CF.
- **Payload "Mostruoso"**: Il `handleSave` crea un megazord-payload. Mappa oltre 50 campi piatti, stringhifica 4 grossi metadata JSON (`attachmentMetadata`, `giftMetadata`, `tessereMetadata`, `certificatoMedicoMetadata`), cicla sugli `attivitaCorso` per creare le righe di `enrollments` attese in base e formatta i `payments` sospesi/pagati. Genera una transazione HTTP gigantesca da 150+ nodi in un'unica `POST /api/maschera-generale/save`.

## E. members.tsx e altre pagine
- **`members.tsx` (Lista)**: È una pagina distaccata e indipendente dalla Maschera Input. Ha un proprio form per l'aggiunta "Rapida" (`InsertMember` gestita in proprio via Mutation diretta). Solo se l'utente clicca su `Modifica (Matita)`, la pagina fa redirect a `/anagrafica?memberId=X` agganciando la maschera input principale.
- **Campi mostrati in lista**: ID, Nome, Cognome, CF, Data Nascita, Luogo, Sesso, Tel, Email, N. Tessera, Scad. Tessera, Cert Medico, Status (Attivo/Inattivo), e Score Profilo CRM.
- **Fonte Dati**: Fetch via GET `/api/members` con query params (gestione server-side pagination/filtering).
- **Altre Pagine collegate**: `import-data.tsx` manipola le listature, la dashboard estrae le aggregazioni degli stessi membri e Componenti Modal condivisi (es: `DuplicateMergeModal`).

## F. 54 campi Athena nel codice
- **Dove si trovano**: Sono tutti incapsulati in `client/src/components/crm/CrmFormContext.tsx` sotto l'oggetto `defaultFormData` all'interno della sezione commentata `// Athena & Legacy`. Tra questi: `athenaMemberType`, `codiceCatastale`, `mastroC`, `mastroCol`, `codiceFe`, `previousMembershipNumber`, `athenaId`, `sedeRiferimento`.
- **Tipi TS**: Non esiste una vera tipizzazione TypeScript per la legacy. Sono tutti definiti brutalmente come campi stringa (`""`), mescolati in flat-structure assieme agli indirizzi.
- **Come sono caricati**: Nel `handleSelectMember` di `maschera-input-generale.tsx` (righe 958-959), le property dal Database (es. `member.athenaId`) sono reidratate nel Context. Nel Frontend l'interfaccia UI in `TabAnagrafica.tsx` (riga 535) mostra l'ID Athena in un campo Disabled/ReadOnly `Input` come meta-dato storico in consultazione.

## G. Componenti shadcn critici
- **`Select` e `Combobox`**: Vengono utilizzati massicciamente per la selezione di attributi e drop-down (Stato, Stagione, Corsi). Essendo molti (soprattutto i corsi), possono influenzare la responsività.
- **`Dialog` / `Popover` / Modals**: Usati per la gestione dei pagamenti (`PaymentDialog`), la fusione duplicati (`DuplicateMergeModal`) e la segnalazione warning codici fiscali (Dialog a riga 1937).
- **Punto di rottura potenziale**: Qualsiasi `Input` testuale. A causa del Context globale accoppiato, la digitazione in un input text innesca un rendering a catena di tutti i Tab e Componenti "stupidi" che non avrebbero bisogno di conoscere l'input.

## H. Pattern salvataggio + proposta auto-save Zustand
- **Modello attuale**: "Mega-Salvataggio Sincrono Finale". L'utente compila 10 sezioni poi clicca "Salva". (C'è un save periodico locale su `sessionStorage` in caso di crash tab del browser, ma il DB si allinea solo sul tasto fisico).
- **Auto-save Zustand (Realismo Refactor)**:
  - Spostare `formData` su uno store **Zustand** eliminando l'infrastruttura di `CrmFormContext.tsx`. Questo fermerà la propogazione dei React Re-renders ai figli non interessati e staccherà il layer dei Dati dal layer della UI.
  - Implementare hook `useDebounce` nello store Zustand. Ogni X secondi dall'ultima modifica ad un campo specifico, si farà scattare un `PATCH /api/members/:id` contenente solo i diff dei campi (o payload parziali), rendendo indolore l'editing e trasformando il "Salva" gigante in una pura notifica di completamento.

## SINTESI E PROPOSTA PIANO SPACCHETTAMENTO INCREMENTALE
1. **Zustand Migration**: Dismettere `CrmFormContext` in favore di `useMascheraStore`. Questo darà respiro al DOM.
2. **Schema Separation (Zod)**: Inserire uno standard formale condiviso frontend-backend (`zod` schemas) localizzato in `shared/schema.ts` e consumato tramite `react-hook-form`.
3. **Chunked Saves (Debounced API)**: Refactorizzare `handleSave` in API chiamate su specifiche Route Modulari (es. `PATCH /members/:id/allegati`, `PATCH /members/:id/marketing`) per minimizzare il "mostro" `/api/maschera-generale/save`.
