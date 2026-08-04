import { CancelTokenSource } from 'axios';

import { observableFromPromise, ObservablePromise, PromiseState } from './observerablePromise.utils';

describe('ObservablePromise', () => {
    it('should initialize with a pending state for a new promise', () => {
        const promise = () => new Promise<string>(jest.fn);
        const observablePromise = ObservablePromise.fromPromise(promise);
        expect(observablePromise.state).toBe(PromiseState.Pending);
    });

    it('should update state to fulfilled when promise resolves', async () => {
        const promise = () => Promise.resolve('success');
        const observablePromise = ObservablePromise.fromPromise(promise);

        await observablePromise;

        expect(observablePromise.state).toBe(PromiseState.Fulfilled);
        expect(observablePromise.value).toBe('success');
    });

    it('should update state to rejected when promise rejects', async () => {
        const promise = () => Promise.reject('error');
        const observablePromise = ObservablePromise.fromPromise(promise);

        try {
            await observablePromise;
        } catch (error) {
            expect(error).toBe('error');
        }

        expect(observablePromise.state).toBe(PromiseState.Rejected);
        expect(observablePromise.reason).toBe('error');
    });

    it('should update state and value when a new promise is set', async () => {
        const initialPromise = () => Promise.resolve('initial');
        const observablePromise = ObservablePromise.fromPromise(initialPromise);

        await observablePromise;
        expect(observablePromise.value).toBe('initial');

        const newPromise = () => Promise.resolve('new');
        observablePromise.setPromise(newPromise);

        expect(observablePromise.state).toBe(PromiseState.Pending);

        await observablePromise;
        expect(observablePromise.state).toBe(PromiseState.Fulfilled);
        expect(observablePromise.value).toBe('new');
    });

    it('should cancel the promise and updates state to cancelled', () => {
        const promise = () => new Promise<string>(jest.fn);
        const observablePromise = ObservablePromise.fromPromise(promise);

        observablePromise.cancel();

        expect(observablePromise.state).toBe(PromiseState.Cancelled);
    });

    it('should handle optional cancelToken', async () => {
        const promise = (cancelToken?: CancelTokenSource) =>
            new Promise<string>((resolve, reject) => {
                if (cancelToken) {
                    cancelToken.token.promise.then(() => reject(new Error('Promise cancelled')));
                }

                setTimeout(() => resolve('success'), 100);
            });

        const observablePromise = ObservablePromise.fromPromise(promise);

        await observablePromise;

        expect(observablePromise.state).toBe(PromiseState.Fulfilled);
        expect(observablePromise.value).toBe('success');
    });
});

describe('observableFromPromise', () => {
    it('should wrap  a observableFromPromise function returning a promise into an ObservablePromise', async () => {
        const promiseFunction = () => new Promise<string>(resolve => setTimeout(() => resolve('test'), 100));
        const observablePromise = observableFromPromise(promiseFunction);

        expect(observablePromise.state).toBe(PromiseState.Pending);
        expect(observablePromise.isPending).toBe(true);

        await observablePromise;

        expect(observablePromise.state).toBe(PromiseState.Fulfilled);
        expect(observablePromise.isFulfilled).toBe(true);
        expect(observablePromise.value).toBe('test');
    });

    it('should handle observableFromPromise cancellation', async () => {
        const promiseFunction = (cancelToken: CancelTokenSource) =>
            new Promise<string>((resolve, reject) => {
                cancelToken.token.promise.then(() => reject());
            });
        const observablePromise = observableFromPromise(promiseFunction);

        observablePromise.cancel();

        expect(observablePromise.state).toBe(PromiseState.Cancelled);
    });
});
