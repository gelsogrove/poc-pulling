#!/bin/bash

# Script per inviare i file modificati direttamente a Heroku
echo "Inizializzazione deploy diretto su Heroku..."

# Crea un archivio con solo i file modificati
tar -czvf deploy.tar.gz dist/server.js dist/src/poulin/whatsapp-proxy.js

# Invia i file a Heroku
echo "Invio dei file a Heroku..."
heroku run "mkdir -p /tmp/deploy" --app poulin
heroku run "rm -rf /tmp/deploy/*" --app poulin

# Crea il comando per scp
# Nota: questo non funzionerà direttamente, è solo per mostrare il comando necessario
echo "Usa il seguente comando per caricare i file su Heroku:"
echo "scp deploy.tar.gz [user]@[heroku-dyno]:/tmp/deploy/"

echo "Poi esegui i seguenti comandi:"
echo "heroku run \"cd /tmp/deploy && tar -xzvf deploy.tar.gz && cp -Rf dist/* /app/dist/\" --app poulin"
echo "heroku restart --app poulin"

echo "Dopo il riavvio, controlla i log e visita:"
echo "https://poulin.herokuapp.com/whatsapp/reset"
echo "Per forzare la disconnessione e ottenere un nuovo QR code"

chmod +x deploy-fix.sh 