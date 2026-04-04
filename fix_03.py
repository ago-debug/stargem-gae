import re

path = '_GAE_SVILUPPO/attuale/03_GAE_Mappa_Pagine_Database.md'
with open(path, 'r') as f:
    text = f.read()

# Make some replacements to reflect Phase 28 features
text = text.replace('🟡 **Knowledge Base** | Tabella wiki | Manuali d\'uso / Wiki per operatori nuovi al desk.', '🟡 **Knowledge Base** | Tabella wiki | Modulo attivo. Manuali d\'uso con Matrix Ruoli ufficiale (Chi vede cosa).')
text = text.replace('🟡 **Utenti e Permessi** | `users`, `user_roles` | Account per accesso al Gestionale via login.', '🟡 **Utenti e Permessi** | `users`, `user_roles` | Gestione Sicurezza e Ruoli con accesso granulare alla Sidebar (30 viste).')
text = text.replace('🟡 (Pulsante interno)', '🟡 **(Route Nascosta)**')

with open(path, 'w') as f:
    f.write(text)

