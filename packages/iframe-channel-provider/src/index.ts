import { ChannelProvider } from "@connext/channel-provider";
import { IRpcConnection } from "@connext/types";

import IframeRpcConnection from "./rpc";

class IframeChannelProvider extends ChannelProvider {
  constructor() {
    super(new IframeRpcConnection() as IRpcConnection);
  }
  public isIframe = true;
}

export default IframeChannelProvider;
