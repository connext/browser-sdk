import React from "react";
import * as connext from "@connext/client";
import { IConnextClient, JsonRpcRequest } from "@connext/types";
import { utils } from "ethers";
const { Magic } = require('@magic-sdk/admin');

// although this is technically a "secret" key, it is to be available to the iframe app in order to validate that the user that is messaging us is actually who they claim to be
const mAdmin = new Magic('sk_live_6B356CD9654E33A7'); // TODO: put into constant

class App extends React.Component {
  private channel: IConnextClient | undefined;
  private parentOrigin: string | undefined;
  private parentOriginIsAuthenticated = false;

  appendToTransactionHistory(newItem: any) {
    const transactionHistory = JSON.parse(window.localStorage.getItem('transactionHistory') || '[]');
    window.localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory.concat([newItem])));
  }

  async handleRequest(request: JsonRpcRequest) {
    const channel = this.channel as IConnextClient;
    switch (request.method) {
      case "connext_login":
        // ensure the user is actually the same one that we have in localstorage
        const existingUserDID = window.localStorage.getItem('userDID');
        const userDID = mAdmin.token.getIssuer(request.params.DID_token);
        if (existingUserDID !== null && existingUserDID !== userDID) {
          throw new Error(`Unauthorized! User ${userDID} is not the same as the user we are authenticated for.`);
        }
        window.localStorage.setItem('userDID', userDID);
        this.parentOriginIsAuthenticated = true;
        return { publicIdentifier: channel.publicIdentifier };
      case "connext_deposit":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        const depositResult = await channel.deposit({
          amount: utils.parseEther(request.params.amount).toString(),
          assetId: request.params.assetId,
        });
        this.appendToTransactionHistory({
          type: "deposit",
          value: request.params.amount,
          timestamp: Date.now(),
          txhash: depositResult.transaction.hash,
        });
        return {txhash: depositResult.transaction.hash};
      case "connext_withdraw":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        const withdrawResult = await channel.withdraw({
          recipient: request.params.recipient,
          amount: utils.parseEther(request.params.amount).toString(),
          assetId: request.params.assetId,
        });
        this.appendToTransactionHistory({
          type: "withdraw",
          value: request.params.amount,
          timestamp: Date.now(),
          txhash: withdrawResult.transaction.hash,
        });
        return {txhash: withdrawResult.transaction.hash,};
      case "connext_balance":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        const freeBalance = await channel.getFreeBalance();
        const userFreeBalance = freeBalance[channel.signerAddress].toString();
        return {balance: userFreeBalance};
      case "connext_transfer":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        return {paymentId: ""};
      case "connext_getTransactionHistory":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        const transactionHistory = JSON.parse(window.localStorage.getItem('transactionHistory') || '[]');
        return {transactions: transactionHistory};
    }
    // if (request.method.startsWith("chan_") && this.userDID) {
    //   result = await channel.channelProvider.send(
    //     request.method as ChannelMethods,
    //     request.params
    //   );
    // }
  }

  async handleIncomingMessages(e: MessageEvent) {
    if (e.origin !== this.parentOrigin) return;
    const request = JSON.parse(e.data);
    let response: any;
    try {
      const result = await this.handleRequest(request);
      response = {
        id: request.id,
        result,
      };
    } catch (e) {
      response = {
        id: request.id,
        error: {
          message: e.message,
        },
      };
    }
    window.parent.postMessage(JSON.stringify(response), this.parentOrigin);
  }

  async componentDidMount() {
    this.parentOrigin = new URL(document.referrer).origin;
    this.channel = await connext.connect("rinkeby");
    window.addEventListener("message", (e) => this.handleIncomingMessages(e), true);
    window.parent.postMessage("event:iframe-initialized", this.parentOrigin);
  }

  render() {
    return (
      <div className="App">
        <div className="Content">Test</div>
      </div>
    );
  }
}

export default App;
