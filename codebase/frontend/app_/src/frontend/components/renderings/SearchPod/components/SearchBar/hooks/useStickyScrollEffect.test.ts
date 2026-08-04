import { fireEvent } from '@testing-library/dom';
import { act, renderHook } from '@testing-library/react';

import { useStickyScrollEffect } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useStickyScrollEffect';

jest.mock('frontend/utils/debounce', () => ({
    debounce: jest.fn(fn => fn),
}));

let mockUseMobileViewport;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('useStickyScrollEffect', () => {
    let mockSetIsExpanded;
    let mockSearchStickyWrRef;
    let mockSearchStickyBoxRef;
    let mockIsStickyOnMobile;
    let mockIsBodyScrollLocked;
    let mockIsBodyScrollLockedViaBlur;
    let mockIsCollapsedMobileVariant;

    beforeEach(() => {
        mockUseMobileViewport = false;
        mockSetIsExpanded = jest.fn();
        mockIsStickyOnMobile = true;
        mockIsBodyScrollLocked = false;
        mockIsBodyScrollLockedViaBlur = false;
        mockIsCollapsedMobileVariant = true;

        const wrapper = document.createElement('div');
        const box = document.createElement('div');
        document.body.appendChild(wrapper);
        document.body.appendChild(box);

        mockSearchStickyWrRef = { current: wrapper };
        mockSearchStickyBoxRef = { current: box };
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should return isSticky as true when offset is less than STICKY_TRIGGER_OFFSET', async () => {
        mockIsCollapsedMobileVariant = false;
        jest.spyOn(mockSearchStickyWrRef.current, 'getBoundingClientRect').mockReturnValue({
            bottom: -20,
        } as DOMRect);

        const { result } = renderHook(() =>
            useStickyScrollEffect({
                isStickyOnMobile: mockIsStickyOnMobile,
                isBodyScrollLocked: mockIsBodyScrollLocked,
                isBodyScrollLockedViaBlur: mockIsBodyScrollLockedViaBlur,
                isCollapsedMobileVariant: mockIsCollapsedMobileVariant,
                setIsExpanded: mockSetIsExpanded,
                searchStickyWrRef: mockSearchStickyWrRef,
                searchStickyBoxRef: mockSearchStickyBoxRef,
            }),
        );

        act(() => {
            fireEvent.scroll(document);
        });

        expect(result.current).toStrictEqual({ isSticky: true });
        expect(mockSetIsExpanded).toHaveBeenCalledWith(false);
    });

    it('should return isSticky as false when offset is greater than stickyOffset', () => {
        mockIsCollapsedMobileVariant = false;
        jest.spyOn(mockSearchStickyWrRef.current, 'getBoundingClientRect').mockReturnValue({
            bottom: -20,
        } as DOMRect);

        const { result } = renderHook(() =>
            useStickyScrollEffect({
                isStickyOnMobile: mockIsStickyOnMobile,
                isBodyScrollLocked: mockIsBodyScrollLocked,
                isBodyScrollLockedViaBlur: mockIsBodyScrollLockedViaBlur,
                isCollapsedMobileVariant: mockIsCollapsedMobileVariant,
                setIsExpanded: mockSetIsExpanded,
                searchStickyWrRef: mockSearchStickyWrRef,
                searchStickyBoxRef: mockSearchStickyBoxRef,
            }),
        );

        act(() => {
            fireEvent.scroll(document);
        });

        expect(result.current).toStrictEqual({ isSticky: true });
        expect(mockSetIsExpanded).toHaveBeenCalledWith(false);

        jest.spyOn(mockSearchStickyWrRef.current, 'getBoundingClientRect').mockReturnValue({
            bottom: 100,
        } as DOMRect);
        jest.spyOn(mockSearchStickyBoxRef.current, 'getBoundingClientRect').mockReturnValue({
            bottom: 50,
        } as DOMRect);

        act(() => {
            fireEvent.scroll(document);
        });

        expect(result.current).toStrictEqual({ isSticky: false });
        expect(mockSetIsExpanded).toHaveBeenCalledWith(true);
    });

    it('should return isSticky as false when offset is less than stickyOffset & is greater than STICKY_RESET_OFFSET', () => {
        jest.spyOn(mockSearchStickyWrRef.current, 'getBoundingClientRect').mockReturnValue({
            bottom: -20,
        } as DOMRect);

        const { result } = renderHook(() =>
            useStickyScrollEffect({
                isStickyOnMobile: mockIsStickyOnMobile,
                isBodyScrollLocked: mockIsBodyScrollLocked,
                isBodyScrollLockedViaBlur: mockIsBodyScrollLockedViaBlur,
                isCollapsedMobileVariant: mockIsCollapsedMobileVariant,
                setIsExpanded: mockSetIsExpanded,
                searchStickyWrRef: mockSearchStickyWrRef,
                searchStickyBoxRef: mockSearchStickyBoxRef,
            }),
        );

        act(() => {
            fireEvent.scroll(document);
        });

        expect(result.current).toStrictEqual({ isSticky: true });
        expect(mockSetIsExpanded).toHaveBeenCalledWith(false);
        expect(mockSetIsExpanded).toHaveBeenCalledTimes(1);

        jest.spyOn(mockSearchStickyWrRef.current, 'getBoundingClientRect').mockReturnValue({
            bottom: 50,
        } as DOMRect);
        jest.spyOn(mockSearchStickyBoxRef.current, 'getBoundingClientRect').mockReturnValue({
            bottom: 100,
        } as DOMRect);

        act(() => {
            fireEvent.scroll(document);
        });

        expect(result.current).toStrictEqual({ isSticky: false });
        expect(mockSetIsExpanded).toHaveBeenCalledTimes(1);
    });

    it('should not update sticky state when isBodyScrollLocked is true', () => {
        mockIsBodyScrollLocked = true;
        jest.spyOn(mockSearchStickyWrRef.current, 'getBoundingClientRect').mockReturnValue({
            bottom: 10,
        } as DOMRect);

        const { result } = renderHook(() =>
            useStickyScrollEffect({
                isStickyOnMobile: mockIsStickyOnMobile,
                isBodyScrollLocked: mockIsBodyScrollLocked,
                isBodyScrollLockedViaBlur: mockIsBodyScrollLockedViaBlur,
                isCollapsedMobileVariant: mockIsCollapsedMobileVariant,
                setIsExpanded: mockSetIsExpanded,
                searchStickyWrRef: mockSearchStickyWrRef,
                searchStickyBoxRef: mockSearchStickyBoxRef,
            }),
        );

        fireEvent.scroll(document);

        expect(result.current.isSticky).toBe(false);
        expect(mockSetIsExpanded).not.toHaveBeenCalled();
    });

    it('should not update sticky state when searchStickyWrRef is not defined', () => {
        mockSearchStickyWrRef = { current: undefined };

        const { result } = renderHook(() =>
            useStickyScrollEffect({
                isStickyOnMobile: mockIsStickyOnMobile,
                isBodyScrollLocked: mockIsBodyScrollLocked,
                isBodyScrollLockedViaBlur: mockIsBodyScrollLockedViaBlur,
                isCollapsedMobileVariant: mockIsCollapsedMobileVariant,
                setIsExpanded: mockSetIsExpanded,
                searchStickyWrRef: mockSearchStickyWrRef,
                searchStickyBoxRef: mockSearchStickyBoxRef,
            }),
        );

        fireEvent.scroll(document);

        expect(result.current.isSticky).toBe(false);
        expect(mockSetIsExpanded).not.toHaveBeenCalled();
    });

    it('should not update sticky state when isStickyOnMobile is false on mobile', () => {
        mockIsStickyOnMobile = false;
        mockUseMobileViewport = true;

        const { result } = renderHook(() =>
            useStickyScrollEffect({
                isStickyOnMobile: mockIsStickyOnMobile,
                isBodyScrollLocked: mockIsBodyScrollLocked,
                isBodyScrollLockedViaBlur: mockIsBodyScrollLockedViaBlur,
                isCollapsedMobileVariant: mockIsCollapsedMobileVariant,
                setIsExpanded: mockSetIsExpanded,
                searchStickyWrRef: mockSearchStickyWrRef,
                searchStickyBoxRef: mockSearchStickyBoxRef,
            }),
        );

        fireEvent.scroll(document);

        expect(result.current.isSticky).toBe(false);
        expect(mockSetIsExpanded).not.toHaveBeenCalled();
    });

    it('should clean up listener on unmount', () => {
        const addSpy = jest.spyOn(document, 'addEventListener');
        const removeSpy = jest.spyOn(document, 'removeEventListener');

        const { unmount } = renderHook(() =>
            useStickyScrollEffect({
                isStickyOnMobile: mockIsStickyOnMobile,
                isBodyScrollLocked: mockIsBodyScrollLocked,
                isBodyScrollLockedViaBlur: mockIsBodyScrollLockedViaBlur,
                isCollapsedMobileVariant: mockIsCollapsedMobileVariant,
                setIsExpanded: mockSetIsExpanded,
                searchStickyWrRef: mockSearchStickyWrRef,
                searchStickyBoxRef: mockSearchStickyBoxRef,
            }),
        );

        expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
});
