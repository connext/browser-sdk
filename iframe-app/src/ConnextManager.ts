import { Wallet, utils } from "ethers";
import * as connext from "@connext/client";
import { JsonRpcRequest, ChannelMethods, IConnextClient } from "@connext/types";

export function payloadId(): number {
  const date = new Date().getTime() * Math.pow(10, 3);
  const extra = Math.floor(Math.random() * Math.pow(10, 3));
  return date + extra;
}

export default class ConnextManager {
  private parentOrigin: string;
  private signer: string | undefined;
  private channel: IConnextClient | undefined;

  constructor() {
    this.parentOrigin = new URL(document.referrer).origin;
    window.addEventListener(
      "message",
      (e) => this.handleIncomingMessage(e),
      true
    );
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", () => {
        window.parent.postMessage(
          "event:iframe-initialized",
          this.parentOrigin
        );
      });
    } else {
      window.parent.postMessage("event:iframe-initialized", this.parentOrigin);
    }
  }

  private async initChannel(
    ethProviderUrl: string,
    nodeUrl: string,
    signature: string
  ): Promise<IConnextClient> {
    // use the entropy of the signature to generate a private key for this wallet
    // since the signature depends on the private key stored by Magic/Metamask, this is not forgeable by an adversary
    const mnemonic = utils.entropyToMnemonic(utils.keccak256(signature));
    this.signer = Wallet.fromMnemonic(mnemonic).privateKey;
    this.channel = await connext.connect({
      signer: this.signer,
      ethProviderUrl,
      nodeUrl,
    });
    return this.channel;
  }

  private async handleIncomingMessage(e: MessageEvent) {
    if (e.origin !== this.parentOrigin) return;
    const request = JSON.parse(e.data);
    let response: any;
    try {
      const result = await this.handleRequest(request);
      response = { id: request.id, result };
    } catch (e) {
      console.error(e);
      response = { id: request.id, error: { message: e.message } };
    }
    window.parent.postMessage(JSON.stringify(response), this.parentOrigin);
  }

  private async handleRequest(request: JsonRpcRequest) {
    if (request.method === "connext_authenticate") {
      console.log("[connext_authenticate]", "request.params", request.params);
      await this.initChannel(
        request.params.ethProviderUrl,
        request.params.nodeUrl,
        request.params.signature
      );
      return { success: true };
    }
    if (typeof this.channel === "undefined") {
      throw new Error(
        "Channel provider not initialized within iframe app - ensure that connext_authenticate is called before any other commands"
      );
    }
    // if (request.method === "chan_subscribe") {
    //   console.log("[chan_subscribe]", "request.params", request.params);
    //   const subscription = utils.keccak256(utils.toUtf8Bytes(`${request.id}`));

    //   this.channel.on(request.params.event, (data) => {
    //     const payload: JsonRpcRequest = {
    //       id: payloadId(),
    //       jsonrpc: "2.0",
    //       method: "chan_subscription",
    //       params: {
    //         subscription,
    //         data,
    //       },
    //     };
    //     console.log("[chan_subscription]", "payload", payload);
    //     window.parent.postMessage(JSON.stringify(payload), this.parentOrigin);
    //   });
    //   return subscription;
    // }
    // if (request.method === "chan_unsubscribe") {
    //   this.channel.off();
    //   return true;
    // }
    console.log(`[${request.method}]`, "request.params", request.params);
    return await this.channel.channelProvider.send(
      request.method as ChannelMethods,
      request.params
    );
  }
}
