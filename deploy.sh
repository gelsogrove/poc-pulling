#!/bin/bash

# 1. Aggiungi e spingi i cambiamenti su Git
git add .
git commit -m "deploy"
git push


# 3. Esegui il build del progetto con npm
echo 'Running npm build...'
cd daily-milk/frontend || exit 1
npm install
npm run build || { echo "Build failed"; exit 1; }
cd ../../

# 4. Carica i file con SCP usando sshpass
echo 'Uploading files to server...'
sshpass -p 'Almogavers@123' scp -P 22 -r daily-milk/frontend/build/* u94121824@home744730785.1and1-data.host:/ai/


# 2. Mostra i log di Heroku
echo '*********'
heroku logs --tail --app poulin


