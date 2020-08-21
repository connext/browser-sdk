import React, { useState } from "react";
import "./App.css";
import { BigNumber } from "ethers";
import ConnextSDK from "@connext/browser-sdk";

function App() {
  const [tipped, setTipped] = useState(false);
  const [errored, setErrored] = useState(false);

  const recipientIdentifier = "indra987zxy...";
  const amount = BigNumber.from(5*10e-18);

  const connext = new ConnextSDK();

  const handleClick = async () => {
    await connext.login();
    const currentBalance = await connext.balance() as BigNumber;
    if (currentBalance.lt(amount)) {
      console.log("Balance too low! Please fund your account.");
      try {
        await connext.deposit();
      } catch (error) {
        setErrored(true);
        console.log(error);
      }
    } else {
      try {
        await connext.transfer(recipientIdentifier, amount);
        setTipped(true);
        setErrored(false);
      } catch (error) {
        setErrored(true);
        console.log(error);
      }
    }
  };
  return (
    <div className="App">
      <div className="Content">
        <h4>(-⌣-) Welcome to Loft Rad</h4>
        <h1>Golden</h1>
        <h3>Tom Doolie</h3>
        <button onClick={handleClick}>{tipped ? "Thanks for the tip!" : errored ? "Error! Please try again" : "Tip"}</button>
      </div>
    </div>
  );
}

export default App;
