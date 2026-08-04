import React from 'react';
import { waitFor } from '@testing-library/dom';
import { act, renderHook } from '@testing-library/react';

import useSwipe from './useSwipe';

jest.spyOn(React, 'useRef').mockReturnValue({
    current: { clientHeight: 299 },
});

global.innerHeight = 500;

describe('useSwipe', () => {
    const onTransitionEnd = jest.fn();

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useSwipe({ isOn: false, onTransitionEnd }));

        expect(result.current).toEqual({});
    });

    it('should set y to 0 when isOn is true', async () => {
        const { result } = renderHook(() => useSwipe({ isOn: true, onTransitionEnd }));

        await waitFor(() => expect(result.current.y).toBe(0));
    });

    it('should handle swiping', () => {
        const { result } = renderHook(() => useSwipe({ isOn: true, onTransitionEnd }));

        act(() => {
            result.current.handlers?.onTouchStart?.({ targetTouches: [{ clientY: 300 }] });
        });

        expect(result.current.swiping).toBe(false);
        expect(result.current.y).toBe(0);

        act(() => {
            result.current.handlers?.onTouchMove?.({ targetTouches: [{ clientY: 400 }] });
        });

        expect(result.current.swiping).toBe(true);
        expect(parseInt(result.current.y + '')).toBe(33);

        act(() => {
            result.current.handlers?.onTouchEnd?.();
        });

        expect(result.current.swiping).toBe(false);
        expect(result.current.y).toBe(0);

        expect(onTransitionEnd).not.toHaveBeenCalled();
    });

    it('should call onTransitionEnd when y is 100', () => {
        const { result } = renderHook(() => useSwipe({ isOn: true, onTransitionEnd }));

        act(() => {
            result.current.handlers?.onTouchStart?.({ targetTouches: [{ clientY: 300 }] });
        });

        act(() => {
            result.current.handlers?.onTouchMove?.({ targetTouches: [{ clientY: 450 }] });
        });

        act(() => {
            result.current.handlers?.onTouchEnd?.();
        });

        expect(result.current.swiping).toBe(false);
        expect(result.current.y).toBe(100);

        act(() => {
            result.current.handlers?.onTransitionEnd?.();
        });

        expect(onTransitionEnd).toHaveBeenCalled();
    });
});
