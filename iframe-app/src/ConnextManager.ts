import { JsonRpcRequest, ChannelMethods, IChannelProvider } from "@connext/types";
import { getLocalStore } from "@connext/store";
import { ChannelSigner, ConsoleLogger, getChainId } from "@connext/utils";
import { NodeApiClient } from "@connext/client/dist/node";

import { Wallet, utils, providers } from "ethers";

export default class ConnextManager {
  private parentOrigin: string;
  private privateKey: string | undefined;
  private channelProvider: IChannelProvider | undefined;

  constructor() {
    this.parentOrigin = new URL(document.referrer).origin;
    window.addEventListener("message", (e) => this.handleIncomingMessage(e), true);
    if (document.readyState === 'loading') {
      window.addEventListener("DOMContentLoaded", () => {
        window.parent.postMessage("event:iframe-initialized", this.parentOrigin as string);
      });
    } else {
      window.parent.postMessage("event:iframe-initialized", this.parentOrigin);
    }
  }

  private async initializeChannelProvider(ethProviderUrl: string, nodeUrl: string, signature: string): Promise<IChannelProvider> {
    // use the entropy of the signature to generate a private key for this wallet
    // since the signature depends on the private key stored by Magic/Metamask, this is not forgeable by an adversary
    const mnemonic = utils.entropyToMnemonic(utils.keccak256(signature));
    this.privateKey = Wallet.fromMnemonic(mnemonic).privateKey;

    const chainId = await getChainId(ethProviderUrl);
    const ethProvider = new providers.JsonRpcProvider(ethProviderUrl, chainId);
    const node = await NodeApiClient.init({
      ethProvider: ethProvider,
      chainId: chainId,
      store: getLocalStore(),
      // @ts-ignore: messaging is actually optional despite being marked as required in the typescript annotations, see @connext/client/src/node.ts
      messaging: undefined,
      logger: new ConsoleLogger("ConnextConnect"),
      nodeUrl: nodeUrl,
      signer: new ChannelSigner(this.privateKey, ethProvider),
    });
    if (typeof node.channelProvider === 'undefined') {
      throw new Error('Node ChannelProvider not present!');
    }
    return node.channelProvider;
  }

  private async handleIncomingMessage(e: MessageEvent) {
    if (e.origin !== this.parentOrigin) return;
    const request = JSON.parse(e.data);
    let response: any;
    try {
      const result = await this.handleRequest(request);
      response = {id: request.id, result};
    } catch (e) {
      response = {id: request.id, error: {message: e.message}};
    }
    window.parent.postMessage(JSON.stringify(response), this.parentOrigin);
  }

  private async handleRequest(request: JsonRpcRequest) {
    console.log('IFRAME REQUEST', request);
    if (request.method === "connext_authenticate") {
      this.channelProvider = await this.initializeChannelProvider(
        request.params.ethProviderUrl,
        request.params.nodeUrl,
        request.params.userSecretEntropy,
      );
      return { success: true };
    }
    if (typeof this.channelProvider === 'undefined') {
      throw new Error("Channel provider not initialized within iframe app - ensure that connext_authenticate is called before any other commands");
    }
    return await this.channelProvider.send(request.method as ChannelMethods, request.params);
  }
}
