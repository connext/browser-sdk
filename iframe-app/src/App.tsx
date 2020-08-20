import React from "react";
import * as connext from "@connext/client";
import { IConnextClient, JsonRpcRequest, ChannelMethods } from "@connext/types";
import { Wallet, utils } from "ethers";

class App extends React.Component {
  private channel: IConnextClient | undefined;
  private parentOrigin: string | undefined;

  async authenticate(params: {
    signature: string;
    ethProviderUrl: string;
    nodeUrl: string;
  }) {
    // use the entropy of the signature to generate a private key for this wallet
    // since the signature depends on the private key stored by Magic/Metamask, this is not forgeable by an adversary
    const mnemonic = utils.entropyToMnemonic(utils.keccak256(params.signature));
    const signer = Wallet.fromMnemonic(mnemonic).privateKey;
    this.channel = await connext.connect({
      signer,
      ethProviderUrl: params.ethProviderUrl,
      nodeUrl: params.nodeUrl,
    });
    return this.channel.publicIdentifier;
  }

  async handleRequest(request: JsonRpcRequest) {
    if (request.method === "connext_authenticate") {
      const publicIdentifier = await this.authenticate(request.params);
      return { publicIdentifier };
    }

    if (typeof this.channel === "undefined") {
      throw new Error("Iframe client is not authenticated");
    }

    let result: any | undefined;

    if (request.method.startsWith("chan_")) {
      result = await this.channel.channelProvider.send(
        request.method as ChannelMethods,
        request.params
      );
    }

    if (typeof result === "undefined") {
      throw new Error(`Failed to responde to request method:${request.method}`);
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
