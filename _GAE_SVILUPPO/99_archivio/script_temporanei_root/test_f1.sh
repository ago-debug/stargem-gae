#!/bin/bash
echo "Logging in..."
curl -c cookie.jar -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}' http://localhost:5001/api/login

echo "\n[T01] Creazione nuova tessera"
TESSERA_RESP=$(curl -b cookie.jar -s -X POST -H "Content-Type: application/json" -d '{"member_id":null,"membership_type":"adulto","season_competence":"2526","season_start_year":2025,"season_end_year":2026,"anagrafica":{"cognome":"TEST","nome":"GEMPASS","codiceFiscale":"TSTGMP99A01F205Z","email":"test.gempass@studiogem.it","cellulare":"3331234567"}}' http://localhost:5001/api/gempass/tessere)
echo $TESSERA_RESP
MEM_ID=$(echo $TESSERA_RESP | grep -o '"memberId":[0-9]*' | cut -d':' -f2 | head -1)
TES_ID=$(echo $TESSERA_RESP | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)

echo "\nMEM_ID=$MEM_ID, TES_ID=$TES_ID"

echo "\n[T02] Verifica unicità"
curl -b cookie.jar -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"member_id":null,"membership_type":"adulto","season_competence":"2526","season_start_year":2025,"season_end_year":2026,"anagrafica":{"cognome":"TEST","nome":"GEMPASS","codiceFiscale":"TSTGMP99A01F205Z","email":"test.gempass@studiogem.it","cellulare":"3331234567"}}' http://localhost:5001/api/gempass/tessere

echo "\n[T04] Tessera singola"
curl -b cookie.jar -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:5001/api/gempass/tessere/$TES_ID

echo "\n[T05] Registra firma"
curl -b cookie.jar -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"member_id\":$MEM_ID,\"form_type\":\"DOMANDA_TESSERAMENTO\",\"season_id\":1}" http://localhost:5001/api/gempass/firme

echo "\n[T06] Doppia firma"
curl -b cookie.jar -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"member_id\":$MEM_ID,\"form_type\":\"DOMANDA_TESSERAMENTO\",\"season_id\":1}" http://localhost:5001/api/gempass/firme

echo "\n[T07] Lista firme per membro"
curl -b cookie.jar -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:5001/api/gempass/firme/$MEM_ID

echo "\n[T09] Tessera attiva per membro"
curl -b cookie.jar -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:5001/api/gempass/membro/$MEM_ID/tessera

echo "\n[T10] Rinnovo tessera"
curl -b cookie.jar -s -w "\nHTTP_STATUS:%{http_code}\n" -X PATCH -H "Content-Type: application/json" -d '{"season_competence":"2627","season_start_year":2026,"season_end_year":2027}' http://localhost:5001/api/gempass/tessere/$TES_ID
