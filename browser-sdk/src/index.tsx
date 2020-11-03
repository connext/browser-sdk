import { EventEmitter } from "events";
import React from "react";
import ReactDOM from "react-dom";
import { Magic } from "magic-sdk";
import { utils } from "ethers";
import { EngineEvent, INodeService } from "@connext/vector-types";
import { getRandomChannelSigner } from "@connext/vector-utils";
import { BrowserNode } from "@connext/vector-browser-node";
import pino from "pino";

import Modal from "./components/Modal";
import * as constants from "./constants";
import { ConnextSDKOptions, ConnextTransaction, LanguageText } from "./typings";
import DepositController from "./controllers/deposit";
import {
  isIframe,
  renderElement,
  getSdkOptions,
  IframeChannelProvider,
  getText,
  getTokenDecimals,
  isEventName,
} from "./helpers";
import { ChannelProvider } from "./helpers/channelProvider";

class ConnextSDK {
  public text: LanguageText;
  public tokenAddress: string;
  public tokenDecimals: number = 18;
  public ethProviderUrl: string;
  public nodeUrl: string;
  public events = new EventEmitter();

  public modal: Modal | undefined;
  public browserNode: INodeService | undefined;
  public channelAddress: string | undefined;

  private magic: Magic | undefined;
  private channelProvider: ChannelProvider | IframeChannelProvider;
  private depositController: DepositController;

  constructor(
    opts?: string | Partial<ConnextSDKOptions>,
    overrideOpts?: Partial<ConnextSDKOptions>
  ) {
    const options = getSdkOptions(opts, overrideOpts);
    this.text = getText(options.language);
    this.tokenAddress = options.tokenAddress;
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
    this.depositController = new DepositController(this);
  }

  get publicIdentifier(): string {
    if (typeof this.browserNode?.publicIdentifier === "undefined") {
      throw new Error(this.text.error.not_logged_in);
    }
    return this.browserNode?.publicIdentifier;
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
    return new Promise(async (resolve, reject) => {
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
            reject(error);
          }

          resolve(true);
        });
      }
    });
  }

  public async deposit(): Promise<boolean> {
    if (
      typeof this.modal === "undefined" ||
      typeof this.browserNode === "undefined"
    ) {
      throw new Error(this.text.error.not_logged_in);
    }
    if (this.depositController.subscribed) {
      throw new Error(this.text.error.awaiting_deposit);
    }
    this.modal.displayDeposit();
    this.modal.setDepositStage(constants.DEPOSIT_PENDING);
    await this.depositController.requestDepositRights();
    await this.depositController.subscribeToDeposit();
    this.modal.setDepositStage(constants.DEPOSIT_SHOW_QR);
    return new Promise((resolve, reject) => {
      this.on(constants.DEPOSIT_SUCCESS, () => resolve());
      this.on(constants.DEPOSIT_FAILURE, () => reject());
    });
  }

  public async withdraw(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (typeof this.modal === "undefined") {
        throw new Error(this.text.error.not_logged_in);
      }
      if (this.depositController.subscribed) {
        throw new Error(this.text.error.awaiting_deposit);
      }
      this.modal.displayWithdraw();
      this.modal.setWithdrawStage(constants.WITHDRAW_PROMPT);
      this.on(constants.WITHDRAW_SUBMIT, async ({ recipient, amount }) => {
        if (
          typeof this.modal === "undefined" ||
          typeof this.browserNode === "undefined"
        ) {
          throw new Error(this.text.error.not_logged_in);
        }
        try {
          if (typeof this.browserNode === "undefined") {
            throw new Error(this.text.error.missing_channel);
          }
          await this.browserNode.withdraw({
            recipient,
            amount,
            assetId: this.tokenAddress,
            channelAddress: this.channelAddress!,
          });
        } catch (error) {
          console.error(error);
          this.modal.setWithdrawStage(constants.WITHDRAW_FAILURE);
          reject(error);
        }
        this.modal.setWithdrawStage(constants.WITHDRAW_SUCCESS);
        resolve(true);
      });
    });
  }

  public async balance(): Promise<string> {
    if (typeof this.browserNode === "undefined") {
      throw new Error(this.text.error.not_logged_in);
    }
    const result = await this.browserNode.getStateChannel(this.channelAddress);
    if (result.isError) {
      throw result.getError();
    }
    return result[this.browserNode.signerAddress];
  }

  public async transfer(recipient: string, amount: string): Promise<boolean> {
    if (typeof this.browserNode === "undefined") {
      throw new Error(this.text.error.not_logged_in);
    }
    if (this.depositController.subscribed) {
      throw new Error(this.text.error.awaiting_deposit);
    }
    try {
      await this.browserNode.transfer({
        recipient,
        amount,
        assetId: this.tokenAddress,
      });
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async getTransactionHistory(): Promise<Array<ConnextTransaction>> {
    if (typeof this.browserNode === "undefined") {
      throw new Error(this.text.error.not_logged_in);
    }
    const result = await this.browserNode.getTransferHistory();
    // TODO: parse transfer history to match ConnextTransaction interface
    return result as any;
  }

  public async logout(): Promise<boolean> {
    if (
      typeof this.magic === "undefined" ||
      typeof this.browserNode === "undefined" ||
      typeof this.modal === "undefined"
    ) {
      throw new Error(this.text.error.not_logged_in);
    }
    await this.magic.user.logout();
    await this.browserNode.off();
    await this.channelProvider.close();
    await this.unrenderModal();
    await this.reset();
    return true;
  }

  public on = (
    event: string | EngineEvent,
    listener: (...args: any[]) => void
  ): any => {
    if (isEventName(event)) {
      if (typeof this.browserNode === "undefined") {
        throw new Error(this.text.error.not_logged_in);
      }
      return this.browserNode.on(event, listener);
    }
    return this.events.on(event, listener);
  };

  public once = (
    event: string | EngineEvent,
    listener: (...args: any[]) => void
  ): any => {
    if (isEventName(event)) {
      if (typeof this.browserNode === "undefined") {
        throw new Error(this.text.error.not_logged_in);
      }
      return this.browserNode.once(event, listener);
    }
    return this.events.once(event, listener);
  };

  // ---------- Private ----------------------------------------------- //

  private async authenticate() {
    if (typeof this.modal === "undefined") {
      throw new Error(this.text.error.missing_modal);
    }
    this.modal.setLoginStage(constants.LOGIN_SETUP);
    try {
      await this.authenticateChannelProvider();
      this.modal.setLoginStage(constants.LOGIN_SUCCESS);
      this.depositController.checkDepositSubscription();
    } catch (e) {
      this.modal.setLoginStage(constants.LOGIN_FAILURE);
      console.error(e);
    }
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
        signature: signature,
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
    this.browserNode = await BrowserNode.connect({
      chainAddresses: {},
      chainProviders: { 1337: "http://localhost:8545" },
      logger: pino(),
      signer: getRandomChannelSigner(),
      messagingUrl: "https://messaging.connext.network",
      // channelProvider: this.channelProvider,
    });

    this.tokenDecimals = await getTokenDecimals(
      this.browserNode.ethProvider,
      this.tokenAddress
    );
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
    await this.depositController.unsubscribeToDeposit();
    this.events.removeAllListeners();
    this.tokenDecimals = 18;
    this.browserNode = undefined;
    this.modal = undefined;
  }
}

export default ConnextSDK;
