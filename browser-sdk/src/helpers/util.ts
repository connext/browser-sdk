import { addressBook } from "@connext/contracts";

import { ConnextSDKOptions } from "../typings";
import {
  DEFAULT_NETWORK,
  CONFIG_OPTIONS,
  DEFAULT_IFRAME_SRC,
  DEFAULT_MAGIC_KEY,
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

// export const removeUndefinedFields = <T>(obj: T): T => {
//   Object.keys(obj).forEach(
//     (key) => typeof obj[key] === "undefined" && delete obj[key]
//   );
//   return obj;
// };

export function getNetworkName(option: string): string {
  if (CONFIG_OPTIONS.networks.includes(option)) {
    return option;
  }
  if (CONFIG_OPTIONS.aliases.includes(option)) {
    return CONFIG_OPTIONS.networks[CONFIG_OPTIONS.aliases.indexOf(option)];
  }
  throw new Error(`Invalid configuration matching: ${option}`);
}

export function getChainId(network: string): number {
  switch (network) {
    case "localhost":
      return 1337;
    case "rinkeby":
      return 4;
    case "mainnet":
      return 1;
    default:
      throw new Error(`Network not supported`);
  }
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
  opts?: string | Partial<ConnextSDKOptions>,
  overrideOpts?: Partial<ConnextSDKOptions>
): ConnextSDKOptions => {
  let network =
    typeof opts === "string" ? getNetworkName(opts) : DEFAULT_NETWORK;
  let options: ConnextSDKOptions = {
    logLevel: 0,
    assetId: addressBook[getChainId(network)].Token.address,
    iframeSrc: DEFAULT_IFRAME_SRC,
    magicKey: DEFAULT_MAGIC_KEY,
    ...getUrlOptions(network),
  };
  if (typeof opts !== "undefined" && typeof opts !== "string") {
    options = {
      ...options,
      ...opts,
    };
  }
  return {
    ...options,
    ...overrideOpts,
  };
};
