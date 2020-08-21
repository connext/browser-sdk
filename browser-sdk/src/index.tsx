import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";
import { ChannelProvider } from "@connext/channel-provider";
import * as connext from "@connext/client";
import { BigNumber } from "ethers";

import Modal from "./components/Modal";
import {
  DEFAULT_IFRAME_SRC,
  DEFAULT_MAGIC_KEY,
  CONNEXT_OVERLAY_STYLE,
  CONNEXT_OVERLAY_ID,
  CONNEXT_IFRAME_ID,
  AUTHENTICATION_MESSAGE,
} from "./constants";
import {
  IframeRpcConnection,
  renderElement,
  SDKError,
  getSdkOptions,
} from "./helpers";
import { ConnextSDKOptions, ConnextTransaction } from "./typings";
import { IConnextClient } from "@connext/types";

class ConnextSDK {
  private assetId: string;
  private ethProviderUrl: string;
  private nodeUrl: string;
  private magic: Magic;
  private iframeRpc: IframeRpcConnection;
  private channel: IConnextClient | undefined;
  private modal: Modal | undefined;

  constructor(opts?: string | Partial<ConnextSDKOptions>) {
    const options = getSdkOptions(opts);
    this.assetId = options.assetId;
    this.ethProviderUrl = options.ethProviderUrl;
    this.nodeUrl = options.nodeUrl;
    this.magic = new Magic(DEFAULT_MAGIC_KEY, {
      network: { rpcUrl: this.ethProviderUrl },
    });
    this.iframeRpc = new IframeRpcConnection({
      src: DEFAULT_IFRAME_SRC,
      id: CONNEXT_IFRAME_ID,
    });
  }

  get publicIdentifier(): string {
    if (typeof this.channel?.publicIdentifier === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before getting publicIdentifier!"
      );
    }
    return this.channel?.publicIdentifier;
  }

  public async login(): Promise<boolean> {
    await this.init();
    if (typeof this.modal === "undefined") {
      throw new SDKError("Modal has not been initialized");
    }
    return await this.modal.startLogin();
  }

  public async deposit(): Promise<boolean> {
    if (typeof this.modal === 'undefined' || typeof this.channel === 'undefined') {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    return await this.modal.startDeposit();
  }

  public async withdraw(): Promise<boolean> {
    if (typeof this.modal === 'undefined' || typeof this.channel === 'undefined') {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    return await this.modal.startWithdraw();
  }

  public async balance(): Promise<string> {
    if (typeof this.channel === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling balance()!"
      );
    }
    const result = await this.channel.getFreeBalance(this.assetId);
    return BigNumber.from(result[this.channel.signerAddress]).toHexString();
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (typeof this.channel === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling transfer()!"
      );
    }
    try {
      const result = await this.channel.transfer({
        recipient,
        amount,
        assetId: this.assetId,
      });
      console.log("transfer", result);
      return Object.keys(result).length === 0;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getTransactionHistory(): Promise<Array<ConnextTransaction>> {
    if (typeof this.channel === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling getTransactionHistory()!"
      );
    }
    const result = await this.channel.getTransferHistory();
    // TODO: parse transfer history to match ConnextTransaction interface
    return result as any;
  }

  async authenticateWithMagic() {
    const accounts = await this.magic.rpcProvider.send("eth_accounts");
    const signature = await this.magic.rpcProvider.send("personal_sign", [
      AUTHENTICATION_MESSAGE,
      accounts[0],
    ]);

    await this.iframeRpc.send({
      method: "connext_authenticate",
      params: {
        userSecretEntropy: signature,
        ethProviderUrl: this.ethProviderUrl,
        nodeUrl: this.nodeUrl,
      },
    });
    this.channel = await connext.connect({
      ethProviderUrl: this.ethProviderUrl,
      channelProvider: new ChannelProvider(this.iframeRpc),
    });
  }

  // ---------- Private ----------------------------------------------- //

  private async init() {
    if (typeof this.modal !== 'undefined') {
      return; // already initialized
    }

    // wait for this.iframeRpc to be fully initialized
    await new Promise((resolve) => {
      if (this.iframeRpc.connected) {
        resolve();
      } else {
        this.iframeRpc.once("connect", resolve);
      }
    });

    // create the styled overlay UI container, and render the UI inside it using React
    renderElement("style", { innerHTML: CONNEXT_OVERLAY_STYLE }, window.document.head);
    this.modal = (ReactDOM.render(
      <Modal sdkInstance={this} />,
      renderElement("div", { id: CONNEXT_OVERLAY_ID }, window.document.body)
    ) as unknown) as Modal;
  }
}

export default ConnextSDK;
