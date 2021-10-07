updated: site.hs bmillwood-github-io.cabal Makefile
	cabal run site -- build
	rsync -r _site/index.html ../index.html
	rsync -r --delete _site/css/* ../css
	rsync -r --delete _site/page/* ../page
	date --iso-8601 > updated
