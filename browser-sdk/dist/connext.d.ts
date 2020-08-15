interface IConnextTransaction {
    recipientPublicIdentifier: string;
    amount: string;
    timestamp: Date;
}
declare function login(): Promise<boolean>;
declare function publicIdentifier(): Promise<string | null>;
declare function deposit(): Promise<boolean>;
declare function withdraw(): Promise<boolean>;
declare function balance(): Promise<string>;
declare function transfer(recipientPublicIdentifier: string, amount: string): Promise<boolean>;
declare function getTransactionHistory(): Promise<Array<IConnextTransaction>>;
declare const _default: {
    login: typeof login;
    publicIdentifier: typeof publicIdentifier;
    deposit: typeof deposit;
    withdraw: typeof withdraw;
    balance: typeof balance;
    transfer: typeof transfer;
    getTransactionHistory: typeof getTransactionHistory;
};
export default _default;
