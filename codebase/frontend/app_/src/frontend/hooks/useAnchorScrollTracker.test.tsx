import { act, renderHook, waitFor } from '@testing-library/react';

import { TUseAnchorScrollTrackerProps, useAnchorScrollTracker } from './useAnchorScrollTracker';

const observe = jest.fn();
const unobserve = jest.fn();
const disconnect = jest.fn();
const takeRecords = jest.fn();

let intersectionCallback;
const mockIntersectionObserver = jest.fn((callback, options) => {
    intersectionCallback = callback;

    return {
        observe,
        unobserve,
        disconnect,
        takeRecords,
        ...options,
    };
});

window.IntersectionObserver = mockIntersectionObserver;

const mutationObserve = jest.fn();
const mutationDisconnect = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockMutationObserver = jest.fn(_callback => ({
    observe: mutationObserve,
    disconnect: mutationDisconnect,
    takeRecords,
}));

window.MutationObserver = mockMutationObserver;

let mockProps: TUseAnchorScrollTrackerProps;

const createProps = (): TUseAnchorScrollTrackerProps => ({
    items: [{ id: 'section1' }, { id: 'section2' }],
    threshold: 1,
    baseOffset: 20,
    keepTabSelection: true,
});

describe('useAnchorScrollTracker', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize correctly', () => {
        mockProps.rootMargin = '-20% 0% -80% 0%';
        renderHook(() => useAnchorScrollTracker(mockProps));

        expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
            rootMargin: '-20% 0% -80% 0%',
            threshold: 1,
        });
        expect(mockMutationObserver).toHaveBeenCalled();
    });

    it('should use baseOffset if rootMargin is not provided', () => {
        mockProps.rootMargin = undefined;

        renderHook(() => useAnchorScrollTracker(mockProps));

        expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
            rootMargin: '-20px 0px 0px',
            threshold: 1,
        });
    });

    it('should NOT create IntersectionObserver and MutationObserver when no items', () => {
        mockProps.items = [];

        renderHook(() => useAnchorScrollTracker(mockProps));

        expect(mockIntersectionObserver).not.toHaveBeenCalled();
        expect(mockMutationObserver).not.toHaveBeenCalled();
    });

    it('should work correctly with keepTabSelection = false', async () => {
        mockProps.keepTabSelection = false;

        const { result } = renderHook(() => useAnchorScrollTracker(mockProps));
        expect(result.current).toEqual([{ id: 'section1' }, { id: 'section2' }]);

        intersectionCallback([{ target: { id: 'section1' }, isIntersecting: true }]);

        await waitFor(() => {
            expect(result.current).toEqual([{ id: 'section1', isActive: true }, { id: 'section2' }]);
        });

        intersectionCallback([{ target: { id: 'section2' }, isIntersecting: true }]);

        await waitFor(() => {
            expect(result.current).toEqual([
                { id: 'section1', isActive: true },
                { id: 'section2', isActive: true },
            ]);
        });
    });

    it('should work correctly with keepTabSelection', async () => {
        mockProps.keepTabSelection = true;

        const { result } = renderHook(() => useAnchorScrollTracker(mockProps));
        expect(result.current).toEqual([{ id: 'section1' }, { id: 'section2' }]);

        intersectionCallback([{ target: { id: 'section1' }, isIntersecting: true }]);

        await waitFor(() => {
            expect(result.current).toEqual([
                { id: 'section1', isActive: true },
                { id: 'section2', isActive: false },
            ]);
        });

        intersectionCallback([{ target: { id: 'section2' }, isIntersecting: true }]);

        await waitFor(() => {
            expect(result.current).toEqual([
                { id: 'section1', isActive: false },
                { id: 'section2', isActive: true },
            ]);
        });

        intersectionCallback([{ target: { id: 'section2' }, isIntersecting: false }]);

        await waitFor(() => {
            expect(result.current).toEqual([
                { id: 'section1', isActive: false },
                { id: 'section2', isActive: true },
            ]);
        });

        intersectionCallback([{ target: { id: 'section0' }, isIntersecting: true }]);

        await waitFor(() => {
            expect(result.current).toEqual([
                { id: 'section1', isActive: false },
                { id: 'section2', isActive: true },
            ]);
        });
    });

    it('should not use MutationObserver when all items rendered', () => {
        const items = [{ id: 'section1' }, { id: 'section2' }];

        jest.spyOn(document, 'getElementById').mockImplementation(() => {
            const mockElement = document.createElement('div');

            return mockElement;
        });

        const { unmount } = renderHook(() => useAnchorScrollTracker({ items }));

        expect(mockMutationObserver).not.toHaveBeenCalled();

        expect(unobserve).toHaveBeenCalledTimes(items.length);
        unobserve.mockClear();

        unmount();

        expect(disconnect).toHaveBeenCalled();
        expect(mutationDisconnect).not.toHaveBeenCalled();

        expect(unobserve).toHaveBeenCalledTimes(items.length);
    });

    it('should cleanup on mount & unmount', () => {
        const items = [{ id: 'section1' }, { id: 'section2' }];

        jest.spyOn(document, 'getElementById')
            .mockImplementationOnce(() => null)
            .mockImplementation(() => {
                const mockElement = document.createElement('div');

                return mockElement;
            });

        const { unmount } = renderHook(() => useAnchorScrollTracker({ items }));

        expect(mockMutationObserver).toHaveBeenCalled();
        expect(unobserve).toHaveBeenCalledTimes(items.length - 1);
        unobserve.mockClear();

        act(() => {
            mockMutationObserver.mock.calls[0][0]();
        });

        expect(unobserve).toHaveBeenCalledTimes(items.length);
        unobserve.mockClear();

        expect(mutationDisconnect).toHaveBeenCalled();

        unmount();

        expect(disconnect).toHaveBeenCalled();
        expect(mutationDisconnect).toHaveBeenCalled();

        expect(unobserve).toHaveBeenCalledTimes(items.length);
    });
});
