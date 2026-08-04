import { logger } from 'frontend/services/logging';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { callOperationWithTimeout, createTimeoutController } from './timeoutController.utils';

jest.mock('frontend/services/logging', () => ({
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

jest.useFakeTimers();

describe('createTimeoutController', () => {
    beforeEach(() => {
        jest.clearAllTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
    });

    it('should create an AbortController instance', () => {
        const controller = createTimeoutController(1000);

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal).toBeInstanceOf(AbortSignal);
    });

    it('should NOT be aborted initially', () => {
        const controller = createTimeoutController(1000);

        expect(controller.signal.aborted).toBe(false);
    });

    it('should abort the controller after the specified timeout', () => {
        const controller = createTimeoutController(1000);

        expect(controller.signal.aborted).toBe(false);

        jest.advanceTimersByTime(1000);

        expect(controller.signal.aborted).toBe(true);
    });

    it('should NOT abort before the timeout', () => {
        const controller = createTimeoutController(1000);

        jest.advanceTimersByTime(999);

        expect(controller.signal.aborted).toBe(false);
    });

    it('should work with different timeout values', () => {
        const shortController = createTimeoutController(500);
        const longController = createTimeoutController(2000);

        jest.advanceTimersByTime(500);

        expect(shortController.signal.aborted).toBe(true);
        expect(longController.signal.aborted).toBe(false);

        jest.advanceTimersByTime(1500);

        expect(longController.signal.aborted).toBe(true);
    });

    it('should handle zero timeout', () => {
        const controller = createTimeoutController(0);

        jest.advanceTimersByTime(0);

        expect(controller.signal.aborted).toBe(true);
    });

    it('should trigger abort event listener when timeout occurs', () => {
        const controller = createTimeoutController(1000);
        const abortListener = jest.fn();

        controller.signal.addEventListener('abort', abortListener);

        jest.advanceTimersByTime(1000);

        expect(abortListener).toHaveBeenCalledTimes(1);
        expect(controller.signal.aborted).toBe(true);
    });

    it('should NOT trigger abort when manually aborted before timeout', () => {
        const controller = createTimeoutController(1000);
        const abortListener = jest.fn();

        controller.signal.addEventListener('abort', abortListener);
        controller.abort();

        expect(controller.signal.aborted).toBe(true);
        expect(abortListener).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1100);

        expect(abortListener).toHaveBeenCalledTimes(1);
    });

    it('should work with multiple controllers independently', () => {
        const controller1 = createTimeoutController(500);
        const controller2 = createTimeoutController(1000);
        const controller3 = createTimeoutController(1500);

        jest.advanceTimersByTime(500);
        expect(controller1.signal.aborted).toBe(true);
        expect(controller2.signal.aborted).toBe(false);
        expect(controller3.signal.aborted).toBe(false);

        jest.advanceTimersByTime(500);
        expect(controller2.signal.aborted).toBe(true);
        expect(controller3.signal.aborted).toBe(false);

        jest.advanceTimersByTime(500);
        expect(controller3.signal.aborted).toBe(true);
    });

    it('should handle negative timeout values', () => {
        const controller = createTimeoutController(-100);

        jest.advanceTimersByTime(0);

        expect(controller.signal.aborted).toBe(true);
    });

    it('should create unique controllers each time', () => {
        const controller1 = createTimeoutController(1000);
        const controller2 = createTimeoutController(1000);

        expect(controller1).not.toBe(controller2);
        expect(controller1.signal).not.toBe(controller2.signal);
    });
});

describe('callOperationWithTimeout', () => {
    const mockLogger = jest.mocked(logger);

    beforeEach(() => {
        jest.clearAllTimers();
        mockLogger.warn.mockClear();
        mockLogger.error.mockClear();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should return result when operation completes before timeout', async () => {
        const mockOperation = jest.fn().mockResolvedValue({ status: 'success' });
        const result = await callOperationWithTimeout(mockOperation, 350, EventTypes.View);

        expect(result).toEqual({ status: 'success' });
        expect(mockOperation).toHaveBeenCalledWith(expect.any(AbortSignal));
        expect(mockLogger.warn).not.toHaveBeenCalled();
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle AbortError from operation and return null', async () => {
        const mockOperation = jest.fn().mockRejectedValue({ name: 'AbortError' });
        const result = await callOperationWithTimeout(
            mockOperation,
            350,
            EventTypes.FlightChangePriceGraph,
            'bid_987654',
            'friendly_12345',
        );

        expect(result).toBeNull();
        expect(mockLogger.warn).toHaveBeenCalledWith(
            'Sitecore Personalize API call timed out for event: flight_change_price_graph with timeout: 350ms and friendlyId: friendly_12345 and browserId: bid_987654',
        );
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should pass AbortSignal to operation', async () => {
        const mockOperation = jest.fn().mockResolvedValue('success');

        await callOperationWithTimeout(mockOperation, 350, EventTypes.PromoClick);

        expect(mockOperation).toHaveBeenCalledWith(expect.any(AbortSignal));

        const passedSignal = mockOperation.mock.calls[0][0];
        expect(passedSignal).toBeInstanceOf(AbortSignal);
        expect(passedSignal.aborted).toBe(false);
    });

    it('should handle operation that throws synchronous error', async () => {
        const syncError = new Error('Synchronous error');
        const mockOperation = jest.fn().mockImplementation(() => {
            throw syncError;
        });

        await expect(callOperationWithTimeout(mockOperation, 350, EventTypes.SearchEdit)).rejects.toThrow(
            'Synchronous error',
        );

        expect(mockLogger.error).toHaveBeenCalledWith(syncError);
        expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should handle operation returning undefined', async () => {
        const mockOperation = jest.fn().mockResolvedValue(undefined);
        const result = await callOperationWithTimeout(mockOperation, 350, EventTypes.UnsuccessfulLogin);

        expect(result).toBeUndefined();
        expect(mockLogger.warn).not.toHaveBeenCalled();
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should work with complex return types', async () => {
        const complexResult = {
            data: { users: [{ id: 1, name: 'John' }] },
            meta: { total: 1, page: 1 },
            status: 'success',
        };
        const mockOperation = jest.fn().mockResolvedValue(complexResult);

        const result = await callOperationWithTimeout(mockOperation, 350, EventTypes.Ecommerce);

        expect(result).toEqual(complexResult);
    });
});
