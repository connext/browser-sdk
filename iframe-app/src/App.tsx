import React from "react";
import * as connext from "@connext/client";
import { IConnextClient } from "@connext/types";
import { constants, utils } from "ethers";

class App extends React.Component {
  private channel: IConnextClient | undefined;

  async handleMessage(message: any) {
    const channel = this.channel as IConnextClient;
    switch (message.action) {
      case 'publicIdentifier':
        return channel.signerAddress;
      case 'deposit':
        return await channel.deposit({
          amount: utils.parseEther(message.amount).toString(), // in wei/wad
          assetId: constants.AddressZero, // constants.AddressZero represents ETH
        });
      case 'withdraw':        
        await channel.withdraw({
          recipient: message.recipient,
          amount: utils.parseEther(message.amount).toString(),  // in wei/wad
          assetId: constants.AddressZero,  // constants.AddressZero represents ETH
        })
        break;
      case 'balance':
        break;
      case 'transfer':
        break;
      case 'getTransactionHistory':
        break;
    }
    throw new Error(`Unknown message action ${message.action}`);
  }

  async componentDidMount() {
    const parentOrigin = (new URL(document.referrer)).origin;
    this.channel = await connext.connect("rinkeby");
    window.addEventListener("message", async (e) => {
      if (e.origin === parentOrigin) {  // the referrer contains the URL of the page that loaded this iframe
        const payload = JSON.parse(e.data);
        const response = await this.handleMessage(payload.message);

        // send response back to the parent
        window.parent.postMessage(JSON.stringify({sequenceNumber: payload.sequenceNumber, message: response}), parentOrigin);
      }
    }, true);
    window.parent.postMessage("INITIALIZED", parentOrigin);
  }

  render() {
    return (
      <div className="App">
        <div className="Content">Test</div>
      </div>
    );
  }
}

export default App;
