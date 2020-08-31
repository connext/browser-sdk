import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";
import { ChannelProvider } from "@connext/channel-provider";
import { BigNumber, utils } from "ethers";
import * as connext from "@connext/client";
import { toWad, fromWad } from "@connext/utils";
import { IConnextClient } from "@connext/types";

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
  getSdkOptions,
  getFreeBalanceOnChain,
  IframeChannelProvider,
} from "./helpers";
import { ConnextSDKOptions, ConnextTransaction } from "./typings";

class ConnextSDK {
  public assetId: string;
  public ethProviderUrl: string;
  public nodeUrl: string;
  public magic: Magic | undefined;
  public channelProvider: ChannelProvider | IframeChannelProvider;
  public channel: IConnextClient | undefined;
  public modal: Modal | undefined;

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
      throw new Error(
        "Not initialized - make sure to await login() first before getting publicIdentifier!"
      );
    }
    return this.channel?.publicIdentifier;
  }

  public async login(): Promise<boolean> {
    await this.init();
    if (typeof this.modal === "undefined") {
      throw new Error("Modal has not been initialized");
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
        throw new Error("Missing magic instance");
      }
      if (typeof this.modal === "undefined") {
        throw new Error("Missing modal instance");
      }
      const onLoginSubmit = async ({ email }) => {
        if (typeof this.modal === "undefined") {
          throw new Error("Missing modal instance");
        }

        try {
          if (typeof this.magic === "undefined") {
            throw new Error("Missing magic instance");
          }
          this.modal.setLoginStage("authenticating");
          await this.magic.auth.loginWithMagicLink({ email, showUI: false });
        } catch (error) {
          this.modal.setLoginStage("failure");
          throw error;
        }

        this.modal.setLoginStage("initializing_connext");
        await this.authenticateWithMagic(); // TODO: handle errors
        this.modal.setLoginStage("success");
        this.checkDepositSubscription();
        resolve(true);
      };
      await this.modal.displayLogin(onLoginSubmit.bind(this));
      const isAlreadyLoggedIn = await this.magic.user.isLoggedIn();
      if (isAlreadyLoggedIn) {
        this.modal.setLoginStage("initializing_connext");
        await this.authenticateWithMagic(); // TODO: handle errors
        this.modal.setLoginStage("success");
        resolve(false); // already logged in automatically
        this.checkDepositSubscription();
      } else {
        this.modal.setLoginStage("choose_user");
      }
    });
  }

  public async onLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (typeof this.modal === "undefined") {
      throw new Error("Missing modal instance");
    }
  }

  public async deposit(): Promise<boolean> {
    if (
      typeof this.modal === "undefined" ||
      typeof this.channel === "undefined"
    ) {
      throw new Error(
        "Not initialized - make sure to await login() first before calling deposit()!"
      );
    }
    this.modal.displayDeposit(this.channel.multisigAddress);
    this.modal.setDepositStage("show_qr");
    this.channel.requestDepositRights({
      assetId: this.assetId,
    });
    await this.subscribeToDeposit();
    return true;
  }

  public async withdraw(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof this.modal === "undefined") {
        throw new Error(
          "Not initialized - make sure to await login() first before calling withdraw()!"
        );
      }
      const onWithdrawSubmit = async ({ recipient, amount }) => {
        if (
          typeof this.modal === "undefined" ||
          typeof this.channel === "undefined"
        ) {
          throw new Error(
            "Not initialized - make sure to await login() first before calling withdraw()!"
          );
        }
        try {
          if (typeof this.channel === "undefined") {
            throw new Error("Missing channel instance");
          }
          await this.channel.withdraw({
            recipient,
            amount: toWad(amount),
            assetId: this.assetId,
          });
        } catch (error) {
          console.error(error);
          this.modal.setWithdrawStage("failure");
          resolve(false);
          throw error;
        }
        this.modal.setWithdrawStage("success");
        resolve(true);
      };
      this.modal.displayWithdraw(onWithdrawSubmit.bind(this));
      this.modal.setWithdrawStage("choose_recipient");
    });
  }

  public async balance(): Promise<string> {
    if (typeof this.channel === "undefined") {
      throw new Error(
        "Not initialized - make sure to await login() first before calling balance()!"
      );
    }
    const result = await this.channel.getFreeBalance(this.assetId);
    return fromWad(result[this.channel.signerAddress]);
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (typeof this.channel === "undefined") {
      throw new Error(
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
      throw new Error(
        "Not initialized - make sure to await login() first before calling getTransactionHistory()!"
      );
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
      throw new Error(
        "Not initialized - make sure to await login() first before calling logout()!"
      );
    }
    await this.magic.user.logout();
    await this.channelProvider.close();
    await this.unrenderModal();
    await this.reset();
    return true;
  }

  // ---------- Private ----------------------------------------------- //

  public async authenticateWithMagic() {
    if (typeof this.magic === "undefined") {
      throw new Error("Magic is undefined");
    }
    const accounts = await this.magic.rpcProvider.send("eth_accounts", []);
    const signature = await this.magic.rpcProvider.send("personal_sign", [
      utils.hexlify(utils.toUtf8Bytes(AUTHENTICATION_MESSAGE)),
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

  public async init() {
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

  public async initChannel() {
    this.channel = await connext.connect({
      ethProviderUrl: this.ethProviderUrl,
      channelProvider: this.channelProvider,
    });
  }

  public async getOnChainBalance() {
    if (typeof this.channel === "undefined") {
      throw new Error(
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

  public async checkDepositSubscription() {
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

  public async subscribeToDeposit() {
    if (typeof this.channel === "undefined") {
      throw new Error("Not initialized");
    }
    const preDepositBalance = await this.getOnChainBalance();
    window.localStorage.setItem(
      MULTISIG_BALANCE_PRE_DEPOSIT,
      preDepositBalance
    );
    this.channel.ethProvider.on("block", this.onNewBlock.bind(this));
  }

  public async unsubscribeToDeposit() {
    if (typeof this.channel === "undefined") {
      throw new Error("Not initialized");
    }
    this.channel.ethProvider.off("block", this.onNewBlock.bind(this));
  }

  public async onNewBlock() {
    if (typeof this.channel === "undefined") {
      throw new Error("Not initialized");
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

  public async onDepositSuccess() {
    if (
      typeof this.modal === "undefined" ||
      typeof this.channel === "undefined"
    ) {
      throw new Error("Not initialized");
    }
    window.localStorage.removeItem(MULTISIG_BALANCE_PRE_DEPOSIT);
    await this.unsubscribeToDeposit();
    this.channel.rescindDepositRights({ assetId: this.assetId });
  }

  public async renderModal() {
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

  private async unrenderModal() {
    const elm = document.getElementById(CONNEXT_OVERLAY_ID);
    if (!elm) return;
    window.document.body.removeChild(elm);
  }

  private async reset() {
    this.channel = undefined;
    this.modal = undefined;
  }
}

export default ConnextSDK;
