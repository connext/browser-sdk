import { IRpcConnection, JsonRpcRequest } from "@connext/types";
import { EventEmitter } from "eventemitter3";

import { sendToConnext } from "../helpers/util";

class IframeRpcConnection extends EventEmitter implements IRpcConnection {
  public connected = false;

  private iframeElem: HTMLIFrameElement | undefined;

  constructor(iframeElem: HTMLIFrameElement) {
    super();
    this.iframeElem = iframeElem
  }

  public async send(payload: JsonRpcRequest): Promise<any> {
    return await sendToConnext(payload, this.iframeElem as HTMLIFrameElement);
  }

  public async open(): Promise<void> {
    // TODO: Instantitate iframe with provided signature
    this.connected = true;
  }

  public async close(): Promise<void> {
    this.connected = false;
  }
}

export default IframeRpcConnection;
