import EventEmitter from "eventemitter3";
import { JsonRpcRequest } from "@connext/types";

import { renderElement, IframeAttributes } from "../helpers";

class IframeRpcConnection extends EventEmitter {
  public connected = false;

  constructor(iframeAttributes: IframeAttributes) {
    super();
    renderElement("iframe", iframeAttributes);
  }

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
