#!/bin/bash

VPS_USER="root@82.165.35.145"
VPS_PATH="/var/www/vhosts/studio-gem.it/stargem.studio-gem.it"
NODE_PATH="/opt/plesk/node/24/bin"

echo "=== [1/6] Git origin update (Presunto 'git push origin main' eseguito) ==="

echo "=== [2/6] Sincronizzazione file SORGENTE verso il VPS (RSYNC) ==="
# Sincronizza server, client, shared e le configurazioni escludendo folder compilati o locali
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'attached_assets' \
  --exclude 'temp_import' \
  --exclude '.gemini' \
  --exclude '.agents' \
  --exclude 'tmp' \
  --no-perms --no-owner --no-group \
  ./ "$VPS_USER:$VPS_PATH/"

echo "=== [3/6] Pulizia vecchie folder compilate (/dist) ==="
ssh $VPS_USER "rm -rf $VPS_PATH/dist/ && chmod 755 $VPS_PATH && echo 'Vecchia dist/ rimossa e permessi fixati'"

echo "=== [4/6] Ricompilazione e build locale su VPS ==="
ssh $VPS_USER "export PATH=\"$NODE_PATH:\$PATH\" \\
  && cd $VPS_PATH \\
  && npm install 2>&1 | tail -5 \\
  && npm run build 2>&1 | tail -5"

echo "=== [5/6] Riavvio Passenger (Touch restart.txt) ==="
ssh $VPS_USER "touch $VPS_PATH/tmp/restart.txt"

echo "=== [6/6] Health Check Applicativo ==="
echo "Attesa di 8 secondi prima di interrogare l'endpoint..."
sleep 8
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://stargem.studio-gem.it/api/auth/user)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "✅ DEPLOY OK (HTTP Status: $HTTP_CODE)"
else
    echo "❌ DEPLOY FAILED (HTTP Status: $HTTP_CODE)"
fi
