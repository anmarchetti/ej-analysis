import { RefObject, useEffect, useRef } from 'react';

/**
 * Handles clicks outside of a referenced element.
 *
 * @param ref - Reference to the element to check clicks against
 * @param callback - Function to call when a click outside is detected
 *
 * `callback` is stored in a ref updated on every render, rather than included in the effect's
 * dependency array. This means the listener is registered once and always invokes the latest
 * callback, avoiding stale closure bugs.
 *
 * React 19's `useEffectEvent` is the official abstraction for this problem. On React 18, the
 * callback ref approach here achieves the same result.
 *
 * @see https://react.dev/learn/separating-events-from-effects#reading-latest-props-and-state-with-effect-events
 */
const useClickOutside = (ref: RefObject<HTMLElement>, callback: () => void): void => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (ref?.current && !ref.current.contains(event.target as HTMLElement)) {
                callbackRef.current();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref]);
};

export default useClickOutside;
