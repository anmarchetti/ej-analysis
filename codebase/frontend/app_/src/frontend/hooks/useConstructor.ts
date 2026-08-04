import { useRef } from 'react';

/**
 * Hook to emulate constructor lifecycle of Component (i.e. run once before render)
 */
const useConstructor = (callBack = () => {}): void => {
    const hasBeenCalled = useRef(false);

    if (hasBeenCalled.current) return;

    callBack();
    hasBeenCalled.current = true;
};

export default useConstructor;
