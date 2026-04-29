# 📋 TEMPLATE RECAP CHAT — StarGem Suite

> **ATTENZIONE — Questo file è il modello standard, NON modificarlo.**
> Per creare il RECAP di una chat: copia questo file rinominandolo in
> `RECAP_NN_NomeChat.md` (es. `RECAP_08_Corsi.md`) e compila i campi.
>
> Ogni chat modulo deve aggiornare il proprio RECAP a fine sessione,
> PRIMA di aggiornare i 4 campi standard di MASTER_STATUS.md.

---

# RECAP_NN_NomeChat
> Aggiornato: YYYY_MM_DD_HHMM
> Stato chat: 🔴 Da iniziare | 🟡 In corso | ✅ Completata | ⏸️ In pausa
> Ultimo protocollo: F1-NNN / F2-NNN

---

## 1. SCOPO E PERIMETRO
*[2-4 righe: cosa fa questo modulo, quale parte del gestionale governa,
quali utenti finali serve. Esempio: "Gestisce iscrizioni a corsi e workshop,
con anagrafica iscritti, status, partecipation_type, source. Visibile a
segreteria e admin. Non gestisce il pagamento (vedi Chat_06)."]*

---

## 2. STATO ATTUALE

### Cosa è già fatto
- ...

### Cosa è in corso
- ...

### Cosa è bloccato (e perché)
- ...

---

## 3. TABELLE DB COINVOLTE

| Tabella | Ruolo nel modulo | Record attuali | Note |
|---|---|---|---|
| `nome_tabella` | breve descrizione | NN | flag/criticità |

---

## 4. FILE CHIAVE NEL CODEBASE
*(Solo i percorsi, non il codice. Serve a Claude e AG per orientarsi
all'inizio di una sessione.)*

- `server/routes/X.ts` — descrizione 1 riga
- `client/src/pages/Y.tsx` — descrizione 1 riga
- `shared/schema.ts` § sezione Z — descrizione 1 riga

---

## 5. DECISIONI ARCHITETTURALI APERTE
*(Cose decise da Gaetano e/o Claude che AG deve sapere o che devono
essere concordate con AG prima di procedere.)*

- **Decisione 1**: ...
  - Stato: ⏳ aperta | ✅ chiusa | ❌ rimandata
  - Note: ...

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1)
- F1-001 — [titolo breve] — ✅ chiuso | ⏳ in corso | ❌ fallito | 🔄 ripreso
- F1-002 — ...

### Frontend (F2)
- F2-001 — [titolo breve] — ✅ chiuso | ⏳ in corso | ❌ fallito | 🔄 ripreso
- F2-002 — ...

---

## 7. PENDENTI
*(In ordine di priorità decrescente.)*

1. [ ] Cosa resta da fare — priorità
2. [ ] ...
3. [ ] ...

---

## 8. INTERSEZIONI CON ALTRE CHAT
*(Quali RECAP di altre chat è utile leggere per chi prende in mano questo modulo.)*

- **Chat_NN_NomeChat** — perché serve sapere il loro stato
- **Chat_NN_NomeChat** — ...

---

## 9. NOTE PER LA PROSSIMA SESSIONE
*(Trappole viste, anomalie, cose da ricordare. Stile libero, breve.)*

- ...

---

*Aggiornato l'ultima volta da: [Claude / AG / Gaetano] in data YYYY_MM_DD_HHMM*
