import EventEmitter from "eventemitter3";
import { renderElement } from "./util";

class IframeProvider extends EventEmitter {
  private index = 0;
  private iframe: HTMLIFrameElement | undefined;

  constructor(iframeUrl) {
    super();
    this.render(iframeUrl);
  }

  get connected() {
    return (
      typeof this.iframe !== "undefined" && this.iframe.contentWindow !== null
    );
  }

  public send(message: any): Promise<any> {
    if (typeof this.iframe === "undefined") {
      throw new Error("iframe is not rendered!");
    }
    if (!this.connected) {
      throw new Error("iframe inner page not loaded!");
    }
    this.index = this.index + 1; // immediately increment the sequence number to uniquely distinguish this call
    const payload = { sequenceNumber: this.index, message: message };
    return new Promise((resolve) => {
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
        if (response.sequenceNumber !== payload.sequenceNumber) {
          // message intended for a different invocation of sendToConnext(), ignore it and let the other handler take it instead
          return;
        }
        window.removeEventListener("message", receiveMessage); // don't listen anymore, we've successfully received the response
        resolve(response.message);
      };
      window.addEventListener("message", receiveMessage, false);
      (this.iframe.contentWindow as Window).postMessage(
        JSON.stringify(payload),
        this.iframe.src
      );
    });
  }

  public render(iframeUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const iframeOrigin = new URL(iframeUrl).origin;
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
          id: "connext-iframe",
          src: iframeUrl as string,
          style: "width:0;height:0;border:0; border:none;",
        },
        document.body
      ) as HTMLIFrameElement;
    });
  }
}

export default IframeProvider;
