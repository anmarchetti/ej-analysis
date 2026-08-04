import { renderHook } from '@testing-library/react';

import { usePagination } from './usePagination';

describe('usePagination', () => {
    it('Should return default state', () => {
        const {
            result: { current },
        } = renderHook(() =>
            usePagination(['test-1', 'test-2', 'test-3'], {
                numberToShow: 1,
                defaultToShow: 1,
                continuous: true,
                defaultPage: 0,
            }),
        );
        expect(current.itemsToShow.length).toBe(1);
        expect(current.itemsToShow[0]).toBe('test-1');
        expect(current.page).toBe(0);
        expect(current.isLastPage).toBe(false);
    });

    it('Should return isEnd true when the end of the list', () => {
        const {
            result: { current },
        } = renderHook(() =>
            usePagination(['test-1', 'test-2', 'test-3'], {
                numberToShow: 3,
                defaultToShow: 3,
                continuous: true,
                defaultPage: 1,
            }),
        );

        expect(current.isLastPage).toBe(true);
    });

    it('Should return sliced first array index', () => {
        const {
            result: { current },
        } = renderHook(() =>
            usePagination(['test-1', 'test-2', 'test-3'], {
                numberToShow: 1,
                defaultToShow: 3,
                defaultPage: 2,
            }),
        );

        expect(current.itemsToShow[0]).toBe('test-2');
    });
});
