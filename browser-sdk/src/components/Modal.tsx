import React from "react";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";
import LoginModal from "./LoginModal";
import { Magic } from "magic-sdk";

interface IProp {
  magic: Magic | undefined;
  isLoggedIn: boolean;
  setIsLoggedIn: CallableFunction;
  userIssuer: string | null;
  setUserIssuer: CallableFunction;
  userEmail: string | null;
  setUserEmail: CallableFunction;
  userPublicAddress: string | null;
  setUserPublicAddress: CallableFunction;
}

interface IState {
  mode: string;
  transferRecipient: string | null;
  transferAmount: string;
}

class Modal extends React.Component<IProp, IState> {
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
      <div id="connext-overlay-modal">
        {
          this.state.mode === "LOGIN" ?
            <LoginModal 
              magic={this.props.magic}
              isLoggedIn={this.props.isLoggedIn}
              setIsLoggedIn={this.props.setIsLoggedIn}
            /> :
            this.state.mode === "DEPOSIT" ?
            <DepositModal /> :
            this.state.mode === "WITHDRAW" ?
            <WithdrawModal /> :
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
