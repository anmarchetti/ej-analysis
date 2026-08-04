import { ResponsiveType } from 'react-multi-carousel';

import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlockTitleColorOption, TitleFontSizeMobileAndDesktopPromoBlocks } from 'models/enum/PromoBlocksParams';
import { PromoBlocksMaxItems, PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';

import { IPromoBlocksParams } from './PromoBlocks';

type TGetMaxItemsCountParams = {
    isScreenExtraSmall: boolean;
    isScreenLarge: boolean;
    max: number;
    responsive: ResponsiveType;
    wasRerendered?: boolean;
};

export type TPromoBlockItemTitleFontSizeClassName =
    | 'textTiny'
    | 'textExtraSmall'
    | 'textSmall'
    | 'textMedium'
    | 'textLarge';

export type TPromoBlockItemTitleColorClassName = 'textWhite' | 'textBlack';

export const PROMO_BLOCK_MOSAIC_RESPONSIVE: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 768 }, items: 1 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

export const PROMO_BLOCK_DEFAULT_RESPONSIVE: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 }, items: 3 },
    tablet: { breakpoint: { max: 1024, min: 768 }, items: 2 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

export const PROMO_BLOCK_SMALL_RESPONSIVE: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 }, items: 4 },
    tablet: { breakpoint: { max: 1024, min: 768 }, items: 3 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

export const getIconTextCarouselResponsive = (itemsAmount: number | undefined): ResponsiveType | null => {
    if (!itemsAmount || itemsAmount === 0) {
        return null;
    }

    const desktopItemsAmount = 4;
    const tabletItemsAmount = 3;

    return {
        desktop: {
            breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 },
            items: Math.min(itemsAmount, desktopItemsAmount),
        },
        tablet: {
            breakpoint: { max: 1024, min: 768 },
            partialVisibilityGutter: 30,
            items: Math.min(itemsAmount, tabletItemsAmount),
        },
        mobile: {
            breakpoint: { max: 768, min: 0 },
            partialVisibilityGutter: 30,
            items: 1,
        },
    };
};

export const PROMO_BLOCK_GROUP_THEMES = [
    PromoBlocksThemes.Mosaic,
    PromoBlocksThemes.FeaturedDestinationsVariant,
    PromoBlocksThemes.IconTextAlt,
    PromoBlocksThemes.TextAlt,
    PromoBlocksThemes.VerticalStripe,
    PromoBlocksThemes.LinkTileWithBorder,
    PromoBlocksThemes.IconTextCarousel,
];

export const getPromoBlocksResponsiveByTheme = (
    theme: IPromoBlocksParams['Theme'] | undefined,
    itemsAmount?: number,
): ResponsiveType => {
    switch (theme) {
        case PromoBlocksThemes.Small:
            return PROMO_BLOCK_SMALL_RESPONSIVE;

        case PromoBlocksThemes.IconTextCarousel:
            return getIconTextCarouselResponsive(itemsAmount) || PROMO_BLOCK_DEFAULT_RESPONSIVE;

        case PromoBlocksThemes.Mosaic:
            return PROMO_BLOCK_MOSAIC_RESPONSIVE;

        default:
            return PROMO_BLOCK_DEFAULT_RESPONSIVE;
    }
};

export const getItemsCountByDevice = (responsive: ResponsiveType, isMobile: boolean, isTablet: boolean): number => {
    if (isMobile) {
        return responsive.mobile.items;
    }

    if (isTablet) {
        return responsive.tablet.items;
    }

    return responsive.desktop.items;
};

export const getPromoBlocksMaxItemByTheme = (theme: IPromoBlocksParams['Theme'] | undefined): PromoBlocksMaxItems => {
    switch (theme) {
        case PromoBlocksThemes.Small:
            return PromoBlocksMaxItems.Small;

        case PromoBlocksThemes.Big:
            return PromoBlocksMaxItems.Big;

        default:
            return PromoBlocksMaxItems.TitleUnderImage;
    }
};

export const shouldHidePromoBlock = (
    theme: IPromoBlocksParams['Theme'] | undefined,
    totalItemsCount: number,
    isScreenExtraSmall: boolean,
    isScreenLarge: boolean,
): boolean => {
    const maxItemsCount = getMaxItemsCount({
        responsive: getPromoBlocksResponsiveByTheme(theme),
        isScreenExtraSmall,
        isScreenLarge,
        max: getPromoBlocksMaxItemByTheme(theme),
    });

    return totalItemsCount > maxItemsCount;
};

export const getMaxItemsCount = ({
    responsive,
    max,
    isScreenExtraSmall,
    isScreenLarge,
}: TGetMaxItemsCountParams): number => {
    if (isScreenExtraSmall) {
        return Math.min(responsive.mobile.items, max);
    }

    if (!isScreenLarge) {
        return Math.min(responsive.tablet.items, max);
    }

    return max;
};

export const getPromoBlockItemTitleFontSizeClassName = (
    fontSize?: TitleFontSizeMobileAndDesktopPromoBlocks,
): Nullable<TPromoBlockItemTitleFontSizeClassName> => {
    switch (fontSize) {
        case TitleFontSizeMobileAndDesktopPromoBlocks.Mobile16Desktop20:
            return 'textTiny';
        case TitleFontSizeMobileAndDesktopPromoBlocks.Mobile20Desktop24:
            return 'textExtraSmall';
        case TitleFontSizeMobileAndDesktopPromoBlocks.Mobile24Desktop32:
            return 'textSmall';
        case TitleFontSizeMobileAndDesktopPromoBlocks.Mobile32Desktop44:
            return 'textMedium';
        case TitleFontSizeMobileAndDesktopPromoBlocks.Mobile40Desktop56:
            return 'textLarge';
        default:
            return null;
    }
};

export const getPromoBlockItemTitleColorClassName = (
    color: PromoBlockTitleColorOption | undefined,
): Nullable<TPromoBlockItemTitleColorClassName> => {
    switch (color) {
        case PromoBlockTitleColorOption.White:
            return 'textWhite';
        case PromoBlockTitleColorOption.Black:
            return 'textBlack';
        default:
            return null;
    }
};

export const generateImageSizes = (resp: ResponsiveType): string => {
    const screenWidth = 100;

    const getWidth = (items: number): string => `${Math.round(screenWidth / items)}vw`;
    const getMedia = (breakpoint: number): string => `(max-width: ${breakpoint}px)`;

    return [
        getMedia(resp.mobile.breakpoint.max),
        getWidth(resp.mobile.items),
        getMedia(resp.tablet.breakpoint.max),
        getWidth(resp.tablet.items),
        getWidth(resp.desktop.items),
    ].join(' ');
};

/** PromoBlock is empty if all fileds are empty  */
export const isPromoBlockEmpty = (item: IPromoBlockFields): boolean =>
    !item.fields ||
    !(
        item.fields.Title?.value ||
        item.fields.Description?.value ||
        item.fields.Image?.value?.src ||
        item.fields.Link?.value?.href
    );

export const shouldRenderPromoBlock = (item: IPromoBlockFields | undefined, isEditMode: boolean): boolean => {
    if (!item?.fields) {
        return false;
    }

    if (!isEditMode && isPromoBlockEmpty(item)) {
        return false;
    }

    return true;
};
