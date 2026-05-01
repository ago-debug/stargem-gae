#!/bin/bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO A — Dimensione e import dei 3 file principali"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
wc -l client/src/pages/calendar.tsx 2>/dev/null || echo "File non trovato"
wc -l client/src/pages/planning.tsx 2>/dev/null || echo "File non trovato"
wc -l client/src/pages/StrategicProgrammingTable.tsx 2>/dev/null || echo "File non trovato"
echo "--- head -80 calendar.tsx ---"
head -80 client/src/pages/calendar.tsx 2>/dev/null
echo "--- head -60 planning.tsx ---"
head -60 client/src/pages/planning.tsx 2>/dev/null

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO B — Come il calendario legge strategic_events"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "--- calendar.tsx ---"
grep -n "strategic\|/api/planning\|/api/strategic" client/src/pages/calendar.tsx 2>/dev/null
echo "--- planning.tsx ---"
grep -n "strategic\|/api/planning\|/api/strategic" client/src/pages/planning.tsx 2>/dev/null
echo "--- StrategicProgrammingTable.tsx ---"
grep -n "useQuery\|useMutation\|fetch\|/api/" client/src/pages/StrategicProgrammingTable.tsx 2>/dev/null | head -30

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO C — Filtri e box evento nel calendario"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "--- filter/activityType ---"
grep -n "filter\|activityType\|activity_type\|ACTIVITY" client/src/pages/calendar.tsx 2>/dev/null | head -30
echo "--- instructor/status/eventCode ---"
grep -n "instructorName\|instructor\|status\|gender\|eventCode" client/src/pages/calendar.tsx 2>/dev/null | head -30

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO D — Link dal Planning al Calendario con data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -n "calendario-attivita\|?date=\|navigate\|href" client/src/pages/planning.tsx 2>/dev/null | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO E — Supporto stagioni e guard ruoli"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "--- calendar.tsx stagioni ---"
grep -n "season\|stagione\|2526\|2627" client/src/pages/calendar.tsx 2>/dev/null | head -20
echo "--- planning.tsx stagioni ---"
grep -n "season\|stagione\|2526\|2627" client/src/pages/planning.tsx 2>/dev/null | head -20
echo "--- calendar.tsx ruoli ---"
grep -n "role\|admin\|operator\|ProtectedRoute" client/src/pages/calendar.tsx 2>/dev/null | head -15
echo "--- planning.tsx ruoli ---"
grep -n "role\|admin\|operator\|ProtectedRoute" client/src/pages/planning.tsx 2>/dev/null | head -15
