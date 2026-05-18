---
aggiornato: 2026-05-15T19:00
tipo: prompt-AG-quickfix
target: AG-F2 (frontend)
stima: ~1.5h
note: prompt esecutivo F2-021 — sblocca DROP F1-030 PATCH C rimuovendo input obsoleti UI
---

# F2-021 — Pulizia TabAnagrafica.tsx (sblocco DROP 32 col)

```
F2-021 — Rimozione input UI obsoleti su TabAnagrafica + connessi (~1.5h)

CONTESTO:
F1-030 ha applicato PATCH A/B/D/E (ADD 21 members + ADD 25 team_employees + alias dict + scratch cleanup) ma si è FERMATA su PATCH C (DROP 32 col) per Regola 24: grep ha rilevato match in TabAnagrafica.tsx e file minori. Vedi report F1-030 per lista esatta dei 32 campi e dei file FE con match.

OBIETTIVO: rimuovere fisicamente gli input UI dei 32 campi obsoleti così da sbloccare F1-032 (DROP fisico) in totale sicurezza.

═══ TASK ═══

1) Aprire report F1-030 → sezione "PATCH C bloccata, match grep":
   identificare ESATTAMENTE i file FE con match e il nome di ogni input.

2) `client/src/components/anagrafica/TabAnagrafica.tsx` (file principale):
   Rimuovere blocchi `<FormField name="X">` per i 32 campi obsoleti:
   - Social: facebook, instagram, twitter, linkedin, website, skype
   - Fisico/biometria: altezza, peso, gruppo_sanguigno, mancino_destro
   - Auto/veicoli: auto_marca, auto_modello, auto_targa, auto_colore
   - Emergenze duplicate: emergency_contact_old, emergency_phone_old, emergency_relation_old
   - Mother/Father legacy: mother_name, mother_phone, mother_email, mother_cf, father_name, father_phone, father_email, father_cf
   - Permit/specialization: residence_permit, specialization, hourly_rate, bio
   - Altri: nickname, hobby_principale, sport_praticati
   (lista esatta da audit F1-029 V2 + report F1-030)

3) File minori segnalati dal grep di F1-030:
   - rimozione campi residui ovunque siano

4) Verificare Zustand store (`anagraficaStore.ts` o nome simile):
   se le 32 prop sono dichiarate nello state, rimuoverle anche lì.

5) Verificare zod schema validazione:
   se i 32 campi sono in zod schema, rimuoverli.

═══ TEST OBBLIGATORI ═══

- `npx tsc --noEmit` exit 0 (Regola 14)
- `npm run build` exit 0
- Test manuale: aprire un member esistente → verificare che la tab Anagrafica
  si renderizzi senza errori console + nessun input "ghost"
- Grep di conferma (Regola 24): `grep -rn "facebook\|instagram\|altezza\|auto_marca\|mother_name\|father_name\|specialization\|hourly_rate\|bio\|nickname" client/`
  → deve risultare ZERO match (eccetto codice morto in 99_archivio/)

═══ DELIVERABLE ═══

Report markdown in:
_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F2-021_pulizia_tab_anagrafica_2026_05_15.md

Contenuto:
1. Diff TabAnagrafica.tsx (sezioni rimosse, LOC ridotte)
2. Diff file minori (file:linea, prima/dopo)
3. Diff zustand store + zod schema (se modificati)
4. Output grep finale (zero match)
5. Risultati test (tsc + build + manuale)
6. GO ufficiale per F1-032 PATCH C DROP

═══ VINCOLI ═══

- Regola 14: tsc 0
- Regola 15: aggiornare F_*_ULTIMI_AGGIORNAMENTI
- Regola 17: frontmatter con ora
- Regola 22: wikilink solo file vault
- Regola 24: grep finale ZERO match obbligatorio
- NO modifiche backend
- NO modifiche al DB schema (in mano a F1-032)
- NON toccare NuovoPagamentoModal (file F2-020 in corso, no conflitti su TabAnagrafica)

Stop & Go a fine — al GO ufficiale parte F1-032 PATCH C DROP.
```

---

## Note coordinamento Cowork

- **F1-030**: chiusura parziale (PATCH A/B/D/E ok, PATCH C rimandata)
- **F2-020** (NuovoPagamentoModal): continua in parallelo, no conflitti file
- **F2-021** (questo prompt): pulizia UI sbloccante per DROP
- **F1-032** (futuro mini-task ~30min): esegue PATCH C DROP + grep verifica + Drizzle align + smoke test
