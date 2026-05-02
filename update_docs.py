import os
import glob
from datetime import datetime

dir_path = "_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui"
files = glob.glob(os.path.join(dir_path, "*.md"))

new_date = "02 Maggio 2026, 11:30"

c_file = next((f for f in files if "C_02" in f), None)
f_file = next((f for f in files if "F_02" in f), None)

# Update dates in all files
for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    # Replace Ultimo Aggiornamento
    import re
    content = re.sub(r">\s*\*\*Ultimo Aggiornamento:\*\*\s*.*", f"> **Ultimo Aggiornamento:** {new_date}", content)
    
    with open(file, "w") as f:
        f.write(content)

# Specifically append to F_ file (Ultimi aggiornamenti)
if f_file:
    with open(f_file, "a") as f:
        f.write("\n\n### Operazioni Notturne (02/05/2026)\n")
        f.write("- **Fase 1 (Performance)**: Ottimizzazione Dashboard/Alerts. Endpoint `/api/stats/dashboard` e `/api/stats/alerts` riscritti con SQL Aggregation dirette. Prevenzione Out-Of-Memory su dataset >5000 righe.\n")
        f.write("- **Fase 1b (Build TS)**: Bonificati 18 errori TypeScript in `server/storage.ts` (join/alias) e UI (`workshops.tsx`). Il comando `npx tsc --noEmit` ora dà Zero Errori.\n")
        f.write("- **Fase 2 & 3 (Sospensione Sicurezza)**: Sospeso smantellamento di `routes.ts` (12k righe) e `maschera-input-generale.tsx` (4.5k righe) per altissimo rischio di corruzione dipendenze incrociate. I file rimangono integri, si procederà modulo per modulo con supervisione manuale.\n")
        f.write("- **Fase 4 (Sicurezza Pagamenti)**: Audit completato. Implementato blocco backend/frontend contro importi negativi. Implementata coerenza obbligatoria `Metodo/Data` quando lo stato è `Paid`.\n")

# Specifically update C_ file (Stato lavori)
if c_file:
    with open(c_file, "r") as f:
        content = f.read()
    
    # Update state of UI breakdown
    content = content.replace("**Stato Attuale:** 🟢 CHIUSO (Area V1) / 🟡 AUDIT ESEGUITO (Per V2)", "**Stato Attuale:** 🟢 CHIUSO (Area V1) / 🔴 AUDIT ESEGUITO (Spacchettamento Monolite Sospeso per Sicurezza)")
    
    # Update Pagamenti
    content = content.replace("Qualsiasi alterazione in `PaymentModuleConnector` si ripercuote su oltre 14 route.", "Aggiunti scudi Strict Validation (Backend/Frontend) contro importi negativi e pagamenti inconsistenti. Modulo attualmente blindato.")
    
    with open(c_file, "w") as f:
        f.write(content)

print("Docs updated.")
