#!/bin/bash

git fetch
git reset --hard origin/dev
npm install
pm2 restart 0