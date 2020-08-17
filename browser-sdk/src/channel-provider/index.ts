import { IRpcConnection } from "@connext/types";
import { ChannelProvider } from "@connext/channel-provider";

import IframeRpcConnection from "./rpc";
import { IframeAttributes } from "../helpers";

class IframeChannelProvider extends ChannelProvider {
  constructor(iframeAttributes: IframeAttributes) {
    super(new IframeRpcConnection(iframeAttributes) as IRpcConnection);
  }

  public isIframe = true;
}

export default IframeChannelProvider;
