import {
    IObservablePromise,
    observableFromPromise,
} from 'frontend/utils/observerablePromise/observerablePromise.utils';

export const mockResolvedObservablePromise = <T>(value?: T): IObservablePromise<T | undefined> =>
    observableFromPromise(() => Promise.resolve(value));
export const mockRejectedObservablePromise = (reason: string): IObservablePromise<Error> =>
    observableFromPromise(() => Promise.reject(new Error(reason)));
export const mockPendingObservablePromise = <T>(): IObservablePromise<T> =>
    observableFromPromise(() => new Promise(jest.fn));
