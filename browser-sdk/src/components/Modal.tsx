import React from "react";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import Login from "./Login";
import ConnextSDK from "..";

interface IProps {
  sdkInstance: ConnextSDK;
}

interface IState {
  mode: string;
  onLoginComplete: (value?: any) => any;
  onDepositComplete: (value?: any) => any;
  onWithdrawComplete: (value?: any) => any;
}

class Modal extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      mode: "",
      onLoginComplete: () => {},
      onDepositComplete: () => {},
      onWithdrawComplete: () => {},
    };
  }

  renderView() {
    switch (this.state.mode) {
      case "LOGIN":
        return (
          <Login
            sdkInstance={this.props.sdkInstance}
            onLoginComplete={this.state.onLoginComplete}
          />
        );
      case "DEPOSIT":
        return (
          <Deposit
            sdkInstance={this.props.sdkInstance}
            onDepositComplete={this.state.onDepositComplete}
          />
        );
      case "WITHDRAW":
        return (
          <Withdraw
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
      });
    });
  }

  async startDeposit() {
    return new Promise<boolean>((resolve) => {
      this.setState({
        mode: "DEPOSIT",
        onDepositComplete: resolve,
      });
    });
  }

  async startWithdraw() {
    return new Promise<boolean>((resolve) => {
      this.setState({
        mode: "WITHDRAW",
        onWithdrawComplete: resolve,
      });
    });
  }
}

export default Modal;
