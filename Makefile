.PHONY: build-and-watch-sdk
build-and-watch-sdk: browser-sdk/node_modules
	cd browser-sdk && npm run build-and-watch

.PHONY: build-sdk
build-sdk: browser-sdk/node_modules
	cd browser-sdk && npm run build

browser-sdk/node_modules:
	cd browser-sdk && npm install && touch node_modules

.PHONY: serve-demo-app
serve-demo-app:
	ln --symbolic --force browser-sdk/dist/connext.js demo-app/connext.js  # make the compiled browser SDK available for importing into the demo app
	echo "Serving app on http://localhost:8000/..."
	cd demo-app && python3 -m http.server