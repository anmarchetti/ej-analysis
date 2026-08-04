import { DESKTOP_ITEMS_TO_SHOW, MOBILE_ITEMS_TO_SHOW, TABLET_ITEMS_TO_SHOW } from './constants';
import { getInitialCarouselSlide, getNumberOfItemsInCarouselSlide } from './weatherData.utils';

describe('weatherData', () => {
    describe('getHreflangTagByPageUrl', () => {
        it('should return TABLET_ITEMS_TO_SHOW when isScreenExtraLarge and isScreenLessMedium are false', () => {
            expect(getNumberOfItemsInCarouselSlide(false, false)).toEqual(TABLET_ITEMS_TO_SHOW);
        });

        it('should return MOBILE_ITEMS_TO_SHOW when isScreenExtraLarge is false and isScreenLessMedium is true', () => {
            expect(getNumberOfItemsInCarouselSlide(false, true)).toEqual(MOBILE_ITEMS_TO_SHOW);
        });

        it('should return MOBILE_ITEMS_TO_SHOW when isScreenExtraLarge is true and isScreenLessMedium is false', () => {
            expect(getNumberOfItemsInCarouselSlide(true, false)).toEqual(DESKTOP_ITEMS_TO_SHOW);
        });
    });

    describe('getInitialCarouselSlide', () => {
        it('should return 0 when items are empty', () => {
            expect(getInitialCarouselSlide([], '10-10-2025')).toEqual(0);
        });

        it('should return 0 when date is NOT provided', () => {
            expect(getInitialCarouselSlide([[], []])).toEqual(0);
        });

        it('should return 0 when month number is bigger than number of elements', () => {
            expect(getInitialCarouselSlide([[], []], '10-10-2025')).toEqual(0);
        });

        it('should return 1 when month number is in 2nd array', () => {
            expect(
                getInitialCarouselSlide(
                    [
                        [1, 2, 3, 4, 5, 6],
                        [7, 8, 9, 10, 11, 12],
                    ],
                    '10-10-2025',
                ),
            ).toEqual(1);
        });
    });
});
