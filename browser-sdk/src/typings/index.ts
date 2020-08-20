export interface ConnextSDKOptions {
  assetId: string;
  nodeUrl: string;
  ethProviderUrl: string;
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
