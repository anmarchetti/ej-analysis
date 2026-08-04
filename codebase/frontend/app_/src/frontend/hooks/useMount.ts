import { useEffect, useRef } from 'react';

export const useMount = (func: () => void): void => {
    const funcRef = useRef(func);

    useEffect(() => {
        funcRef.current();
    }, []);
};
