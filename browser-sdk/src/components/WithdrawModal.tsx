import React, { useRef } from "react";

import { isValidAddress } from "../helpers";
import { WITHDRAW_SUCCESS_EVENT } from "../constants";

function WithdrawModal({ emit }) {
  const recipientRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  function withdraw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !recipientRef ||
      !recipientRef.current ||
      isValidAddress(recipientRef.current.value)
    ) {
      console.log("Invalid address!");
      return;
    }

    if (!e.currentTarget.checkValidity() || !amountRef || !amountRef.current) {
      console.log("Invalid amount!");
      return;
    }

    emit(WITHDRAW_SUCCESS_EVENT, {
      amount: amountRef.current.value,
      recipient: recipientRef.current.value,
    });
  }
  return (
    <div className="flex-column">
      <>
        <form onSubmit={withdraw}>
          <h3>Please enter amount to withdraw and recipient.</h3>
          <input required type="number" placeholder="Amount" ref={amountRef} />
          <input required placeholder="Ethereum address" ref={recipientRef} />
          <button type="submit">Withdraw</button>
        </form>
      </>
    </div>
  );
}

export default WithdrawModal;
