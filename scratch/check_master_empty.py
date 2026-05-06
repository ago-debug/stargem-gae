import csv

file2 = "./_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input/estrap_2026-05-04_estrapolazione_Master - importazione copia.csv"

with open(file2, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    print(f"Totale righe: {len(rows)}")
    
    empty_count = 0
    for i, row in enumerate(rows):
        nome = row.get("an_nome", "").strip()
        cognome = row.get("an_cognome", "").strip()
        
        if not nome or not cognome:
            empty_count += 1
            print(f"Riga {i+2} (Excel): {row}")
            if empty_count >= 5:
                break
