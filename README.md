# Connext Browser SDK
The Connext Browser SDK is the simplest way to add micropayments to any web app.

Connext is the protocol for p2p micropayments, built with state channels on Ethereum and other EVM blockchains. This SDK creates a Connext client inside of an iframe in your browser page, and then uses that client and some minimal UI components to dispatch transfers.

The SDK supports the following features:
- 📨 Email-based logins by default via [Magic.Link](https://magic.link).
- 💳 Debit card on/offboarding via ________.
- ⛽ End-to-end Ethereum gas (transaction fee) abstraction.
- 💵 Transfers denoted in USD, with optional customizeability to other currencies.
- 🦊 Logins using any popular Ethereum wallet such as [Metamask](https://metamask.io). (coming soon!)

### Table of Contents
- [Installation](https://github.com/connext/browser-sdk/blob/master/README.md#installation)
- [Quick Start](https://github.com/connext/browser-sdk/blob/master/README.md#quick-start)
- Advanced Configuration
- API Reference
- Contributing

## Installation
You can install the SDK using npm:

```bash
npm i connext
```

## Quick Start
After installing, import the SDK into your web app, instantiate it and open the login UI.
```javascript
import * as SDK from 'connext';

const sdk = new SDK();
await sdk.login();
```
Note that by default the sdk will spin up in `sandbox` mode on the Rinkeby Ethereum testnet. You will be able to create and send transactions, but they will not use real money. To send real-world value, you can instantiate the sdk in `production` mode:

```javascript
const sdk = new SDK('production')
```
After going through the login flow, your SDK is now ready to go! Open the deposit UI to put funds into Connext:
```javascript
await sdk.deposit();
```

You can query balance or the user's SDK identifier with:
```javascript
const id = sdk.publicIdentifier; // id = "indra123abc..."
const balance = await sdk.balance(); // balance = "1.234567"
```

And send micropayments using a recipient identifier and amount:
```javascript
const recipientIdentifier = "indra987zxy..."
const amount = "0.00001"
await sdk.transfer(recipientIdentifier, amount)
```

Lastly, to open the withdraw UI:
```javascript
await sdk.withdraw();
```
## Advanced Configuration
By default the browser SDK uses Dai, a USD-stable Ethereum token and connects to our bootstrap Connext node on testnet or mainnet.

You can use the SDK with a custom Connext node and/or token too -- just pass in these params when instantiating:
```javascript
const sdk = new SDK({
      assetId: "0xabc123..." // Token address (0x0 for Eth)
      nodeUrl: "https://node.example.com"
      ethProviderUrl: "https://infura.com/abc123
   })
```

## API Reference
