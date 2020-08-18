import React from "react";
import * as connext from "@connext/client";
import { IConnextClient, JsonRpcRequest } from "@connext/types";
import { utils } from "ethers";

class App extends React.Component {
  private channel: IConnextClient | undefined;

  async handleRequest(request: JsonRpcRequest) {
    const channel = this.channel as IConnextClient;
    switch (request.method) {
      case "connext_publicIdentifier":
        return channel.signerAddress;
      case "connext_deposit":
        return await channel.deposit({
          amount: utils.parseEther(request.params.amount).toString(), // in wei/wad
          assetId: request.params.assetId, // constants.AddressZero represents ETH
        });
      case "connext_withdraw":
        await channel.withdraw({
          recipient: request.params.recipient,
          amount: utils.parseEther(request.params.amount).toString(), // in wei/wad
          assetId: request.params.assetId, // constants.AddressZero represents ETH
        });
        break;
      case "connext_balance":
        break;
      case "connext_transfer":
        break;
      case "connext_getTransactionHistory":
        break;
    }
    throw new Error(`Unknown request method ${request.method}`);
  }

  async componentDidMount() {
    const parentOrigin = new URL(document.referrer).origin;
    this.channel = await connext.connect("rinkeby");
    window.addEventListener(
      "message",
      async (e) => {
        if (e.origin === parentOrigin) {
          const request = JSON.parse(e.data);
          try {
            const result = await this.handleRequest(request);

            window.parent.postMessage(
              JSON.stringify({
                id: request.id,
                result,
              }),
              parentOrigin
            );
          } catch (e) {
            window.parent.postMessage(
              JSON.stringify({
                id: request.id,
                error: {
                  message: e.message,
                },
              }),
              parentOrigin
            );
          }
        }
      },
      true
    );
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
