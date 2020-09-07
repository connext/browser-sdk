import EventEmitter from "eventemitter3";
import {
  JsonRpcRequest,
  IRpcConnection,
  EventName,
  MethodName,
} from "@connext/types";

import { renderElement, payloadId } from "./util";
import { IframeOptions } from "../typings";
import { ChannelProvider } from "@connext/channel-provider";

export class IframeRpcConnection
  extends EventEmitter<string>
  implements IRpcConnection {
  public iframe: HTMLIFrameElement | undefined;
  public opts: IframeOptions;
  public connected = false;
  private subscribed = false;

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
      this.on(`${request.id}`, (response) => {
        if (response?.result) {
          resolve(response?.result);
        } else {
          if (response?.error?.message) {
            reject(new Error(response?.error?.message));
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
    this.send({
      method: "chan_subscribe",
      params: { event },
    }).then((id) => {
      this.on(id, listener);
    });
  };

  public once = (
    event: string | EventName | MethodName,
    listener: (...args: any[]) => void
  ): any => {
    this.send({
      method: "chan_subscribe",
      params: { event },
    }).then((id) => {
      this.once(id, listener);
    });
  };

  public removeAllListeners = (): any => {
    return this.send({ method: "chan_unsuscribe" });
  };

  public render(): Promise<void> {
    if (this.iframe) {
      return Promise.resolve(); // already rendered
    }
    if (window.document.getElementById(this.opts.id)) {
      return Promise.resolve(); // already exists
    }
    return new Promise((resolve) => {
      this.on("iframe-initialized", () => {
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
        this.emit(event);
      } else {
        const payload = JSON.parse(e.data);
        if (payload.method === "chan_subscription") {
          this.emit(payload.params.subscription, payload.params.data);
        } else {
          this.emit(`${payload.id}`, payload);
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
    this.emit("connect");
    this.emit("open");
  }

  private onDisconnect() {
    this.connected = false;
    this.emit("disconnect");
    this.emit("close");
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

export function isIframe(
  channelProvider: ChannelProvider | IframeChannelProvider
): channelProvider is IframeChannelProvider {
  return (
    typeof (channelProvider as IframeChannelProvider).isIframe !== "undefined"
  );
}
