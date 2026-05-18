---
aggiornato: 2026-05-15T18:45
tipo: prompt-AG-refactor
target: AG-F2 (frontend)
stima: ~6-8h
note: prompt esecutivo F2-020 — implementa NuovoPagamentoModal multi-participant chiudendo MC3 Fase A end-to-end
---

# F2-020 — MC3 Fase A FE NuovoPagamentoModal multi-participant

```
F2-020 — NuovoPagamentoModal multi-participant + Society + ExternalPayer + Gift Card (apply patches ~6-8h)

CONTESTO:
MC3 Fase A BE chiuso in F1-017 con 4 scenari testati (madre 2 figlie, scuola danza,
Comune, gift card). BE espone tabelle `external_payers`, `societies`,
`payment_participants`, `payments` espanso + helper documentType. Manca il pezzo FE:
NuovoPagamentoModal che lega tutto in UI usabile.
Report BE riferimento: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1-017_mc3_fase_a_esecuzione_2026_05_14.md
Piano MC3 originale: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/piano_F1-013_mc3_pagamenti_relazionali_2026_05_13.md

OBIETTIVO: NuovoPagamentoModal end-to-end con supporto:
- Pagatore: Member | ExternalPayer | Society
- Partecipanti: 1..N (con split importo per partecipante)
- Metodo pagamento: contanti/bonifico/pos/sdd/assegno/gift_card
- Gift Card: campo dedicato con codice + saldo residuo
- Helper documentType: deduce automaticamente ricevuta/fattura

PARALLELO: F1-030 sta eseguendo la migration cleanup+extension schema su members/team_employees.
Nessun conflitto: F2-020 lavora su payments/external_payers/societies/payment_participants.

═══ PATCH A — Componente NuovoPagamentoModal ═══

A.1 — Creare `client/src/components/payments/NuovoPagamentoModal.tsx`
  Sezioni UI (in ordine):
    1) Tipo Pagatore — radio group: Member | Società | Pagatore Esterno
    2) Selezione Pagatore — search dinamico in base al tipo:
       - Member → AsyncSelect verso GET /api/members?q=
       - Società → AsyncSelect verso GET /api/societies?q= (nuovo? verifica BE)
       - ExternalPayer → AsyncSelect + bottone "+ Crea Nuovo" → mini-form
    3) Partecipanti (1..N) — array editabile:
       - Per ogni riga: AsyncSelect member + input importo (€)
       - Bottone "+ Aggiungi partecipante"
       - Validazione: somma importi partecipanti = totale pagamento
    4) Dettagli pagamento:
       - Importo totale (auto-calcolato da somma partecipanti, modificabile per arrotondamenti)
       - Data pagamento (default oggi)
       - Metodo: select contanti/bonifico/pos/sdd/assegno/gift_card
       - Causale (textarea)
    5) Se metodo = gift_card → campo aggiuntivo:
       - Codice gift card (input)
       - Saldo residuo pre-scarico (auto-fetch GET /api/gift-cards/:code)
    6) Helper documentType (read-only display):
       - Auto-deduzione: se ExternalPayer privato → ricevuta; se Society/ExternalPayer azienda → fattura
       - Bottone "Forza tipo" → override manuale

A.2 — Form management con react-hook-form + zod schema
  Validazione zod:
    - tipo_pagatore: enum required
    - pagatore_id: number required
    - participants: array(min=1, validate sum=totale)
    - importo_totale: number positive
    - metodo: enum required
    - data_pagamento: date required
    - causale: string min(3)
    - gift_card_code: string optional (required se metodo=gift_card)

A.3 — Submit handler
  POST /api/payments con body:
    {
      payer_type: 'member' | 'society' | 'external',
      payer_id: number,
      participants: [{member_id, amount}, ...],
      total_amount: number,
      payment_date: ISO,
      method: enum,
      reason: string,
      gift_card_code?: string,
      document_type_override?: string
    }
  Success → toast success + invalidate query 'payments' + close modal
  Error → toast error + mantiene form aperto

═══ PATCH B — Mini-form ExternalPayer ═══

B.1 — Componente `client/src/components/payments/ExternalPayerQuickCreate.tsx`
  Campi:
    - tipo: enum 'privato' | 'azienda'
    - nome_o_ragione_sociale (required)
    - cf_o_piva (required se azienda)
    - email (optional)
    - telefono (optional)
    - indirizzo (optional)
  Submit → POST /api/external-payers → ritorna id da inserire in NuovoPagamentoModal

═══ PATCH C — Trigger NuovoPagamentoModal dalle pagine esistenti ═══

C.1 — Pagina Pagamenti (client/src/pages/pagamenti.tsx o simile):
  Aggiungere bottone "+ Nuovo Pagamento" che apre il modale
C.2 — Dashboard utente (maschera-input-generale.tsx):
  Sezione "Pagamenti" → bottone "+ Nuovo Pagamento" pre-compilato col member corrente
C.3 — DashboardDossiers (Wizard step Pagamento):
  Apre modale pre-compilato con member del dossier + importo dovuto

═══ PATCH D — Visualizzazione partecipanti in lista pagamenti ═══

D.1 — Tabella pagamenti: aggiungere colonna "Partecipanti"
  Render: avatar stack (max 3) + "+N altri" se >3
  Tooltip al hover: lista completa nomi + importi
D.2 — Riga espandibile: click → mostra dettaglio split partecipanti

═══ TEST OBBLIGATORI ═══

- `npx tsc --noEmit` exit 0 (Regola 14)
- `npm run build` exit 0
- Test E2E manuale 4 scenari (replica F1-017):
  1. Madre paga 2 figlie (1 pagatore Member, 2 participants)
  2. Scuola danza paga 5 allievi (1 Society pagatore, 5 participants)
  3. Comune Milano paga 3 utenti welfare (1 ExternalPayer azienda, 3 participants)
  4. Gift Card 100€ scala su 2 utenti 50€ ciascuno
- Verifica audit_logs popolati correttamente
- Verifica somma participants = totale_pagamento (constraint)

═══ DELIVERABLE ═══

Report markdown in:
_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F2-020_mc3_fase_a_fe_2026_05_15.md

Contenuto:
1. Componenti creati (path + LOC + screenshot)
2. Diff trigger pagine esistenti (file:linea, prima/dopo)
3. Risultati test 4 scenari (pass/fail + screenshot ogni step)
4. UX note: usability rilevata, edge case incontrati
5. Bug emersi (se presenti) — apri F2-021 fix
6. Cose lasciate fuori scope MC3 Fase B (es. ricorrenze, rateizzazioni)

═══ VINCOLI ═══

- Regola 14: tsc 0
- Regola 15: aggiornare F_*_ULTIMI_AGGIORNAMENTI
- Regola 17: frontmatter con ora
- Regola 22: wikilink solo file vault
- NO modifiche al BE (F1-017 è chiuso, se serve fix BE apri F1-031 separato)
- NO modifiche allo schema members (in mano a F1-030 in parallelo)
- Coerenza nomenclatura: "genitore" non "tutore" se compare nei mini-form
- Riusare componenti shadcn esistenti (Dialog, Select, Form) — no nuovi pattern

Stop & Go a fine.
```

---

## Note di coordinamento Cowork

- F2-020 lanciato in parallelo a F1-030 (zero conflitti di file).
- Quando entrambi chiudono:
  1. Ricarica `/importa` → ~95% auto-mapping (effetto F1-030 Patch D)
  2. Test rapido NuovoPagamentoModal sui 4 scenari MC3
  3. Step 3: import effettivo 3986 record Athena (Lotto 1)
  4. Lotto 2 (pagamenti) abilitato grazie a F2-020
