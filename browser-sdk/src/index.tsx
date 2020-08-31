import { EventEmitter } from "events";
import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";
import { ChannelProvider } from "@connext/channel-provider";
import { BigNumber, utils } from "ethers";
import * as connext from "@connext/client";
import { toWad, fromWad } from "@connext/utils";
import { IConnextClient } from "@connext/types";

import Modal from "./components/Modal";
import * as constants from "./constants";
import {
  isIframe,
  renderElement,
  getSdkOptions,
  getFreeBalanceOnChain,
  IframeChannelProvider,
  getText,
} from "./helpers";
import { ConnextSDKOptions, ConnextTransaction, LanguageText } from "./typings";

class ConnextSDK extends EventEmitter {
  public assetId: string;
  public ethProviderUrl: string;
  public nodeUrl: string;
  public text: LanguageText;
  public channel: IConnextClient | undefined;
  private channelProvider: ChannelProvider | IframeChannelProvider;
  private magic: Magic | undefined;
  private modal: Modal | undefined;

  constructor(
    opts?: string | Partial<ConnextSDKOptions>,
    overrideOpts?: Partial<ConnextSDKOptions>
  ) {
    super();
    this.text = getText();
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
        id: constants.CONNEXT_IFRAME_ID,
      });
  }

  get publicIdentifier(): string {
    if (typeof this.channel?.publicIdentifier === "undefined") {
      throw new Error(this.text.error.not_logged_in);
    }
    return this.channel?.publicIdentifier;
  }

  public async login(): Promise<boolean> {
    await this.init();
    if (typeof this.modal === "undefined") {
      throw new Error(this.text.error.missing_modal);
    }
    if (isIframe(this.channelProvider)) {
      return this.loginWithMagic();
    } else {
      await this.initChannel();
    }
    return true;
  }

  public loginWithMagic(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (typeof this.magic === "undefined") {
        throw new Error(this.text.error.missing_magic);
      }
      if (typeof this.modal === "undefined") {
        throw new Error(this.text.error.missing_modal);
      }
      await this.modal.displayLogin();
      const isAlreadyLoggedIn = await this.magic.user.isLoggedIn();
      if (isAlreadyLoggedIn) {
        await this.authenticate();
        resolve(false); // already logged in automatically
      } else {
        this.modal.setLoginStage(constants.LOGIN_PROMPT);
        this.on(constants.LOGIN_SUBMIT, async ({ email }) => {
          if (typeof this.modal === "undefined") {
            throw new Error(this.text.error.missing_modal);
          }

          try {
            if (typeof this.magic === "undefined") {
              throw new Error(this.text.error.missing_magic);
            }
            this.modal.setLoginStage(constants.LOGIN_PENDING);
            await this.magic.auth.loginWithMagicLink({ email, showUI: false });
            await this.authenticate();
          } catch (error) {
            this.modal.setLoginStage(constants.LOGIN_FAILURE);
            throw error;
          }

          resolve(true);
        });
      }
    });
  }

  public async deposit(): Promise<boolean> {
    if (
      typeof this.modal === "undefined" ||
      typeof this.channel === "undefined"
    ) {
      throw new Error(this.text.error.not_logged_in);
    }
    this.modal.displayDeposit();
    this.modal.setDepositStage(constants.DEPOSIT_SHOW_QR);
    this.channel.requestDepositRights({
      assetId: this.assetId,
    });
    await this.subscribeToDeposit();
    return new Promise((resolve) => {
      this.on(constants.DEPOSIT_SUCCESS, () => resolve());
    });
  }

  public async withdraw(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof this.modal === "undefined") {
        throw new Error(this.text.error.not_logged_in);
      }
      this.modal.displayWithdraw();
      this.modal.setWithdrawStage(constants.WITHDRAW_PROMPT);
      this.on(constants.WITHDRAW_SUBMIT, async ({ recipient, amount }) => {
        if (
          typeof this.modal === "undefined" ||
          typeof this.channel === "undefined"
        ) {
          throw new Error(this.text.error.not_logged_in);
        }
        try {
          if (typeof this.channel === "undefined") {
            throw new Error(this.text.error.missing_channel);
          }
          await this.channel.withdraw({
            recipient,
            amount: toWad(amount),
            assetId: this.assetId,
          });
        } catch (error) {
          console.error(error);
          this.modal.setWithdrawStage(constants.WITHDRAW_FAILURE);
          resolve(false);
          throw error;
        }
        this.modal.setWithdrawStage(constants.WITHDRAW_SUCCESS);
        resolve(true);
      });
    });
  }

  public async balance(): Promise<string> {
    if (typeof this.channel === "undefined") {
      throw new Error(this.text.error.not_logged_in);
    }
    const result = await this.channel.getFreeBalance(this.assetId);
    return fromWad(result[this.channel.signerAddress]);
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (typeof this.channel === "undefined") {
      throw new Error(this.text.error.not_logged_in);
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
      throw new Error(this.text.error.not_logged_in);
    }
    const result = await this.channel.getTransferHistory();
    // TODO: parse transfer history to match ConnextTransaction interface
    return result as any;
  }

  public async logout(): Promise<boolean> {
    if (
      typeof this.magic === "undefined" ||
      typeof this.channel === "undefined" ||
      typeof this.modal === "undefined"
    ) {
      throw new Error(this.text.error.not_logged_in);
    }
    await this.magic.user.logout();
    await this.channelProvider.close();
    await this.unrenderModal();
    await this.reset();
    return true;
  }

  // ---------- Private ----------------------------------------------- //

  private async authenticate() {
    if (typeof this.modal === "undefined") {
      throw new Error(this.text.error.missing_modal);
    }
    this.modal.setLoginStage(constants.LOGIN_SETUP);
    await this.authenticateChannelProvider(); // TODO: handle errors
    this.modal.setLoginStage(constants.LOGIN_SUCCESS);
    this.checkDepositSubscription();
  }

  private async authenticateChannelProvider() {
    if (typeof this.magic === "undefined") {
      throw new Error("Magic is undefined");
    }
    const accounts = await this.magic.rpcProvider.send("eth_accounts", []);
    const signature = await this.magic.rpcProvider.send("personal_sign", [
      utils.hexlify(utils.toUtf8Bytes(constants.AUTHENTICATION_MESSAGE)),
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

  private async init() {
    if (typeof this.modal !== "undefined") {
      return; // already initialized
    }

    if (isIframe(this.channelProvider)) {
      // this makes sure the iframe is re-render after logout
      await this.channelProvider.connection.open();
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
      throw new Error(this.text.error.not_logged_in);
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
      constants.MULTISIG_BALANCE_PRE_DEPOSIT
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
      throw new Error(this.text.error.missing_channel);
    }
    const preDepositBalance = await this.getOnChainBalance();
    window.localStorage.setItem(
      constants.MULTISIG_BALANCE_PRE_DEPOSIT,
      preDepositBalance
    );
    this.channel.ethProvider.on("block", this.onNewBlock.bind(this));
  }

  private async unsubscribeToDeposit() {
    if (typeof this.channel === "undefined") {
      throw new Error(this.text.error.missing_channel);
    }
    this.channel.ethProvider.off("block", this.onNewBlock.bind(this));
  }

  private async onNewBlock() {
    if (typeof this.channel === "undefined") {
      throw new Error(this.text.error.missing_channel);
    }
    this.channel.ethProvider.off("block", this.onNewBlock.bind(this));
    const preDepositBalance = window.localStorage.getItem(
      constants.MULTISIG_BALANCE_PRE_DEPOSIT
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
      throw new Error(this.text.error.missing_channel);
    }
    window.localStorage.removeItem(constants.MULTISIG_BALANCE_PRE_DEPOSIT);
    await this.unsubscribeToDeposit();
    this.channel.rescindDepositRights({ assetId: this.assetId });
    this.emit(constants.DEPOSIT_SUCCESS);
    this.modal.setDepositStage(constants.DEPOSIT_SUCCESS);
  }

  private async renderModal() {
    // create the styled overlay UI container, and render the UI inside it using React
    renderElement(
      "style",
      { innerHTML: constants.CONNEXT_OVERLAY_STYLE },
      window.document.head
    );
    this.modal = (ReactDOM.render(
      <Modal sdk={this} />,
      renderElement(
        "div",
        { id: constants.CONNEXT_OVERLAY_ID },
        window.document.body
      )
    ) as unknown) as Modal;
  }

  private async unrenderModal() {
    const elm = document.getElementById(constants.CONNEXT_OVERLAY_ID);
    if (!elm) return;
    window.document.body.removeChild(elm);
  }

  private async reset() {
    this.channel = undefined;
    this.modal = undefined;
  }
}

export default ConnextSDK;
