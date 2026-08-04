import { Guid } from 'guid-typescript';

import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import isBackend from './isBackend';

enum TransactionStatus {
    NEW,
    PROCESSING,
    DONE,
}

interface ITransaction {
    i: string;
    q: string;
    s: TransactionStatus;
    t: boolean;
    p?: number; // package price to track changes
}

export const generateTransactionId = () => `${Guid.create()}-${Date.now()}`;
export const generateDeviceId = () => `${Guid.create()}`;

export const startNewTransaction = (query: string, price?: number) => {
    if (isBackend()) {
        return;
    }

    try {
        localStorage.setItem(
            WebStorageKeys.TransactionValueName,
            JSON.stringify({
                i: generateTransactionId(),
                s: TransactionStatus.NEW,
                q: query,
                t: false,
                p: price || 0,
            }),
        );
    } catch (e) {
        localStorage.removeItem(WebStorageKeys.TransactionValueName);
    }
};
export const getTransaction = () => {
    if (isBackend()) {
        return null;
    }

    const value = localStorage?.getItem(WebStorageKeys.TransactionValueName);

    if (value) {
        return JSON.parse(value) as ITransaction;
    }

    return null;
};
export const getTransactionId = (query: string) => {
    let transaction = getTransaction();

    if (!transaction) {
        startNewTransaction(query);
        transaction = getTransaction();
    }

    return transaction ? transaction.i : generateTransactionId();
};

export const isTransactionNew = (transaction: ITransaction) => transaction.s === TransactionStatus.NEW;
export const isTransactionProcessing = (transaction: ITransaction) => transaction.s === TransactionStatus.PROCESSING;
export const isTransactionDone = (transaction: ITransaction) => transaction.s === TransactionStatus.DONE;
export const isTransactionTracked = (transaction: ITransaction) => transaction.t === true;

export const updateTransaction = (transaction: ITransaction) => {
    if (isBackend()) {
        return;
    }

    localStorage.setItem(WebStorageKeys.TransactionValueName, JSON.stringify(transaction));
};

export const setTransactionProcessing = () => {
    const transaction = getTransaction();

    if (transaction) {
        transaction.s = TransactionStatus.PROCESSING;

        updateTransaction(transaction);
    }
};

export const setTransactionDone = () => {
    const transaction = getTransaction();

    if (transaction) {
        transaction.s = TransactionStatus.DONE;

        updateTransaction(transaction);
    }
};

export const setTransactionTracked = () => {
    const transaction = getTransaction();

    if (transaction) {
        transaction.t = true;

        updateTransaction(transaction);
    }
};
