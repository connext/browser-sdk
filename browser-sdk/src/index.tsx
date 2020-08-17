import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";
// import { ChannelProvider } from "@connext/channel-provider";

import Modal from "./components/Modal";
// import IframeChannelProvider from "./channel-provider";
import { MAGIC_LINK_PUBLISHABLE_KEY, RINKEBY_NETWORK } from "./constants";
import {
  ConnextSDKOptions,
  IConnextTransaction,
  SDKError,
  renderElement,
} from "./helpers";

class ConnextSDK {
  // public channelProvider: ChannelProvider;
  public modal: Modal | undefined;
  public magic: Magic | undefined;

  constructor(opts?: ConnextSDKOptions) {
    // this.channelProvider = opts?.channelProvider || new IframeChannelProvider();
    this.magic = new Magic(opts?.magicKey || MAGIC_LINK_PUBLISHABLE_KEY, {
      network: (opts?.network as any) || RINKEBY_NETWORK,
    });
  }

  public render() {
    if (typeof this.modal !== "undefined") {
      return;
    }
    renderElement(
      "style",
      {
        innerHTML: `
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
        `,
      },
      "head"
    );
    const overlay = renderElement("div", { id: "connext-overlay" });
    this.modal = (ReactDOM.render(<Modal />, overlay) as unknown) as Modal;
  }

  public async login(): Promise<boolean> {
    this.render();

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

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (typeof this.modal === "undefined") {
      throw new SDKError(
        "Overlay UI not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    this.modal.showTransferUI(recipient, amount);
    return false;
  }

  public async getTransactionHistory(): Promise<Array<IConnextTransaction>> {
    return [];
  }
}
export default ConnextSDK;
