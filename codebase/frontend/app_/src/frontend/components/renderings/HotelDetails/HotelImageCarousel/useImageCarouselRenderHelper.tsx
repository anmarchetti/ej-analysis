import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import { ImageSize } from 'models/enum/ImageSize';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import { ISliderImage, ISliderItem } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import SliderNavButton from 'frontend/components/common/SliderNavButton';
import VideoPlayer from 'frontend/components/common/VideoPlayer/VideoPlayer';
import VideoThumbnailImage from 'frontend/components/common/VideoThumbnailImage/VideoThumbnailImage';
import SvgEnlarge from 'frontend/components/icons-new/Enlarge';
import SliderImage from 'frontend/components/renderings/SearchResults/components/SliderImage';

interface IImageCarouselRenderHelperProps {
    currentIndex: (ref: any) => number;
    disableArrowKeys: () => void;
    enableArrowKeys: () => void;
    fallbackImage: string;
    isEditMode: boolean;
    isFullScreenActive: boolean;
    isFullScreenEnabled: boolean;
    mainSlideRef: React.RefObject<any>;
    openFullScreen: () => void;
    setIsPromoBannerShown: (isShown: boolean) => void;
    thumbnailFallbackImage: string;
    offer?: Nullable<IOffer | IOfferWithoutAltBoards>;
    withoutSelection?: boolean;
}

interface IImageCarouselRenderHelperReturn {
    renderFullScreenBtn: () => JSX.Element | null;
    renderLeftNav: (onClick: () => void) => JSX.Element;
    renderMainImage: (slideItem: ISliderItem) => JSX.Element;
    renderRightNav: (onClick: () => void) => JSX.Element;
    renderThumbInner: (slideItem: ISliderItem) => JSX.Element;
}

export const useImageCarouselRenderHelper = ({
    currentIndex,
    mainSlideRef,
    fallbackImage,
    thumbnailFallbackImage,
    isFullScreenActive,
    isEditMode,
    withoutSelection,
    enableArrowKeys,
    disableArrowKeys,
    isFullScreenEnabled,
    openFullScreen,
    offer,
    setIsPromoBannerShown,
}: IImageCarouselRenderHelperProps): IImageCarouselRenderHelperReturn => {
    const renderMainImage = (slideItem: ISliderItem): JSX.Element => {
        const { youtubeVideoId = '', cloudinaryVideoSrc = '', image, index } = slideItem;

        if (image) {
            return (
                <SliderImage
                    key={image.id ?? index}
                    item={slideItem as ISliderImage}
                    slideIndex={currentIndex(mainSlideRef)}
                    slideSize={ImageSize.Large}
                    fallbackImage={fallbackImage && cmsUrls.media(fallbackImage)}
                />
            );
        }

        return (
            <VideoPlayer
                youtubeVideoId={youtubeVideoId}
                cloudinaryVideoSrc={cloudinaryVideoSrc}
                wrapperClassName='media-video-carousel'
                fallbackImage={fallbackImage}
                videoPlaceholder={slideItem.videoPlaceholder}
                isBasicPreview
                isDisplayed={mainSlideRef?.current?.state?.currentIndex === 0 && !isFullScreenActive}
                title={offer?.hotel?.name}
                onPlayCallback={(): void => setIsPromoBannerShown(false)}
            />
        );
    };

    const renderThumbInner = ({
        image,
        index,
        youtubeVideoId = '',
        cloudinaryVideoSrc = '',
        videoPlaceholder,
    }: ISliderItem): JSX.Element => {
        const renderedImage = image ? (
            <HotelImage
                key={image.id ?? index}
                className='img-carousel-thumbnails__image'
                image={image}
                fallbackImage={cmsUrls.media(thumbnailFallbackImage)}
                defaultSize={ImageSize.Small}
            />
        ) : (
            <VideoThumbnailImage
                youtubeId={youtubeVideoId}
                publicId={cloudinaryVideoSrc}
                className='img-carousel-thumbnails__image'
                fallbackImage={thumbnailFallbackImage}
                videoPlaceholder={videoPlaceholder}
                isSmall
                showPlayButton
            />
        );

        if (isEditMode && !!image) {
            return (
                <>
                    {!withoutSelection && (
                        //     Use button to select images. Don't use checkbox for it, because doesn't work correctly in EE
                        <button
                            type='button'
                            data-item-id={image.id}
                            data-item-index={index}
                            className={classNames('btn select-image-btn', image.selected && 'checked')}
                            aria-label={'Select image'}
                            data-tid='select-image'
                        />
                    )}

                    {renderedImage}

                    <div className='text-center'>
                        <button
                            data-item-id={image.id}
                            data-item-index={index}
                            className='btn delete-image-btn'
                            data-tid='remove-button'
                        >
                            Remove
                        </button>
                    </div>
                </>
            );
        }

        return renderedImage;
    };

    const renderLeftNav = (onClick: () => void): JSX.Element => (
        <SliderNavButton isLeftNav onClick={onClick} onFocus={enableArrowKeys} onBlur={disableArrowKeys} />
    );

    const renderRightNav = (onClick: () => void): JSX.Element => (
        <SliderNavButton onClick={onClick} onFocus={enableArrowKeys} onBlur={disableArrowKeys} />
    );

    const renderFullScreenBtn = (): JSX.Element | null =>
        isFullScreenEnabled ? (
            <button type='button' className='fullscreen-btn' onClick={openFullScreen} aria-label='Open Fullscreen'>
                <SvgEnlarge />
            </button>
        ) : null;

    return {
        renderMainImage,
        renderThumbInner,
        renderLeftNav,
        renderRightNav,
        renderFullScreenBtn,
    };
};
