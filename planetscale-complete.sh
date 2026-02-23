#!/bin/bash

# Script per completare il setup dopo aver ottenuto la connection string da PlanetScale

echo "================================================"
echo "  PlanetScale - Setup Finale"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verifica che .env esista
if [ ! -f .env ]; then
    print_error "File .env non trovato!"
    echo "Creazione file .env..."
    cp .env.planetscale .env
fi

# Leggi DATABASE_URL dal .env
source .env 2>/dev/null

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "INSERISCI_QUI_LA_CONNECTION_STRING_DA_PLANETSCALE" ]; then
    print_warning "DATABASE_URL non configurato nel file .env"
    echo ""
    echo "Per favore:"
    echo "  1. Apri il file .env"
    echo "  2. Sostituisci DATABASE_URL con la connection string di PlanetScale"
    echo "  3. Esegui di nuovo questo script"
    echo ""
    echo "Vuoi aprire il file .env ora? (s/n)"
    read -r response
    if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
        ${EDITOR:-nano} .env
        echo ""
        echo "File salvato. Esegui di nuovo: ./planetscale-complete.sh"
    fi
    exit 1
fi

echo "Step 1: Verifica Connection String..."
print_info "DATABASE_URL trovato nel .env"
echo ""

echo "Step 2: Test Connessione..."
print_info "Connessione a PlanetScale in corso..."
npm run db:test

if [ $? -eq 0 ]; then
    print_success "Connessione riuscita!"
else
    print_error "Connessione fallita!"
    echo ""
    echo "Verifica che:"
    echo "  - La connection string sia corretta"
    echo "  - Il database sia stato creato su PlanetScale"
    echo "  - La password sia stata generata"
    exit 1
fi

echo ""
echo "Step 3: Applicazione Migrazioni..."
print_info "Creazione tabelle nel database..."
npm run db:push

if [ $? -eq 0 ]; then
    print_success "Migrazioni applicate!"
else
    print_error "Errore durante le migrazioni!"
    exit 1
fi

echo ""
echo "Step 4: Verifica Tabelle..."
print_info "Controllo tabelle create..."
npm run db:test

echo ""
echo "================================================"
print_success "Setup Completato!"
echo "================================================"
echo ""
echo "Il tuo database PlanetScale è pronto! 🎉"
echo ""
echo "Prossimi passi:"
echo "  1. Avvia l'app:        npm run dev"
echo "  2. Apri browser:       http://localhost:5001"
echo "  3. Esplora database:   npm run db:studio"
echo ""
echo "Comandi utili:"
echo "  - Test DB:             npm run db:test"
echo "  - Drizzle Studio:      npm run db:studio"
echo "  - Push schema:         npm run db:push"
echo ""
