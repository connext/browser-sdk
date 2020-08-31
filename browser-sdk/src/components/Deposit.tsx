import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { BigNumber } from "ethers";

import { MULTISIG_BALANCE_PRE_DEPOSIT } from "../constants";
import ConnextSDK from "..";

interface IDepositProps {
  sdkInstance: ConnextSDK;
  stage: string;
  depositAddress: string;
}

function Deposit({ sdkInstance, stage, depositAddress }: IDepositProps) {
  if (typeof sdkInstance.channel === "undefined") {
    throw new Error("Missing channel instance");
  }
  return (
    <div className="flex-column">
      {stage === "show_qr" ? (
        <>
          <h3>Please deposit to the following address.</h3>
          <QRCode value={depositAddress} />
          <input type="text" value={depositAddress} readOnly />
        </>
      ) : stage === "deposit_success" ? (
        <h3>Deposit success!</h3>
      ) : null}
    </div>
  );
}

export default Deposit;
