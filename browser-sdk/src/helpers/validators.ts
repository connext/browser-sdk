import {
  EngineEvent,
  EngineEvents,
  ChannelRpcMethods,
  ChannelRpcMethod,
} from "@connext/vector-types";

import { ChannelProvider } from "./channelProvider";
import { IframeChannelProvider } from "./iframe";

export function isIframe(
  channelProvider: ChannelProvider | IframeChannelProvider
): channelProvider is IframeChannelProvider {
  return (
    typeof (channelProvider as IframeChannelProvider).isIframe !== "undefined"
  );
}

export function isEventName(event: string): event is EngineEvent {
  return event in EngineEvents;
}

export function isMethodName(method: string): method is ChannelRpcMethod {
  return method in ChannelRpcMethods;
}
