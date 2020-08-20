import { constants } from "ethers";

export const DEFAULT_IFRAME_SRC = "http://localhost:3030";
export const DEFAULT_MAGIC_KEY = "pk_live_AF53537280E47C75";
export const DEFAULT_ASSET_ID = constants.AddressZero;

export const DEFAULT_NETWORK = "rinkeby";

export const CONFIG_OPTIONS = {
  networks: ["localhost", "rinkeby", "mainnet"],
  aliases: ["sandbox", "staging", "production"],
};
