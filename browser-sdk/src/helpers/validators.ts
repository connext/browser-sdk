import { EventNames, EventName, MethodNames, MethodName } from "@connext/types";
import { ChannelProvider } from "@connext/channel-provider";

import { IframeChannelProvider } from "./iframe";

export function isIframe(
  channelProvider: ChannelProvider | IframeChannelProvider
): channelProvider is IframeChannelProvider {
  return (
    typeof (channelProvider as IframeChannelProvider).isIframe !== "undefined"
  );
}

export function isEventName(event: string): event is EventName {
  return event in EventNames;
}

export function isMethodName(event: string): event is MethodName {
  return event in MethodNames;
}
