echo "=== STEP 4: Server ==="
grep -rn "upload\|multer\|file.*url\|attachment\|FileReader\|FormData" server/ --include="*.ts" | grep -v "node_modules\|\.d\.ts" | head -30

echo -e "\n=== STEP 4: Frontend ==="
grep -rn "upload\|FileReader\|FormData\|attachment" client/src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | head -30

echo -e "\n=== STEP 5: Teobot Backend ==="
grep -rn "claude\|anthropic\|copilot\|teobot\|teo.bot" server/ --include="*.ts" | grep -v "node_modules" | head -20

echo -e "\n=== STEP 6: Componenti Frontend ==="
grep -rn "Drawer\|Sheet\|Badge\|notification\|bell\|Bell\|chat\|Chat\|inbox\|Inbox" client/src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules\|\.d\.ts" | grep "import\|from" | head -30

echo -e "\n=== STEP 7: App Sidebar Badges ==="
grep -rn "badge\|Badge\|indicator\|bell\|Bell\|notification" client/src/components/app-sidebar.tsx | head -20

echo -e "\n=== STEP 8: Polling / WebSocket ==="
grep -rn "setInterval\|polling\|WebSocket\|socket\.io\|refetchInterval" client/src/ server/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -20
