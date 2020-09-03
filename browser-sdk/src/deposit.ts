import { BigNumber } from "ethers";
import * as constants from "./constants";
import {
  safeJsonStringify,
  safeJsonParse,
  getTokenBalance,
  getEthBalance,
  getEthAssetId,
} from "./helpers";
import { PreDepositBalance } from "./typings";
import ConnextSDK from ".";

class DepositController {
  constructor(public sdk: ConnextSDK) {
    this.sdk = sdk;
  }

  public async checkDepositSubscription() {
    const preDepositBalance = this.getPreDepositBalance();
    if (preDepositBalance) {
      if (await this.assertBalanceIncrease(preDepositBalance)) {
        await this.onDepositSuccess();
      } else {
        await this.subscribeToDeposit();
      }
    }
  }

  public async onDepositSuccess() {
    if (
      typeof this.sdk.modal === "undefined" ||
      typeof this.sdk.channel === "undefined"
    ) {
      throw new Error(this.sdk.text.error.not_logged_in);
    }
    this.removePreDepositBalance();
    await this.unsubscribeToDeposit();
    this.sdk.channel.rescindDepositRights({ assetId: getEthAssetId() });
    this.sdk.channel.rescindDepositRights({ assetId: this.sdk.tokenAddress });
    this.sdk.emit(constants.DEPOSIT_SUCCESS);
    this.sdk.modal.setDepositStage(constants.DEPOSIT_SUCCESS);
  }

  public async getOnChainTokenBalance() {
    if (typeof this.sdk.channel === "undefined") {
      throw new Error(this.sdk.text.error.not_logged_in);
    }
    const tokenBalance = await getTokenBalance(
      this.sdk.channel.multisigAddress,
      this.sdk.channel.ethProvider,
      this.sdk.tokenAddress
    );
    return tokenBalance;
  }

  public async getOnChainEthBalance() {
    if (typeof this.sdk.channel === "undefined") {
      throw new Error(this.sdk.text.error.not_logged_in);
    }
    const ethBalance = await getEthBalance(
      this.sdk.channel.multisigAddress,
      this.sdk.channel.ethProvider
    );
    return ethBalance;
  }

  public async subscribeToDeposit() {
    if (typeof this.sdk.channel === "undefined") {
      throw new Error(this.sdk.text.error.missing_channel);
    }
    this.setPreDepositBalance({
      tokenBalance: await this.getOnChainTokenBalance(),
      ethBalance: await this.getOnChainEthBalance(),
    });
    this.sdk.channel.ethProvider.on("block", this.onNewBlock.bind(this));
  }

  public async unsubscribeToDeposit() {
    if (typeof this.sdk.channel === "undefined") {
      throw new Error(this.sdk.text.error.missing_channel);
    }
    this.sdk.channel.ethProvider.off("block", this.onNewBlock.bind(this));
  }

  public async onNewBlock() {
    if (typeof this.sdk.channel === "undefined") {
      throw new Error(this.sdk.text.error.missing_channel);
    }
    this.sdk.channel.ethProvider.off("block", this.onNewBlock.bind(this));
    const preDepositBalance = this.getPreDepositBalance();
    if (preDepositBalance === null) {
      return this.unsubscribeToDeposit();
    }
    if (await this.assertBalanceIncrease(preDepositBalance)) {
      await this.onDepositSuccess();
    }
  }
  public async assertBalanceIncrease(preDepositBalance: PreDepositBalance) {
    const tokenBalance = await this.getOnChainTokenBalance();
    const ethBalance = await this.getOnChainEthBalance();
    return (
      BigNumber.from(tokenBalance).gt(
        BigNumber.from(preDepositBalance.tokenBalance)
      ) ||
      BigNumber.from(ethBalance).gt(
        BigNumber.from(preDepositBalance.ethBalance)
      )
    );
  }

  public setPreDepositBalance(preDepositBalance: PreDepositBalance): void {
    window.localStorage.setItem(
      constants.MULTISIG_BALANCE_PRE_DEPOSIT,
      safeJsonStringify(preDepositBalance)
    );
  }

  public getPreDepositBalance(): PreDepositBalance {
    return safeJsonParse(
      window.localStorage.getItem(constants.MULTISIG_BALANCE_PRE_DEPOSIT)
    );
  }

  public removePreDepositBalance(): void {
    window.localStorage.removeItem(constants.MULTISIG_BALANCE_PRE_DEPOSIT);
  }
}
export default DepositController;
