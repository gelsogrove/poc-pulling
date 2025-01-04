#!/bin/bash

git add .
git commit -m "deploy"
git push
heroku logs --tail --app poulin