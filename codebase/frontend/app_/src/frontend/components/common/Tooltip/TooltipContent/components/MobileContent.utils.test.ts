import React from 'react';
import { fireEvent, renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as mediaQueryUtils from 'frontend/hooks/useMediaQuery';
import * as swipeUtils from 'frontend/hooks/useSwipe/useSwipe';

import useMobileContent, { ITabletContent } from './MobileContent.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useRef: jest.fn(),
}));

let mockProps;
let mockStores;

describe('useMobileContent', () => {
    const setIsAnimationLaunched = jest.fn();
    const setOpen = jest.fn();
    const focus = jest.fn();

    jest.spyOn(document, 'activeElement', 'get').mockReturnValue(document.createElement('button'));
    const useXSMobileViewport = jest.spyOn(mediaQueryUtils, 'useXSMobileViewport');
    const useSwipe = jest.spyOn(swipeUtils, 'default');

    const mockTarget = document.createElement('div');
    document.getElementById = jest.fn(() => mockTarget);

    beforeEach(() => {
        mockProps = {
            isAnimationLaunched: false,
            setOpen,
            setIsAnimationLaunched,
            refs: {
                reference: {
                    current: { focus },
                },
                floating: {
                    current: { focus },
                },
            },
        };
        mockStores = createMockStores();
    });

    describe('mount/unmount', () => {
        const overlay = document.createElement('div');
        jest.mocked(React.useRef).mockReturnValue({ current: overlay });

        it('should handle mount logic', () => {
            document.documentElement.style.setProperty = jest.fn();

            const windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
            const overlayAddEventListenerSpy = jest.spyOn(overlay, 'addEventListener');

            renderHook(() => useMobileContent(mockProps));

            expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--inner-height', '768px');
            expect(overlayAddEventListenerSpy).toHaveBeenNthCalledWith(1, 'click', expect.any(Function), {
                passive: true,
            });
            expect(overlayAddEventListenerSpy).toHaveBeenNthCalledWith(2, 'keydown', expect.any(Function), {
                passive: true,
            });
            expect(windowAddEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), {
                passive: true,
            });
            expect(mockProps.refs.floating.current.focus).toHaveBeenCalled();
        });

        it('should call setIsAnimationLaunched on click', async () => {
            renderHook(() => useMobileContent(mockProps));

            fireEvent.click(overlay);

            expect(setIsAnimationLaunched).toHaveBeenCalledWith(false);
        });

        it('should call setIsAnimationLaunched on escape', async () => {
            renderHook(() => useMobileContent(mockProps));

            fireEvent.keyDown(overlay, { key: 'Escape', code: 'Escape' });

            expect(setIsAnimationLaunched).toHaveBeenCalledWith(false);
        });

        it('should call setIsAnimationLaunched on enter', async () => {
            renderHook(() => useMobileContent(mockProps));

            fireEvent.keyDown(overlay, { key: 'Enter', code: 'Enter' });

            expect(setIsAnimationLaunched).toHaveBeenCalledWith(false);
        });

        it('should call setIsAnimationLaunched on space', async () => {
            renderHook(() => useMobileContent(mockProps));

            fireEvent.keyDown(overlay, { key: ' ', code: 'Space' });

            expect(setIsAnimationLaunched).toHaveBeenCalledWith(false);
        });

        it('should NOT call setIsAnimationLaunched on any key besides esc/space/enter', async () => {
            renderHook(() => useMobileContent(mockProps));

            fireEvent.keyDown(overlay, { key: 'a', code: 'KeyA' });

            expect(setIsAnimationLaunched).not.toHaveBeenCalled();
        });

        it('should handle unmount logic', () => {
            document.documentElement.style.removeProperty = jest.fn();

            const windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');
            const overlayRemoveEventListenerSpy = jest.spyOn(overlay, 'removeEventListener');

            const { unmount } = renderHook(() => useMobileContent(mockProps));

            unmount();

            expect(overlayRemoveEventListenerSpy).toHaveBeenNthCalledWith(1, 'click', expect.any(Function));
            expect(overlayRemoveEventListenerSpy).toHaveBeenNthCalledWith(2, 'keydown', expect.any(Function));
            expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
            expect(document.documentElement.style.removeProperty).toHaveBeenCalledWith('--inner-height');
            expect(mockProps.refs.reference.current.focus).toHaveBeenCalled();
        });
    });

    describe('isMobile', () => {
        beforeEach(() => {
            useXSMobileViewport.mockReturnValue(true);
        });

        it('should return correct data', () => {
            const {
                result: { current },
            } = renderHook(() => useMobileContent(mockProps));

            expect(current.isMobile).toBe(true);
            expect(current.onClose).toStrictEqual(expect.any(Function));
            expect(current.overlay).toStrictEqual({
                style: {
                    backgroundColor: 'rgba(83, 83, 83, 0)',
                },
                ref: expect.any(Object),
            });
            expect(current.content).toStrictEqual({
                onTouchEnd: expect.any(Function),
                onTouchMove: expect.any(Function),
                onTouchStart: expect.any(Function),
                onTransitionEnd: expect.any(Function),
                ref: expect.any(Object),
                style: {
                    transform: 'translateY(100%)',
                    transition: 'transform .3s linear',
                },
            });
        });

        it('should call onChange when isAnimationLaunched is false', () => {
            const onChange = jest.fn();
            useSwipe.mockReturnValue({ onChange });

            mockProps.isAnimationLaunched = false;

            renderHook(() => useMobileContent(mockProps));

            expect(onChange).toHaveBeenCalledWith({ y: 100 });
        });

        it('should NOT call onChange when isAnimationLaunched is true', () => {
            const onChange = jest.fn();
            useSwipe.mockReturnValue({ onChange });

            mockProps.isAnimationLaunched = true;

            renderHook(() => useMobileContent(mockProps));

            expect(onChange).not.toHaveBeenCalled();
        });

        describe('overlay', () => {
            it('should return empty object when y is undefined', () => {
                const onChange = jest.fn();
                useSwipe.mockReturnValue({ y: undefined, onChange });

                const {
                    result: { current },
                } = renderHook(() => useMobileContent(mockProps));

                expect(current.overlay).toStrictEqual(
                    expect.objectContaining({
                        style: {},
                    }),
                );
            });

            it('should return data when y/swiping is defined', () => {
                const onChange = jest.fn();
                useSwipe.mockReturnValue({ y: 10, onChange });

                const {
                    result: { current },
                } = renderHook(() => useMobileContent(mockProps));

                expect(current.overlay).toStrictEqual(
                    expect.objectContaining({
                        style: {
                            backgroundColor: 'rgba(83, 83, 83, 0.585)',
                        },
                    }),
                );
            });
        });

        describe('content', () => {
            it('should return empty object when y is undefined', () => {
                const onChange = jest.fn();
                useSwipe.mockReturnValue({ y: undefined, onChange });

                const {
                    result: { current },
                } = renderHook(() => useMobileContent(mockProps));

                expect(current.content).toStrictEqual(
                    expect.objectContaining({
                        style: {},
                    }),
                );
            });

            it('should return data when y/swiping is defined', () => {
                const onChange = jest.fn();
                useSwipe.mockReturnValue({ y: 10, onChange });

                const {
                    result: { current },
                } = renderHook(() => useMobileContent(mockProps));

                expect(current.content).toStrictEqual(
                    expect.objectContaining({
                        style: {
                            transform: 'translateY(10%)',
                            transition: 'transform .3s linear',
                        },
                    }),
                );
            });
        });
    });

    describe('isTablet', () => {
        beforeEach(() => {
            useXSMobileViewport.mockReturnValue(false);
        });

        it('should return data', () => {
            const {
                result: { current },
            } = renderHook(() => useMobileContent(mockProps));

            expect(current.isMobile).toBe(false);
            expect(current.onClose).toStrictEqual(expect.any(Function));
            expect(current.overlay).toStrictEqual({
                ref: expect.any(Object),
                style: {},
            });
            expect(current.content).toStrictEqual({
                isShown: false,
                onAnimationEnd: expect.any(Function),
            });
        });

        it('should call setOpen and setIsShown on animation end', () => {
            const { result } = renderHook(() => useMobileContent(mockProps));

            (result.current.content as ITabletContent).onAnimationEnd();

            expect(setOpen).toHaveBeenCalledWith(false);
            expect(setIsAnimationLaunched).toHaveBeenCalledWith(true);
        });

        it('should return empty overlay', () => {
            const {
                result: { current },
            } = renderHook(() => useMobileContent(mockProps));

            expect(current.overlay).toStrictEqual({
                ref: expect.any(Object),
                style: {},
            });
        });
    });

    it('should update isAnimationLaunched state when calling onClose', () => {
        const { result } = renderHook(() => useMobileContent(mockProps));

        result.current.onClose();

        expect(setIsAnimationLaunched).toHaveBeenCalledWith(false);
    });
});
