import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";
import { ChannelProvider } from "@connext/channel-provider";
import { BigNumber } from "ethers";
import * as connext from "@connext/client";
import { toWad } from "@connext/utils";

import Modal from "./components/Modal";
import {
  CONNEXT_OVERLAY_STYLE,
  CONNEXT_OVERLAY_ID,
  CONNEXT_IFRAME_ID,
  AUTHENTICATION_MESSAGE,
  MULTISIG_BALANCE_PRE_DEPOSIT,
} from "./constants";
import {
  isIframe,
  renderElement,
  SDKError,
  getSdkOptions,
  getFreeBalanceOnChain,
  IframeChannelProvider,
} from "./helpers";
import { ConnextSDKOptions, ConnextTransaction } from "./typings";
import { IConnextClient } from "@connext/types";

class ConnextSDK {
  private assetId: string;
  private ethProviderUrl: string;
  private nodeUrl: string;
  private magic: Magic | undefined;
  private channelProvider: ChannelProvider | IframeChannelProvider;
  private channel: IConnextClient | undefined;
  private modal: Modal | undefined;

  constructor(
    opts?: string | Partial<ConnextSDKOptions>,
    overrideOpts?: Partial<ConnextSDKOptions>
  ) {
    const options = getSdkOptions(opts, overrideOpts);
    this.assetId = options.assetId;
    this.ethProviderUrl = options.ethProviderUrl;
    this.nodeUrl = options.nodeUrl;
    this.magic = new Magic(options.magicKey, {
      network: { rpcUrl: this.ethProviderUrl },
    });
    this.channelProvider =
      options.channelProvider ||
      new IframeChannelProvider({
        src: options.iframeSrc,
        id: CONNEXT_IFRAME_ID,
      });
  }

  get publicIdentifier(): string {
    if (typeof this.channel?.publicIdentifier === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before getting publicIdentifier!"
      );
    }
    return this.channel?.publicIdentifier;
  }

  public async login(): Promise<boolean> {
    await this.init();
    if (typeof this.modal === "undefined") {
      throw new SDKError("Modal has not been initialized");
    }
    if (isIframe(this.channelProvider)) {
      await this.modal.startLogin();
    } else {
      await this.initChannel();
    }
    return true;
  }

  public async deposit(): Promise<boolean> {
    if (
      typeof this.modal === "undefined" ||
      typeof this.channel === "undefined"
    ) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    return await this.modal.startDeposit();
  }

  public async withdraw(): Promise<boolean> {
    if (
      typeof this.modal === "undefined" ||
      typeof this.channel === "undefined"
    ) {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling withdraw()!"
      );
    }
    return await this.modal.startWithdraw();
  }

  public async balance(): Promise<string> {
    if (typeof this.channel === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling balance()!"
      );
    }
    const result = await this.channel.getFreeBalance(this.assetId);
    return BigNumber.from(result[this.channel.signerAddress]).toHexString();
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (typeof this.channel === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling transfer()!"
      );
    }
    try {
      await this.channel.transfer({
        recipient,
        amount: toWad(amount),
        assetId: this.assetId,
      });
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async getTransactionHistory(): Promise<Array<ConnextTransaction>> {
    if (typeof this.channel === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling getTransactionHistory()!"
      );
    }
    const result = await this.channel.getTransferHistory();
    // TODO: parse transfer history to match ConnextTransaction interface
    return result as any;
  }

  async authenticateWithMagic() {
    if (typeof this.magic === "undefined") {
      throw new SDKError("Magic is undefined");
    }
    const accounts = await this.magic.rpcProvider.send("eth_accounts");
    const signature = await this.magic.rpcProvider.send("personal_sign", [
      AUTHENTICATION_MESSAGE,
      accounts[0],
    ]);

    await this.channelProvider.connection.send({
      id: 1,
      jsonrpc: "2.0",
      method: "connext_authenticate",
      params: {
        userSecretEntropy: signature,
        ethProviderUrl: this.ethProviderUrl,
        nodeUrl: this.nodeUrl,
      },
    });
    await this.initChannel();
  }

  // ---------- Private ----------------------------------------------- //

  private async init() {
    if (typeof this.modal !== "undefined") {
      return; // already initialized
    }

    // wait for this.iframeRpc to be fully initialized
    await new Promise((resolve) => {
      if (this.channelProvider.connection.connected) {
        resolve();
      } else {
        this.channelProvider.connection.once("connect", resolve);
      }
    });

    await this.renderModal();
  }

  private async initChannel() {
    this.channel = await connext.connect({
      ethProviderUrl: this.ethProviderUrl,
      channelProvider: this.channelProvider,
    });
  }

  private async getOnChainBalance() {
    if (typeof this.channel === "undefined") {
      throw new SDKError(
        "Not initialized - make sure to await login() first before calling publicIdentifier()!"
      );
    }
    const balance = await getFreeBalanceOnChain(
      this.channel.multisigAddress,
      this.channel.ethProvider,
      this.assetId
    );
    return balance;
  }

  private async checkDepositSubscription() {
    const preDepositBalance = window.localStorage.getItem(
      MULTISIG_BALANCE_PRE_DEPOSIT
    );
    if (preDepositBalance) {
      const balance = await this.getOnChainBalance();
      if (BigNumber.from(balance).gt(BigNumber.from(preDepositBalance))) {
        await this.onDepositSuccess();
      } else {
        await this.subscribeToDeposit();
      }
    }
  }

  private async subscribeToDeposit() {
    if (typeof this.channel === "undefined") {
      throw new SDKError("Not initialized");
    }
    const preDepositBalance = await this.getOnChainBalance();
    window.localStorage.setItem(
      MULTISIG_BALANCE_PRE_DEPOSIT,
      preDepositBalance
    );
    this.channel.ethProvider.on("block", this.onNewBlock.bind(this));
  }

  private async unsubscribeToDeposit() {
    if (typeof this.channel === "undefined") {
      throw new SDKError("Not initialized");
    }
    this.channel.ethProvider.off("block", this.onNewBlock.bind(this));
  }

  private async onNewBlock() {
    if (typeof this.channel === "undefined") {
      throw new SDKError("Not initialized");
    }
    this.channel.ethProvider.off("block", this.onNewBlock.bind(this));
    const preDepositBalance = window.localStorage.getItem(
      MULTISIG_BALANCE_PRE_DEPOSIT
    );
    if (preDepositBalance === null) {
      return this.unsubscribeToDeposit();
    }
    const balance = await this.getOnChainBalance();
    if (BigNumber.from(balance).gt(BigNumber.from(preDepositBalance))) {
      await this.onDepositSuccess();
    }
  }

  private async onDepositSuccess() {
    if (
      typeof this.modal === "undefined" ||
      typeof this.channel === "undefined"
    ) {
      throw new SDKError("Not initialized");
    }
    window.localStorage.removeItem(MULTISIG_BALANCE_PRE_DEPOSIT);
    await this.unsubscribeToDeposit();
    this.channel.rescindDepositRights({ assetId: this.assetId });
  }

  private async renderModal() {
    // create the styled overlay UI container, and render the UI inside it using React
    renderElement(
      "style",
      { innerHTML: CONNEXT_OVERLAY_STYLE },
      window.document.head
    );
    this.modal = (ReactDOM.render(
      <Modal sdkInstance={this} />,
      renderElement("div", { id: CONNEXT_OVERLAY_ID }, window.document.body)
    ) as unknown) as Modal;
  }
}

export default ConnextSDK;
