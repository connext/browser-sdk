.PHONY: brower-sdk-demo
brower-sdk-demo:
	cd browser-sdk && PORT=8000 npx serve .

.PHONY: browser-sdk-watch
browser-sdk-watch: browser-sdk/node_modules
	cd browser-sdk && npm run build-and-watch

.PHONY: browser-sdk
browser-sdk: browser-sdk/node_modules
	cd browser-sdk && npm run build

browser-sdk/node_modules:
	cd browser-sdk && npm install && touch node_modules

.PHONY: demo-app
demo-app: demo-app/node_modules
	cd demo-app && npm start

demo-app/node_modules:
	cd demo-app && npm install && touch node_modules

.PHONY: iframe-app
iframe-app: iframe-app/node_modules
	cd iframe-app && npm start

iframe-app/node_modules:
	cd iframe-app && npm install && touch node_modules

.PHONY: start
start:
	make -j 2 iframe-app demo-app