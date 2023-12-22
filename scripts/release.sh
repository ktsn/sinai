#!/bin/bash

set -eu

echo -n "Enter bump type: "
read type

npm test -s
npm run build -s

npm version $type
npm publish
git push origin master --tags
