updated: $(wildcard content/*) dist/build/site/site
	./dist/build/site/site build
	git splat
	date > updated

dist/build/site/site: site.hs bmillwood-github-io.cabal
	cabal build
	./dist/build/site/site clean
