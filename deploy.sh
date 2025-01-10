#!/bin/bash
set -x # Attiva il debug

# Git push
git add .
git commit -m "deploy"
git push

# Esegui build
echo 'Running npm build...'
cd daily-milk/frontend || exit 1
npm install
npm run build || { echo "Build failed"; exit 1; }
cd ../../

# SCP per caricare i file
echo 'Uploading files to server...'
sshpass -p 'Almogavers@123' scp -P 22 -r daily-milk/frontend/build/* u94121824@home744730785.1and1-data.host:/ai/
set +x # Disattiva il debug



# 2. Mostra i log di Heroku
# echo '*********'
# heroku logs --tail --app poulin


