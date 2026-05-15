# Report Stop & Go: Cancellazione Massiva Dati Core (DB)

> **Ultimo Aggiornamento:** 04 Maggio 2026, 18:05

## 1. Modifica Proposta
Hai richiesto di cancellare **definitivamente e totalmente** i seguenti dati dal database per poter rifare la mappatura ed eseguire la re-importazione da `localhost:5001/importa`:
- Partecipanti (`members`) = 4969 record
- Tessere (`memberships`) = 3305 record
- Pagamenti (`payments`) = tutti i record

## 2. Perché Serve
Per sbloccare un processo di bonifica e ri-mappatura massiva dei dati tramite il modulo di importazione, assicurandosi di non avere conflitti con i dati preesistenti.

## 3. Moduli Coinvolti
L'operazione agirà direttamente sul database MySQL tramite Drizzle ORM per svuotare le seguenti tabelle:
- `payments`
- `memberships`
- `members`

## 4. Impatti Previsti e Cascade
Svuotando queste tabelle, le chiavi esterne potrebbero innescare effetti a cascata. 
- Eliminare `members` annullerà i riferimenti in `enrollments` (o potrebbe innescare una cancellazione a cascata, a seconda di `onDelete: "cascade"`). 
- Eliminare `payments` rimuoverà tutto lo storico transazionale.

## 5. Rischi / Regressioni (Violazione Regola Core)
⚠️ **ATTENZIONE CRITICA** ⚠️
La regola di progetto `[AG-RULE-0002]` impone tassativamente:
> **"2. Non toccare pagamenti e tessere (core sensibile)."**

Questa operazione svuoterà in modo irreversibile le entità più sensibili del sistema. 

## 6. Cosa NON Verrà Toccato
- Le tabelle dei Corsi (`courses`), Calendario (`activities`), Dipendenti (`staff`) e le configurazioni di Sistema non verranno toccate, a meno che non ci siano vincoli `CASCADE` diretti che leghino un Partecipante ad altre tabelle non menzionate.
- Il codice dell'interfaccia UI rimarrà inalterato.

---

### RICHIESTA DI CONFERMA (OBBLIGATORIA)
Essendo questa un'operazione distruttiva su un "Core Sensibile", sono obbligato dalla regola `AG-RULE-0001` (Punto 3) a bloccare l'esecuzione.

Per procedere, devi rispondere esplicitamente con:
**"APPROVO CANCELLAZIONE DB E BYPASS REGOLA 2"**

Appena mi darai il via libera, eseguirò lo script TypeScript per fare lo svuotamento sicuro delle 3 tabelle.
