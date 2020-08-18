export function renderElement(name: string, attr: any, target) {
  const elm = document.createElement(name);
  Object.keys(attr).forEach((key) => {
    elm[key] = attr[key];
  });
  target.appendChild(elm);
  return elm;
}

let SEQUENCE_NUMBER = 0;
export async function sendToConnext(message: any, iframeElem: HTMLIFrameElement): Promise<any> {
  if (iframeElem.contentWindow === null) {
    throw new Error('iframeElem inner page not loaded!');
  }
  SEQUENCE_NUMBER ++;  // immediately increment the sequence number to uniquely distinguish this call
  const payload = {sequenceNumber: SEQUENCE_NUMBER, message: message};
  return new Promise(resolve => {
    const receiveMessage = (e) => {
      const iframeOrigin = (new URL(iframeElem.src)).origin;
      if (e.origin != iframeOrigin) {
        // just a message from some other origin, ignore it
        return;
      }
      const response = JSON.parse(e.data);
      if (response.sequenceNumber !== payload.sequenceNumber) {
        // message intended for a different invocation of sendToConnext(), ignore it and let the other handler take it instead
        return;
      }
      window.removeEventListener("message", receiveMessage);  // don't listen anymore, we've successfully received the response
      resolve(response.message);
    }
    window.addEventListener("message", receiveMessage, false);
    (iframeElem.contentWindow as Window).postMessage(JSON.stringify(payload), iframeElem.src);
  });
}
