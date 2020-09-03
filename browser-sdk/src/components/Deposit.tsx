import React from "react";
import QRCode from "react-qr-code";

import {
  DEPOSIT_SHOW_QR,
  DEPOSIT_SUCCESS,
  DEPOSIT_FAILURE,
} from "../constants";
import ConnextSDK from "..";

interface IDepositProps {
  sdk: ConnextSDK;
  stage: string;
}

function Deposit({ sdk, stage }: IDepositProps) {
  if (typeof sdk.channel === "undefined") {
    throw new Error(sdk.text.error.missing_channel);
  }
  const depositAddress = sdk.channel.multisigAddress;
  return (
    <div className="flex-column">
      {stage === DEPOSIT_SHOW_QR ? (
        <>
          <h3>{sdk.text.info.deposit_show_qr}</h3>
          <QRCode value={depositAddress} />
          <input type="text" value={depositAddress} readOnly />
        </>
      ) : stage === DEPOSIT_SUCCESS ? (
        <h3>{sdk.text.info.deposit_success}</h3>
      ) : stage === DEPOSIT_FAILURE ? (
        <h3>{sdk.text.info.deposit_failure}</h3>
      ) : null}
    </div>
  );
}

export default Deposit;
