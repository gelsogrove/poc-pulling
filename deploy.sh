#!/bin/bash

git add .
git commit -m "deploy"
git push
echo '*********'
heroku logs --tail --app poulin