import EventEmitter from "eventemitter3";
import {
  JsonRpcRequest,
  IRpcConnection,
  EventName,
  MethodName,
} from "@connext/types";
import { ChannelProvider } from "@connext/channel-provider";

import { renderElement, payloadId } from "./util";
import { IframeOptions } from "../typings";
import { isEventName, isMethodName } from "./validators";

export class IframeRpcConnection
  extends EventEmitter<string>
  implements IRpcConnection {
  public iframe: HTMLIFrameElement | undefined;
  public opts: IframeOptions;
  public connected = false;

  private subscribed = false;
  private events = new EventEmitter<string>();

  constructor(opts: IframeOptions) {
    super();
    this.opts = opts;
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", () => {
        this.open();
      });
    } else {
      this.open();
    }
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
      this.events.on(`${request.id}`, (response) => {
        if (response?.result) {
          resolve(response?.result);
        } else {
          if (response?.error?.message) {
            reject(new Error(response.error.message));
          } else {
            reject(new Error(`Failed request for method: ${request.method}`));
          }
        }
      });
      this.iframe.contentWindow.postMessage(
        JSON.stringify(request),
        this.iframe.src
      );
    });
  }
  public on = (
    event: string | EventName | MethodName,
    listener: (...args: any[]) => void
  ): any => {
    if (isEventName(event) || isMethodName(event)) {
      return this.send({
        method: "chan_subscribe",
        params: { event },
      }).then((id) => {
        this.events.on(id, listener);
      });
    }
    return this.events.on(event, listener);
  };

  public once = (
    event: string | EventName | MethodName,
    listener: (...args: any[]) => void
  ): any => {
    if (isEventName(event) || isMethodName(event)) {
      return this.send({
        method: "chan_subscribe",
        params: { event },
      }).then((id) => {
        this.events.once(id, listener);
      });
    }
    return this.events.once(event, listener);
  };

  public removeAllListeners = (): any => {
    this.events.removeAllListeners();
    return this.send({ method: "chan_unsubscribe" });
  };

  public render(): Promise<void> {
    if (this.iframe) {
      return Promise.resolve(); // already rendered
    }
    if (window.document.getElementById(this.opts.id)) {
      return Promise.resolve(); // already exists
    }
    return new Promise((resolve) => {
      this.events.on("iframe-initialized", () => {
        this.onConnect();
        resolve();
      });
      this.iframe = renderElement(
        "iframe",
        {
          id: this.opts.id,
          src: this.opts.src,
          style: "width:0;height:0;border:0;border:none;display:block",
        },
        window.document.body
      ) as HTMLIFrameElement;
    });
  }

  public async unrender(): Promise<void> {
    if (typeof this.iframe === "undefined") {
      return Promise.resolve();
    }
    try {
      window.document.body.removeChild(this.iframe);
    } finally {
      this.iframe = undefined;
    }
  }

  public handleIncomingMessages(e: MessageEvent) {
    const iframeOrigin = new URL(this.opts.src).origin;
    if (e.origin === iframeOrigin) {
      if (typeof e.data !== "string") {
        throw new Error(`Invalid incoming message data:${e.data}`);
      }
      if (e.data.startsWith("event:")) {
        const event = e.data.replace("event:", "");
        this.events.emit(event);
      } else {
        const payload = JSON.parse(e.data);
        if (payload.method === "chan_subscription") {
          const { subscription, data } = payload.params;
          this.events.emit(subscription, data);
        } else {
          this.events.emit(`${payload.id}`, payload);
        }
      }
    }
  }

  public async open() {
    this.subscribe();
    await this.render();
  }

  public async close() {
    this.unsubscribe();
    await this.unrender();
    this.onDisconnect();
  }

  public subscribe() {
    if (this.subscribed) {
      return;
    }
    this.subscribed = true;
    window.addEventListener("message", this.handleIncomingMessages.bind(this));
  }

  public unsubscribe() {
    if (!this.subscribed) {
      return;
    }
    this.subscribed = false;
    window.removeEventListener(
      "message",
      this.handleIncomingMessages.bind(this)
    );
  }

  private onConnect() {
    this.connected = true;
    this.events.emit("connect");
    this.events.emit("open");
  }

  private onDisconnect() {
    this.connected = false;
    this.events.emit("disconnect");
    this.events.emit("close");
  }
}

export class IframeChannelProvider extends ChannelProvider {
  constructor(opts: IframeOptions) {
    super(new IframeRpcConnection(opts));
  }
  get isIframe(): boolean {
    return true;
  }
}
