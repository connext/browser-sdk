import React, { useState, useRef } from "react";

import { isValidAddress } from "../helpers";

function WithdrawModal({ sdkInstance, onWithdrawComplete }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [withdrawStage, setWithdrawStage] = useState("choose_recipient");

  const withdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const recipientRef = e.currentTarget.elements.namedItem(
      "recipient"
    ) as HTMLInputElement;

    if (!isValidAddress(recipient)) {
      console.log("Invalid address!");
      recipientRef?.setCustomValidity("Please enter a valid address");
      recipientRef?.reportValidity();
      return;
    } else {
      recipientRef?.setCustomValidity("");
      recipientRef?.reportValidity();
    }

    if (!e.currentTarget.checkValidity()) {
      console.log("Invalid amount!");
      return;
    }

    console.log("WITHDRAW", { amount, recipient });
    try {
      const result = await sdkInstance.channel.withdraw({
        recipient,
        amount,
        assetId: sdkInstance.assetId,
      });
      console.log(result);
    } catch (error) {
      console.log(error);
      setWithdrawStage("failure");
      onWithdrawComplete(false);
      throw error;
    }
    setWithdrawStage("success");
    onWithdrawComplete(true);
  };
  // TODO: cancel button
  return (
    <div className="flex-column">
      {withdrawStage == "success" ? (
        <h3>Withdraw successful!</h3>
      ) : withdrawStage == "failure" ? (
        <h3>Withdraw failed - try again!</h3>
      ) : withdrawStage == "choose_recipient" ? (
        <form onSubmit={withdraw}>
          <h3>Please enter amount to withdraw and recipient.</h3>
          <input
            required
            type="number"
            placeholder="Amount"
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

export default WithdrawModal;
