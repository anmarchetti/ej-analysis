import { MediaSize } from 'models/data/MediaSizeParams';

import { TJSSImageDynamicMediaSize, TJSSImageDynamicSize } from './JSSImageNext';

const DEFAULT_MEDIA_SIZES = {
    tablet: MediaSize.Medium,
    mobile: MediaSize.Small,
};

export const getDynamicImageSizes = (
    dynamicSize: TJSSImageDynamicSize,
    isMobile: boolean,
    isTablet: boolean,
): { height: number; width: number } | undefined => {
    if (isMobile) {
        return dynamicSize.mobile ?? dynamicSize.tablet ?? dynamicSize.desktop;
    }

    if (isTablet) {
        return dynamicSize.tablet ?? dynamicSize.desktop;
    }

    return dynamicSize.desktop;
};

export const getDynamicMediaSize = (
    mediaSize: TJSSImageDynamicMediaSize | undefined,
    isMobile: boolean,
    isTablet: boolean,
    minimumMediaSize?: MediaSize,
): MediaSize | undefined => {
    if (mediaSize && typeof mediaSize === 'string') return mediaSize;

    if (isMobile) {
        return mediaSize?.mobile ?? minimumMediaSize ?? DEFAULT_MEDIA_SIZES.mobile;
    }

    if (isTablet) {
        return mediaSize?.tablet ?? minimumMediaSize ?? DEFAULT_MEDIA_SIZES.tablet;
    }

    return mediaSize?.desktop ?? minimumMediaSize;
};
