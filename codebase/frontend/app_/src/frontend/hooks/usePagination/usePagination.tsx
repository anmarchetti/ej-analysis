import { useCallback, useState } from 'react';

interface IPaginationOptions {
    continuous?: boolean;
    defaultPage?: number;
    defaultToShow?: number;
    numberToShow?: number;
}

export const usePagination = <T,>(
    items: T[],
    { numberToShow, defaultToShow = 0, continuous, defaultPage = 0 }: IPaginationOptions = {},
): {
    goToNext: () => void;
    goToPage: (page: number) => void;
    goToPrev: () => void;
    isLastPage: boolean;
    itemsToShow: T[];
    page: number;
} => {
    const actualNumberToShow = numberToShow || items.length;
    const [state, setState] = useState({
        page: defaultPage,
        maxPage: Math.ceil(items.length / actualNumberToShow),
    });

    const goToPage = useCallback((page: number) => {
        setState(prev => ({ ...prev, page }));
    }, []);

    const goToNext = useCallback(() => {
        setState(prev => ({ ...prev, page: Math.min(prev.maxPage, prev.page + 1) }));
    }, []);

    const goToPrev = useCallback(() => {
        setState(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }));
    }, []);

    const startIndex = continuous ? 0 : (state.page - 1) * actualNumberToShow;
    const itemsToShow =
        state.page === 0
            ? items.slice(0, defaultToShow)
            : items.slice(startIndex, (state.page - 1) * actualNumberToShow + actualNumberToShow);

    return {
        itemsToShow,
        goToPage,
        goToNext,
        goToPrev,
        page: state.page,
        isLastPage: state.page === state.maxPage || itemsToShow.length === items.length,
    };
};
