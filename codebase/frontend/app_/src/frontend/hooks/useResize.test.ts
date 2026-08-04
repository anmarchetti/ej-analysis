import { act, renderHook } from '@testing-library/react';

import useResize from './useResize';

describe('useResize', () => {
    it('should return window inner dimensions when no component is provided', () => {
        const { result } = renderHook(() => useResize());

        expect(result.current.width).toBe(window.innerWidth);
        expect(result.current.height).toBe(window.innerHeight);
    });

    it('should return the dimensions of the component when a component is provided', () => {
        const component = { current: document.createElement('div') };
        Object.defineProperty(component.current, 'offsetWidth', { value: 100 });
        Object.defineProperty(component.current, 'offsetHeight', { value: 200 });

        const { result } = renderHook(() => useResize(component));

        expect(result.current.width).toBe(100);
        expect(result.current.height).toBe(200);
    });

    it('should update dimensions on window resize', () => {
        const component = { current: document.createElement('div') };
        Object.defineProperty(component.current, 'offsetWidth', { value: 100, writable: true });
        Object.defineProperty(component.current, 'offsetHeight', { value: 200, writable: true });

        const { result } = renderHook(() => useResize(component));

        act(() => {
            Object.defineProperty(component.current, 'offsetWidth', { value: 300 });
            Object.defineProperty(component.current, 'offsetHeight', { value: 400 });
            window.dispatchEvent(new Event('resize'));
        });

        expect(result.current.width).toBe(300);
        expect(result.current.height).toBe(400);
    });
});
