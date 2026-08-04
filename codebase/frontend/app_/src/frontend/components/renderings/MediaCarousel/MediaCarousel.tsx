import * as React from 'react';
import ImageGallery from 'react-image-gallery';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { TStores } from 'frontend/store/IStores';
import { IMediaContentCarouselFields } from 'models/data/MediaContent';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

interface IMediaCarouselFields {
    items?: IMediaContentCarouselFields[];
}

export interface IMediaCarouselProps extends ISitecoreComponent<IMediaCarouselFields> {
    isScreenLessMedium: boolean;
}

interface ICarouselItemProps {
    isScreenLessMedium: boolean;
    item: IMediaContentCarouselFields;
}

export const CarouselItem = (props: ICarouselItemProps): React.JSX.Element => {
    const { Image } = { ...props.item.fields };
    const backgroundSrc = Image?.value?.src;
    const mediaSize = props.isScreenLessMedium ? MediaSize.Medium : MediaSize.Large;
    const backgroundImage = backgroundSrc ? `url(${cmsUrls.media(backgroundSrc, getMediaSizeParams(mediaSize))})` : '';

    return <div className='media-carousel__item' style={{ backgroundImage }} />;
};

export const MediaCarousel = (props: IMediaCarouselProps): React.JSX.Element => (
    <div className='media-carousel'>
        {props.fields?.items && (
            <ImageGallery
                infinite={false}
                items={props.fields.items}
                showThumbnails={false}
                renderItem={item => <CarouselItem item={item} isScreenLessMedium={props.isScreenLessMedium} />}
                showBullets={!!(props.fields.items && props.fields.items.length > 1)}
                renderRightNav={(onClick, disabled): React.JSX.Element => (
                    <button
                        className={classNames('media-carousel__nav next', disabled && 'disabled')}
                        disabled={disabled}
                        onClick={onClick}
                    >
                        <SvgChevronRight />
                    </button>
                )}
                renderLeftNav={(onClick, disabled): React.JSX.Element => (
                    <button
                        className={classNames('media-carousel__nav prev', disabled && 'disabled')}
                        disabled={disabled}
                        onClick={onClick}
                    >
                        <SvgChevronLeft />
                    </button>
                )}
            />
        )}
    </div>
);

export default inject((stores: TStores) => ({
    isScreenLessMedium: stores.appStore.isScreenLessMedium,
}))(MediaCarousel);
