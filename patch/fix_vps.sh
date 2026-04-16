#!/bin/bash
export PATH="/opt/plesk/node/24/bin:$PATH"

echo "=== STEP 1: npm install ==="
ssh root@82.165.35.145 "export PATH=\"/opt/plesk/node/24/bin:\$PATH\"; cd /var/www/vhosts/studio-gem.it/stargem.studio-gem.it && npm install 2>&1 | tail -10"

echo "=== STEP 2: npm run build ==="
ssh root@82.165.35.145 "export PATH=\"/opt/plesk/node/24/bin:\$PATH\"; cd /var/www/vhosts/studio-gem.it/stargem.studio-gem.it && npm run build 2>&1 | tail -20"

echo "=== STEP 3: restart ==="
ssh root@82.165.35.145 "touch /var/www/vhosts/studio-gem.it/stargem.studio-gem.it/tmp/restart.txt && echo 'Restart inviato'"

echo "=== STEP 4: check ==="
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://stargem.studio-gem.it/api/auth/user)
echo "HTTP_CODE: $HTTP_CODE"

if [ "$HTTP_CODE" != "401" ] && [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "403" ]; then
    echo "=== ERROR LOG ==="
    ssh root@82.165.35.145 "tail -30 /var/www/vhosts/studio-gem.it/logs/stargem.studio-gem.it/error_log"
fi
