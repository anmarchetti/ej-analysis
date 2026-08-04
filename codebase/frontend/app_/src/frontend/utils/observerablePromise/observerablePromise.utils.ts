import axios, { CancelTokenSource } from 'axios';
import { makeAutoObservable, runInAction } from 'mobx';

export enum PromiseState {
    Pending = 'Pending',
    Fulfilled = 'Fulfilled',
    Rejected = 'Rejected',
    Cancelled = 'Cancelled',
}

export interface IObservablePromise<T> {
    cancel: () => void;
    catch: <TResult = never>(
        onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ) => Promise<T | TResult>;
    finally: (onfinally?: (() => void) | null) => Promise<T>;
    isCancelled: boolean;
    isFinished: boolean;
    isFulfilled: boolean;
    isPending: boolean;
    isRejected: boolean;
    originalPromise: Promise<T>;
    setPromise: (newPromise: (cancelToken?: CancelTokenSource) => Promise<T>) => void;
    state: PromiseState;
    then: <TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise<TResult1 | TResult2>;
    cancelToken?: CancelTokenSource;
    reason?: any;
    value?: T;
}

/**
 * Class that wraps a native Promise and adds MobX observability.
 * It allows for tracking the state of the promise and its resolution or rejection.
 */
export class ObservablePromise<T> implements IObservablePromise<T> {
    state = PromiseState.Pending;
    value?: T;
    reason?: any;
    originalPromise: Promise<T>;
    private cancelTokenSource?: CancelTokenSource;

    constructor() {
        makeAutoObservable(this);
    }

    static readonly fromPromise = <T>(
        promiseFactory: (cancelToken?: CancelTokenSource) => Promise<T>,
    ): ObservablePromise<T> => {
        const observable = new ObservablePromise<T>();
        observable.cancelTokenSource = axios.CancelToken.source();
        observable.originalPromise = observable.wrapWithCancel(promiseFactory(observable.cancelTokenSource));
        observable.bindPromise(observable.originalPromise);

        return observable;
    };

    get isPending(): boolean {
        return this.state === PromiseState.Pending;
    }

    get isFulfilled(): boolean {
        return this.state === PromiseState.Fulfilled;
    }

    get isRejected(): boolean {
        return this.state === PromiseState.Rejected;
    }

    get isCancelled(): boolean {
        return this.state === PromiseState.Cancelled;
    }

    get isFinished(): boolean {
        return this.isFulfilled || this.isRejected || this.isCancelled;
    }

    then = <TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> => this.originalPromise.then(onfulfilled, onrejected);

    catch = <TResult = never>(
        onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ): Promise<T | TResult> => this.originalPromise.catch(onrejected);

    finally = (onfinally?: (() => void) | null): Promise<T> => this.originalPromise.finally(onfinally);

    setPromise = (newPromise: (cancelToken?: CancelTokenSource) => Promise<T>): void => {
        this.state = PromiseState.Pending;
        this.value = undefined;
        this.reason = undefined;

        if (this.cancelTokenSource) {
            this.cancelTokenSource.cancel('Promise cancelled');
        }

        this.cancelTokenSource = axios.CancelToken.source();
        this.originalPromise = this.wrapWithCancel(newPromise(this.cancelTokenSource));
        this.bindPromise(this.originalPromise);
    };

    cancel = (): void => {
        runInAction(() => {
            this.state = PromiseState.Cancelled;
        });

        this.cancelTokenSource?.cancel();
    };

    private readonly bindPromise = (promise: Promise<T>): void => {
        runInAction(() => {
            this.state = PromiseState.Pending;
        });

        promise.then(
            value =>
                runInAction(() => {
                    this.value = value;
                    this.state = PromiseState.Fulfilled;
                }),
            reason =>
                runInAction(() => {
                    if (this.state !== PromiseState.Cancelled) {
                        this.reason = reason;
                        this.state = PromiseState.Rejected;
                    }
                }),
        );
    };

    private readonly wrapWithCancel = (promise: Promise<T>): Promise<T> =>
        new Promise<T>((resolve, reject) => {
            promise.then(resolve, reject);

            if (this.cancelTokenSource) {
                const onCancel = (e): void => {
                    reject(new Error(e));
                };
                this.cancelTokenSource.token.promise.catch(onCancel);
            }
        });
}

/**
 * Factory function to create an ObservablePromise from a native Promise.
 * @param promise - The promise to be made observable.
 * @returns An ObservablePromise instance.
 */
export const observableFromPromise = <T>(
    promise: (cancelToken: CancelTokenSource) => Promise<T>,
): IObservablePromise<T> => ObservablePromise.fromPromise<T>(promise);
