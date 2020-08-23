import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { BigNumber } from "ethers";

import { MULTISIG_BALANCE_PRE_DEPOSIT } from "../constants";

function DepositModal({ sdkInstance, onDepositComplete }) {
  const depositAddress = sdkInstance.channel.multisigAddress;
  const [depositStage, setDepositStage] = useState("show_qr");

  useEffect(() => {
    (async () => {
      sdkInstance.channel.requestDepositRights({ assetId: sdkInstance.assetId });
      await sdkInstance.subscribeToDeposit();
      sdkInstance.channel.ethProvider.on("block", onDepositSuccess);
    })();
  }, []);

  const onDepositSuccess = async () => {
    const preDepositBalance = window.localStorage.getItem(
      MULTISIG_BALANCE_PRE_DEPOSIT
    );
    if (preDepositBalance === null) {
      return await unsubscribeFromDeposit();
    }
    const balance = await sdkInstance.getOnChainBalance();
    if (BigNumber.from(balance).gt(BigNumber.from(preDepositBalance))) {
      setDepositStage("deposit_success");
      return await unsubscribeFromDeposit();
    }
  }

  const unsubscribeFromDeposit = async () => {
    sdkInstance.channel.ethProvider.off("block", onDepositSuccess);
    onDepositComplete(true);
  }

  return (
    <div className="flex-column">
      {depositStage === "show_qr" ? (
        <>
          <h3>Please deposit to the following address.</h3>
          <QRCode value={depositAddress} />
          <input type="text" value={depositAddress} readOnly />
        </>
      ) : depositStage === "deposit_success" ? (
        <h3>Deposit success!</h3>
      ) : null}
    </div>
  );
}

export default DepositModal;
