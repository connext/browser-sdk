import React from "react";
import * as connext from "@connext/client";
import { IConnextClient, JsonRpcRequest } from "@connext/types";
import { utils } from "ethers";

class App extends React.Component {
  private channel: IConnextClient | undefined;

  async handleRequest(request: JsonRpcRequest) {
    const channel = this.channel as IConnextClient;
    let result: any | undefined;
    switch (request.method) {
      case "connext_publicIdentifier":
        result = { publicIdentifier: channel.publicIdentifier };
      case "connext_deposit":
        result = {
          txhash: (
            await channel.deposit({
              amount: utils.parseEther(request.params.amount).toString(),
              assetId: request.params.assetId,
            })
          ).transaction.hash,
        };
      case "connext_withdraw":
        result = {
          txhash: (
            await channel.withdraw({
              recipient: request.params.recipient,
              amount: utils.parseEther(request.params.amount).toString(),
              assetId: request.params.assetId,
            })
          ).transaction.hash,
        };
        break;
      case "connext_balance":
        result = {
          balance: "",
        };
        break;
      case "connext_transfer":
        result = {
          paymentId: "",
        };
        break;
      case "connext_getTransactionHistory":
        result = {
          transactions: [],
        };
        break;
    }
    if (typeof result === "undefined") {
      throw new Error(`Failed to responde to request method:${request.method}`);
    }
    return result;
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
