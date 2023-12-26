#!/bin/bash

set -eu

echo -n "Enter bump type: "
read type

npm run test -s -- --run
npm run build -s

npm version $type
npm publish
git push origin v0.4 --tags
