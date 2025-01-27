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

# Funzione per eseguire l'upload SFTP
sftp_upload() {
  SFTP_HOST="home744730785.1and1-data.host"
  SFTP_USER="u94121824"
  SFTP_PASSWORD="Almogavers123@"
  LOCAL_DIR="/Users/gelso/workspace/pulling/daily-milk"
  REMOTE_DIR="/ai"

  echo "Inizio upload SFTP..."
  # Usa `sftp` per trasferire i file
  sftp "$SFTP_USER@$SFTP_HOST" <<EOF
cd $REMOTE_DIR
lcd $LOCAL_DIR
put -r *
bye
EOF

  if [ $? -eq 0 ]; then
    echo "Upload SFTP completato con successo."
  else
    echo "Errore durante l'upload SFTP."
    exit 1
  fi
}

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

# Esegui upload SFTP
sftp_upload

# Mostra i log di Heroku
echo '*********'
heroku logs --tail --app poulin
