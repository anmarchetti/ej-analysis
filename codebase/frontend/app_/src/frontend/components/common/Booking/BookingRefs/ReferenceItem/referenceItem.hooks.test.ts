import { act, renderHook } from '@testing-library/react';

import { PADDING_TO_EDGE, useAdjustCopiedLabelPosition } from './referenceItem.hooks';

describe('referenceItem.hooks', () => {
    describe('useAdjustCopiedLabelPosition', () => {
        let elRef;

        beforeEach(() => {
            elRef = { current: document.createElement('div') };
        });

        test('should return false for isNearLeftEdge and isNearRightEdge after initialization ', () => {
            const { result } = renderHook(() => useAdjustCopiedLabelPosition(elRef));

            expect(result.current.isNearLeftEdge).toBe(false);
            expect(result.current.isNearRightEdge).toBe(false);
        });

        test('checkPosition should set isNearRightEdge to true when element closer to the right edge than PADDING_TO_EDGE ', () => {
            window.innerWidth = 1000;
            elRef.current.getBoundingClientRect = jest.fn(() => ({
                right: window.innerWidth - PADDING_TO_EDGE + 1,
                left: 20,
            }));

            const { result } = renderHook(() => useAdjustCopiedLabelPosition(elRef));

            act(() => {
                result.current.checkPosition();
            });

            expect(result.current.isNearRightEdge).toBe(true);
        });

        test('checkPosition should set isNearRightEdge to true when element closer to the left edge than PADDING_TO_EDGE', () => {
            elRef.current.isNearLeftEdge = jest.fn(() => ({
                left: PADDING_TO_EDGE - 1,
                right: 800,
            }));

            const { result } = renderHook(() => useAdjustCopiedLabelPosition(elRef));

            act(() => {
                result.current.checkPosition();
            });

            expect(result.current.isNearLeftEdge).toBe(true);
        });

        test('checkPosition should set isNearRightEdge and isNearLeftEdge to false when element is further from edges than PADDING_TO_EDGE', () => {
            elRef.current.getBoundingClientRect = jest.fn(() => ({
                left: 200,
                right: 800,
            }));

            const { result } = renderHook(() => useAdjustCopiedLabelPosition(elRef));

            act(() => {
                result.current.checkPosition();
            });

            expect(result.current.isNearRightEdge).toBe(false);
            expect(result.current.isNearLeftEdge).toBe(false);
        });

        test('should recalculate position on resize event', () => {
            const resizeEvent = new Event('resize');
            elRef.current.getBoundingClientRect = jest.fn(() => ({
                right: window.innerWidth - PADDING_TO_EDGE + 1,
                left: 20,
            }));

            const { result } = renderHook(() => useAdjustCopiedLabelPosition(elRef));

            act(() => {
                window.dispatchEvent(resizeEvent);
            });

            expect(result.current.isNearRightEdge).toBe(true);
        });
    });
});
