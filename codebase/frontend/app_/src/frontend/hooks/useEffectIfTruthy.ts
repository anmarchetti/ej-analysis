import { useEffect } from 'react';

export const useEffectIfTruthy = (callback: () => void, value: any): void => {
    useEffect(() => {
        if (!value) return;

        callback();
    }, [value]);
};
