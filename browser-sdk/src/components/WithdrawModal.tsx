import React, { useState } from "react";

import { isValidAddress } from "../helpers";

function WithdrawModal({ sdkInstance, onWithdrawComplete }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const withdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isValidAddress(recipient)) {
      console.log("Invalid address!");
      return;
    }

    if (!e.currentTarget.checkValidity()) {
      console.log("Invalid amount!");
      return;
    }

    console.log('WITHDRAW', { amount, recipient });
    try {
      const result = await sdkInstance.channel.withdraw({
        recipient,
        amount,
        assetId: sdkInstance.assetId
      });
      console.log(result);
    } catch (error) {
      console.log(error);
      throw error;
    }
    onWithdrawComplete(true);
  }
  // TODO: cancel button
  return (
    <div className="flex-column">
      <form onSubmit={withdraw}>
        <h3>Please enter amount to withdraw and recipient.</h3>
        <input required type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
        <input required placeholder="Ethereum address" value={recipient} onChange={e => setRecipient(e.target.value)} />
        <button type="submit">Withdraw</button>
      </form>
    </div>
  );
}

export default WithdrawModal;
