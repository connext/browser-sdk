import React from "react";
import ReactDOM from "react-dom";
import { Magic, MagicUserMetadata, RPCError, RPCErrorCode } from "magic-sdk";
import { ChannelProvider } from "@connext/channel-provider";
import * as connext from "@connext/client";

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
import { IConnextClient } from "@connext/types";

class ConnextSDK {
  public modal: Modal | undefined;
  private iframeRpc: IframeRpcConnection | undefined;
  public magic: Magic | undefined;
  private connextTarget: EventTarget;
  private channel: IConnextClient | undefined;
  private userPublicIdentifier: string | undefined;

  private initialized = false;

  constructor(opts?: ConnextSDKOptions) {
    this.magic = new Magic(opts?.magicKey || DEFAULT_MAGIC_KEY, {
      network: (opts?.network as any) || DEFAULT_NETWORK,
    });
    this.iframeRpc = new IframeRpcConnection({
      src: opts?.iframeSrc || DEFAULT_IFRAME_SRC,
      id: CONNEXT_IFRAME_ID,
    });
    this.connextTarget = new EventTarget();
  }

  get publicIdentifier(): string | null {
    if (!this.initialized) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling publicIdentifier()!"
      );
    }
    if (!this.userPublicIdentifier) {
      return null;
    }
    return this.userPublicIdentifier;
  }

  public async login(): Promise<boolean> {
    await this.init();

    try {
      // Check if user is already logged in, and authenticate with the iframe app using the DID token
      if (await this.magic?.user.isLoggedIn()) {
        const userDIDtoken = await this.magic?.user.getIdToken();
        const result = await this.iframeRpc?.send({method: "connext_login", params: {DID_token: userDIDtoken}});
        this.userPublicIdentifier = result.publicIdentifier;
        this.modal?.setState({ isLoggedIn: true });
        return true;
      }
    } catch (error) {
      console.log(error);
    }

    // Listen for user to enter email
    const email: string = await new Promise((resolve) => {
      this.connextTarget.addEventListener("login", {
        handleEvent: (event: CustomEvent) => {
          resolve(event.detail);
        }
      })
    })

    try {
      // Authenticate with the iframe app using the DID token
      const userDIDtoken = await this.magic?.auth.loginWithMagicLink({ email });
      const result = await this.iframeRpc?.send({method: "connext_login", params: {DID_token: userDIDtoken}});
      this.userPublicIdentifier = result.publicIdentifier;
      this.modal?.setState({ isLoggedIn: true });
    } catch (error) {
      console.log(error);
      throw error;
    }
    return false;
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
    const {amount, recipient} = await new Promise((resolve) => {
      this.connextTarget.addEventListener("withdraw", {
        handleEvent: (event: CustomEvent) => {
          resolve(event.detail);
        }
      })
    })
    console.log({amount, recipient});
    try {
      const result = await this.iframeRpc?.send({method: "connext_withdraw", params: {recipient, amount, assetId: ""}});
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
    console.warn(this.channel?.getFreeBalance());
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
      <Modal magic={this.magic} connextTarget={this.connextTarget} />,
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
}

export default ConnextSDK;
