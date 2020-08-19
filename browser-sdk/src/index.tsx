import React from "react";
import ReactDOM from "react-dom";
import { Magic, RPCError, RPCErrorCode } from "magic-sdk";
// import { ChannelProvider } from "@connext/channel-provider";
// import * as connext from "@connext/client";

import Modal from "./components/Modal";
import {
  DEFAULT_IFRAME_SRC,
  DEFAULT_MAGIC_KEY,
  DEFAULT_NETWORK,
  CONNEXT_OVERLAY_STYLE,
  CONNEXT_OVERLAY_ID,
  CONNEXT_IFRAME_ID,
  CONNEXT_LOGIN_EVENT,
} from "./constants";
import { IframeRpcConnection, renderElement, SDKError } from "./helpers";
import { ConnextSDKOptions, ConnextTransaction, LoginEvent } from "./typings";
// import { IConnextClient } from "@connext/types";

class ConnextSDK {
  private modal: Modal | undefined;
  private iframeRpc: IframeRpcConnection | undefined;
  private magic: Magic | undefined;
  private loginTarget: EventTarget | undefined;
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
      if (typeof this.loginTarget === "undefined") {
        throw new SDKError(
          "Not initialized - make sure to create login event target before calling login()!"
        );
      }
      this.loginTarget.addEventListener(CONNEXT_LOGIN_EVENT, {
        handleEvent: (event: LoginEvent) => {
          resolve(event.detail);
        },
      });
    });

    try {
      await this.magic?.auth.loginWithMagicLink({ email });
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

    this.loginTarget = new EventTarget();

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
