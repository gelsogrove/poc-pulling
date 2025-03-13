#!/bin/bash

# Script di deploy per Heroku
# Compila il codice TypeScript e lo invia a Heroku

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== INIZIO DEPLOY SU HEROKU ===${NC}"

# Compila il codice TypeScript
echo -e "${YELLOW}Compilazione TypeScript...${NC}"
npm run build

# Verifica se la compilazione è andata a buon fine
if [ $? -ne 0 ]; then
  echo -e "${RED}Errore durante la compilazione TypeScript. Deploy annullato.${NC}"
  exit 1
fi

echo -e "${GREEN}Compilazione completata con successo.${NC}"

# Aggiungi i file modificati a git
echo -e "${YELLOW}Aggiunta dei file modificati a git...${NC}"
git add .

# Chiedi il messaggio di commit
echo -e "${YELLOW}Inserisci il messaggio di commit:${NC}"
read commit_message

# Crea il commit
echo -e "${YELLOW}Creazione del commit...${NC}"
git commit -m "$commit_message"

# Invia a Heroku
echo -e "${YELLOW}Invio a Heroku...${NC}"
git push heroku main

# Verifica se il push è andato a buon fine
if [ $? -ne 0 ]; then
  echo -e "${RED}Errore durante il push su Heroku.${NC}"
  exit 1
fi

echo -e "${GREEN}Deploy completato con successo!${NC}"

# Riavvia l'app su Heroku
echo -e "${YELLOW}Riavvio dell'app su Heroku...${NC}"
heroku restart --app poulin

echo -e "${GREEN}=== DEPLOY COMPLETATO ===${NC}" 