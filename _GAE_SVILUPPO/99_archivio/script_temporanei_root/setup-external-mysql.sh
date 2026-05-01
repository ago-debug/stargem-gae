#!/bin/bash

# Guida per configurare MySQL su server esterno

echo "================================================"
echo "  Configurazione MySQL Server Esterno"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Hai diverse opzioni per usare MySQL esterno:${NC}"
echo ""

echo "1️⃣  PlanetScale (Consigliato - GRATIS)"
echo "   - Vai su: https://planetscale.com"
echo "   - Crea un account gratuito"
echo "   - Crea un nuovo database"
echo "   - Copia la connection string"
echo ""

echo "2️⃣  Railway.app (GRATIS con limiti)"
echo "   - Vai su: https://railway.app"
echo "   - Crea un progetto"
echo "   - Aggiungi MySQL dal marketplace"
echo "   - Copia la connection string"
echo ""

echo "3️⃣  Aiven (GRATIS per 30 giorni)"
echo "   - Vai su: https://aiven.io"
echo "   - Crea un servizio MySQL"
echo "   - Copia la connection string"
echo ""

echo "4️⃣  Server Plesk esistente"
echo "   - Accedi al tuo Plesk"
echo "   - Databases → Add Database"
echo "   - Crea database 'gestione_corsi'"
echo "   - Crea utente 'app_user'"
echo "   - Annota host, porta, username, password"
echo ""

echo "5️⃣  DigitalOcean Managed Database"
echo "   - Vai su: https://www.digitalocean.com/products/managed-databases-mysql"
echo "   - Crea un cluster MySQL"
echo "   - Copia la connection string"
echo ""

echo ""
echo -e "${YELLOW}Dopo aver ottenuto la connection string:${NC}"
echo ""
echo "1. Apri il file .env:"
echo "   nano .env"
echo ""
echo "2. Aggiorna DATABASE_URL con il formato:"
echo "   DATABASE_URL=mysql://username:password@host:port/database"
echo ""
echo "   Esempio PlanetScale:"
echo "   DATABASE_URL=mysql://user:pass@aws.connect.psdb.cloud/gestione_corsi?ssl={\"rejectUnauthorized\":true}"
echo ""
echo "   Esempio server normale:"
echo "   DATABASE_URL=mysql://app_user:password@123.45.67.89:3306/gestione_corsi"
echo ""
echo "3. Testa la connessione:"
echo "   npm run db:test"
echo ""
echo "4. Applica le migrazioni:"
echo "   npm run db:push"
echo ""
echo "5. Avvia l'app:"
echo "   npm run dev"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Configurazione completata!${NC}"
echo -e "${GREEN}================================================${NC}"
