import React, { useState } from "react";

function WithdrawModal() {
  const [showAddress, setShowAddress] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("some eth address");
  return (
    <div className="flex-column">
      {showAddress ?
        <>
          <h3>Withdraw to:</h3>
          <input
            type="text"
            value={withdrawAddress}
            onChange={e => setWithdrawAddress(e.target.value)} />
          <button onClick={() => { console.log(withdrawAddress); }}>Confirm</button>
        </> :
        <>
          <div className="underline" onClick={() => setShowAddress(true)}>
            Or withdraw using existing crypto wallet
          </div>
        </>
      }
    </div>
  );
}

export default WithdrawModal;