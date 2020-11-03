import EventEmitter from "eventemitter3";
import {
  ChannelRpcMethod,
  ChannelRpcMethodsPayloadMap,
  JsonRpcRequest,
  EngineEvent,
  Address,
} from "@connext/vector-types";

export class ConnextEventEmitter extends EventEmitter<
  string | ChannelRpcMethod | EngineEvent
> {}

export interface IRpcConnection extends ConnextEventEmitter {
  ////////////////////////////////////////
  // Properties
  connected: boolean;

  ////////////////////////////////////////
  // Methods
  send(payload: JsonRpcRequest): Promise<any>;
  open(): Promise<void>;
  close(): Promise<void>;
}

export interface IChannelProvider extends ConnextEventEmitter {
  connected: boolean;
  connection: IRpcConnection;
  enable(): Promise<any>;
  send(
    method: ChannelRpcMethod,
    params: ChannelRpcMethodsPayloadMap
  ): Promise<any>;
  close(): Promise<void>;
  multisigAddress: Address | undefined;
  signerAddress: Address | undefined;
}

export class ChannelProvider
  extends ConnextEventEmitter
  implements IChannelProvider {
  public connected: boolean = false;
  public connection: IRpcConnection;

  public multisigAddress: string | undefined;
  public signerAddress: string | undefined;

  constructor(connection: IRpcConnection) {
    super();
    this.connection = connection;
  }

  enable(): Promise<any> {
    throw new Error("Method not implemented.");
  }

  send(
    method: ChannelRpcMethod,
    params: ChannelRpcMethodsPayloadMap
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }
  close(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
