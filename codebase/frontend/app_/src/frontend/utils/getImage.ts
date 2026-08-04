import { cmsUrls } from 'code/endpoints';
import { IImage } from 'models/data/IHotel';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import { ImageSize } from 'models/enum/ImageSize';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

/** This function checks if image of default size is available, if not tries to load image of smaller size */
export function getImage(image: IImage, defaultSize = ImageSize.Large): Promise<string> {
    return new Promise(resolve => {
        try {
            let img: Nullable<HTMLImageElement> = new Image();
            let images = [image.large, image.medium, image.small] as string[];

            if (defaultSize === ImageSize.Medium) {
                images.splice(0, 1); // don't load large image
            } else if (defaultSize === ImageSize.Small) {
                images.splice(0, 2); // don't load large and medium images
            }

            images = images.filter(Boolean);

            if (!images.length) {
                resolve('');
            }

            let index = 0;

            img.src = getImageUrl(images[index]);

            // here we try load image with another dimension if this image was not loaded
            img.onerror = () => {
                if (index === images.length - 1) {
                    img = undefined as any;
                    resolve(getImageUrl(images[index]));
                } else {
                    index++;

                    if (img) {
                        img.src = getImageUrl(images[index]);
                    }
                }
            };

            img.onload = () => {
                resolve(getImageUrl(images[index]));
            };
        } catch (e) {}
    });
}

export function getImageUrl(url: string) {
    const imageUrl = url.startsWith('/-/media') || url.startsWith('/-/jssmedia') ? cmsUrls.media(url) : url;

    return imageUrl.replace('+', encodeURIComponent('+'));
}

/**
 * Get Background Styles for Sitecore Image field
 * (backgroundImage, backgroundSize and backgroundPosition (if there are focal points settings)
 */
export const getSitecoreImageBackgroundStyles = (
    imageField: ISitecoreField<ISitecoreImage> | undefined,
    mediaSize: MediaSize | undefined,
    isScreenLessMedium: boolean = false,
    isEditMode: boolean = false,
): React.CSSProperties | undefined => {
    const image = imageField?.value;

    if (!image?.src || isEditMode) return undefined;

    const mediaSizeParams = mediaSize ? getMediaSizeParams(mediaSize) : undefined;
    const backgroundImage = `url(${cmsUrls.media(image.src, mediaSizeParams)})`;

    const styles = getImageFocalPointStyles(image, isScreenLessMedium);

    return { backgroundImage, ...styles };
};

/** This function get styles for Images which have focal points settings*/
export const getImageFocalPointStyles = (
    image: ISitecoreImage,
    isScreenLessMedium?: boolean,
): React.CSSProperties | undefined => {
    const fpoint = {
        x: isScreenLessMedium ? image.mfx : image.dfx,
        y: isScreenLessMedium ? image.mfy : image.dfy,
    };

    const isPropExists = fpoint.x && fpoint.y;

    if (isPropExists) {
        const backgroundPosition = isPropExists ? `${fpoint.x}% ${fpoint.y}%` : '';
        const styles: React.CSSProperties = {
            backgroundSize: 'cover',
            backgroundPosition,
        };

        return styles;
    }

    return undefined;
};
