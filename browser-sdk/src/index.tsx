import React, { useReducer } from "react";
import ReactDOM from "react-dom";
import { Magic, MagicUserMetadata, RPCError, RPCErrorCode } from "magic-sdk";
import { ChannelProvider } from "@connext/channel-provider";
// import * as connext from "@connext/client";

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
import { ConnextSDKOptions, ConnextTransaction, LoginEvent } from "./typings";
import { IConnextClient } from "@connext/types";

class ConnextSDK {
  public modal: Modal | undefined;
  private iframeRpc: IframeRpcConnection | undefined;
  public magic: Magic | undefined;
  private magicUserMetaData: MagicUserMetadata | undefined;
  private loginTarget: EventTarget;
  // private channel: IConnextClient | undefined;

  private initialized = false;

  constructor(opts?: ConnextSDKOptions) {
    this.magic = new Magic(opts?.magicKey || DEFAULT_MAGIC_KEY, {
      network: (opts?.network as any) || DEFAULT_NETWORK,
    });
    this.iframeRpc = new IframeRpcConnection({
      src: opts?.iframeSrc || DEFAULT_IFRAME_SRC,
      id: CONNEXT_IFRAME_ID,
    });
    this.loginTarget = new EventTarget();
  }

  public async publicIdentifier(): Promise<string> {
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

  public async login(): Promise<boolean> {
    await this.init();

    try {
      // Check if user is already logged in
      const isUserLoggedIn = await this.magic?.user.isLoggedIn();
      if (isUserLoggedIn) {
        this.magicUserMetaData = await this.magic?.user.getMetadata();
        this.modal?.setState({ isLoggedIn: true });
        return true;
      }
    } catch (error) {
      if (error instanceof RPCError) {
        switch (error.code) {
          case RPCErrorCode.InternalError:
            // Checking for isLoggedIn before being logged in always throws a -32603 InternalError
            console.log(error);
            break;
          default:
            break;
        }
      } else {
        console.log(error);
      }
    }

    // Listen for user to enter email
    const email: string = await new Promise((resolve, reject) => {
      this.loginTarget.addEventListener("login", {
        handleEvent: (event: LoginEvent) => {
          resolve(event.detail);
        },
      });
    });

    try {
      await this.magic?.auth.loginWithMagicLink({ email });
      this.magicUserMetaData = await this.magic?.user.getMetadata();
      this.modal?.setState({ isLoggedIn: true });
      return true;
    } catch (error) {
      if (error instanceof RPCError) {
        switch (error.code) {
          case RPCErrorCode.MagicLinkFailedVerification:
          case RPCErrorCode.MagicLinkExpired:
          case RPCErrorCode.MagicLinkRateLimited:
          case RPCErrorCode.UserAlreadyLoggedIn:
            console.log(error);
            break;
        }
      } else {
        console.log(error);
      }
      return false;
    }
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
      <Modal magic={this.magic} loginTarget={this.loginTarget} />,
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

    if (typeof this.iframeRpc === "undefined") {
      throw new Error("Iframe Provider is undefined");
    }

    // this.channel = await connext.connect({
    //   channelProvider: new ChannelProvider(this.iframeRpc),
    // });

    // mark this SDK as fully initialized
    this.initialized = true;
  }
}

export default ConnextSDK;
