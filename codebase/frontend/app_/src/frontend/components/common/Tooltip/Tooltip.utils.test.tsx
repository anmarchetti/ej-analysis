import React from 'react';
import { renderHook } from '@testing-library/react';

import * as mediaQuery from 'frontend/hooks/useMediaQuery';

import Tooltip from './Tooltip';
import { useTooltip, useTooltipContext } from './Tooltip.utils';

const mockFlipSpy = jest.fn();
jest.mock('@floating-ui/react', () => ({
    __esModule: true,
    ...jest.requireActual('@floating-ui/react'),
    flip: data => mockFlipSpy(data),
    useId: () => 'floating-id-mock',
}));

const useMoreThenDesktopViewport = jest.spyOn(mediaQuery, 'useMoreThenDesktopViewport').mockReturnValue(true);

describe('Tooltip utils', () => {
    describe('useTooltip', () => {
        it('should return initial state', () => {
            const { result } = renderHook(() => useTooltip());

            expect(result.current).toStrictEqual({
                arrowRef: {
                    current: null,
                },
                context: {
                    dataRef: expect.any(Object),
                    elements: {
                        domReference: null,
                        floating: null,
                        reference: null,
                    },
                    events: {
                        emit: expect.any(Function),
                        off: expect.any(Function),
                        on: expect.any(Function),
                    },
                    floatingId: expect.any(String),
                    floatingStyles: {
                        left: 0,
                        position: 'absolute',
                        top: 0,
                    },
                    isPositioned: false,
                    middlewareData: {},
                    nodeId: undefined,
                    onOpenChange: expect.any(Function),
                    open: false,
                    placement: 'top',
                    refs: {
                        domReference: {
                            current: null,
                        },
                        floating: {
                            current: null,
                        },
                        reference: {
                            current: null,
                        },
                        setFloating: expect.any(Function),
                        setPositionReference: expect.any(Function),
                        setReference: expect.any(Function),
                    },
                    strategy: 'absolute',
                    update: expect.any(Function),
                    x: 0,
                    y: 0,
                },
                elements: {
                    domReference: null,
                    floating: null,
                    reference: null,
                },
                floatingStyles: {
                    left: 0,
                    position: 'absolute',
                    top: 0,
                },
                getFloatingProps: expect.any(Function),
                getItemProps: expect.any(Function),
                getReferenceProps: expect.any(Function),
                isAnimationLaunched: true,
                isPositioned: false,
                middlewareData: {},
                open: false,
                placement: 'top',
                refs: {
                    domReference: {
                        current: null,
                    },
                    floating: {
                        current: null,
                    },
                    reference: {
                        current: null,
                    },
                    setFloating: expect.any(Function),
                    setPositionReference: expect.any(Function),
                    setReference: expect.any(Function),
                },
                setIsAnimationLaunched: expect.any(Function),
                setOpen: expect.any(Function),
                strategy: 'absolute',
                tooltipId: 'floating-id-mock',
                update: expect.any(Function),
                x: 0,
                y: 0,
            });
        });

        it('should handle custom initial values', () => {
            const { result } = renderHook(() =>
                useTooltip({
                    initialOpen: true,
                    initialIsAnimationLaunched: false,
                    placement: 'bottom',
                }),
            );

            expect(result.current).toStrictEqual({
                arrowRef: {
                    current: null,
                },
                context: {
                    dataRef: {
                        current: expect.objectContaining({
                            __escapeKeyBubbles: false,
                            __outsidePressBubbles: true,
                        }),
                    },
                    elements: {
                        domReference: null,
                        floating: null,
                        reference: null,
                    },
                    events: {
                        emit: expect.any(Function),
                        off: expect.any(Function),
                        on: expect.any(Function),
                    },
                    floatingId: expect.any(String),
                    floatingStyles: {
                        left: 0,
                        position: 'absolute',
                        top: 0,
                    },
                    isPositioned: false,
                    middlewareData: {},
                    nodeId: undefined,
                    onOpenChange: expect.any(Function),
                    open: true,
                    placement: 'bottom',
                    refs: {
                        domReference: {
                            current: null,
                        },
                        floating: {
                            current: null,
                        },
                        reference: {
                            current: null,
                        },
                        setFloating: expect.any(Function),
                        setPositionReference: expect.any(Function),
                        setReference: expect.any(Function),
                    },
                    strategy: 'absolute',
                    update: expect.any(Function),
                    x: 0,
                    y: 0,
                },
                elements: {
                    domReference: null,
                    floating: null,
                    reference: null,
                },
                floatingStyles: {
                    left: 0,
                    position: 'absolute',
                    top: 0,
                },
                getFloatingProps: expect.any(Function),
                getItemProps: expect.any(Function),
                getReferenceProps: expect.any(Function),
                isAnimationLaunched: false,
                isPositioned: false,
                middlewareData: {},
                open: true,
                placement: 'bottom',
                refs: {
                    domReference: {
                        current: null,
                    },
                    floating: {
                        current: null,
                    },
                    reference: {
                        current: null,
                    },
                    setFloating: expect.any(Function),
                    setPositionReference: expect.any(Function),
                    setReference: expect.any(Function),
                },
                setIsAnimationLaunched: expect.any(Function),
                setOpen: expect.any(Function),
                strategy: 'absolute',
                update: expect.any(Function),
                x: 0,
                y: 0,
                tooltipId: 'floating-id-mock',
            });
        });

        describe('FlipPadding', () => {
            const rect = {
                height: 100,
                x: 0,
                y: 0,
                bottom: 99,
                width: 100,
                left: 0,
                right: 0,
                top: 0,
                toJSON: jest.fn(),
            };

            const getBoundingClientRectSpy = jest.fn(() => rect);

            Object.defineProperty(document, 'querySelectorAll', {
                value: jest.fn(() => [
                    {
                        getBoundingClientRect: getBoundingClientRectSpy,
                    },
                ]),
                writable: true,
            });

            it('should calculate FlipPadding when both isDesktop/open is true', () => {
                renderHook(() => useTooltip({ initialOpen: true }));

                expect(mockFlipSpy).toHaveBeenNthCalledWith(1, {
                    crossAxis: false,
                    fallbackAxisSideDirection: 'start',
                    padding: { top: 30 },
                });

                expect(document.querySelectorAll).toHaveBeenCalledWith('#sticky-box');
                expect(mockFlipSpy).toHaveBeenNthCalledWith(2, {
                    crossAxis: false,
                    fallbackAxisSideDirection: 'start',
                    padding: { top: 99 },
                });
            });

            it('should NOT update flipPadding when rect.bottom is 0', () => {
                getBoundingClientRectSpy.mockReturnValueOnce({ ...rect, bottom: 0 });

                renderHook(() => useTooltip({ initialOpen: true }));

                expect(mockFlipSpy).toHaveBeenCalledTimes(1);
            });

            it('should NOT update flipPadding when isDesktop is false', () => {
                useMoreThenDesktopViewport.mockReturnValueOnce(false);

                renderHook(() => useTooltip({ initialOpen: true }));

                expect(document.querySelectorAll).not.toHaveBeenCalled();
            });

            it('should NOT update flipPadding when open is false', () => {
                renderHook(() => useTooltip({ initialOpen: false }));

                expect(document.querySelectorAll).not.toHaveBeenCalled();
            });

            it('should NOT update flipPadding when ignoreIfAnyModalDisplayed is true', () => {
                Object.defineProperty(document, 'getElementById', {
                    value: jest.fn(() => ({
                        hasChildNodes: () => true,
                    })),
                    writable: true,
                });

                renderHook(() => useTooltip({ initialOpen: true }));

                expect(document.getElementById).toHaveBeenCalledWith('modal-portal-root');
                expect(document.querySelectorAll).not.toHaveBeenCalled();
            });
        });
    });

    describe('useTooltipContext', () => {
        it('should pass TooltipContext', () => {
            const wrapper = ({ children }) => <Tooltip>{children}</Tooltip>;

            const { result } = renderHook(() => useTooltipContext(), { wrapper });

            expect(result.current).toBeDefined();
        });

        it('should throw error when used outside TooltipContext', () => {
            const consoleError = console.error;
            console.error = jest.fn();

            expect(() => {
                renderHook(() => useTooltipContext());
            }).toThrow('Tooltip components must be wrapped in <Tooltip />');

            console.error = consoleError;
        });
    });
});
