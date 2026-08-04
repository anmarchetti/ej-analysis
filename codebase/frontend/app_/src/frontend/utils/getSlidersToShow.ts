import { ResponsiveType } from 'react-multi-carousel';

// react-multi-carousel hides carousels on screens wider than the highest `max` breakpoint value,
// so this constant must be set high enough to cover all real desktop screen widths
export const CAROUSEL_DESKTOP_MAX_BREAKPOINT = 9999;

export const responsive: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 992 }, items: 4 },
    tablet: { breakpoint: { max: 992, min: 768 }, items: 3 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

// this setup uses only for carousels from Promo & SearchResults pages where left-side filters reduce the rendering area
export const responsiveCarouselSlim: ResponsiveType = {
    extraLargeDesktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1200 }, items: 3 },
    desktop: { breakpoint: { max: 1200, min: 992 }, items: 2 },
    tablet: { breakpoint: { max: 992, min: 768 }, items: 1 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

export const slimCarouselMinItemsNumberToShow = 2;

/**
 * return number of show sliders
 */
export const getSlidesToShow = (
    responsive: ResponsiveType,
    isScreenExtraLarge: boolean,
    isScreenLarge: boolean,
    isScreenMedium: boolean,
    slidesToShow?: number,
): number => {
    if (slidesToShow) {
        return slidesToShow;
    }

    // If carousel DOM is still not loaded, slidesToShow equals 0.
    // In this case check standard breakpoints
    if (isScreenExtraLarge) {
        return responsive.extraLargeDesktop?.items ?? responsive.desktop.items;
    }

    if (isScreenLarge) {
        return responsive.desktop.items;
    }

    if (isScreenMedium) {
        return responsive.tablet.items;
    }

    return responsive.mobile.items;
};
