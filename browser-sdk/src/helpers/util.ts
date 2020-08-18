export function renderElement(name: string, attr: any, target) {
  const elm = document.createElement(name);
  Object.keys(attr).forEach((key) => {
    elm[key] = attr[key];
  });
  target.appendChild(elm);
  return elm;
}
