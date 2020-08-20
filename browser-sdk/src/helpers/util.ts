import { ConnextSDKOptions } from "../typings";
import {
  DEFAULT_ASSET_ID,
  DEFAULT_NETWORK,
  CONFIG_OPTIONS,
} from "../constants";

export function renderElement(name: string, attr: any, target) {
  const elm = document.createElement(name);
  Object.keys(attr).forEach((key) => {
    elm[key] = attr[key];
  });
  target.appendChild(elm);
  return elm;
}

export function payloadId(): number {
  const date = new Date().getTime() * Math.pow(10, 3);
  const extra = Math.floor(Math.random() * Math.pow(10, 3));
  return date + extra;
}

export function getNetworkName(option: string): string {
  if (CONFIG_OPTIONS.networks.includes(option)) {
    return option;
  }
  if (CONFIG_OPTIONS.aliases.includes(option)) {
    return CONFIG_OPTIONS.networks[CONFIG_OPTIONS.aliases.indexOf(option)];
  }
  throw new Error(`Invalid configuration matching: ${option}`);
}

export const getUrlOptions = (
  network: string
): { ethProviderUrl: string; nodeUrl: string } => {
  let urlOptions;

  if (network.toLowerCase() === "localhost") {
    urlOptions = {
      ethProviderUrl: `http://localhost:8545`,
      nodeUrl: `http://localhost:8080`,
    };
  } else {
    const baseUrl =
      network.toLowerCase() === "mainnet"
        ? "indra.connext.network"
        : network.toLowerCase() === "rinkeby"
        ? "rinkeby.indra.connext.network"
        : null;
    if (!baseUrl) {
      throw new Error(
        `Provided network (${network.toLowerCase()}) is not supported`
      );
    }
    urlOptions = {
      ethProviderUrl: `https://${baseUrl}/ethprovider`,
      nodeUrl: `https://${baseUrl}`,
    };
  }
  return urlOptions;
};

export const getSdkOptions = (
  opts?: string | Partial<ConnextSDKOptions>
): ConnextSDKOptions => {
  let options: ConnextSDKOptions = {
    assetId: DEFAULT_ASSET_ID,
    ...getUrlOptions(DEFAULT_NETWORK),
  };
  if (typeof opts === "string") {
    options = {
      ...options,
      ...getUrlOptions(getNetworkName(opts)),
    };
  } else if (typeof opts !== "undefined") {
    options = {
      ...options,
      ...opts,
    };
  }
  return options;
};
