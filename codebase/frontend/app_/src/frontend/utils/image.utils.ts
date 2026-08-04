import { ImageLoaderProps } from 'next/image';

import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import { IImage } from 'models/data/IHotel';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import { ImageSize } from 'models/enum/ImageSize';
import { YOUTUBE_THUMBNAIL_URL } from 'frontend/components/common/VideoThumbnailImage/constants';

import { getImageUrl } from './getImage';
import { Tokenizer } from './tokenizer';

export const imgUrl = process.env.NEXT_PUBLIC_IMG_URL ?? '';
export const FALLBACK_IMAGE_URL = imgUrl + '/ejh-placeholder.webp';
const ASSET_PREFIX = process.env.ASSET_PREFIX ?? '';
const DEFAULT_NEXT_IMAGE_WIDTH = 1920;

/** This function returns the best available image URL for the requested size, cascading to next available when the field is empty */
export const getImage = (images: IImage, defaultSize = ImageSize.Large): string => {
    if (!images) return '';

    if (defaultSize === ImageSize.Large) {
        return getImageUrl(images.large || images.medium || '');
    }

    if (defaultSize === ImageSize.Medium) {
        return getImageUrl(images.medium || images.small || '');
    }

    return getImageUrl(images.small || images.medium || '');
};

/** Get a fallback image if initial image fails to load (HTTP error on a valid URL) */
export const getFallbackImage = (
    image: IImage,
    defaultSize = ImageSize.Large,
    fallbackImage = FALLBACK_IMAGE_URL,
): string => {
    if (defaultSize === ImageSize.Large) {
        return image.large && image.medium ? getImageUrl(image.medium) : fallbackImage;
    }

    if (defaultSize === ImageSize.Medium) {
        return image.medium && image.small ? getImageUrl(image.small) : fallbackImage;
    }

    return image.small && image.medium ? getImageUrl(image.medium) : fallbackImage;
};

// Custom image load, makes image load from /holiday/ on production
export const imageLoader = ({ src, width, quality }: ImageLoaderProps): string =>
    `${ASSET_PREFIX}/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;

export const getNextImageSrc = (
    src: string,
    mediaSize: MediaSize = MediaSize.Small,
    width = DEFAULT_NEXT_IMAGE_WIDTH,
): string => imageLoader({ src: cmsUrls.media(src, getMediaSizeParams(mediaSize)), width });

export const getVideoThumbnailUrl = (id: string): string =>
    Tokenizer.replaceToken(YOUTUBE_THUMBNAIL_URL, Tokens.Id, `${id}`);

export const getCloudinaryThumbnailUrl = (publicId?: string, isDisabled?: boolean): string =>
    publicId && !isDisabled
        ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}.jpg`
        : '';

export const toDataURL = (src: string, callback: (url: string) => void): void => {
    const img = new Image();

    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        const canvas = <HTMLCanvasElement>document.createElement('CANVAS');
        const ctx = canvas.getContext('2d');

        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        ctx?.drawImage(img, 0, 0);
        callback(canvas.toDataURL());
    };
    img.src = src;
};

export const getBgImage = (images: IImage[], basePath: string, withOverlay = true): string => {
    if (!images?.[0]?.large) {
        return '';
    }

    const url = `${basePath}/print-image?url=${encodeURIComponent(images[0].large)}`;

    if (!withOverlay) {
        return `url('${url}')`;
    }

    return `linear-gradient(180deg, rgba(0, 0, 0, 0%) 7.04%, rgba(0, 0, 0, 44%) 100%), url('${url}')`;
};
