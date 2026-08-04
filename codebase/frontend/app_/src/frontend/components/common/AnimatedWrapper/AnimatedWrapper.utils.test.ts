import React from 'react';
import { renderHook } from '@testing-library/react';

import useAnimatedWrapper from './AnimatedWrapper.utils';

describe('AnimatedWrapper.utils', () => {
    describe('useAnimatedWrapper', () => {
        const setRender = jest.fn();
        const useStateSpy = jest.spyOn(React, 'useState');

        it('should return correct data when isShown is true', () => {
            useStateSpy.mockReturnValue([true, setRender]);

            const { result } = renderHook(() => useAnimatedWrapper({ isShown: true }));

            expect(setRender).toHaveBeenCalledWith(true);
            expect(result.current).toStrictEqual({
                render: true,
                onAnimationEnd: expect.any(Function),
            });

            result.current.onAnimationEnd();

            expect(setRender).not.toHaveBeenCalledTimes(2);
        });

        it('should return correct data when isShown is false', () => {
            useStateSpy.mockReturnValueOnce([false, setRender]);

            const onEnd = jest.fn();

            const { result } = renderHook(() => useAnimatedWrapper({ isShown: false, onEnd }));

            expect(setRender).not.toHaveBeenCalled();
            expect(result.current).toStrictEqual({
                render: false,
                onAnimationEnd: expect.any(Function),
            });

            result.current.onAnimationEnd();

            expect(setRender).toHaveBeenCalledWith(false);
            expect(onEnd).toHaveBeenCalled();
        });

        it('should immediately hide when disableAnimation is true and isShown is false', () => {
            useStateSpy.mockReturnValueOnce([true, setRender]);

            const onEnd = jest.fn();

            const { result, rerender } = renderHook(
                ({ isShown }) => useAnimatedWrapper({ isShown, disableAnimation: true, onEnd }),
                { initialProps: { isShown: true } },
            );

            expect(result.current.render).toBe(true);

            rerender({ isShown: false });

            expect(setRender).toHaveBeenCalledWith(false);
            expect(onEnd).toHaveBeenCalled();
        });

        it('should call setRender from useEffect when disableAnimation is true and isShown is false', () => {
            useStateSpy.mockReturnValueOnce([false, setRender]);

            const onEnd = jest.fn();

            renderHook(() => useAnimatedWrapper({ isShown: false, disableAnimation: true, onEnd }));

            // setRender is called from useEffect to immediately remove from DOM
            expect(setRender).toHaveBeenCalledWith(false);
            expect(onEnd).toHaveBeenCalled();
        });
    });
});
