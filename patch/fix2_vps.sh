#!/bin/bash
echo "=== STEP 1 ==="
ssh root@82.165.35.145 "cd /var/www/vhosts/studio-gem.it/stargem.studio-gem.it && /opt/plesk/node/24/bin/npm install @anthropic-ai/sdk --save 2>&1 | tail -5"

echo "=== STEP 2 ==="
API_KEY=$(grep 'ANTHROPIC_API_KEY' /Users/gaetano1/SVILUPPO/StarGem_manager/.env | cut -d '=' -f2)
ssh root@82.165.35.145 "echo \"ANTHROPIC_API_KEY=$API_KEY\" >> /var/www/vhosts/studio-gem.it/stargem.studio-gem.it/.env && echo 'Key aggiunta'"

echo "=== STEP 3 ==="
ssh root@82.165.35.145 "grep -c 'ANTHROPIC_API_KEY' /var/www/vhosts/studio-gem.it/stargem.studio-gem.it/.env"

echo "=== STEP 4 ==="
ssh root@82.165.35.145 "touch /var/www/vhosts/studio-gem.it/stargem.studio-gem.it/tmp/restart.txt && echo 'Restart inviato'"

echo "=== STEP 5 ==="
sleep 8
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://stargem.studio-gem.it/api/auth/user)
echo "HTTP_CODE: $HTTP_CODE"

if [ "$HTTP_CODE" == "500" ]; then
    echo "=== ERROR LOG ==="
    ssh root@82.165.35.145 "cd /var/www/vhosts/studio-gem.it/stargem.studio-gem.it && /opt/plesk/node/24/bin/node dist/index.js 2>&1 | head -10 & sleep 3 && kill %1 2>/dev/null"
fi
