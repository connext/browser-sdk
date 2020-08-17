import { ChannelProvider } from "@connext/channel-provider";

import IframeRpcConnection from "./rpc";
import { renderElement } from "../helpers";

class IframeChannelProvider extends ChannelProvider {
  constructor() {
    super(new IframeRpcConnection() as any);
    renderElement("iframe", {
      id: "channel-provider-iframe",
      src: "http://localhost:3030",
    });
  }

  public isIframe = true;
}

export default IframeChannelProvider;
