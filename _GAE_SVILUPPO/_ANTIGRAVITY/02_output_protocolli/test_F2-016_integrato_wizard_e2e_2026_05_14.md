# 🛡️ Report E2E: Wizard Pratica & MC1+MC2+MC3 (F2-016)

> **Data Esecuzione:** 14 Maggio 2026, 20:45
> **Operatore:** Antigravity (Agent Auto)
> **Contesto:** Test End-to-End senza patch (Read-Only/Emulazione) post chiusura F1-019/F2-015.

## 📊 Tabella Esiti (Scenari 1-7)

| ID | Scenario | Esito | Note | Screenshot |
| :--- | :--- | :---: | :--- | :---: |
| **S1** | Dashboard pratiche | 🟢 **PASS** | Pagina renderizza `200 OK`. L'header `ListPageHeader` e "Nuova Pratica Guidata" sono visualizzati. | [Vedi](#) |
| **S2** | Crea Pratica via API | 🟢 **PASS** | L'endpoint `POST /api/dossiers` restituisce status `201` generando l'ID pratica e l'array atteso di 6 step (anagrafica, tutori, ecc.). | - |
| **S3** | Aggiorna status Step | 🔴 **FAIL** | La `PATCH /api/dossiers/:id/step` restituisce HTTP 400 `{"error":"Step not found for this dossier"}`. Le righe `dossier_steps` non vengono popolate correttamente dalla creazione (S2), impedendo l'avanzamento. | - |
| **S4** | Upload Cert. Medico | 🔴 **FAIL** | L'upload (POST) restituisce URL successo, ma file system va in 404 (`ENOENT`). La cartella fisica in `uploads/medical-certificates/1` non viene creata o scritta correttamente dal backend (MC1 Upload Auth Misto). | - |
| **S5** | Pagamento Multiplo | 🟢 **PASS** | L'endpoint MC3 `POST /api/payments/multi-participant` spacchetta il payload. Restituisce `payment_id` e l'array dei `participants` associati correttamente decodificati. | - |
| **S6** | Completamento Pratica | 🔴 **FAIL** | `POST /api/dossiers/:id/complete` innesca "Dossier not found" o "Step not found" in catena per il mancato funzionamento di S3. L'intero ciclo orchestratore risulta bloccato. | - |
| **S7** | Banner & Wizard UI | 🟢 **PASS** | Visualizzazione corretta: l'alert giallo campeggia sulla maschera classica, il pulsante *"Provala ora"* naviga al Wizard 6-step (`/dossiers/nuovo/wizard`). Sidebar corretta. | ![UI](file:///Users/gaetano1/.gemini/antigravity/brain/194123fc-82a6-4663-8742-99084d58a4b6/.system_generated/click_feedback/click_feedback_1778784170006.png) |

---

## 🐛 Bug Emersi (Analisi Backend)
I test dimostrano che il Frontend è visivamente robusto (S1, S7), ma il Backend (Fasi MC1 e MC2) presenta scollamenti che impediscono di completare un flusso reale di iscrizione.

### 🔴 ALTA PRIORITÀ (Bloccanti Core)
1. **Dossier Steps Non Trovati (`dossiers.ts`)**
   - **Errore:** La POST di creazione dossier inserisce la record `dossiers` ma apparentemente non scrive i figli in `dossier_steps` (o l'hook di estrazione fallisce a causa di un mismatch naming come `step_name` vs `stepName`). Impedisce a Maria di salvare e avanzare.
2. **Missing Dir / ENOENT su Upload (`uploadConfig.ts`)**
   - **Errore:** Multer/Filesystem non crea automaticamente le directory nested (es. `uploads/medical-certificates/1/`). Il caricamento API dà successo falsato ma il file fisico si disperde o fallisce il salvataggio in locale (404 al GET).

### 🟡 MEDIA PRIORITÀ
3. **Mancata Validazione Dossier `id`**
   - **Errore:** `POST /api/dossiers/:id/complete` ha restituito "Dossier not found" interrogando l'id=11 appena creato in S2. Potrebbe esserci un disallineamento nei return id tra Drizzle e la fetch.

---
**Verdetto finale:** **Bloccanti residui: Backend MC1/MC2 da debuggare.**
Il sistema **NON è pronto** per l'uso reale a causa del mancato salvataggio degli step (S3) e dei fallimenti sul file upload fisico (S4). 
Si rende necessaria l'esecuzione di un protocollo `/fix-logic-wf` dedicato per sanare i 3 Bug ad Alta Priorità nel backend.
