import { createDebouncedRequest, isCancelError } from './debouncedRequest.utils';

describe('debouncedRequest.utils', () => {
    describe('createDebouncedRequest', () => {
        it('should execute the request function after the specified delay', async () => {
            jest.useFakeTimers();
            const requestFn = jest.fn().mockResolvedValue('result');
            const debouncedRequest = createDebouncedRequest(requestFn, 500);

            const promise = debouncedRequest('arg1', 'arg2');
            jest.advanceTimersByTime(500);

            await expect(promise).resolves.toBe('result');
            expect(requestFn).toHaveBeenCalledWith(expect.any(AbortSignal), 'arg1', 'arg2');
            jest.useRealTimers();
        });

        it('should cancel the previous request when a new one is triggered', async () => {
            jest.useFakeTimers();
            const requestFn = jest.fn().mockResolvedValue('result');
            const debouncedRequest = createDebouncedRequest(requestFn, 500);

            const promise1 = debouncedRequest('arg1');
            const promise2 = debouncedRequest('arg2');
            jest.advanceTimersByTime(500);

            await expect(promise1).rejects.toThrow('Superseded by newer call');
            await expect(promise2).resolves.toBe('result');
            expect(requestFn).toHaveBeenCalledTimes(1);
            expect(requestFn).toHaveBeenCalledWith(expect.any(AbortSignal), 'arg2');
            jest.useRealTimers();
        });

        it('should NOT execute the request function if canceled before the delay', () => {
            jest.useFakeTimers();
            const requestFn = jest.fn();
            const debouncedRequest = createDebouncedRequest(requestFn, 500);

            debouncedRequest('arg1');
            debouncedRequest.cancel();
            jest.advanceTimersByTime(500);

            expect(requestFn).not.toHaveBeenCalled();
            jest.useRealTimers();
        });

        it('should handle errors from the request function', async () => {
            const requestFn = jest.fn().mockRejectedValue(new Error('Request failed'));
            const debouncedRequest = createDebouncedRequest(requestFn, 300);

            await expect(debouncedRequest('arg1')).rejects.toThrow('Request failed');
        });

        it('should ignore cancel errors from the request function', async () => {
            const requestFn = jest.fn().mockRejectedValue({ name: 'CanceledError' });
            const debouncedRequest = createDebouncedRequest(requestFn, 300);

            await expect(debouncedRequest('arg1')).rejects.toStrictEqual({ name: 'CanceledError' });
        });
    });

    describe('isCancelError', () => {
        it('should return true for error with name CanceledError', () => {
            const error = new Error();
            error.name = 'CanceledError';

            expect(isCancelError(error)).toBe(true);
        });

        it('should return true for error with code ERR_CANCELED', () => {
            const error = new Error();

            (error as { code?: string }).code = 'ERR_CANCELED';

            expect(isCancelError(error)).toBe(true);
        });

        it('should return false for generic error', () => {
            const error = new Error('Some other error');

            expect(isCancelError(error)).toBe(false);
        });

        it('should return false for non-error object', () => {
            const error = { message: 'Not an error' };

            expect(isCancelError(error)).toBe(false);
        });

        it('should return false for null or undefined', () => {
            expect(isCancelError(null)).toBe(false);
            expect(isCancelError(undefined)).toBe(false);
        });
    });
});
