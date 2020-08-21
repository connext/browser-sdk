import React from "react";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";
import LoginModal from "./LoginModal";

interface IProps {
  sdkInstance: any;
}

interface IState {
  mode: string;

  // login fields
  onLoginComplete?: () => any;
  loginKey: boolean;

  // deposit fields
  onDepositComplete?: () => any;
  depositKey: boolean;

  // withdraw fields
  onWithdrawComplete?: () => any;
  withdrawKey: boolean;
}

class Modal extends React.Component<IProps, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      mode: "",
      loginKey: false,
      depositKey: false,
      withdrawKey: false,
    };
  }

  renderView() {
    switch (this.state.mode) {
      case "LOGIN":
        return (
          <LoginModal
            key={this.state.loginKey.toString()}
            sdkInstance={this.props.sdkInstance}
            onLoginComplete={this.state.onLoginComplete}
          />
        );
      case "DEPOSIT":
        return (
          <DepositModal
            key={this.state.depositKey.toString()}
            sdkInstance={this.props.sdkInstance}
            onDepositComplete={this.state.onDepositComplete}
          />
        );
      case "WITHDRAW":
        return (
          <WithdrawModal
            key={this.state.withdrawKey.toString()}
            sdkInstance={this.props.sdkInstance}
            onWithdrawComplete={this.state.onWithdrawComplete}
          />
        );
      default:
        return null;
    }
  }

  render() {
    return <div id="connext-overlay-modal">{this.renderView()}</div>;
  }

  async startLogin() {
    return new Promise<boolean>((resolve) => {
      this.setState({
        mode: "LOGIN",
        onLoginComplete: resolve,
        loginKey: !this.state.loginKey,
      });
    });
  }

  async startDeposit() {
    return new Promise<boolean>((resolve) => {
      this.setState({
        mode: "DEPOSIT",
        onDepositComplete: resolve,
        depositKey: !this.state.depositKey,
      });
    });
  }

  async startWithdraw() {
    return new Promise<boolean>((resolve) => {
      this.setState({
        mode: "WITHDRAW",
        onWithdrawComplete: resolve,
        withdrawKey: !this.state.withdrawKey,
      });
    });
  }
}

export default Modal;
