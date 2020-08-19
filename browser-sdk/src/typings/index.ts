import { ChannelProvider } from "@connext/channel-provider";

import { CONNEXT_LOGIN_EVENT } from "../constants";

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

export interface IframeOptions {
  id: string;
  src: string;
}

export class LoginEvent extends CustomEvent<string> {
  constructor(email: string) {
    super(CONNEXT_LOGIN_EVENT, { detail: email });
  }
}
