export function renderElement(name: string, attr: any, target = "body") {
  const elm = document.createElement(name);
  Object.keys(attr).forEach((key) => {
    elm[key] = attr[key];
  });
  document[target].appendChild(elm);
  return elm;
}
