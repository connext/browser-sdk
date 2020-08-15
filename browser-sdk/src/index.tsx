import React from 'react';
import ReactDOM from 'react-dom';

interface IConnextTransaction {
    recipientPublicIdentifier: string;
    amount: string;
    timestamp: Date;
}

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
        return <div style={{pointerEvents: 'auto'}}>Hello World! {this.state.mode}</div>;
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

let APP_COMPONENT: App | null = null;

function initializeOverlay() {
    if (APP_COMPONENT !== null) {
        return;
    }
    const overlay = document.createElement("div");
    overlay.id = 'connext-overlay';
    document.body.appendChild(overlay);

    // style the overlay element
    const style = document.createElement('style');
    style.innerHTML = `
        #connext-overlay {
            position: fixed;
            top: 0; bottom: 0; left: 0; right: 0;
            z-index: 999;
            pointer-events: none;
        }
        #connext-overlay * {
            /* reset all CSS styles for elements inside the overlay, as a way to "sandbox" the overlay UI from the parent page without using an iframe */
            all: unset;
        }
    `;

    document.head.appendChild(style);
    APP_COMPONENT = ReactDOM.render(<App />, overlay) as unknown as App;
}

async function login(): Promise<boolean> {
    initializeOverlay();

    // TODO: magic link

    return true;
}

async function publicIdentifier(): Promise<string | null> {
    return null;
}

async function deposit(): Promise<boolean> {
    if (APP_COMPONENT === null) {
        throw new Error('Overlay UI not initialized - make sure to await login() first before calling deposit()!');
    }
    APP_COMPONENT.showDepositUI();
    return false;
}

async function withdraw(): Promise<boolean> {
    if (APP_COMPONENT === null) {
        throw new Error('Overlay UI not initialized - make sure to await login() first before calling withdraw()!');
    }
    APP_COMPONENT.showWithdrawUI();
    return false;
}

async function balance(): Promise<string> {
    return '0.00';
}

async function transfer(recipientPublicIdentifier: string, amount: string): Promise<boolean> {
    if (APP_COMPONENT === null) {
        throw new Error('Overlay UI not initialized - make sure to await login() first before calling withdraw()!');
    }
    APP_COMPONENT.showTransferUI(recipientPublicIdentifier, amount);
    return false;
}

async function getTransactionHistory(): Promise<Array<IConnextTransaction>> {
    return [];
}

export default { login, publicIdentifier, deposit, withdraw, balance, transfer, getTransactionHistory };