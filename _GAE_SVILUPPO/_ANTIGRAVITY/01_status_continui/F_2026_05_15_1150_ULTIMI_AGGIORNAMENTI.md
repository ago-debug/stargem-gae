
### 15 Maggio 2026 - 12:38
**F1-023: Diagnostica parsing CSV Athena e ottimizzazione Auto-Mapping**
- Eseguito test su CSV Athena: confermato che contiene fisicamente 179 colonne delimitato da virgola, non c'è bug nel parsing Papaparse.
- Aggiornata logica `calculateAutoMapping` in `import-data.tsx` con dizionario alias specifico per campi Athena.
- Aggiunta normalizzazione stringhe e fallback con distanza di Levenshtein (<=2).
- Mappate automaticamente 35 colonne (sulle ~40 pertinenti) dal file anagrafico base di Athena. Le restanti (es. Patente, Banca) rimangono volutamente Da Mappare.
