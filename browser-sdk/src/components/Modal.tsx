import React from "react";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";
import LoginModal from "./LoginModal";
import { Magic } from "magic-sdk";

interface IProp {
  magic: Magic | undefined;
  connextTarget: EventTarget;
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
      mode: "LOGIN",
      isLoggedIn: false,
      publicAddress: '',
      transferRecipient: null,
      transferAmount: "1.00",
    };
  }

  render() {
    return (
      <div id="connext-overlay-modal">
        {
          this.state.mode === "LOGIN" ?
            <LoginModal
              isLoggedIn={this.state.isLoggedIn}
              connextTarget={this.props.connextTarget}
            /> :
            this.state.mode === "DEPOSIT" ?
            <DepositModal /> :
            this.state.mode === "WITHDRAW" ?
            <WithdrawModal 
              connextTarget={this.props.connextTarget}
            /> :
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
