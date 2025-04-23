update: tools
	if [ -d sources ]; then git -C sources pull ; else git clone https://github.com/nfdi4objects/n4o-databases.git sources; fi
	if [ -d crm-rdf-ap ]; then git -C crm-rdf-ap pull ; else git clone https://github.com/nfdi4objects/crm-rdf-ap.git crm-rdf-ap; fi
	if [ -d lido-schema ]; then git -C lido-schema pull ; else git clone https://github.com/nfdi4objects/lido-schema.git lido-schema; fi
	npm install
	npm ci --prefix sources

tools:
	@echo "Check availability of tools:"
	@which rapper
	@which xmlstarlet
	@which npm
	@which jq
	@which python

deps:
	python -m venv .venv
	.venv/bin/pip install -r requirements.txt
	
extract-wikidata:
	rm -f wikidata/*.rdf wikidata/*.nt
	./get-wikidata-entity.sh `grep -o -E 'Q[0-9]+' sources/n4o-databases.csv`

.PHONY: test
test:
	@.venv/bin/pytest
	@./test/test.sh

lint:
	@flake8 lib test *.py --ignore=C901 --exit-zero --max-complexity=10 --max-line-length=127 --statistics

fix:
	@autopep8 --in-place *.py lib/*.py test/*.py

