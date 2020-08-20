import React from "react";
import ReactDOM from "react-dom";
import EventEmitter from "eventemitter3";
import { Magic } from "magic-sdk";
import { ChannelProvider } from "@connext/channel-provider";
import { providers } from "ethers";
import * as connext from "@connext/client";

import Modal from "./components/Modal";
import {
  DEFAULT_IFRAME_SRC,
  DEFAULT_MAGIC_KEY,
  CONNEXT_OVERLAY_STYLE,
  CONNEXT_OVERLAY_ID,
  CONNEXT_IFRAME_ID,
  AUTHENTICATION_MESSAGE,
  WITHDRAW_SUCCESS_EVENT,
  LOGIN_SUCCESS_EVENT,
} from "./constants";
import {
  IframeRpcConnection,
  renderElement,
  SDKError,
  getSdkOptions,
} from "./helpers";
import { ConnextSDKOptions, ConnextTransaction } from "./typings";
import { IConnextClient } from "@connext/types";

class ConnextSDK extends EventEmitter<string> {
  private modal: Modal | undefined;
  private iframeRpc: IframeRpcConnection | undefined;
  private assetId: string;
  private ethProviderUrl: string;
  private nodeUrl: string;
  private magic: Magic | undefined;
  private channel: IConnextClient | undefined;

  constructor(opts?: string | Partial<ConnextSDKOptions>) {
    super();
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

    const isLoggedIn = await this.isMagicLoggedIn();

    if (!isLoggedIn) {
      if (typeof this.modal === "undefined") {
        throw new SDKError(
          "SDK not initialized! Please try again."
        );
      }
      this.modal.showLoginUI();
      await this.loginWithMagic();
    }

    const signature = await this.signAuthenticationMessage();

    await this.authenticateIframe(signature);
    return true;
  }

  public async deposit(): Promise<boolean> {
    if (typeof this.modal === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    this.modal.showDepositUI();
    return false;
  }

  public async withdraw(): Promise<boolean> {
    if (typeof this.modal === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    this.modal.showWithdrawUI();
    const { amount, recipient } = await new Promise((resolve) => {
      this.on(WITHDRAW_SUCCESS_EVENT, (params) => {
        resolve(params);
      });
    });
    console.log({ amount, recipient });
    try {
      if (typeof this.channel === "undefined") {
        throw new SDKError(
          "Not initialized - make sure to await login() first before calling withdraw()!"
        );
      }
      const result = await this.channel.withdraw({
        recipient,
        amount,
        assetId: this.assetId,
      });
      console.log(result);
    } catch (error) {
      console.log(error);
      throw error;
    }
    return false;
  }

  public async balance(): Promise<string> {
    if (
      typeof this.modal === "undefined" ||
      typeof this.channel === "undefined"
    ) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling balance()!"
      );
    }
    const result = await this.channel.getFreeBalance(this.assetId);
    return result[this.channel.signerAddress].toString();
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (typeof this.modal === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling transfer()!"
      );
    }
    try {
      if (typeof this.iframeRpc === "undefined") {
        throw new SDKError(
          "Not initialized - make sure to await login() first before calling transfer()!"
        );
      }
      const result = await this.iframeRpc.send({
        method: "connext_transfer",
        params: { recipient, amount, assetId: this.assetId },
      });
      console.log("transfer", result);
      return Object.keys(result).length === 0;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getTransactionHistory(): Promise<Array<ConnextTransaction>> {
    if (
      typeof this.modal === "undefined" ||
      typeof this.channel === "undefined"
    ) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling getTransactionHistory()!"
      );
    }
    const result = await this.channel.getTransferHistory();
    // TODO: parse transfer history to match ConnextTransaction interface
    return result as any;
  }

  // ---------- Private ----------------------------------------------- //

  private async init() {
    if (this.modal) {
      return; // already initialized
    }

    if (typeof this.iframeRpc === "undefined") {
      throw new SDKError("Iframe Provider is undefined");
    }

    await this.renderModal();
    await this.waitForIframe();

    this.channel = await connext.connect({
      ethProviderUrl: this.ethProviderUrl,
      channelProvider: new ChannelProvider(this.iframeRpc),
    });
  }

  private isMagicLoggedIn() {
    if (typeof this.magic === "undefined") {
      throw new SDKError("Magic SDK has not been initialized");
    }
    return this.magic.user.isLoggedIn();
  }

  private async loginWithMagic() {
    if (typeof this.magic === "undefined") {
      throw new SDKError("Magic SDK has not been initialized");
    }
    if (typeof this.modal === "undefined") {
      throw new SDKError("Modal has not been initialized");
    }
    // Listen for user to enter email
    const email: string = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          reject(
            new SDKError(
              "Login with Magic timeout - expected email after 10 mins"
            )
          );
        },
        600_000 // 10 mins
      );
      this.on(LOGIN_SUCCESS_EVENT, ({ email }) => {
        clearTimeout(timeout);
        resolve(email);
      });
    });

    try {
      this.modal.setState({ loginStage: "pending" });
      await this.magic.auth.loginWithMagicLink({ email, showUI: false });
      this.modal.setState({ loginStage: "success" });
    } catch (error) {
      this.modal.setState({ loginStage: "failure" });
      throw error;
    }
  }

  private async signAuthenticationMessage() {
    if (typeof this.magic === "undefined") {
      throw new SDKError("Magic SDK has not been initialized");
    }
    const accounts = await this.magic.rpcProvider.send("eth_accounts");
    const result = await this.magic.rpcProvider.send("personal_sign", [
      AUTHENTICATION_MESSAGE,
      accounts[0],
    ]);
    return result;
  }

  private async authenticateIframe(signature: string) {
    if (
      typeof this.modal === "undefined" ||
      typeof this.iframeRpc === "undefined"
    ) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling publicIdentifier()!"
      );
    }
    await this.iframeRpc.send({
      method: "connext_authenticate",
      params: {
        signature,
        ethProviderUrl: this.ethProviderUrl,
        nodeUrl: this.nodeUrl,
      },
    });
  }

  private async waitForIframe() {
    await new Promise((resolve) => {
      if (typeof this.iframeRpc === "undefined") {
        throw new SDKError("Iframe Provider is undefined");
      }
      if (this.iframeRpc.connected) {
        resolve();
      } else {
        this.iframeRpc.once("connect", () => {
          resolve();
        });
      }
    });
  }

  private async renderModal() {
    // style all the elements we're injecting into the page
    renderElement(
      "style",
      { innerHTML: CONNEXT_OVERLAY_STYLE },
      window.document.head
    );

    // create the overlay UI container and render the UI inside it using React

    this.modal = (ReactDOM.render(
      <Modal emit={this.emit.bind(this)} />,
      renderElement("div", { id: CONNEXT_OVERLAY_ID }, window.document.body)
    ) as unknown) as Modal;
  }
}

export default ConnextSDK;
