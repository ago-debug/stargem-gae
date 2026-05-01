#!/bin/bash

# ==============================================================================
# STAR GEM MANAGER - DISASTER RECOVERY BACKUP SCRIPT
# ==============================================================================
# Questo script crea un dump completo del database MySQL, lo comprime e 
# pulisce i vecchi backup (ritenzione 30 giorni).
# ==============================================================================

# 1. Spostati nella cartella principale del progetto
cd "$(dirname "$0")/.." || exit 1

# 2. Carica le variabili d'ambiente in modo sicuro
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo "❌ Errore: File .env non trovato!"
    exit 1
fi

# Imposta pipefail per catturare errori in mysqldump anche se gzip ha successo
set -o pipefail

# 3. Configurazione
BACKUP_DIR="./backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
DB_USER=${MYSQL_USER:-root}
DB_PASS=${MYSQL_PASSWORD:-""}
DB_NAME=${MYSQL_DATABASE:-stargem_v2}
DB_HOST=${MYSQL_HOST:-127.0.0.1}
DB_PORT=${MYSQL_PORT:-3306}
FILENAME="${BACKUP_DIR}/stargem_backup_${DATE}.sql.gz"

echo "⏳ Avvio backup del database '${DB_NAME}' su ${DB_HOST}:${DB_PORT}..."

# 4. Crea la cartella backups se non esiste
mkdir -p "$BACKUP_DIR"

# 5. Esegui mysqldump e comprimi in gzip
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$FILENAME"

# 6. Verifica se il comando è andato a buon fine
if [ $? -eq 0 ]; then
    echo "✅ Backup completato con successo: $FILENAME"
    
    # Ottieni la dimensione del file
    SIZE=$(ls -lh "$FILENAME" | awk '{print $5}')
    echo "📦 Dimensione: $SIZE"
else
    echo "❌ Errore durante il backup del database!"
    # Rimuovi il file vuoto/corrotto
    rm -f "$FILENAME"
    exit 1
fi

# 7. Pulizia (Retention: Elimina i backup più vecchi di 30 giorni)
echo "🧹 Pulizia dei backup più vecchi di 30 giorni..."
find "$BACKUP_DIR" -type f -name "stargem_backup_*.sql.gz" -mtime +30 -exec rm {} \;

echo "🎉 Procedura terminata."
exit 0
