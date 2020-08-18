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
import { renderElement, sendToConnext } from "./helpers/util";
import { ConnextSDKOptions, ConnextTransaction } from "./helpers/types";
import { SDKError } from "./helpers/error";

export class ConnextSDK {
  public modal: Modal | undefined;
  private magic: Magic | undefined;
  private iframeUrl: string | undefined;
  private iframeElem: HTMLIFrameElement | undefined;

  private initialized = false;

  constructor(opts?: ConnextSDKOptions) {
    this.magic = new Magic(opts?.magicKey || DEFAULT_MAGIC_KEY, {
      network: (opts?.network as any) || DEFAULT_NETWORK,
    });
    this.iframeUrl = opts?.iframeSrc || DEFAULT_IFRAME_SRC;
  }

  public async login(): Promise<boolean> {
    await this.init();

    // TODO: magic link

    return true;
  }

  public async publicIdentifier(): Promise<string | null> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling publicIdentifier()!"
      );
    }
    return await sendToConnext(
      { action: "publicIdentifier" },
      this.iframeElem as HTMLIFrameElement
    );
  }

  public async deposit(): Promise<boolean> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    (this.modal as Modal).showDepositUI();
    return false;
  }

  public async withdraw(): Promise<boolean> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    (this.modal as Modal).showWithdrawUI();
    return false;
  }

  public async balance(): Promise<string> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling balance()!"
      );
    }
    return await sendToConnext(
      { action: "balance" },
      this.iframeElem as HTMLIFrameElement
    );
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling transfer()!"
      );
    }
    (this.modal as Modal).showTransferUI(recipient, amount);
    return false;
  }

  public async getTransactionHistory(): Promise<Array<ConnextTransaction>> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling getTransactionHistory()!"
      );
    }
    return await sendToConnext(
      { action: "getTransactionHistory" },
      this.iframeElem as HTMLIFrameElement
    );
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

    // create an invisible iframe that contains the Connext Browser SDK service
    await new Promise((resolve) => {
      const iframeOrigin = new URL(this.iframeUrl as string).origin;
      const receiveInitializedMessage = (e) => {
        if (e.origin === iframeOrigin && e.data === "INITIALIZED") {
          window.removeEventListener("message", receiveInitializedMessage); // don't listen anymore, we've successfully initialized
          resolve();
        }
      };
      window.addEventListener("message", receiveInitializedMessage, false);
      this.iframeElem = renderElement(
        "iframe",
        {
          id: "connext-iframe",
          src: this.iframeUrl as string,
          style: "width:0;height:0;border:0; border:none;",
        },
        document.body
      ) as HTMLIFrameElement;
    });

    // mark this SDK as fully initialized
    this.initialized = true;
  }
}
