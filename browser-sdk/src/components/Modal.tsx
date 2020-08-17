import React from "react";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";

interface IState {
  mode: string;
  transferRecipient: string | null;
  transferAmount: string;
}

class Modal extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      mode: "LOGIN",
      transferRecipient: null,
      transferAmount: "1.00",
    };
  }

  render() {
    return (
      <div
        style={{
          pointerEvents: "auto",
          position: "absolute",
          bottom: "1em",
          right: "1em",
          background: "white",
          padding: "2em",
          borderRadius: "1em",
        }}
      >
        {
          this.state.mode === "DEPOSIT" ?
            <DepositModal /> :
            this.state.mode === "WITHDRAW" ?
            <WithdrawModal />:
            <div>Hello World! {this.state.mode}</div>
        }
      </div>
    );
  }

  showDepositUI() {
    this.setState({ mode: "DEPOSIT" });
  }

  showWithdrawUI() {
    this.setState({ mode: "WITHDRAW" });
  }

  showTransferUI(recipient: string, amount: string) {
    this.setState({
      mode: "TRANSFER",
      transferRecipient: recipient,
      transferAmount: amount,
    });
  }
}

export default Modal;
