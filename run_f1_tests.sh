#!/bin/bash
BASE_URL="http://localhost:5001"

echo "T01..."
T01_RES=$(curl -s -X POST $BASE_URL/api/gempass/tessere \
  -H 'Content-Type: application/json' \
  -d '{"member_id": null,"membership_type": "adulto","season_competence": "2526","season_start_year": 2025,"season_end_year": 2026,"anagrafica": {"cognome": "TEST","nome": "GEMPASS","codiceFiscale": "TSTGMP99A01F205Z","email": "test.gempass@studiogem.it","cellulare": "3331234567"}}')
echo "T01_RES: $T01_RES"
T01_ID=$(echo $T01_RES | grep -o '"id":[0-9]*' | head -1 | awk -F':' '{print $2}')
T01_MEMBER_ID=$(echo $T01_RES | grep -o '"memberId":[0-9]*' | head -1 | awk -F':' '{print $2}')
echo "T01: ID=$T01_ID, MemberID=$T01_MEMBER_ID"

echo "T02..."
T02_RES=$(curl -s -X POST $BASE_URL/api/gempass/tessere \
  -w "\n%{http_code}" \
  -H 'Content-Type: application/json' \
  -d '{"member_id": null,"membership_type": "adulto","season_competence": "2526","season_start_year": 2025,"season_end_year": 2026,"anagrafica": {"cognome": "TEST","nome": "GEMPASS","codiceFiscale": "TSTGMP99A01F205Z"}}')
echo "T02_RES: $T02_RES"

echo "T03..."
T03_RES=$(curl -s -X GET $BASE_URL/api/gempass/tessere -w "\n%{http_code}")
# Check if T01_ID is in T03_RES
if echo "$T03_RES" | grep -q "\"id\":$T01_ID"; then echo "T03: Found"; else echo "T03: Not Found"; fi

echo "T04..."
T04_RES=$(curl -s -X GET $BASE_URL/api/gempass/tessere/$T01_ID -w "\n%{http_code}")
echo "T04_RES: $T04_RES"

echo "T05..."
T05_RES=$(curl -s -X POST $BASE_URL/api/gempass/firme \
  -H 'Content-Type: application/json' \
  -d "{\"member_id\": $T01_MEMBER_ID, \"form_type\": \"DOMANDA_TESSERAMENTO\", \"season_id\": 1}")
echo "T05_RES: $T05_RES"

echo "T06..."
T06_RES=$(curl -s -X POST $BASE_URL/api/gempass/firme \
  -H 'Content-Type: application/json' \
  -d "{\"member_id\": $T01_MEMBER_ID, \"form_type\": \"DOMANDA_TESSERAMENTO\", \"season_id\": 1}")
echo "T06_RES: $T06_RES"

# dummy privacy request
curl -s -X POST $BASE_URL/api/gempass/firme \
  -H 'Content-Type: application/json' \
  -d "{\"member_id\": $T01_MEMBER_ID, \"form_type\": \"PRIVACY_ADULTI\", \"season_id\": 1}" > /dev/null

echo "T07..."
T07_RES=$(curl -s -X GET $BASE_URL/api/gempass/firme/$T01_MEMBER_ID)
echo "T07_RES: $T07_RES"

echo "T08..."
T08_RES=$(curl -s -X GET $BASE_URL/api/gempass/firme-all)
if echo "$T08_RES" | grep -q "\"memberFirstName\""; then echo "T08: Join Found"; else echo "T08: Join missing"; fi

echo "T09..."
T09_RES=$(curl -s -X GET $BASE_URL/api/gempass/membro/$T01_MEMBER_ID/tessera)
echo "T09_RES: $T09_RES"

echo "T10..."
T10_RES=$(curl -s -X PATCH $BASE_URL/api/gempass/tessere/$T01_ID/rinnova \
  -H 'Content-Type: application/json' \
  -d '{"season_competence": "2627", "season_start_year": 2026, "season_end_year": 2027}')
echo "T10_RES: $T10_RES"
NEXT_ID=$(echo $T10_RES | grep -o '"membershipNumber":"[^"]*"' | cut -d'"' -f4)
echo "T10 NEXT: $NEXT_ID"

echo "T11..."
T11_RES=$(curl -s -X GET $BASE_URL/api/public/membership-status/$NEXT_ID)
echo "T11_RES: $T11_RES"
