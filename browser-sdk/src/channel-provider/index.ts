import { ChannelProvider } from "@connext/channel-provider";

import IframeRpcConnection from "./rpc";

class IframeChannelProvider extends ChannelProvider {
  constructor() {
    super(new IframeRpcConnection() as any);
  }
  public isIframe = true;
}

export default IframeChannelProvider;
