#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
set -x
while sleep 1
do
  cabal run site -- build
  rsync -r _site/index.html ../index.html
  rsync -r --delete _site/css/ ../css
  rsync -r --delete _site/page/ ../page
  inotifywait -r --quiet -e modify -e delete .
done
