> **Ultimo Aggiornamento:** 02 Maggio 2026, 17:28

# 🎨 H - Design System & UI Homogenization

Questo documento funge da "Source of Truth" per le regole grafiche e architetturali del frontend, al fine di evitare le inconsistenze accumulate nelle versioni legacy e standardizzare l'interfaccia utente di StarGem Manager.

---

## 1. Regole di Impaginazione (Layout Wrappers)

Per garantire che tutte le pagine principali abbiano gli stessi margini, lo stesso padding e la stessa larghezza massima (evitando l'effetto "salti" o "bordi sfasati"), è obbligatorio utilizzare il seguente pattern per il contenitore radice (`div` padre) di qualsiasi componente Page:

```tsx
<div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
  {/* Contenuto Pagina */}
</div>
```

**Eccezioni Ammesse:**
- La `Maschera Input Generale` (CRM) e le interfacce ad alta densità informativa possono richiedere un container fluido o più largo. Le variazioni devono però essere esplicitate, preferendo classi relative (es. `w-full` o layout flex) piuttosto che misure esatte (`px-[45px]`).

---

## 2. Palette Colori e Design Tokens

L'uso di codici colore esadecimali hardcoded (es. `#e11d48`, `#f43f5e`, `#9D174D`) all'interno del codice React è **severamente vietato**.

- Il colore rosso istituzionale è stato mappato nella variabile di configurazione Tailwind `stargem-red`.
- I riferimenti colore vanno chiamati usando le classi del tema ufficiale: `bg-stargem-red`, `text-stargem-red`, `border-stargem-red`.
- Per tutti gli altri elementi dell'interfaccia (sfondi, badge), attenersi strettamente alla palette base di shadcn/ui: `primary`, `secondary`, `muted`, `accent`, `destructive`.

---

## 3. Micro-Tipografia e Spaziature (Font & Spacing)

**Scale Testo Arbitrarie**
- L'utilizzo di classi custom come `text-[10px]` o `text-[9px]` è disabilitato (sostituito massivamente nel Refactoring di Maggio 2026).
- Sono state aggiunte al `tailwind.config.ts` due scale micro:
  - `text-xxs`: corrisponde a 10px. (Ideale per Badge compatti e sottotitoli).
  - `text-xxxs`: corrisponde a 8px. (Da usare con estrema parsimonia per etichette ridotte).

**Spaziature Arbitrarie**
- Vietato l'uso di padding o margin custom (`p-[40px]`, `pt-[3px]`).
- Si deve utilizzare *sempre* la scala standard di Tailwind (multipli di 4px: `p-1`, `p-2`, `p-4`, `p-8`, `p-10`).

---

## 4. Linting ed Enforcement

Il codice sorgente è ora presidiato da due strumenti ufficiali:
1. **Prettier Tailwind Plugin**: Riordina automaticamente l'ordine delle classi CSS salvate, in modo uniforme (es. `p-4 flex` diventa `flex p-4` sempre).
2. **ESLint Tailwind**: Genera un avviso formale (Warning) ogni qual volta rileva valori arbitrari (Arbitrary Values). Questo garantisce che nessuno reintroduca classi in formato stringa esadecimale sfuggendo al design system.
