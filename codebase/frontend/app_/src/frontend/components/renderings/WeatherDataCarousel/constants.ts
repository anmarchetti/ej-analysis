import { ResponsiveType } from 'react-multi-carousel';

import { ScreenBreakpoints } from 'code/screenBreakpoints';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';

const MOBILE_MIN_BREAKPOINT = 0;
const MOBILE_PARTIAL_VISIBILITY = 10;

export const DESKTOP_ITEMS_TO_SHOW = 6;
export const TABLET_ITEMS_TO_SHOW = 4;
export const MOBILE_ITEMS_TO_SHOW = 2;
export const CELSIUS_DEGREES = '°C';

export const responsiveConfig: ResponsiveType = {
    desktop: {
        breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: ScreenBreakpoints.XL },
        items: 1,
        slidesToSlide: 1,
    },
    tablet: {
        breakpoint: { max: ScreenBreakpoints.XL - 1, min: ScreenBreakpoints.SM },
        items: 1,
        slidesToSlide: 1,
    },
    mobile: {
        breakpoint: { max: ScreenBreakpoints.SM - 1, min: MOBILE_MIN_BREAKPOINT },
        partialVisibilityGutter: MOBILE_PARTIAL_VISIBILITY,
        items: 1,
        slidesToSlide: 1,
    },
};
