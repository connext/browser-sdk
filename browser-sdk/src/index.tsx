import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";
// import { ChannelProvider } from "@connext/channel-provider";

import Modal from "./Modal";
import { MAGIC_LINK_PUBLISHABLE_KEY } from "./constants";
import { ConnextSDKOptions, IConnextTransaction, SDKError } from "./helpers";
// import IframeChannelProvider from "./channel-provider";

class ConnextSDK {
  // public channelProvider: ChannelProvider;
  public modal: Modal | undefined;
  public magic: Magic | undefined;

  constructor(opts?: ConnextSDKOptions) {
    // this.channelProvider = opts?.channelProvider || new IframeChannelProvider();
    this.magic = new Magic(opts?.magicKey || MAGIC_LINK_PUBLISHABLE_KEY, {
      network: (opts?.network as any) || "rinkeby",
    });
  }

  public initializeOverlay() {
    if (typeof this.modal !== "undefined") {
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = "connext-overlay";
    document.body.appendChild(overlay);

    // style the overlay element
    const style = document.createElement("style");
    style.innerHTML = `
        #connext-overlay {
            position: fixed;
            top: 0; bottom: 0; left: 0; right: 0;
            z-index: 999;
            pointer-events: none;
        }
        #connext-overlay * {
            /* reset all CSS styles for elements inside the overlay, as a way to "sandbox" the overlay UI from the parent page without using an iframe */
            all: unset;
        }
    `;

    document.head.appendChild(style);
    this.modal = (ReactDOM.render(<Modal />, overlay) as unknown) as Modal;
  }

  public async login(): Promise<boolean> {
    this.initializeOverlay();

    // TODO: magic link

    return true;
  }

  public async publicIdentifier(): Promise<string | null> {
    return null;
  }

  public async deposit(): Promise<boolean> {
    if (typeof this.modal === "undefined") {
      throw new SDKError(
        "Overlay UI not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    this.modal.showDepositUI();
    return false;
  }

  public async withdraw(): Promise<boolean> {
    if (typeof this.modal === "undefined") {
      throw new SDKError(
        "Overlay UI not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    this.modal.showWithdrawUI();
    return false;
  }

  public async balance(): Promise<string> {
    return "0.00";
  }

  public async transfer(
    recipientPublicIdentifier: string,
    amount: string
  ): Promise<boolean> {
    if (typeof this.modal === "undefined") {
      throw new SDKError(
        "Overlay UI not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    this.modal.showTransferUI(recipientPublicIdentifier, amount);
    return false;
  }

  public async getTransactionHistory(): Promise<Array<IConnextTransaction>> {
    return [];
  }
}
export default ConnextSDK;
