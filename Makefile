BIN = ./node_modules/.bin/
NODE ?= node

test:
	@$(NODE) $(BIN)mocha \
		--require should \
		--reporter spec \
		--harmony-generators \
		--bail

.PHONY: test