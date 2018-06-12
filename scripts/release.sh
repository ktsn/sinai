#!/bin/bash

set -eu

echo -n "Enter bump type: "
read type

npm test -s
npm run clean -s
npm run build -s

npm version $type
npm publish
git push origin master
conventional-github-releaser -p angular
