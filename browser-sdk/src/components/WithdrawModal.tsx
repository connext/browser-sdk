import React, { useState } from "react";

function WithdrawModal() {
  const [withdrawAddress, setWithdrawAddress] = useState("some eth address");
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div>Withdraw to:</div>
      <input
        type="text"
        value={withdrawAddress}
        onChange={e => setWithdrawAddress(e.target.value)} />
      <button onClick={() => {console.log(withdrawAddress);}}>Confirm</button>
    </div>
  )
}

export default WithdrawModal;