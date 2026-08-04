import { act, renderHook } from '@testing-library/react';

import { ITest } from 'frontend/components/cro/Experiment/models';

import useExperiment from './useExperiment';

const TEST_ID = 'test-123';
const mockTest: ITest = { testId: TEST_ID, testVariant: 'B' } as ITest;

Object.defineProperties(window, {
    dataLayer: { value: [] as any, writable: true },
});

describe('useExperiment', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        dataLayer = [];
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should start as undefined - useState does not read from dataLayer on initial render', () => {
        const { result } = renderHook(() => useExperiment(TEST_ID));

        expect(result.current).toBeUndefined();
    });

    it('should resolve the variant immediately when dataLayer is already populated', () => {
        dataLayer = [mockTest];

        const { result } = renderHook(() => useExperiment(TEST_ID));

        expect(result.current).toBe(mockTest);
    });

    it('should keep polling until the variant appears', () => {
        dataLayer = [];

        const { result } = renderHook(() => useExperiment(TEST_ID));

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(result.current).toBeUndefined();

        dataLayer = [mockTest];

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current).toBe(mockTest);
    });

    it('should stop polling and return undefined after maxLoad (8) attempts', () => {
        dataLayer = [];

        const { result } = renderHook(() => useExperiment(TEST_ID));

        act(() => {
            jest.advanceTimersByTime(9000);
        });

        expect(result.current).toBeUndefined();

        dataLayer = [mockTest];

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(result.current).toBeUndefined();
    });

    it('should clean up the interval on unmount', () => {
        const clearSpy = jest.spyOn(global, 'clearInterval');

        const { unmount } = renderHook(() => useExperiment(TEST_ID));

        unmount();

        expect(clearSpy).toHaveBeenCalled();

        clearSpy.mockRestore();
    });
});
