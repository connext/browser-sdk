# Connext Browser SDK

The Connext Browser SDK is the simplest way to add micropayments to any web app.

[Connext](https://connext.network) is the protocol for p2p micropayments, built using [state channels](https://docs.connext.network/en/latest/quickstart/introduction.html#state-channel-basics) on the Ethereum blockchain. This SDK creates a [Connext client](https://docs.connext.network/en/latest/quickstart/clientInstantiation.html) inside of an iframe in your browser page, and then uses that client along with some minimal UI components to dispatch transfers to a recipient.

The SDK supports the following features:

- 🎩 Email-based login via [Magic](https://magic.link).
- 💳 Debit card on/offboarding via [Moonpay](https://moonpay.io).
- ⛽ End-to-end Ethereum gas (transaction fee) abstraction.
- 💵 Transfers in USD by default, with optional customizeability to other currencies.
- 🦊 Login using any popular Ethereum wallet such as [Metamask](https://metamask.io). (coming soon!)

## Installation

You can install the SDK using npm:

```bash
npm i --save connext
```

## Usage

After installing, import the SDK into your web app, instantiate it and open the login UI.

```javascript
import ConnextSDK from "connext";

const connext = new ConnextSDK();

// login
await connext.login();

// publicIdentifier
const publicIdentifier = connext.publicIdentifier;

// balance
const balance = await connext.balance();

// deposit
await connext.deposit();

// transfer
const recipientIdentifier = "indra987zxy...";
const amount = "0.00001";
await connext.transfer(recipientIdentifier, amount);

// withdraw
await connext.withdraw();
```

## Documentation

For more documentation, please check the [Github repo for Connext SDK](https://github.com/connext/browser-sdk)
