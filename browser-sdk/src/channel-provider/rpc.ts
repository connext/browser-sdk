import EventEmitter from "eventemitter3";
import { JsonRpcRequest } from "@connext/types";

class IframeRpcConnection extends EventEmitter {
  public connected = false;

  public async send(payload: JsonRpcRequest): Promise<any> {
    // TODO: send payloads through postMessage
  }
  public async open(): Promise<void> {
    // TODO: Instantitate iframe with provided signature
    this.connected = true;
  }
  public async close(): Promise<void> {
    // TODO: Remove iframe   from window
    this.connected = false;
  }
}
export default IframeRpcConnection;
