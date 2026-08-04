import { renderHook } from '@testing-library/react';

import { useIsMounted } from './useIsMounted';

describe('useIsMounted', () => {
    it('should return true after mount', () => {
        const { result } = renderHook(() => useIsMounted());

        expect(result.current).toBe(true);
    });
});
