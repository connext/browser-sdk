import React from "react";
import ReactDOM from "react-dom";
import EventEmitter from "eventemitter3";
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
  AUTHENTICATION_MESSAGE,
  WITHDRAW_SUCCESS_EVENT,
  LOGIN_SUCCESS_EVENT,
} from "./constants";
import { IframeRpcConnection, renderElement, SDKError } from "./helpers";
import { ConnextSDKOptions, ConnextTransaction } from "./typings";
// import { IConnextClient } from "@connext/types";

class ConnextSDK extends EventEmitter<string> {
  private modal: Modal | undefined;
  private iframeRpc: IframeRpcConnection | undefined;
  private network: string;
  private magic: Magic | undefined;
  // private channel: IConnextClient | undefined;
  private userPublicIdentifier: string | undefined;

  private initialized = false;

  constructor(opts?: ConnextSDKOptions) {
    super();
    this.network = opts?.network || DEFAULT_NETWORK;
    this.magic = new Magic(opts?.magicKey || DEFAULT_MAGIC_KEY, {
      network: this.network as any,
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

    const isLoggedIn = await this.isMagicLoggedIn();

    if (!isLoggedIn) {
      await this.loginWithMagic();
    }

    const signature = await this.signAuthenticationMessage();

    await this.authenticateIframe(signature);
    return true;
  }

  public async deposit(): Promise<boolean> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    this.modal?.showDepositUI();
    return false;
  }

  public async withdraw(): Promise<boolean> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    this.modal?.showWithdrawUI();
    const { amount, recipient } = await new Promise((resolve) => {
      this.on(WITHDRAW_SUCCESS_EVENT, (params) => {
        resolve(params);
      });
    });
    console.log({ amount, recipient });
    try {
      const result = await this.iframeRpc?.send({
        method: "connext_withdraw",
        params: { recipient, amount, assetId: "" },
      });
      console.log(result);
    } catch (error) {
      console.log(error);
      throw error;
    }
    return false;
  }

  public async balance(): Promise<string> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling balance()!"
      );
    }
    // console.warn(this.channel?.getFreeBalance());
    const result = await this.iframeRpc?.send({ method: "connext_balance" });
    return result.balance;
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling transfer()!"
      );
    }
    this.modal?.showTransferUI(recipient, amount);
    return false;
  }

  public async getTransactionHistory(): Promise<Array<ConnextTransaction>> {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling getTransactionHistory()!"
      );
    }
    const result = await this.iframeRpc?.send({
      method: "connext_getTransactionHistory",
    });
    return result;
  }

  private async init() {
    if (this.modal) {
      return;
    }

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
      <Modal emit={this.emit.bind(this)} />,
      overlay
    ) as unknown) as Modal;

    await new Promise((resolve) => {
      if (typeof this.iframeRpc === "undefined") {
        throw new Error("Iframe Provider is undefined");
      }
      if (this.iframeRpc.connected) {
        resolve(); // TODO: doesn't wait for component to be fully mounted
      } else {
        this.iframeRpc.once("connect", () => {
          resolve();
        });
      }
    });
    this.iframeRpc?.subscribe();

    if (typeof this.iframeRpc === "undefined") {
      throw new Error("Iframe Provider is undefined");
    }

    // this.channel = await connext.connect({
    //   channelProvider: new ChannelProvider(this.iframeRpc),
    // });

    // mark this SDK as fully initialized
    this.initialized = true;
  }

  private async isMagicLoggedIn() {
    if (typeof this.magic === "undefined") {
      throw new Error("Magic SDK has not been initialized");
    }
    if (typeof this.modal === "undefined") {
      throw new Error("Modal has not been initialized");
    }
    try {
      // Check if user is already logged in
      const isLoggedIn = await this.magic.user.isLoggedIn();
      if (isLoggedIn) {
        this.modal.setState({ isLoggedIn: true });
      }
      return isLoggedIn;
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
    return false;
  }

  private async loginWithMagic() {
    if (typeof this.magic === "undefined") {
      throw new Error("Magic SDK has not been initialized");
    }
    if (typeof this.modal === "undefined") {
      throw new Error("Modal has not been initialized");
    }
    // Listen for user to enter email
    const email: string = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          reject(
            new Error("Login with Magic timeout - expected email after 10 mins")
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
      await this.magic.auth.loginWithMagicLink({ email });
      this.modal.setState({ isLoggedIn: true });
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
    }
  }

  private async signAuthenticationMessage() {
    if (typeof this.magic === "undefined") {
      throw new Error("Magic SDK has not been initialized");
    }
    const accounts = await this.magic.rpcProvider.send("eth_accounts");
    const result = await this.magic.rpcProvider.send("personal_sign", [
      AUTHENTICATION_MESSAGE,
      accounts[0],
    ]);
    return result;
  }

  private async authenticateIframe(signature: string) {
    if (!this.initialized || typeof this.iframeRpc === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling publicIdentifier()!"
      );
    }
    await this.iframeRpc.send({
      method: "connext_authenticate",
      params: { signature, network: this.network },
    });
  }
}

export default ConnextSDK;
