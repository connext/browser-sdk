import React, { useState } from "react";
import { toWad } from "@connext/utils";

import { isValidAddress } from "../helpers";
import ConnextSDK from "..";

interface IWithdrawProps {
  sdkInstance: ConnextSDK;
  stage: string;
  onSubmit: (value?: any) => void;
}

function Withdraw({ sdkInstance, stage, onSubmit }: IWithdrawProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const withdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const recipientRef = e.currentTarget.elements.namedItem(
      "recipient"
    ) as HTMLInputElement;

    if (!isValidAddress(recipient)) {
      console.error("Invalid address!");
      recipientRef?.setCustomValidity("Please enter a valid address");
      recipientRef?.reportValidity();
      return;
    } else {
      recipientRef?.setCustomValidity("");
      recipientRef?.reportValidity();
    }

    if (!e.currentTarget.checkValidity()) {
      console.error("Invalid amount!");
      return;
    }
    onSubmit({ recipient, amount });
  };
  // TODO: cancel button
  return (
    <div className="flex-column">
      {stage === "success" ? (
        <h3>Withdraw successful!</h3>
      ) : stage === "failure" ? (
        <h3>Withdraw failed - try again!</h3>
      ) : stage === "choose_recipient" ? (
        <form onSubmit={withdraw}>
          <h3>Please enter amount to withdraw and recipient.</h3>
          <input
            required
            type="number"
            placeholder="Token Amount"
            value={amount}
            step="any"
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            required
            name="recipient"
            placeholder="Ethereum address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <button type="submit">Withdraw</button>
        </form>
      ) : null}
    </div>
  );
}

export default Withdraw;
