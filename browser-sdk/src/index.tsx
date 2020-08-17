import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";
// import { ChannelProvider } from "@connext/channel-provider";

import Modal from "./components/Modal";
// import IframeChannelProvider from "./channel-provider";
import {
  MAGIC_LINK_PUBLISHABLE_KEY,
  RINKEBY_NETWORK,
  STYLE_CONNEXT_OVERLAY,
  // DEFAULT_IFRAME_ID,
  // DEFAULT_IFRAME_SRC,
} from "./constants";
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
  private isLoggedIn: boolean;
  private userIssuer: string | null;
  private userEmail: string | null;
  private userPublicAddress: string | null;

  constructor(opts?: ConnextSDKOptions) {
    // this.channelProvider =
    //   opts?.channelProvider ||
    //   new IframeChannelProvider({
    //     id: DEFAULT_IFRAME_ID,
    //     src: opts?.iframeSrc || DEFAULT_IFRAME_SRC,
    //   });
    this.isLoggedIn = false;
    this.userIssuer = null;
    this.userEmail = null;
    this.userPublicAddress = null;
    this.magic = new Magic(opts?.magicKey || MAGIC_LINK_PUBLISHABLE_KEY, {
      network: (opts?.network as any) || RINKEBY_NETWORK,
    });
  }

  render() {
    if (typeof this.modal !== "undefined") {
      return;
    }
    renderElement("style", { innerHTML: STYLE_CONNEXT_OVERLAY }, "head");
    const overlay = renderElement("div", { id: "connext-overlay" });
    this.modal = (ReactDOM.render(
      <Modal
        magic={this.magic}
        isLoggedIn={this.isLoggedIn}
        setIsLoggedIn={e => {this.isLoggedIn = e}}
        userIssuer={this.userIssuer}
        setUserIssuer={e => {this.userIssuer = e}}
        userEmail={this.userEmail}
        setUserEmail={e => {this.userEmail = e}}
        userPublicAddress={this.userPublicAddress}
        setUserPublicAddress={e => {this.userPublicAddress = e}}
      />, overlay) as unknown) as Modal;
  }

  public async login(): Promise<boolean> {
    // const loginToken = await this.magic?.auth.loginWithMagicLink({ email: 'wangqile123@gmail.com' });
    // const isLoggedIn = await this.magic?.user.isLoggedIn()
    // const metadata = await this.magic?.user.getMetadata();
    // console.log(isLoggedIn, metadata);
    this.render();
    // await the login result from this.modal.login()
    // set up the modal's isLoggedIn feature
    // from there, return the result of the login here.

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
    else if (!this.isLoggedIn) {
      throw new SDKError(
        "User not logged in - please log in before calling deposit()!"
      )
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
