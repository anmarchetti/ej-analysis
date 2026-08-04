import { renderHook } from '@testing-library/react';

import { ScreenBreakpoints } from 'code/screenBreakpoints';
import {
    useMediaQuery,
    useMobileViewport,
    useMoreThenTabletViewport,
    useMoreThenXSMobileViewport,
    useXSMobileViewport,
} from 'frontend/hooks/useMediaQuery';

const mockStores = {
    layoutStore: {
        isMobileDeviceDetectedDuringSSR: false,
    },
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useMediaQuery', () => {
    beforeEach(() => {
        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: query === 'test-query-true',
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));
    });

    it('should return true from matchMedia when mock returns true', () => {
        const { result } = renderHook(() => useMediaQuery('test-query-true'));

        expect(result.current).toBe(true);
    });

    it('should return false from matchMedia when mock returns false', () => {
        const { result } = renderHook(() => useMediaQuery('test-query-false'));

        expect(result.current).toBe(false);
    });

    it('should return final state (false) even if default is true', () => {
        const { result } = renderHook(() => useMediaQuery('test-query-false', true));

        expect(result.current).toBe(false);
    });
});

describe('Hooks', () => {
    const mockQuery = jest.fn();

    beforeEach(() => {
        mockStores.layoutStore.isMobileDeviceDetectedDuringSSR = false;
        window.matchMedia = jest.fn().mockImplementation(query => {
            mockQuery(query);

            return {
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            };
        });
    });

    describe('useMobileViewport', () => {
        it('should return false as final value', () => {
            const { result } = renderHook(() => useMobileViewport());

            expect(mockQuery).toHaveBeenCalledWith(`(max-width: ${ScreenBreakpoints.SM - 0.02}px)`);
            expect(result.current).toBe(false);
        });

        it('should return false as final value even when SSR default is true', () => {
            mockStores.layoutStore.isMobileDeviceDetectedDuringSSR = true;

            const { result } = renderHook(() => useMobileViewport());

            expect(result.current).toBe(false);
        });
    });

    describe('useXSMobileViewport', () => {
        it('should return false as final value', () => {
            const { result } = renderHook(() => useXSMobileViewport());

            expect(mockQuery).toHaveBeenCalledWith(`(max-width: ${ScreenBreakpoints.XS}px)`);
            expect(result.current).toBe(false);
        });

        it('should return false as final value even when SSR default is true', () => {
            mockStores.layoutStore.isMobileDeviceDetectedDuringSSR = true;

            const { result } = renderHook(() => useMobileViewport());

            expect(result.current).toBe(false);
        });
    });

    describe('useMoreThenTabletViewport', () => {
        it('should return false when viewport is narrower than tablet', () => {
            const { result } = renderHook(() => useMoreThenTabletViewport());

            expect(mockQuery).toHaveBeenCalledWith(`(min-width: ${ScreenBreakpoints.MD}px)`);
            expect(result.current).toBe(false);
        });

        it('should return true when viewport is wider than tablet', () => {
            window.matchMedia = jest.fn().mockImplementation(query => {
                mockQuery(query);

                return {
                    matches: true,
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                };
            });

            const { result } = renderHook(() => useMoreThenTabletViewport());

            expect(result.current).toBe(true);
        });

        it('should return true even when SSR detects mobile device', () => {
            mockStores.layoutStore.isMobileDeviceDetectedDuringSSR = true;
            window.matchMedia = jest.fn().mockImplementation(query => {
                mockQuery(query);

                return {
                    matches: true,
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                };
            });

            const { result } = renderHook(() => useMoreThenTabletViewport());

            expect(result.current).toBe(true);
        });
    });

    describe('useMoreThenXSMobileViewport', () => {
        it('should return false as final value', () => {
            const { result } = renderHook(() => useMoreThenXSMobileViewport());

            expect(mockQuery).toHaveBeenCalledWith(`(min-width: ${ScreenBreakpoints.XS}px)`);
            expect(result.current).toBe(false);
        });

        it('should return false as final value even when SSR default is true', () => {
            mockStores.layoutStore.isMobileDeviceDetectedDuringSSR = true;

            const { result } = renderHook(() => useMobileViewport());

            expect(result.current).toBe(false);
        });
    });

    describe('useMoreThenTabletViewport', () => {
        it('should return false as final value', () => {
            const { result } = renderHook(() => useMoreThenTabletViewport());

            expect(mockQuery).toHaveBeenCalledWith(`(min-width: ${ScreenBreakpoints.MD}px)`);
            expect(result.current).toBe(false);
        });
    });
});
