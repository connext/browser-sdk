import React from "react";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";
import LoginModal from "./LoginModal";

interface IProp {
  emit: (event: string, ...args: any[]) => boolean;
}

interface IState {
  mode: string;
  isLoggedIn: boolean;
  publicAddress: string;
  transferRecipient: string | null;
  transferAmount: string;
}

class Modal extends React.Component<IProp, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      mode: "",
      isLoggedIn: false,
      publicAddress: "",
      transferRecipient: null,
      transferAmount: "1.00",
    };
  }

  renderView() {
    switch (this.state.mode) {
      case "LOGIN":
        return (
          <LoginModal
            isLoggedIn={this.state.isLoggedIn}
            emit={this.props.emit}
          />
        );
      case "DEPOSIT":
        return <DepositModal />;
      case "WITHDRAW":
        return <WithdrawModal emit={this.props.emit} />;
      default:
        return null;
    }
  }

  render() {
    return <div id="connext-overlay-modal">{this.renderView()}</div>;
  }

  showLoginUI() {
    this.setState({ mode: "LOGIN" });
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
