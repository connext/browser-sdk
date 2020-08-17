import { ChannelProvider } from "@connext/channel-provider";

export interface ConnextSDKOptions {
  network?: string;
  magicKey?: string;
  channelProvider?: ChannelProvider;
}

export interface IConnextTransaction {
  recipient: string;
  amount: string;
  timestamp: Date;
}
