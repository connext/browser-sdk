import React from "react";
import * as connext from "@connext/client";
import { IConnextClient, JsonRpcRequest, ChannelMethods } from "@connext/types";
import { utils } from "ethers";
const { Magic } = require('@magic-sdk/admin');

// although this is technically a "secret" key, it is to be available to the iframe app in order to validate that the user that is messaging us is actually who they claim to be
const mAdmin = new Magic('sk_live_6B356CD9654E33A7'); // TODO: put into constant

class App extends React.Component {
  private channel: IConnextClient | undefined;
  private parentOrigin: string | undefined;
  private parentOriginIsAuthenticated = false;
  private userDID: string | undefined;

  async handleRequest(request: JsonRpcRequest) {
    const channel = this.channel as IConnextClient;
    let result: any | undefined;
    switch (request.method) {
      case "connext_login":
        // ensure the user is actually the same one that we have in localstorage
        const existingUserDID = localStorage.getItem('userDID');
        const userDID = mAdmin.token.getIssuer(request.params.DID_token);
        if (existingUserDID !== null && existingUserDID !== userDID) {
          throw new Error(`Unauthorized! User ${userDID} is not the same as the user we are authenticated for.`);
        }
        localStorage.setItem('userDID', userDID);
        this.parentOriginIsAuthenticated = true;

        result = { publicIdentifier: channel.publicIdentifier };

        // TODO: store this DID in localstorage, this ensures that the parent site is actually authenticated via Magic
        break;
      case "connext_publicIdentifier":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        result = { publicIdentifier: channel.publicIdentifier };
        break;
      case "connext_deposit":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        result = {
          txhash: (
            await channel.deposit({
              amount: utils.parseEther(request.params.amount).toString(),
              assetId: request.params.assetId,
            })
          ).transaction.hash,
        };
        break;
      case "connext_withdraw":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        result = {
          txhash: (
            await channel.withdraw({
              recipient: request.params.recipient,
              amount: utils.parseEther(request.params.amount).toString(),
              assetId: request.params.assetId,
            })
          ).transaction.hash,
        };
        break;
      case "connext_balance":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        result = {
          balance: "",
        };
        break;
      case "connext_transfer":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        result = {
          paymentId: "",
        };
        break;
      case "connext_getTransactionHistory":
        if (!this.parentOriginIsAuthenticated) {
          throw new Error(`Unauthorized! Call connext_login first with a valid DID token`);
        }
        result = {
          transactions: [],
        };
        break;
    }
    if (request.method.startsWith("chan_") && this.userDID) {
      result = await channel.channelProvider.send(
        request.method as ChannelMethods,
        request.params
      );
    }
    if (typeof result === "undefined") {
      throw new Error(`Failed to respond to request method: ${request.method}`);
    }
    return result;
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
    this.channel = await connext.connect("rinkeby", {
      ethProviderUrl: 'https://indra.connext.network/api/ethprovider',
    });
    window.addEventListener(
      "message",
      (e) => this.handleIncomingMessages(e),
      true
    );
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
