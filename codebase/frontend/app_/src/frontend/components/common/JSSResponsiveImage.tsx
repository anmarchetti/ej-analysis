import { FC } from 'react';
import { inject } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { TStores } from 'frontend/store/IStores';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { JSSImage } from './JSSImage';

export interface IJSSResponsiveImageProps {
    field: ISitecoreField<ISitecoreImage>;
    className?: string;
    isEditMode?: boolean;
}

export const JSSResponsiveImage: FC<IJSSResponsiveImageProps> = props => {
    const imageField = props.field;

    if (!imageField?.value?.src) {
        return null;
    }

    if (!props.isEditMode && imageField) {
        imageField.value.src = cmsUrls.media(imageField.value.src);
    }

    const getSrcSet = (): string[] =>
        [MediaSize.Large, MediaSize.Big, MediaSize.Medium, MediaSize.Small].map(
            size => `${cmsUrls.media(imageField.value.src, getMediaSizeParams(size))} ${getMediaSizeParams(size).mw}w`,
        );

    return (
        <JSSImage
            field={imageField}
            srcSet={getSrcSet()}
            sizes={`(min-width: ${getMediaSizeParams(MediaSize.Large).mw}px) ${
                getMediaSizeParams(MediaSize.Large).mw
            }px, (min-width: ${getMediaSizeParams(MediaSize.Big).mw}px) ${
                getMediaSizeParams(MediaSize.Big).mw
            }px, (min-width: ${getMediaSizeParams(MediaSize.Medium).mw}px) ${
                getMediaSizeParams(MediaSize.Medium).mw
            }px, (min-width: 0px) ${getMediaSizeParams(MediaSize.Small).mw}px`}
            src={imageField.value.src}
            className={props.className}
        />
    );
};

export default inject((stores: TStores) => ({
    isEditMode: stores.layoutStore.isEditMode,
}))(JSSResponsiveImage);
