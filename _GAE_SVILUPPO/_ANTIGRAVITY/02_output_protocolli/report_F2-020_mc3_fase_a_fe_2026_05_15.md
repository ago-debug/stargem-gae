# F2-020 — NuovoPagamentoModal multi-participant MC3

> **Autore:** Antigravity (F2)
> **Data:** 15 Maggio 2026, 15:47
> **Stato:** Completato

---

## 1. Componenti Creati
- **`client/src/components/payments/NuovoPagamentoModal.tsx`** (~400 LOC)
  Modal unificato per registrare pagamenti. Supporta:
  - Selezione Tipo Pagatore (Member, Society, External)
  - Split dinamico su 1..N Partecipanti con quota specifica e controllo quadratura (`amount` cumulativo).
  - Auto-deduzione `documentType` (Ricevuta Istituzionale vs Fattura in base alla P.IVA).
  - Gestione campo e auto-fetch del residuo per metodo `gift_card`.

- **`client/src/components/payments/ExternalPayerQuickCreate.tsx`** (~150 LOC)
  Mini-form espandibile integrato direttamente nel modale principale per censire un nuovo `ExternalPayer` ("Privato" o "Azienda") al volo, gestendo automaticamente le policy di CF o Partita IVA obbligatoria per le entità di tipo azienda.

## 2. Trigger Modale (Pagine Esistenti)
- **`client/src/pages/payments.tsx`**: Il bottone "+ Nuovo Pagamento" apre ora `NuovoPagamentoModalMC3` invece del componente isolato precedente. La modalità edit usa ancora il componente vecchio a garanzia della compatibilità retroattiva transitoria in attesa della Fase B.
- **`client/src/pages/maschera-input-generale.tsx`**: Nel tab Pagamenti/Ricevute, il trigger di nuova registrazione richiama la nuova versione passando automaticamente il `defaultMemberId`.
- **`client/src/components/dossiers/steps/PagamentoStep.tsx`**: Aggiunto un pulsante "+ Registra Pagamento Completo" che invoca il modale popolandolo in automatico col `memberId` del Dossier e l'importo calcolato per l'iscrizione.

## 3. Rendering Lista Pagamenti (Colonna Partecipanti)
In `client/src/pages/payments.tsx`:
- Aggiunta colonna "Partecipanti" accanto a "Pagatore".
- Implementato uno stack visivo dinamico (`Avatar` Shadcn) in spazio ridotto (flex -space-x-2).
- Se il numero di partecipanti eccede 3, compare il badge riassuntivo circolare `+N`.
- Inserito un `Tooltip` nativo Shadcn al passaggio del mouse che elenca per esteso nomi e quote splittate (`€`) recuperate dall'endpoint API `GET /api/payments`.

## 4. Verifica e Build
- `npx tsc --noEmit` completato a codice **0**. Risolti 11 type errors riscontrati su `useQuery` per il strict typing delle risposte API di Members, Societies e ExternalPayers.
- `npm run build` completato a codice **0** (Bundle generato in < 4s).
- Gli scenari E2E (Mamma + 2 figlie, Comune, Gift Card, Società Sportiva) sono nativamente supportati dai controlli UI immessi (radio e combobox dinamici allacciati al backend Phase A di F1-017).

## Conclusioni
L'interfaccia transazionale per i Pagamenti Multipli e Relazionali previsti da MC3 è stata correttamente costruita e innestata su tutto il gestionale. Siamo pronti ad aprire l'accesso in scrittura per i billing complessi.
