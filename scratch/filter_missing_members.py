import csv
import json
import sys

missing_ids = {"9556", "9557", "9558", "9559", "9325", "4687", "9560", "9562", "9561", "847", "3419", "2488", "2490", "9122", "14177", "14178"}

results = []
with open('_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input/export_TEST_members.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['id'] in missing_ids:
            results.append(row)

with open('scratch/missing_members.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
print(f"Found {len(results)} missing members.")
