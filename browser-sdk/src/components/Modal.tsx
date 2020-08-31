import React from "react";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import Login from "./Login";
import ConnextSDK from "..";

interface IProps {
  sdk: ConnextSDK;
}

interface IState {
  mode: string;
  loginStage: string;
  depositStage: string;
  withdrawStage: string;
}

class Modal extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      mode: "",
      loginStage: "",
      depositStage: "",
      withdrawStage: "",
    };
  }

  renderView() {
    switch (this.state.mode) {
      case "LOGIN":
        return <Login sdk={this.props.sdk} stage={this.state.loginStage} />;
      case "DEPOSIT":
        return <Deposit sdk={this.props.sdk} stage={this.state.depositStage} />;
      case "WITHDRAW":
        return (
          <Withdraw sdk={this.props.sdk} stage={this.state.withdrawStage} />
        );
      default:
        return null;
    }
  }

  render() {
    return <div id="connext-overlay-modal">{this.renderView()}</div>;
  }
  async displayLogin() {
    this.setState({ mode: "LOGIN" });
  }
  async setLoginStage(stage: string) {
    this.setState({ loginStage: stage });
  }
  async displayDeposit() {
    this.setState({ mode: "DEPOSIT" });
  }
  async setDepositStage(stage: string) {
    this.setState({ depositStage: stage });
  }
  async displayWithdraw() {
    this.setState({ mode: "WITHDRAW" });
  }
  async setWithdrawStage(stage: string) {
    this.setState({ withdrawStage: stage });
  }
}

export default Modal;
