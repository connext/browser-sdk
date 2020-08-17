export const STYLE_CONNEXT_OVERLAY = `
  #connext-overlay {
      position: fixed;
      top: 0; bottom: 0; left: 0; right: 0;
      z-index: 999;
      pointer-events: none;
      font-family: Fira Sans,Helvetica Neue,Apple SD Gothic Neo,Malgun Gothic,Segoe UI,sans-serif;
  }
  #connext-overlay * not(svg) {
      /* reset all CSS styles for elements inside the overlay, as a way to "sandbox" the overlay UI from the parent page without using an iframe */
      all: unset;
  }

  #connext-overlay-modal {
    pointer-events: auto;
    position: absolute;
    bottom: 1em;
    right: 1em;
    background: white;
    width: 16em;
    padding: 2em;
    border-radius: 1em;
  }

  #connext-overlay #connext-overlay-modal .flex-column {
    display: flex;
    flex-direction: column;
    text-align: center;
  }

  #connext-overlay #connext-overlay-modal .underline {
    text-decoration: underline;
  }

  #connext-overlay #connext-overlay-modal h3 {
    font-weight: lighter;
    margin: 0.5em;
  }

  #connext-overlay #connext-overlay-modal button {
    background-color: #fca311;
    color: #ffffff;
    font-size: 1.25em;
    border: none;
    border-radius: 0.25em;
    padding: 0.25em;
    margin: 0.5em 0.5em 0;
  }

  #connext-overlay #connext-overlay-modal input {
    border-radius: 0.25em;
    padding: 0.5em;
    border: solid;
    border-width: 1px;
    text-align: center;
    margin: 1em 0 0;
  }
`;
