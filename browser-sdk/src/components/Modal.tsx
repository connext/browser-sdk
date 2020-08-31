import React from "react";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import Login from "./Login";
import ConnextSDK from "..";

interface IProps {
  sdkInstance: ConnextSDK;
}

interface IViewProps {
  stage: string;
  onSubmit: (value?: any) => void;
}

interface IState {
  mode: string;
  loginProps: IViewProps;
  depositProps: {
    stage: string;
    depositAddress: string;
  };
  withdrawProps: IViewProps;
}

class Modal extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      mode: "",
      loginProps: {
        stage: "",
        onSubmit: () => {},
      },
      depositProps: {
        stage: "",
        depositAddress: "",
      },
      withdrawProps: {
        stage: "",
        onSubmit: () => {},
      },
    };
  }

  renderView() {
    switch (this.state.mode) {
      case "LOGIN":
        return (
          <Login
            sdkInstance={this.props.sdkInstance}
            stage={this.state.loginProps.stage}
            onSubmit={this.state.loginProps.onSubmit}
          />
        );
      case "DEPOSIT":
        return (
          <Deposit
            sdkInstance={this.props.sdkInstance}
            stage={this.state.depositProps.stage}
            depositAddress={this.state.depositProps.depositAddress}
          />
        );
      case "WITHDRAW":
        return (
          <Withdraw
            sdkInstance={this.props.sdkInstance}
            stage={this.state.withdrawProps.stage}
            onSubmit={this.state.withdrawProps.onSubmit}
          />
        );
      default:
        return null;
    }
  }

  render() {
    return <div id="connext-overlay-modal">{this.renderView()}</div>;
  }
  async displayLogin(onSubmit: (value?: any) => void) {
    this.setState({
      mode: "LOGIN",
      loginProps: { ...this.state.loginProps, onSubmit },
    });
  }
  async setLoginStage(stage: string) {
    this.setState({
      mode: "LOGIN",
      loginProps: { ...this.state.loginProps, stage },
    });
  }
  async displayDeposit(depositAddress) {
    this.setState({
      mode: "DEPOSIT",
      depositProps: { ...this.state.depositProps, depositAddress },
    });
  }
  async setDepositStage(stage: string) {
    this.setState({
      mode: "DEPOSIT",
      depositProps: { ...this.state.depositProps, stage },
    });
  }
  async displayWithdraw(onSubmit: (value?: any) => void) {
    this.setState({
      mode: "WITHDRAW",
      withdrawProps: { ...this.state.withdrawProps, onSubmit },
    });
  }
  async setWithdrawStage(stage: string) {
    this.setState({
      mode: "WITHDRAW",
      withdrawProps: { ...this.state.withdrawProps, stage },
    });
  }
}

export default Modal;
