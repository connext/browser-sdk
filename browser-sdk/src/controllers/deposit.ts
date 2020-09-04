import { BigNumber } from "ethers";

import * as constants from "../constants";
import {
  safeJsonStringify,
  safeJsonParse,
  getTokenBalance,
  getEthBalance,
} from "../helpers";
import { PreDepositBalance } from "../typings";
import ConnextSDK from "..";

class DepositController {
  constructor(private sdk: ConnextSDK) {
    this.sdk = sdk;
  }

  get subscribed(): boolean {
    return !!this.getPreDepositBalance();
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

  public async requestDepositRights() {
    if (typeof this.sdk.channel === "undefined") {
      throw new Error(this.sdk.text.error.not_logged_in);
    }
    // await this.sdk.channel.requestDepositRights({
    //   assetId: constants.ETH_ASSET_ID,
    // });
    await this.sdk.channel.requestDepositRights({
      assetId: this.sdk.tokenAddress,
    });
  }

  public async rescindDepositRights() {
    if (typeof this.sdk.channel === "undefined") {
      throw new Error(this.sdk.text.error.not_logged_in);
    }
    // await this.sdk.channel.rescindDepositRights({
    //   assetId: constants.ETH_ASSET_ID,
    // });
    await this.sdk.channel.rescindDepositRights({
      assetId: this.sdk.tokenAddress,
    });
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

  // ---------- Private ----------------------------------------------- //

  private async onDepositSuccess() {
    if (
      typeof this.sdk.modal === "undefined" ||
      typeof this.sdk.channel === "undefined"
    ) {
      throw new Error(this.sdk.text.error.not_logged_in);
    }
    this.removePreDepositBalance();
    try {
      await this.unsubscribeToDeposit();
      await this.rescindDepositRights();
      // const freeBalanceEth = await this.getEthFreeBalance();
      // if (freeBalanceEth.gt(BigNumber.from(0))) {
      //   await this.sdk.channel.swap({
      //     fromAssetId: constants.ETH_ASSET_ID,
      //     toAssetId: this.sdk.tokenAddress,
      //     amount: freeBalanceEth,
      //     swapRate: await this.sdk.channel.getLatestSwapRate(
      //       constants.ETH_ASSET_ID,
      //       this.sdk.tokenAddress
      //     ),
      //   });
      // }
      this.sdk.emit(constants.DEPOSIT_SUCCESS);
      this.sdk.modal.setDepositStage(constants.DEPOSIT_SUCCESS);
    } catch (e) {
      console.error(e);
      this.sdk.emit(constants.DEPOSIT_FAILURE);
      this.sdk.modal.setDepositStage(constants.DEPOSIT_FAILURE);
    }
  }

  // private async getEthFreeBalance() {
  //   if (typeof this.sdk.channel === "undefined") {
  //     throw new Error(this.sdk.text.error.not_logged_in);
  //   }
  //   const result = await this.sdk.channel.getFreeBalance(
  //     constants.ETH_ASSET_ID
  //   );
  //   return BigNumber.from(result[this.sdk.channel.signerAddress]);
  // }

  private async getOnChainTokenBalance() {
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

  private async getOnChainEthBalance() {
    if (typeof this.sdk.channel === "undefined") {
      throw new Error(this.sdk.text.error.not_logged_in);
    }
    const ethBalance = await getEthBalance(
      this.sdk.channel.multisigAddress,
      this.sdk.channel.ethProvider
    );
    return ethBalance;
  }

  private async onNewBlock() {
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
  private async assertBalanceIncrease(preDepositBalance: PreDepositBalance) {
    const tokenBalance = await this.getOnChainTokenBalance();
    // const ethBalance = await this.getOnChainEthBalance();
    return BigNumber.from(tokenBalance).gt(
      BigNumber.from(preDepositBalance.tokenBalance)
    );
    // BigNumber.from(ethBalance).gt(
    //   BigNumber.from(preDepositBalance.ethBalance)
    // )
  }

  private setPreDepositBalance(preDepositBalance: PreDepositBalance): void {
    window.localStorage.setItem(
      constants.MULTISIG_BALANCE_PRE_DEPOSIT,
      safeJsonStringify(preDepositBalance)
    );
  }

  private getPreDepositBalance(): PreDepositBalance {
    return safeJsonParse(
      window.localStorage.getItem(constants.MULTISIG_BALANCE_PRE_DEPOSIT)
    );
  }

  private removePreDepositBalance(): void {
    window.localStorage.removeItem(constants.MULTISIG_BALANCE_PRE_DEPOSIT);
  }
}
export default DepositController;
