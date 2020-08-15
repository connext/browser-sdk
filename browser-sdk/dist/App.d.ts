import React from 'react';
interface IState {
    mode: string;
    transferRecipient: string | null;
    transferAmount: string;
}
declare class App extends React.Component<{}, IState> {
    constructor(props: any);
    render(): JSX.Element;
    showDepositUI(): void;
    showWithdrawUI(): void;
    showTransferUI(recipientPublicIdentifier: string, amount: string): void;
}
export default App;
