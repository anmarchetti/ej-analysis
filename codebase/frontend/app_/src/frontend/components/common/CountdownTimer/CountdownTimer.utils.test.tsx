import { waitFor } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';

import useCountdown from './CountdownTimer.utils';

jest.useFakeTimers().setSystemTime(new Date('01/01/2024'));

describe('useCountdown', () => {
    afterAll(() => {
        jest.useRealTimers();
    });

    it('should return data when date is valid', () => {
        const { result } = renderHook(() => useCountdown('02/01/2024'));

        expect(result.current).toStrictEqual({ days: 31, hours: 0, minutes: 0, seconds: 0 });
    });

    it('should return null when date is invalid', () => {
        const { result } = renderHook(() => useCountdown('invalid date'));

        expect(result.current).toBe(null);
    });

    it('should return null when deadline is expired', async () => {
        const clearInterval = jest.spyOn(global, 'clearInterval');

        const { result } = renderHook(() => useCountdown('01/01/2023'));

        jest.advanceTimersByTime(1000);

        await waitFor(() => expect(clearInterval).toHaveBeenCalledTimes(1));

        expect(result.current).toBe(null);
    });

    it('should call clearInterval on unmount', async () => {
        const clearInterval = jest.spyOn(global, 'clearInterval');

        const { unmount } = renderHook(() => useCountdown('02/01/2024'));

        unmount();

        await waitFor(() => expect(clearInterval).toHaveBeenCalledTimes(1));
    });
});
