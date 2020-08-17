export const STYLE_CONNEXT_OVERLAY = `
  #connext-overlay {
      position: fixed;
      top: 0; bottom: 0; left: 0; right: 0;
      z-index: 999;
      pointer-events: none;
  }
  #connext-overlay * {
      /* reset all CSS styles for elements inside the overlay, as a way to "sandbox" the overlay UI from the parent page without using an iframe */
      all: unset;
  }
`;
