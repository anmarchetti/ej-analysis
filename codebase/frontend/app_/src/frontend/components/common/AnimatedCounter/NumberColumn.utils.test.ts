import React from 'react';
import { renderHook } from '@testing-library/react';

import useNumberColumn from './NumberColumn.utils';

const spyUseRef = jest.spyOn(React, 'useRef');

describe('useNumberColumn', () => {
    it('should apply transform rule based on height', async () => {
        const containerRef = {
            current: {
                clientHeight: 10,
                firstChild: {
                    style: {
                        transform: '',
                    },
                },
            },
        };

        spyUseRef.mockImplementationOnce(() => containerRef);

        const { result } = renderHook(() => useNumberColumn({ digit: 5 }));

        expect(containerRef.current.firstChild.style.transform).toBe('translateY(50px)');
        expect(result.current).toStrictEqual({ containerRef });
    });

    it('should NOT apply animation when firstChild is undefined', async () => {
        const containerRef = {
            current: undefined,
        };

        spyUseRef.mockImplementationOnce(() => containerRef);

        const { result } = renderHook(() => useNumberColumn({ digit: 5 }));

        expect(result.current).toStrictEqual({ containerRef });
    });
});
