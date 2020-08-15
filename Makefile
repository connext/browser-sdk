.PHONY: demo-sdk-basic
demo-sdk-basic:
	echo "Serving basic SDK demo at: http://localhost:8000/demo.html"
	cd browser-sdk && python3 -m http.server

.PHONY: build-and-watch-sdk
build-and-watch-sdk: browser-sdk/node_modules
	cd browser-sdk && npm run build-and-watch

.PHONY: build-sdk
build-sdk: browser-sdk/node_modules
	cd browser-sdk && npm run build

browser-sdk/node_modules:
	cd browser-sdk && npm install && touch node_modules

.PHONY: demo-app
demo-app: demo-app/node_modules
	cd demo-app && npm start

demo-app/node_modules:
	cd demo-app && npm install && touch node_modules