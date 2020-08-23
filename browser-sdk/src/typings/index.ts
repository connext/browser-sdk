import { ChannelProvider } from "@connext/channel-provider";

export interface ConnextSDKOptions {
  assetId: string;
  nodeUrl: string;
  ethProviderUrl: string;
  iframeSrc: string;
  magicKey: string;
  channelProvider?: ChannelProvider;
}

export interface ConnextTransaction {
  recipient: string;
  amount: string;
  timestamp: Date;
}

export interface IframeOptions {
  id: string;
  src: string;
}
