import EventEmitter from "eventemitter3";
import { JsonRpcRequest } from "@connext/types";

import { renderElement } from "./util";
import { IframeOptions } from "../typings";

export class IframeProvider extends EventEmitter {
  private index = 0;
  private iframe: HTMLIFrameElement | undefined;

  constructor(opts: IframeOptions) {
    super();
    window.addEventListener("DOMContentLoaded", (event) => {
      this.render(opts);
    });
  }

  get connected() {
    return (
      typeof this.iframe !== "undefined" && this.iframe.contentWindow !== null
    );
  }

  public send(payload: Partial<JsonRpcRequest>): Promise<any> {
    if (typeof this.iframe === "undefined") {
      throw new Error("iframe is not rendered!");
    }
    if (!this.connected) {
      throw new Error("iframe inner page not loaded!");
    }
    this.index = this.index + 1; // immediately increment the sequence number to uniquely distinguish this call
    const request: JsonRpcRequest = {
      id: this.index,
      jsonrpc: "2.0",
      method: payload.method || "",
      params: payload.params || {},
    };
    if (!request.method.trim()) {
      throw new Error("Missing payload method or invalid");
    }
    return new Promise((resolve, reject) => {
      if (typeof this.iframe === "undefined") {
        throw new Error("iframe is not rendered!");
      }
      const receiveMessage = (e) => {
        if (typeof this.iframe === "undefined") {
          throw new Error("iframe is not rendered!");
        }
        const iframeOrigin = new URL(this.iframe.src).origin;
        if (e.origin != iframeOrigin) {
          // just a message from some other origin, ignore it
          return;
        }
        const response = JSON.parse(e.data);
        if (response.id !== request.id) {
          return;
        }
        window.removeEventListener("message", receiveMessage);
        if (response.result) {
          resolve(response.result);
        } else {
          if (response.error.message) {
            reject(new Error(response.error.message));
          } else {
            reject(new Error(`Failed request for method: ${request.method}`));
          }
        }
      };
      window.addEventListener("message", receiveMessage, false);
      (this.iframe.contentWindow as Window).postMessage(
        JSON.stringify(payload),
        this.iframe.src
      );
    });
  }

  public render(opts: IframeOptions): Promise<void> {
    return new Promise((resolve) => {
      const iframeOrigin = new URL(opts.src).origin;
      const receiveInitializedMessage = (e) => {
        if (e.origin === iframeOrigin && e.data === "INITIALIZED") {
          window.removeEventListener("message", receiveInitializedMessage); // don't listen anymore, we've successfully initialized
          this.emit("connected");
          resolve();
        }
      };
      window.addEventListener("message", receiveInitializedMessage, false);
      this.iframe = renderElement(
        "iframe",
        {
          id: opts.id,
          src: opts.src,
          style: "width:0;height:0;border:0; border:none;",
        },
        window.document.body
      ) as HTMLIFrameElement;
    });
  }
}
