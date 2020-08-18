import React from "react";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";
import LoginModal from "./LoginModal";
import { Magic } from "magic-sdk";

interface IProp {
  magic: Magic | undefined;
}

interface IState {
  mode: string;
  isLoggedIn: boolean;
  userPID: string | null;
  userEmail: string | null;
  userPublicAddress: string | null;
  transferRecipient: string | null;
  transferAmount: string;
}

class Modal extends React.Component<IProp, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      mode: "LOGIN",
      isLoggedIn: false,
      userPID: null,
      userEmail: null,
      userPublicAddress: null,
      transferRecipient: null,
      transferAmount: "1.00",
    };
  }

  componentDidMount() {
    this.refreshLogin();
  }

  render() {
    return (
      <div id="connext-overlay-modal">
        {
          this.state.mode === "LOGIN" ?
            <LoginModal 
              magic={this.props.magic}
              isLoggedIn={this.state.isLoggedIn}
              refreshLogin={this.refreshLogin.bind(this)}
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

  async refreshLogin() {
    const isLoggedIn = await this.props.magic?.user.isLoggedIn() ?? false;
    const metadata = await this.props.magic?.user.getMetadata();

    this.setState({
      isLoggedIn: isLoggedIn,
      userPID: metadata?.issuer ?? null,
      userEmail: metadata?.email ?? null,
      userPublicAddress: metadata?.publicAddress ?? null,
    });
    console.log(this.state);
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
