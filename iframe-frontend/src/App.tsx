import React from "react";

// @ts-ignore
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [address, setAddress] = React.useState<string>("");

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>{address}</div>
      </header>
    </div>
  );
}

export default App;
