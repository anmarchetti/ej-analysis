import { MutableRefObject, useEffect, useRef } from 'react';

/**
 * Hook to get the previous props or state
 */
const usePrevious = <T>(value: T): MutableRefObject<T | undefined>['current'] => {
    const ref = useRef<T>();

    useEffect(() => {
        ref.current = value;
    });

    return ref.current;
};

export default usePrevious;
