import React, { useState } from "react";
import QRCode from "react-qr-code";

function DepositModal() {
  const [showQR, setShowQR] = useState(false);
  const depositAddress = "some eth address";
  return (
    <div>
      {showQR ?
        <div>
          <QRCode value={depositAddress} />
          <div style={{ textAlign: "center" }}>{depositAddress}</div>
          <div onClick={() => setShowQR(false)}>back</div>
        </div>
        :
        <div onClick={() => setShowQR(true)}>
          Or deposit using existing crypto wallet
        </div>}
    </div>
  )
}

export default DepositModal;