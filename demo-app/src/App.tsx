import React from "react";
import "./App.css";
import connext from '@connext/browser-sdk';

function App() {
  const handleClick = async () => {
    await connext.login();
  }
  return (
    <div className="App">
      <div className="Content">
        <h4>(-⌣-) Welcome to Loft Rad</h4>
        <h1>Golden</h1>
        <h3>Tom Doolie</h3>
        <button onClick={handleClick}>
          Tip
        </button>
      </div>
    </div>
  );
}

export default App;
