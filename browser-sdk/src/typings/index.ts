import { ChannelProvider } from "@connext/channel-provider";

export interface ConnextSDKOptions {
  tokenAddress: string;
  nodeUrl: string;
  ethProviderUrl: string;
  iframeSrc: string;
  magicKey: string;
  logLevel: number;
  language?: string;
  channelProvider?: ChannelProvider;
}

export interface ConnextTransaction {
  recipient: string;
  amount: string;
  timestamp: Date;
}

export interface PreDepositBalance {
  tokenBalance: string;
  ethBalance: string;
}

export interface IframeOptions {
  id: string;
  src: string;
}

export interface LanguageText {
  error: {
    not_logged_in: string;
    missing_modal: string;
    missing_magic: string;
    missing_channel: string;
    invalid_address: string;
    invalid_amount: string;
    invalid_email: string;
  };
  label: {
    token_amount: string;
    ethereum_address: string;
    email_address: string;
  };
  action: {
    withdraw: string;
    login: string;
  };
  warn: {
    enter_valid_address: string;
  };
  info: {
    login_pending: string;
    login_setup: string;
    login_success: string;
    login_failure: string;
    login_prompt: string;
    deposit_pending: string;
    deposit_success: string;
    deposit_failure: string;
    deposit_show_qr: string;
    withdraw_prompt: string;
    withdraw_success: string;
    withdraw_failure: string;
  };
}
