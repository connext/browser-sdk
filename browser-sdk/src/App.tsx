import React from 'react';

interface IState {
    mode: string;
    transferRecipient: string | null;
    transferAmount: string;
}

class App extends React.Component<{}, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            mode: 'LOGIN',
            transferRecipient: null,
            transferAmount: '1.00',
        };
    }

    render() {
        return <div style={{pointerEvents: 'auto', position: 'absolute', bottom: '0', right: '0', maxWidth: '20em', background: 'red'}}>
            Hello World! {this.state.mode}
        </div>;
    }

    showDepositUI() {
        this.setState({mode: 'DEPOSIT'});
    }

    showWithdrawUI() {
        this.setState({mode: 'WITHDRAW'});
    }

    showTransferUI(recipientPublicIdentifier: string, amount: string) {
        this.setState({mode: 'TRANSFER', transferRecipient: recipientPublicIdentifier, transferAmount: amount});
    }
}

export default App;
