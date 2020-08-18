import { ChannelProvider } from "@connext/channel-provider";

export interface ConnextSDKOptions {
  network?: string;
  magicKey?: string;
  iframeSrc?: string;
  channelProvider?: ChannelProvider;
}

export interface ConnextTransaction {
  recipient: string;
  amount: string;
  timestamp: Date;
}
