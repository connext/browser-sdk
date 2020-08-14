.PHONY: build-sdk
build-sdk: browser-sdk/node_modules
	cd browser-sdk && npm run build

browser-sdk/node_modules:
	cd browser-sdk && npm install && touch node_modules
