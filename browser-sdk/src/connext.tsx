import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";

import Modal from "./Modal";
import { MAGIC_LINK_PUBLISHABLE_KEY } from "./constants";

let MODAL_COMPONENT: Modal | null = null;
const MAGIC_LINK_CLIENT = new Magic(MAGIC_LINK_PUBLISHABLE_KEY, {
  network: "rinkeby",
});

// custom error class for errors at the developer-SDK boundary
class SDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SDKError";
  }
}

interface IConnextTransaction {
  recipientPublicIdentifier: string;
  amount: string;
  timestamp: Date;
}
class ConnextSDK {
  public initializeOverlay() {
    if (MODAL_COMPONENT !== null) {
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
    MODAL_COMPONENT = (ReactDOM.render(<Modal />, overlay) as unknown) as Modal;
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
    if (MODAL_COMPONENT === null) {
      throw new SDKError(
        "Overlay UI not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    MODAL_COMPONENT.showDepositUI();
    return false;
  }

  public async withdraw(): Promise<boolean> {
    if (MODAL_COMPONENT === null) {
      throw new SDKError(
        "Overlay UI not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    MODAL_COMPONENT.showWithdrawUI();
    return false;
  }

  public async balance(): Promise<string> {
    return "0.00";
  }

  public async transfer(
    recipientPublicIdentifier: string,
    amount: string
  ): Promise<boolean> {
    if (MODAL_COMPONENT === null) {
      throw new SDKError(
        "Overlay UI not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    MODAL_COMPONENT.showTransferUI(recipientPublicIdentifier, amount);
    return false;
  }

  public async getTransactionHistory(): Promise<Array<IConnextTransaction>> {
    return [];
  }
}
export default ConnextSDK;
