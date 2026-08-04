import { getSlidesToShow, responsive, responsiveCarouselSlim } from './getSlidersToShow';

let isScreenExtraLarge;
let isScreenLarge;
let isScreenMedium;
let slidesToShow;

describe('getSlidesToShow', () => {
    beforeEach(() => {
        isScreenExtraLarge = false;
        isScreenLarge = false;
        isScreenMedium = false;
        slidesToShow = null;
    });

    it('should return slidesToShow when slidesToShow is provided', () => {
        slidesToShow = 100;
        const result = 100;
        const slides = getSlidesToShow(responsive, isScreenExtraLarge, isScreenLarge, isScreenMedium, slidesToShow);

        expect(slides).toStrictEqual(result);
    });

    it('should return desktop items when screen is large', () => {
        isScreenLarge = true;
        const slides = getSlidesToShow(responsive, isScreenExtraLarge, isScreenLarge, isScreenMedium);

        expect(slides).toStrictEqual(responsive.desktop.items);
    });

    it('should return tablet items when screen is medium', () => {
        isScreenMedium = true;
        const slides = getSlidesToShow(responsive, isScreenExtraLarge, isScreenLarge, isScreenMedium);

        expect(slides).toStrictEqual(responsive.tablet.items);
    });

    it('should return mobile items when screen is NOT large and NOT medium', () => {
        const slides = getSlidesToShow(responsive, isScreenExtraLarge, isScreenLarge, isScreenMedium);

        expect(slides).toStrictEqual(responsive.mobile.items);
    });

    it('should return extraLargeDesktop items when screen is extra large and extraLargeDesktop field is defined', () => {
        isScreenExtraLarge = true;
        const slides = getSlidesToShow(responsiveCarouselSlim, isScreenExtraLarge, isScreenLarge, isScreenMedium);

        expect(slides).toStrictEqual(responsiveCarouselSlim.extraLargeDesktop.items);
    });

    it('should return desktop items when screen is extra large and extraLargeDesktop field is not defined', () => {
        isScreenExtraLarge = true;
        const slides = getSlidesToShow(responsive, isScreenExtraLarge, isScreenLarge, isScreenMedium);

        expect(slides).toStrictEqual(responsive.desktop.items);
    });
});
