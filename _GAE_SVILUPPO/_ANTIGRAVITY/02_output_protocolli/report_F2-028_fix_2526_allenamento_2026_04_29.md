# REPORT F2-028: Fix Crash 2526ALLENAMENTO

**Data:** 30/04/2026
**Priorità:** ALTA

## DIAGNOSI E CAUSA
Il click su "Scheda" in `/attivita/allenamenti` per il record `2526ALLENAMENTO` portava a una pagina bianca. 
Il problema derivava da due fattori concomitanti all'interno di `scheda-allenamento.tsx`:
1. **Mancanza dello scudo anti-contenitore**: a differenza di `scheda-domenica` e le altre schede rifattorizzate in F2-026, la `scheda-allenamento` non possedeva il blocco di `early return` per bloccare la renderizzazione della tabella sui contenitori generici (`item.sku === '2526ALLENAMENTO'`).
2. **Data Mapping Obsoleto (Bomba a Orologeria)**: in F2-025 era stato aggiornato il query endpoint da `["/api/"]` a `["/api/courses?activityType=allenamenti"]`, ma non la struttura dei dati restituiti dall'endpoint `enrolled-members`! Se l'allenamento avesse avuto anche un solo iscritto, si sarebbe schiantato esattamente come le 3 schede in F2-027.

## FIX APPLICATO (in `scheda-allenamento.tsx`)

### 1. Inserimento Blocco Early Return
È stato replicato fedelmente lo scudo UI anti-crash presente nelle altre schede:
```tsx
if (item.sku === '2526ALLENAMENTO' || (item.sku && item.sku.startsWith('2526GENERICO'))) {
    return (
        <div className="p-6 md:p-8 mx-auto">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800">Scheda Allenamento</h1>
                <p className="text-slate-600 mt-2">Nessun dato relazionale per questo contenitore generico ({item.sku}).</p>
                <div className="mt-4">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Torna Indietro
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

### 2. Riallineamento Flat Data Mapping (Prevenzione Crash Futuri)
Come effettuato nel protocollo F2-027, l'intera mappatura del `<TableBody>` di `scheda-allenamento.tsx` è stata riscritta per processare correttamente i dati flat (`data.first_name`, `data.last_name`) derivati dall'endpoint ottimizzato `enrolled-members`.

## VERIFICHE EFFETTUATE
- ✔️ Cliccando su `2526ALLENAMENTO`, la pagina si ferma regolarmente sul messaggio "Nessun dato relazionale...".
- ✔️ Il file `scheda-allenamento.tsx` compila in modo pulito e strict con `npx tsc`.
- ✔️ Le altre schede non sono state minimamente toccate e mantengono regressione zero.
