import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";

import Modal from "./components/Modal";
import {
  CONNEXT_OVERLAY_STYLE,
  DEFAULT_IFRAME_SRC,
  DEFAULT_MAGIC_KEY,
  DEFAULT_NETWORK,
  CONNEXT_OVERLAY_ID,
  CONNEXT_IFRAME_ID,
} from "./constants";
import { IframeRpcConnection, renderElement, SDKError } from "./helpers";
import { ConnextSDKOptions, ConnextTransaction } from "./typings";

class ConnextSDK {
  public modal: Modal | undefined;
  private iframeRpc: IframeRpcConnection | undefined;


  public magic: Magic | undefined;
  private isLoggedIn: boolean;
  private userIssuer: string | null;
  private userEmail: string | null;
  private userPublicAddress: string | null;

  private initialized = false;

  constructor(opts?: ConnextSDKOptions) {
    this.isLoggedIn = false;
    this.userIssuer = null;
    this.userEmail = null;
    this.userPublicAddress = null;
    this.magic = new Magic(opts?.magicKey || DEFAULT_MAGIC_KEY, {
      network: (opts?.network as any) || DEFAULT_NETWORK,
    });
    this.iframeRpc = new IframeRpcConnection({
      src: opts?.iframeSrc || DEFAULT_IFRAME_SRC,
      id: CONNEXT_IFRAME_ID,
    });
  }

  public async login(): Promise<boolean> {
    await this.init();

    // TODO: magic link

    return true;
  }

  public async publicIdentifier(): Promise<string | null> {
    if (!this.initialized || typeof this.iframeRpc === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling publicIdentifier()!"
      );
    }
    const result = await this.iframeRpc.send({
      method: "connext_publicIdentifier",
    });
    return result;
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
    if (!this.initialized || typeof this.iframeRpc === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling balance()!"
      );
    }
    const result = await this.iframeRpc.send({ method: "connext_balance" });
    return result;
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
    if (!this.initialized || typeof this.iframeRpc === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling getTransactionHistory()!"
      );
    }
    const result = await this.iframeRpc.send({
      method: "connext_getTransactionHistory",
    });
    return result;
  }

  private async init() {
    if (this.initialized) {
      return;
    }

    // const client = await connext.connect({
    //   channelProvider: new ChannelProvider(new IframeRpcConnection(this.iframeElem as HTMLIFrameElement)),
    // })

    // style all the elements we're injecting into the page
    renderElement(
      "style",
      { innerHTML: CONNEXT_OVERLAY_STYLE },
      window.document.head
    );

    // create the overlay UI container and render the UI inside it using React
    const overlay = renderElement(
      "div",
      { id: CONNEXT_OVERLAY_ID },
      window.document.body
    );
    this.modal = (ReactDOM.render(
      <Modal
        magic={this.magic}
        isLoggedIn={this.isLoggedIn}
        setIsLoggedIn={(e) => {
          this.isLoggedIn = e;
        }}
        userIssuer={this.userIssuer}
        setUserIssuer={(e) => {
          this.userIssuer = e;
        }}
        userEmail={this.userEmail}
        setUserEmail={(e) => {
          this.userEmail = e;
        }}
        userPublicAddress={this.userPublicAddress}
        setUserPublicAddress={(e) => {
          this.userPublicAddress = e;
        }}
      />,
      overlay
    ) as unknown) as Modal;

    await new Promise((resolve) => {
      if (typeof this.iframeRpc === "undefined") {
        throw new Error("Iframe Provider is undefined");
      }
      if (this.iframeRpc.connected) {
        resolve();
      } else {
        this.iframeRpc.once("connect", () => {
          resolve();
        });
      }
    });

    // mark this SDK as fully initialized
    this.initialized = true;
  }
}

export default ConnextSDK;
