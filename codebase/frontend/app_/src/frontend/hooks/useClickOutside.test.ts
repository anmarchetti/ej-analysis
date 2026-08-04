import { renderHook } from '@testing-library/react';

import useClickOutside from './useClickOutside';

describe('useClickOutside', () => {
    it('should call the callback when clicking outside the element', () => {
        const callback = jest.fn();
        const ref = { current: document.createElement('div') };

        renderHook(() => useClickOutside(ref, callback));

        document.dispatchEvent(new MouseEvent('mousedown'));

        expect(callback).toHaveBeenCalled();
    });

    it('should NOT call the callback when clicking inside the element', () => {
        const callback = jest.fn();
        const ref = { current: document.createElement('div') };

        renderHook(() => useClickOutside(ref, callback));

        ref.current.dispatchEvent(new MouseEvent('mousedown'));

        expect(callback).not.toHaveBeenCalled();
    });

    it('should call the latest callback after it changes between renders', () => {
        /* Callbacks passed to this hook are typically inline functions recreated on every render.
         * Without a callback ref, the listener would close over the initial callback and never
         * see updates, causing stale closure bugs (e.g. reading outdated state or props).
         */
        const firstCallback = jest.fn();
        const secondCallback = jest.fn();
        const ref = { current: document.createElement('div') };

        const { rerender } = renderHook(({ cb }) => useClickOutside(ref, cb), {
            initialProps: { cb: firstCallback },
        });

        rerender({ cb: secondCallback });

        document.dispatchEvent(new MouseEvent('mousedown'));

        expect(secondCallback).toHaveBeenCalled();
        expect(firstCallback).not.toHaveBeenCalled();
    });
});
