import { CarouselInternalState } from 'react-multi-carousel';

export const getNewSelectedIndexOnSlide = (
    previousSlide: number,
    state: CarouselInternalState,
    currentIndex: number,
): number => {
    const { currentSlide, slidesToShow } = state;

    const newVisible = Array.from({ length: slidesToShow }, (_, i) => currentSlide + i);

    if (!newVisible.includes(currentIndex)) {
        const isNext = currentSlide > previousSlide;

        return isNext ? newVisible[0] : newVisible[newVisible.length - 1];
    }

    return currentIndex;
};
