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

 
 2. Mostra i log di Heroku
 echo '*********'
 heroku logs --tail --app poulin


