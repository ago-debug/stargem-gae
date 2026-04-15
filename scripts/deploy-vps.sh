#!/bin/bash

# Parametro opzionale (default: dist/)
TARGET=${1:-"dist/"}
VPS_USER="root@82.165.35.145"
VPS_PATH="/var/www/vhosts/studio-gem.it/stargem.studio-gem.it"
NODE_PATH="/opt/plesk/node/24/bin"

echo "=== [1/5] Git origin update (Presunto 'git push origin main' già eseguito) ==="

echo "=== [2/5] Copia file ($TARGET) sul VPS tramite SCP ==="
if [ -e "$TARGET" ]; then
    # -r per file / cartelle
    scp -r "$TARGET" "$VPS_USER:$VPS_PATH/"
else
    echo "⚠️ Target $TARGET non trovato localmente. Salto SCP."
fi

echo "=== [3/5] Esecuzione npm install & build sul VPS ==="
ssh $VPS_USER "export PATH=\"$NODE_PATH:\$PATH\" \
  && cd $VPS_PATH \
  && npm install 2>&1 | tail -3 \
  && npm run build 2>&1 | tail -5"

echo "=== [4/5] Riavvio Passenger (Touch restart.txt) ==="
ssh $VPS_USER "touch $VPS_PATH/tmp/restart.txt"

echo "=== [5/5] Health Check Applicativo ==="
echo "Attesa di 8 secondi prima di interrogare l'endpoint..."
sleep 8
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://stargem.studio-gem.it/api/auth/user)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ DEPLOY OK (HTTP Status: $HTTP_CODE)"
else
    echo "❌ DEPLOY FAILED (HTTP Status: $HTTP_CODE)"
fi
