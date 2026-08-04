import axios from 'axios';
import debounce from 'lodash/debounce';

type TRequestFn<TArgs extends unknown[], TResult> = (signal: AbortSignal, ...args: TArgs) => Promise<TResult>;

interface IDebouncedRequest<TArgs extends unknown[], TResult> {
    (...args: TArgs): Promise<TResult>;
    cancel: () => void;
}

const isCancelError = (error: unknown): boolean => {
    if (axios.isCancel(error)) return true;

    if (error instanceof Error) {
        return error.name === 'CanceledError' || (error as { code?: string }).code === 'ERR_CANCELED';
    }

    return false;
};

const createDebouncedRequest = <TArgs extends unknown[], TResult>(
    requestFn: TRequestFn<TArgs, TResult>,
    delay = 300,
): IDebouncedRequest<TArgs, TResult> => {
    let abortController: AbortController | null = null;
    let rejectPrevious: ((reason?: unknown) => void) | null = null;

    const execute = (...args: TArgs): Promise<TResult> => {
        if (abortController) {
            abortController.abort();
        }

        abortController = new AbortController();

        return requestFn(abortController.signal, ...args);
    };

    const trigger = debounce((args: TArgs, resolve: (value: TResult) => void, reject: (reason?: unknown) => void) => {
        rejectPrevious = null;

        execute(...args)
            .then(resolve)
            .catch((error: unknown) => {
                if (isCancelError(error)) return;

                reject(error);
            });
    }, delay);

    const debouncedRequest = ((...args: TArgs): Promise<TResult> =>
        new Promise<TResult>((resolve, reject) => {
            if (rejectPrevious) {
                rejectPrevious(new Error('Superseded by newer call'));
            }

            rejectPrevious = reject;

            trigger(args, resolve, reject);
        })) as IDebouncedRequest<TArgs, TResult>;

    debouncedRequest.cancel = (): void => {
        trigger.cancel();
        abortController?.abort();
    };

    return debouncedRequest;
};

export { createDebouncedRequest, isCancelError };
export type { TRequestFn, IDebouncedRequest };
