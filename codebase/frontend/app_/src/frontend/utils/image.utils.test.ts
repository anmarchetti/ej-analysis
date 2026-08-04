import { MediaSize } from 'models/data/MediaSizeParams';
import { ImageSize } from 'models/enum/ImageSize';
import { YOUTUBE_THUMBNAIL_URL } from 'frontend/components/common/VideoThumbnailImage/constants';

import {
    FALLBACK_IMAGE_URL,
    getBgImage,
    getCloudinaryThumbnailUrl,
    getFallbackImage,
    getImage,
    getNextImageSrc,
    getVideoThumbnailUrl,
} from './image.utils';
import { Tokenizer } from './tokenizer';

const replaceTokenMock = jest.fn(s => s);
jest.mock('frontend/utils/tokenizer');
Tokenizer.replaceToken = replaceTokenMock;

const createImages = () => ({
    small: '/small',
    medium: '/medium',
    large: '/large',
});

let images = createImages();

describe('Image Utils', () => {
    beforeEach(() => {
        images = createImages();
    });

    describe('getNextImageSrc', () => {
        it('Should return source string with default media size', () => {
            const result = getNextImageSrc('/image-src');

            expect(result).toBe('/_next/image?url=%2Fimage-src%3Fmw%3D500%26mh%3D500&w=1920&q=75');
        });

        it('Should return source string with MediaSize.Big media size', () => {
            const result = getNextImageSrc('/image-src', MediaSize.Big);

            expect(result).toBe('/_next/image?url=%2Fimage-src%3Fmw%3D1200%26mh%3D650&w=1920&q=75');
        });

        it('Should return source with 640 width param', () => {
            const result = getNextImageSrc('/image-src', MediaSize.Big, 640);

            expect(result).toBe('/_next/image?url=%2Fimage-src%3Fmw%3D1200%26mh%3D650&w=640&q=75');
        });
    });

    describe('getImage', () => {
        it('should be falsy when src is not passed', () => {
            images.small = '';
            images.medium = '';
            images.large = '';
            const img = getImage(images);
            expect(img).toBeFalsy();
        });

        it('should be large when src is passed & size is not', () => {
            const img = getImage(images);
            expect(img).toEqual(images.large);
        });

        it('should be passed size when src & size are passed', () => {
            const img = getImage(images, ImageSize.Medium);
            expect(img).toEqual(images.medium);
        });

        it('should return medium when large is empty', () => {
            images.large = '';
            const img = getImage(images, ImageSize.Large);
            expect(img).toEqual(images.medium);
        });

        it('should return empty when both large and medium are empty', () => {
            images.large = '';
            images.medium = '';
            const img = getImage(images, ImageSize.Large);
            expect(img).toBeFalsy();
        });

        it('should return small when medium is empty', () => {
            images.medium = '';
            const img = getImage(images, ImageSize.Medium);
            expect(img).toEqual(images.small);
        });

        it('should return empty when both medium and small are empty', () => {
            images.medium = '';
            images.small = '';
            const img = getImage(images, ImageSize.Medium);
            expect(img).toBeFalsy();
        });

        it('should return medium when small is empty', () => {
            images.small = '';
            const img = getImage(images, ImageSize.Small);
            expect(img).toEqual(images.medium);
        });

        it('should return empty when both small and medium are empty', () => {
            images.small = '';
            images.medium = '';
            const img = getImage(images, ImageSize.Small);
            expect(img).toBeFalsy();
        });
    });

    describe('getFallbackImage', () => {
        it('should return medium when large HTTP request fails', () => {
            const img = getFallbackImage(images, ImageSize.Large);
            expect(img).toEqual(images.medium);
        });

        it('should return fallback when large was already empty (getImage cascaded to medium which then failed)', () => {
            images.large = '';
            const img = getFallbackImage(images, ImageSize.Large);
            expect(img).toEqual(FALLBACK_IMAGE_URL);
        });

        it('should return small when medium HTTP request fails', () => {
            const img = getFallbackImage(images, ImageSize.Medium);
            expect(img).toEqual(images.small);
        });

        it('should return fallback when medium was already empty (getImage cascaded to small which then failed)', () => {
            images.medium = '';
            const img = getFallbackImage(images, ImageSize.Medium);
            expect(img).toEqual(FALLBACK_IMAGE_URL);
        });

        it('should return medium when small HTTP request fails', () => {
            const img = getFallbackImage(images, ImageSize.Small);
            expect(img).toEqual(images.medium);
        });

        it('should return fallback when small was already empty (getImage cascaded to medium which then failed)', () => {
            images.small = '';
            const img = getFallbackImage(images, ImageSize.Small);
            expect(img).toEqual(FALLBACK_IMAGE_URL);
        });

        it('should return fallback when small HTTP request fails and medium is missing', () => {
            images.medium = '';
            const img = getFallbackImage(images, ImageSize.Small);
            expect(img).toEqual(FALLBACK_IMAGE_URL);
        });
    });

    describe('getVideoThumbnailUrl', () => {
        it('should return thumbnail url', () => {
            const url = getVideoThumbnailUrl('test');

            expect(url).toEqual(YOUTUBE_THUMBNAIL_URL);
        });
    });

    describe('getBgImage', () => {
        it('should return empty string', () => {
            expect(getBgImage([], 'basePath')).toEqual('');
        });

        it('should return only url', () => {
            expect(
                getBgImage(
                    [
                        {
                            large: 'large',
                            medium: 'medium',
                            small: 'small',
                        },
                    ],
                    'basePath',
                    false,
                ),
            ).toEqual("url('basePath/print-image?url=large')");
        });

        it('should return bg image', () => {
            expect(
                getBgImage(
                    [
                        {
                            large: 'large',
                            medium: 'medium',
                            small: 'small',
                        },
                    ],
                    'basePath',
                ),
            ).toEqual(
                "linear-gradient(180deg, rgba(0, 0, 0, 0%) 7.04%, rgba(0, 0, 0, 44%) 100%), url('basePath/print-image?url=large')",
            );
        });
    });

    describe('getCloudinaryThumbnailUrl', () => {
        it('should return empty string when publicId is NOT provided', () => {
            expect(getCloudinaryThumbnailUrl()).toBe('');
        });

        it('should return empty string when isDisabled is true', () => {
            expect(getCloudinaryThumbnailUrl('test', true)).toBe('');
        });

        it('should return string with publicId', () => {
            expect(getCloudinaryThumbnailUrl('test', false)).toContain('test');
        });
    });
});
