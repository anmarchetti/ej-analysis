import { useMemo } from 'react';

let idCounter = 0;

/**
 * Hook generates a unique ID.
 * @param prefix - the value that the ID appended to
 */
const useUniqueId = (prefix: string): string => {
    // ID should remain the same on every component render/update, that why need to use useMemo() hook
    const id = useMemo(() => idCounter++, [prefix]);

    return `${prefix}-${id}`;
};

export default useUniqueId;
