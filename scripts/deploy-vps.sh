#!/bin/bash
set -e
SITE_DIR=/var/www/vhosts/studio-gem.it/stargem.studio-gem.it
export PATH=/opt/plesk/node/24/bin:/usr/local/bin:$PATH

echo '=== Git Pull ==='
cd $SITE_DIR
git pull origin main

echo '=== Fix Permessi ==='
chown -R $(stat -c '%U' $SITE_DIR) $SITE_DIR/dist 2>/dev/null || true
chmod -R 755 $SITE_DIR/dist 2>/dev/null || true

echo '=== Build ==='
npm run build

echo '=== Restart ==='
pm2 restart stargem 2>/dev/null || \
  pm2 start dist/index.js --name stargem

echo '=== Done ==='
pm2 list
