import { CarouselInternalState } from 'react-multi-carousel';

import { getNewSelectedIndexOnSlide } from './InformationBelowTilesVariant.utils';

const mockCarouselState = {
    currentSlide: 0,
    slidesToShow: 3,
} as CarouselInternalState;

describe('InformationBelowTilesVariant.utils', () => {
    describe('getNewSelectedIndexOnSlide', () => {
        it('should return currentIndex when currentIndex is in visible array', () => {
            const newIndex = getNewSelectedIndexOnSlide(0, mockCarouselState, 1);

            expect(newIndex).toBe(1);
        });

        it('should return last item from visible array when currentSlide < previousSlide', () => {
            const newIndex = getNewSelectedIndexOnSlide(1, mockCarouselState, 3);

            expect(newIndex).toBe(2);
        });

        it('should return first item from visible array when currentSlide > previousSlide', () => {
            mockCarouselState.currentSlide = 4;

            const newIndex = getNewSelectedIndexOnSlide(2, mockCarouselState, 3);

            expect(newIndex).toBe(4);
        });
    });
});
