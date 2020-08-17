export const STYLE_CONNEXT_OVERLAY = `
  #connext-overlay {
      position: fixed;
      top: 0; bottom: 0; left: 0; right: 0;
      z-index: 999;
      pointer-events: none;
      font-family: Fira Sans,Helvetica Neue,Apple SD Gothic Neo,Malgun Gothic,Segoe UI,sans-serif;
  }
  #connext-overlay * not(svg){
      /* reset all CSS styles for elements inside the overlay, as a way to "sandbox" the overlay UI from the parent page without using an iframe */
      all: unset;
  }
`;
