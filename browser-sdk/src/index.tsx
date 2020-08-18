import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";

import Modal from "./components/Modal";
import {
  STYLE_CONNEXT_OVERLAY,
  DEFAULT_IFRAME_SRC,
  DEFAULT_MAGIC_KEY,
  DEFAULT_NETWORK,
} from "./constants";
import { renderElement } from "./helpers/util";
import { ConnextSDKOptions, ConnextTransaction } from "./helpers/types";
import { SDKError } from "./helpers/error";
import IframeProvider from "./helpers/iframe";

export class ConnextSDK {
  public modal: Modal | undefined;
  private magic: Magic | undefined;
  private iframeProvider: IframeProvider | undefined;

  private initialized = false;

  constructor(opts?: ConnextSDKOptions) {
    this.magic = new Magic(opts?.magicKey || DEFAULT_MAGIC_KEY, {
      network: (opts?.network as any) || DEFAULT_NETWORK,
    });
    this.iframeProvider = new IframeProvider(
      opts?.iframeSrc || DEFAULT_IFRAME_SRC
    );
  }

  public async login(): Promise<boolean> {
    await this.init();

    // TODO: magic link

    return true;
  }

  public async publicIdentifier(): Promise<string | null> {
    if (!this.initialized || typeof this.iframeProvider === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling publicIdentifier()!"
      );
    }
    return this.iframeProvider.send({ action: "publicIdentifier" });
  }

  public async deposit(): Promise<boolean> {
    if (!this.initialized || typeof this.modal === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    this.modal.showDepositUI();
    return false;
  }

  public async withdraw(): Promise<boolean> {
    if (!this.initialized || typeof this.modal === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    this.modal.showWithdrawUI();
    return false;
  }

  public async balance(): Promise<string> {
    if (!this.initialized || typeof this.iframeProvider === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling balance()!"
      );
    }
    return this.iframeProvider.send({ action: "balance" });
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (!this.initialized || typeof this.modal === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling transfer()!"
      );
    }
    this.modal.showTransferUI(recipient, amount);
    return false;
  }

  public async getTransactionHistory(): Promise<Array<ConnextTransaction>> {
    if (!this.initialized || typeof this.iframeProvider === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling getTransactionHistory()!"
      );
    }
    return this.iframeProvider.send({ action: "getTransactionHistory" });
  }

  private async init() {
    if (this.initialized) {
      return;
    }

    // const client = await connext.connect({
    //   channelProvider: new ChannelProvider(new IframeRpcConnection(this.iframeElem as HTMLIFrameElement)),
    // })

    // style all the elements we're injecting into the page
    renderElement("style", { innerHTML: STYLE_CONNEXT_OVERLAY }, document.head);

    // create the overlay UI container and render the UI inside it using React
    const overlay = renderElement(
      "div",
      { id: "connext-overlay" },
      document.body
    );
    this.modal = (ReactDOM.render(<Modal />, overlay) as unknown) as Modal;

    await new Promise((resolve) => {
      if (typeof this.iframeProvider === "undefined") {
        throw new Error("Iframe Provider is undefined");
      }
      if (this.iframeProvider.connected) {
        resolve();
      } else {
        this.iframeProvider.once("connected", () => {
          resolve();
        });
      }
    });

    // mark this SDK as fully initialized
    this.initialized = true;
  }
}
