import EventEmitter from "eventemitter3";
import { JsonRpcRequest } from "@connext/types";

import { renderElement, payloadId } from "./util";
import { IframeOptions } from "../typings";

export class IframeProvider extends EventEmitter {
  public iframe: HTMLIFrameElement | undefined;
  public opts: IframeOptions;

  constructor(opts: IframeOptions) {
    super();
    this.opts = opts;
    window.addEventListener("DOMContentLoaded", () => {
      this.render();
    });
  }

  get connected() {
    return (
      typeof this.iframe !== "undefined" && this.iframe.contentWindow !== null
    );
  }

  public send(payload: Partial<JsonRpcRequest>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof this.iframe === "undefined") {
        throw new Error("iframe is not rendered!");
      }
      if (this.iframe.contentWindow === null) {
        throw new Error("iframe inner page not loaded!");
      }
      const request: JsonRpcRequest = {
        id: payloadId(),
        jsonrpc: "2.0",
        method: payload.method || "",
        params: payload.params || {},
      };
      if (!request.method.trim()) {
        throw new Error("Missing payload method or invalid");
      }
      this.on(`${request.id}`, (response) => {
        if (response.result) {
          resolve(response.result);
        } else {
          if (response.error.message) {
            reject(new Error(response.error.message));
          } else {
            reject(new Error(`Failed request for method: ${request.method}`));
          }
        }
      });
      this.iframe.contentWindow.postMessage(
        JSON.stringify(payload),
        this.iframe.src
      );
    });
  }

  public render(): Promise<void> {
    this.subscribe();
    return new Promise((resolve) => {
      this.on("iframe-initialized", () => {
        this.emit("connected");
        resolve();
      });
      this.iframe = renderElement(
        "iframe",
        {
          id: this.opts.id,
          src: this.opts.src,
          style: "width:0;height:0;border:0; border:none;",
        },
        window.document.body
      ) as HTMLIFrameElement;
    });
  }

  public handleIncomingMessages(e: MessageEvent) {
    const iframeOrigin = new URL(this.opts.src).origin;
    if (e.origin === iframeOrigin) {
      if (typeof e.data !== "string") {
        throw new Error(`Invalid incoming message data:${e.data}`);
      }
      if (e.data.startsWith("event:")) {
        const event = e.data.replace("event:", "");
        this.emit(event);
      } else {
        const payload = JSON.parse(e.data);
        this.emit(`${payload.id}`, payload);
      }
    }
  }

  public subscribe() {
    window.addEventListener("message", (e) => this.handleIncomingMessages(e));
  }

  public unsubscribe() {
    window.removeEventListener("message", (e) =>
      this.handleIncomingMessages(e)
    );
  }
}
