import {
    DESKTOP_ITEMS_TO_SHOW,
    MOBILE_ITEMS_TO_SHOW,
    TABLET_ITEMS_TO_SHOW,
} from 'frontend/components/renderings/WeatherDataCarousel/constants';

export const getNumberOfItemsInCarouselSlide = (isScreenExtraLarge: boolean, isScreenLessMedium: boolean): number => {
    if (isScreenExtraLarge) {
        return DESKTOP_ITEMS_TO_SHOW;
    }

    if (isScreenLessMedium) {
        return MOBILE_ITEMS_TO_SHOW;
    }

    return TABLET_ITEMS_TO_SHOW;
};

export const getInitialCarouselSlide = (items: number[][], date?: string): number => {
    if (!items.length || !date) {
        return 0;
    }

    let monthsCounter = 0;
    const month = new Date(date).getMonth() + 1;

    const index = items.findIndex(array => {
        monthsCounter += array.length;

        return month <= monthsCounter;
    });

    return index === -1 ? 0 : index;
};
