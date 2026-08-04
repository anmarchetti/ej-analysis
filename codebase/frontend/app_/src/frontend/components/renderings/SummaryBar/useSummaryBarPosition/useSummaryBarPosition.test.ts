import { act, renderHook } from '@testing-library/react';

import { MARGIN, useSummaryBarPosition } from './useSummaryBarPosition';

describe('useSummaryBarPosition', () => {
    const setViewportHeight = (height: number): void => {
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            writable: true,
            value: height,
        });
    };

    const setScrollY = (scrollY: number): void => {
        Object.defineProperty(window, 'scrollY', {
            configurable: true,
            writable: true,
            value: scrollY,
        });
    };

    beforeEach(() => {
        setViewportHeight(800);
        setScrollY(0);
    });

    it('should return default top offset when container ref is not attached', () => {
        const { result } = renderHook(() => useSummaryBarPosition());

        expect(result.current.topOffset).toBe(MARGIN);
    });

    it('should keep margin offset when bar fits inside viewport', () => {
        const { result } = renderHook(() => useSummaryBarPosition());

        Object.defineProperty(result.current.containerRef, 'current', {
            configurable: true,
            writable: true,
            value: {
                getBoundingClientRect: () => ({ height: 300 }),
            },
        });

        act(() => {
            window.dispatchEvent(new Event('scroll'));
            setScrollY(250);
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.topOffset).toBe(MARGIN);
    });

    it('should set bottom aligned offset when bar is taller than viewport and scrolling down', () => {
        const { result } = renderHook(() => useSummaryBarPosition());

        Object.defineProperty(result.current.containerRef, 'current', {
            configurable: true,
            writable: true,
            value: {
                getBoundingClientRect: () => ({ height: 900 }),
            },
        });

        act(() => {
            setScrollY(120);
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.topOffset).toBe(-115);
    });

    it('should reset to margin when bar is taller than viewport and scrolling up', () => {
        const { result } = renderHook(() => useSummaryBarPosition());

        Object.defineProperty(result.current.containerRef, 'current', {
            configurable: true,
            writable: true,
            value: {
                getBoundingClientRect: () => ({ height: 900 }),
            },
        });

        act(() => {
            setScrollY(180);
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.topOffset).toBe(-115);

        act(() => {
            setScrollY(60);
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.topOffset).toBe(MARGIN);
    });

    it('should update offset on resize event', () => {
        const { result } = renderHook(() => useSummaryBarPosition());

        Object.defineProperty(result.current.containerRef, 'current', {
            configurable: true,
            writable: true,
            value: {
                getBoundingClientRect: () => ({ height: 900 }),
            },
        });

        setViewportHeight(950);
        window.dispatchEvent(new Event('resize'));

        expect(result.current.topOffset).toBe(MARGIN);
    });

    it('should not register window listeners when disabled', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        renderHook(() => useSummaryBarPosition(false));

        expect(addEventListenerSpy).not.toHaveBeenCalled();

        addEventListenerSpy.mockRestore();
    });

    it('should remove window listeners on unmount', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useSummaryBarPosition());

        expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
            passive: true,
        });
        expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), {
            passive: true,
        });

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });
});
