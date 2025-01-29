#!/bin/bash
set -x # Attiva il debug

# Verifica che l'argomento del messaggio di commit sia passato
if [ -z "$1" ]; then
  echo "Errore: nessun messaggio di commit fornito."
  echo "Utilizzo: ./deploy.sh \"messaggio del commit\""
  exit 1
fi

# Salva il messaggio di commit
COMMIT_MESSAGE=$1

# Git push
git add .
git commit -m "$COMMIT_MESSAGE" || { echo "Git commit fallito"; exit 1; }
git push || { echo "Git push fallito"; exit 1; }

# Esegui build
echo 'Running npm build...'
cd daily-milk/frontend || exit 1
npm install || { echo "npm install fallito"; exit 1; }
npm run build || { echo "Build fallita"; exit 1; }
cd ../../

# Mostra i log di Heroku
echo '*********'
heroku logs --tail --app poulin
