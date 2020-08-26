![Alt text](https://github.com/connext/browser-sdk/blob/master/public/Connext-Horizontal-Logo.png?raw=true)

# Browser SDK

The Connext Browser SDK is the simplest way to add micropayments to any web app.

[Connext](https://connext.network) is the protocol for p2p micropayments, built using [state channels](https://docs.connext.network/en/latest/quickstart/introduction.html#state-channel-basics) on the Ethereum blockchain. This SDK creates a [Connext client](https://docs.connext.network/en/latest/quickstart/clientInstantiation.html) inside of an iframe in your browser page, and then uses that client along with some minimal UI components to dispatch transfers to a recipient.

The SDK supports the following features:

- 🎩 Email-based login via [Magic](https://magic.link).
- 💳 Debit card on/offboarding via [Moonpay](https://moonpay.io).
- ⛽ End-to-end Ethereum gas (transaction fee) abstraction.
- 💵 Transfers in USD by default, with optional customizeability to other currencies.
- 🦊 Login using any popular Ethereum wallet such as [Metamask](https://metamask.io). (coming soon!)

### Table of Contents

- [Installation](https://github.com/connext/browser-sdk/blob/master/README.md#installation)
- [Quick Start](https://github.com/connext/browser-sdk/blob/master/README.md#quick-start)
- [Advanced Configuration](https://github.com/connext/browser-sdk/blob/master/README.md#advanced-configuration)
- [API Reference](https://github.com/connext/browser-sdk/blob/master/README.md#api-reference)
- [Development](https://github.com/connext/browser-sdk/blob/master/README.md#development)

## Installation

You can install the SDK using npm:

```bash
npm i --save connext
```

## Quick Start

After installing, import the SDK into your web app, instantiate it and open the login UI.

```javascript
import ConnextSDK from "connext";

const connext = new ConnextSDK();
await connext.login();
```

Note that by default the sdk will spin up in `staging` mode on the Rinkeby Ethereum testnet. You will be able to create and send transactions, but they will not use real money. To send real-world value, you can instantiate the sdk in `production` mode:

```javascript
const connext = new ConnextSDK("production");
```

After going through the login flow, your SDK is now ready to go! Open the deposit UI to put funds into Connext:

```javascript
await connext.deposit();
```

You can query balance or the user's SDK identifier with:

```javascript
const id = connext.publicIdentifier; // id = "indra123abc..."
const balance = await connext.balance(); // balance = "1.234567"
```

And send micropayments using a recipient identifier and amount:

```javascript
const recipientIdentifier = "indra987zxy...";
const amount = "0.00001";
await connext.transfer(recipientIdentifier, amount);
```

Lastly, to open the withdraw UI:

```javascript
await connext.withdraw();
```

## Advanced Configuration

By default the browser SDK uses Eth in production and connects to our bootstrap Connext node on testnet or mainnet.

You can use the SDK with [your own Connext node](https://docs.connext.network/en/latest/how-to/deploy-indra.html) and/or token too -- just pass in the following when instantiating:

```javascript
const connext = new ConnextSDK({
   assetId: "0xabc123..." // Token address (0x0 for Eth)
   nodeUrl: "https://node.example.com"
   ethProviderUrl: "https://infura.com/abc123
})
```

Note that our bootstrap nodes will not work with custom assets. **If you are using your own token, you will need to run your own Connext node**.

## API Reference

|         Method          |                     Example                     |                              Description                               |                                                                               Params                                                                                |           Response           |
| :---------------------: | :---------------------------------------------: | :--------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------: |
|      instantiation      | `const connext = new ConnextSDK('production');` | Instantiates SDK with provided config (defaulting to `'sandbox'` mode) | Either of: String: `'production'` or: ConfigObject: { `assetId`: token address or 0x0 for Eth `ethProviderUrl`: Ethereum node RPC url `nodeUrl`: Connext node url } |                              |
|         `login`         |            `await connext.login();`             |                           Opens the login UI                           |                                                                                                                                                                     |                              |
|   `publicIdentifier`    |     `const id = connext.publicIdentifier;`      |                Gets the user's unique public identifier                |                                                                                                                                                                     | String e.g. `indra123abc...` |
|        `deposit`        |           `await connext.deposit();`            |                          Opens the deposit UI                          |                                                                                                                                                                     |                              |
|       `withdraw`        |           `await connext.withdraw();`           |                         Opens the withdraw UI                          |                                                                                                                                                                     |                              |
|        `balance`        |           `await connext.balance();`            |                        Gets the user's balance                         |                                                                                                                                                                     |    String e.g. `0.12456`     |
|       `transfer`        |      `await connext.transfer(id, amount);`      |            Sends amount to the specified public identifier             |                                                  - String: public identifier of recipient - String: amount to send                                                  |                              |
| `getTransactionHistory` |    `await connext.getTransactionHistory();`     |                Gets a history of previous transactions                 |                                                                                                                                                                     |            //TODO            |

## Development

To work on the Connext Browser SDK itself:

```bash
$ git clone git@github.com:connext/browser-connext.git
$ make build-and-watch-sdk
```

Now, you should be able to open the demo and test like so:

```bash
$ make serve-demo-app
```
