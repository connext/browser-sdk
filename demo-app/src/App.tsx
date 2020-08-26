import React, { useState } from "react";
import "./App.css";
import { BigNumber } from "ethers";
import ConnextSDK from "connext";

function App() {
  const [tipped, setTipped] = useState(false);
  const [errored, setErrored] = useState(false);

  const recipientIdentifier =
    "indra6WYYHjQsgU7KRWHVb7NQL5NvYwoMibtAUNM7QwmNJqXacRbvZ7";
  const amount = BigNumber.from(5);

  const connext = new ConnextSDK("rinkeby", {
    logLevel: 3,
    iframeSrc: "http://localhost:3030",
  });

  const tip = async () => {
    console.log("[tip]", "connext.login()", "BEFORE");
    await connext.login();
    console.log("[tip]", "connext.login()", "AFTER");
    const currentBalance = BigNumber.from(await connext.balance());
    console.log("[tip]", "currentBalance", "currentBalance");
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
        await connext.transfer(recipientIdentifier, amount.toString());
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
        <button onClick={tip}>
          {tipped
            ? "Thanks for the tip!"
            : errored
            ? "Error! Please try again"
            : "Tip"}
        </button>
      </div>
    </div>
  );
}

export default App;
