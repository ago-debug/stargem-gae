import re
path = '_GAE_SVILUPPO/attuale/04_GAE_Piano_Interazione_SaaS_UI.md'
with open(path, 'r') as f:
    text = f.read()

text = text.replace('Costruiremo **due componenti', 'Sono stati costruiti **due componenti')
text = text.replace('Creeremo `client/src/components/time-slot-picker.tsx`', 'È stato creato `client/src/components/time-slot-picker.tsx`')
text = text.replace('Creeremo `client/src/components/payment-module-connector.tsx`', 'È stato creato `client/src/components/payment-module-connector.tsx`')
text = text.replace('Il componente riceverà e restituirà', 'Il componente riceve e restituisce')
text = text.replace('Questo componente non manderà', 'Questo componente non manda')
text = text.replace('impacchetterà i dati', 'impacchetta i dati')
text = text.replace('Sarà obbligatorio inserire', 'È stato inserito')
text = text.replace('Dobbiamo creare un blocco', 'È stato creato un blocco')

with open(path, 'w') as f:
    f.write(text)

