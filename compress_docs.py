import os
import glob

base_dir = '/Users/gaetano1/SVILUPPO/CourseManager_Source_Export/_GAE_SVILUPPO'

plan = [
    {
        "name": "attuale/01_Architettura_e_Database_Core.md",
        "sources": ["attuale/01_GAE_Database_Attuale.md", "attuale/02_GAE_Architettura_e_Regole.md"]
    },
    {
        "name": "attuale/02_Frontend_UI_e_Routing.md",
        "sources": ["attuale/03_GAE_Mappa_Pagine_Database.md", "attuale/04_GAE_Piano_Interazione_SaaS_UI.md", "attuale/05_GAE_Linee_Guida_Grafiche_UI.md", "attuale/06_GAE_Route_Audit_e_Stato.md"]
    },
    {
        "name": "attuale/03_Moduli_Operativi_e_Calendario.md",
        "sources": ["attuale/07_GAE_Tassonomia_13_Attivita.md", "attuale/09_GAE_MAPPA_GLOBALE.md", "attuale/10_GAE_TABELLA_MASTER_MODALI.md", "attuale/17_GAE_Calendario_Multi_Stagione.md"]
    },
    {
        "name": "attuale/04_Stato_Lavori_e_Briefing_Tecnico.md",
        "sources": ["attuale/08_GAE_Briefing_Tecnico_Operativo.md", "attuale/11_GAE_Stato_Lavori_Per_Sezione.md"]
    },
    {
        "name": "futuro/05_Piano_Architettura_STI.md",
        "sources": ["futuro/12_GAE_Database_Futuro_STI.md", "futuro/15_GAE_STI_Bridge_Plan_Executive.md"]
    },
    {
        "name": "futuro/06_Migrazione_Database_Checklist.md",
        "sources": ["futuro/13_GAE_Piano_Migrazione_DB.md"]
    },
    {
        "name": "futuro/07_Infrastruttura_Server_e_Deploy.md",
        "sources": ["futuro/16_GAE_Phase26_Migrazione_VPS.md"]
    },
    {
        "name": "futuro/08_Espansione_CRM_Clarissa.md",
        "sources": ["futuro/14_GAE_Strategic_Plan_Clarissa_CRM.md"]
    }
]

created_files = []

for group in plan:
    out_path = os.path.join(base_dir, group['name'])
    combined_text = ""
    for src in group['sources']:
        src_path = os.path.join(base_dir, src)
        if os.path.exists(src_path):
            with open(src_path, 'r') as f:
                content = f.read()
                # Basic formatting: add a separator and the file name as a header comment
                combined_text += f"\n\n<!-- --- INIZIO SORGENTE: {src} --- -->\n\n"
                combined_text += content
                combined_text += f"\n\n<!-- --- FINE SORGENTE: {src} --- -->\n\n"
        else:
            print(f"Warning: {src_path} not found.")
            
    with open(out_path, 'w') as f:
        f.write(combined_text)
    
    created_files.append(out_path)
    print(f"Created {out_path}")

# Now delete the source files that were merged
for group in plan:
    for src in group['sources']:
        src_path = os.path.join(base_dir, src)
        if os.path.exists(src_path):
            os.remove(src_path)
            print(f"Deleted old source file: {src_path}")

print("Merge and cleanup completed.")
