import React, { useState } from "react";

import { isValidAddress } from "../helpers";
import {
  WITHDRAW_SUCCESS,
  WITHDRAW_FAILURE,
  WITHDRAW_PROMPT,
  WITHDRAW_SUBMIT,
} from "../constants";
import ConnextSDK from "..";

interface IWithdrawProps {
  sdk: ConnextSDK;
  stage: string;
}

function Withdraw({ sdk, stage }: IWithdrawProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const withdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const recipientRef = e.currentTarget.elements.namedItem(
      "recipient"
    ) as HTMLInputElement;

    if (!isValidAddress(recipient)) {
      console.error(sdk.text.error.invalid_address);
      recipientRef?.setCustomValidity(sdk.text.warn.enter_valid_address);
      recipientRef?.reportValidity();
      return;
    } else {
      recipientRef?.setCustomValidity("");
      recipientRef?.reportValidity();
    }

    if (!e.currentTarget.checkValidity()) {
      console.error(sdk.text.error.invalid_amount);
      return;
    }
    sdk.events.emit(WITHDRAW_SUBMIT, { recipient, amount });
  };
  return (
    <div className="flex-column">
      {stage === WITHDRAW_SUCCESS ? (
        <h3>{sdk.text.info.withdraw_success}</h3>
      ) : stage === WITHDRAW_FAILURE ? (
        <h3>{sdk.text.info.withdraw_failure}</h3>
      ) : stage === WITHDRAW_PROMPT ? (
        <form onSubmit={withdraw}>
          <h3>{sdk.text.info.withdraw_prompt}</h3>
          <input
            required
            type="number"
            placeholder={sdk.text.label.token_amount}
            value={amount}
            step="any"
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            required
            name="recipient"
            placeholder={sdk.text.label.ethereum_address}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <button type="submit">{sdk.text.action.withdraw}</button>
        </form>
      ) : null}
    </div>
  );
}

export default Withdraw;
