curl -s -c /tmp/cookie_bot.txt \
  -X POST http://localhost:5001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"botAI","password":"botAI123!"}' \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print('LOGIN OK:', r.get('role','?'))"

echo "==== TEST 1 ===="
curl -s -b /tmp/cookie_bot.txt \
  -X POST http://localhost:5001/api/gemteam/checkin \
  -H "Content-Type: application/json" \
  -d '{"employee_id":1,"tipo":"IN","device":"e2e-test-botai"}' \
  | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin),indent=2))"

sleep 3

curl -s -b /tmp/cookie_bot.txt \
  -X POST http://localhost:5001/api/gemteam/checkin \
  -H "Content-Type: application/json" \
  -d '{"employee_id":1,"tipo":"OUT","device":"e2e-test-botai"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('oreOggi:', d.get('oreOggi','N/A'))"

echo "==== TEST 2 ===="
curl -s -b /tmp/cookie_bot.txt \
  -X POST http://localhost:5001/api/gemteam/diario \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id":1,
    "data":"2026-04-14",
    "ora_slot":"09:00",
    "postazione":"RECEPTION",
    "attivita_libera":"Test E2E diario botAI",
    "quantita":1,
    "minuti":5
  }' | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin),indent=2))"

echo "==== TEST 3 ===="
REQ_ID=$(curl -s -b /tmp/cookie_bot.txt \
  -X POST http://localhost:5001/api/gemteam/permessi \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id":1,
    "tipo":"PE",
    "data_inizio":"2026-04-15",
    "data_fine":"2026-04-15",
    "ore_totali":8,
    "note_dipendente":"Test E2E permesso botAI"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))")

echo "ID richiesta: $REQ_ID"

curl -s -b /tmp/cookie_bot.txt \
  -X PATCH http://localhost:5001/api/gemteam/permessi/$REQ_ID/approva \
  -H "Content-Type: application/json" \
  -d '{"note_admin":"Approvato nel test E2E"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('status dopo approvazione:', d.get('status','N/A'))"

echo "==== TEST 4 ===="
curl -s -b /tmp/cookie_bot.txt \
  -X POST http://localhost:5001/api/gemteam/report/genera/2026/4 \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'dipendenti nel report: {len(d)}') if isinstance(d, list) else print(d)"

curl -s -b /tmp/cookie_bot.txt \
  -o /tmp/test_gemteam_report.xlsx \
  -w "export xlsx: HTTP %{http_code} — %{size_download} bytes\n" \
  http://localhost:5001/api/gemteam/report/2026/4/export
