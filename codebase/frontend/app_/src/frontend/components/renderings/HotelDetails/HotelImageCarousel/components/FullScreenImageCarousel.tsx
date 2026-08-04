import React, { FC, useEffect, useRef, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import { SwipeableHandlers } from 'react-swipeable';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ImageSize } from 'models/enum/ImageSize';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import { ISliderImage, ISliderItem } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import { Popup } from 'frontend/components/common/Popup';
import SliderNavButton from 'frontend/components/common/SliderNavButton';
import VideoPlayer from 'frontend/components/common/VideoPlayer/VideoPlayer';
import VideoThumbnailImage from 'frontend/components/common/VideoThumbnailImage/VideoThumbnailImage';
import SliderImage from 'frontend/components/renderings/SearchResults/components/SliderImage';

import styles from './FullScreenImageCarousel.module.scss';

export interface IFullScreenImageCarouselProps {
    currentImageIndex: number;
    fallbackImage: string;
    images: ISliderItem[];
    onClose: (idx: number) => void;
    autoPlay?: boolean;
    handleSlide?: (currentIndex: number, isFullScreen: boolean) => void;
    onCarouselSync?: (currentIndex: number, nextIndex: number) => void;
    setAutoPlay?: (value: boolean) => void;
    startIndex?: number;
    swipeHandlers?: SwipeableHandlers;
    trackThumbnailClick?: () => void;
    videoTitle?: string;
    youtubePlayerClassName?: string;
}

export const FullScreenImageCarousel: FC<IFullScreenImageCarouselProps> = ({
    images,
    fallbackImage,
    onClose,
    currentImageIndex,
    videoTitle,
    youtubePlayerClassName = 'media-video-carousel',
    handleSlide,
    swipeHandlers,
    onCarouselSync,
    trackThumbnailClick,
    startIndex,
    autoPlay,
    setAutoPlay,
}) => {
    const { isScreenLarge, isLandscapeOrientation, isScreenMedium } = useStore((stores: TStores) => ({
        isScreenLarge: stores.appStore.isScreenLarge,
        isLandscapeOrientation: stores.appStore.isLandscapeOrientation,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    useEffect(() => {
        initCustomThumbnails();

        const index = mainSlideRef.current?.getCurrentIndex() ?? 0;
        onCarouselSync?.(index, currentImageIndex);

        mainSlideRef?.current?.slideToIndex(currentImageIndex);

        if (isLandscapeOrientation && !isScreenLarge) {
            scrollVerticallyIfNedded();
        }

        if (!isLandscapeOrientation && !isScreenMedium) {
            scrollHorizontallyIfNeeded();
        }

        onSetDescriptionToShow();

        return () => {
            destroyCustomThumbnails();
        };
    }, []);

    useEffect(() => {
        if (isLandscapeOrientation && !isScreenLarge) {
            scrollVerticallyIfNedded();
        }

        if (!isLandscapeOrientation && !isScreenMedium) {
            scrollHorizontallyIfNeeded();
        }
    }, [isLandscapeOrientation, isScreenMedium, isScreenLarge]);

    const mainSlideRef = useRef<any>(null);
    const thumbsRef = useRef<any>(null);
    const [isDisabledArrowKeys, setDisabledArrowKeys] = useState(false);
    const [currentDescription, setCurrentDescription] = useState('');
    const onSetDescriptionToShow = () => {
        const idx = currentIndex(mainSlideRef);
        const description = images[idx]?.image?.description;
        setCurrentDescription(description || '');
    };

    const renderMainImage = (slideItem: ISliderItem) => {
        const { youtubeVideoId = '', image, index, videoPlaceholder, cloudinaryVideoSrc = '' } = slideItem;

        if (!!image) {
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
                wrapperClassName={youtubePlayerClassName}
                fallbackImage={fallbackImage}
                isBasicPreview
                videoPlaceholder={videoPlaceholder}
                isDisplayed={mainSlideRef.current?.state?.currentIndex === 0}
                title={videoTitle}
                autoPlay={autoPlay}
                setAutoPlay={setAutoPlay}
            />
        );
    };

    const initCustomThumbnails = (): void => {
        if (mainSlideRef.current?._thumbnailsWrapper && thumbsRef.current) {
            thumbsRef.current.appendChild(mainSlideRef.current._thumbnailsWrapper);
            thumbsRef.current.addEventListener('focus', enableArrowKeys);
            thumbsRef.current.addEventListener('blur', disableArrowKeys);
        }
    };
    const destroyCustomThumbnails = () => {
        if (thumbsRef.current) {
            thumbsRef.current.removeEventListener('focus', enableArrowKeys);
            thumbsRef.current.removeEventListener('blur', disableArrowKeys);
        }
    };
    const currentIndex = ref => (ref?.current ? ref.current.getCurrentIndex() : 0);
    const disableArrowKeys = () => {
        setDisabledArrowKeys(true);
    };

    const enableArrowKeys = () => {
        setDisabledArrowKeys(false);
    };

    const scrollHorizontallyIfNeeded = () => {
        if (thumbsRef.current) {
            const currentIdx = currentIndex(mainSlideRef);
            const selectedElem = thumbsRef.current.getElementsByClassName('image-gallery-thumbnail')[currentIdx];
            const container = thumbsRef.current.getElementsByClassName('image-gallery-thumbnails')[0];

            if (selectedElem && container && !isFullyInViewHorizontal(container, selectedElem)) {
                selectedElem.scrollIntoView({ inline: 'nearest' });
            }
        }
    };

    const scrollVerticallyIfNedded = () => {
        if (thumbsRef.current) {
            const currentIdx = currentIndex(mainSlideRef);
            const selectedElem = thumbsRef.current.getElementsByClassName('image-gallery-thumbnail')[currentIdx];

            if (selectedElem && !isFullyInViewVertical(thumbsRef.current, selectedElem)) {
                selectedElem.scrollIntoView(true);
            }
        }
    };

    const isFullyInViewVertical = (parent, elem) => {
        const eleTop = elem.offsetTop;
        const eleBottom = eleTop + elem.clientHeight;

        const containerTop = parent.scrollTop;
        const containerBottom = containerTop + parent.clientHeight;

        return eleTop >= containerTop && eleBottom <= containerBottom;
    };

    const renderLeftNav = (onClick: () => void) => (
        <SliderNavButton
            isLeftNav
            onClick={onClick}
            onFocus={enableArrowKeys}
            onBlur={disableArrowKeys}
            className='fullscreen-prev-btn'
        />
    );

    const isFullyInViewHorizontal = (parent, elem) => {
        const eleLeft = elem.offsetLeft;
        const eleRight = eleLeft + elem.clientWidth;

        const containerLeft = parent.scrollLeft;
        const containerRight = containerLeft + parent.clientWidth;

        // The element is fully visible in the container
        return eleLeft >= containerLeft && eleRight <= containerRight;
    };

    const renderRightNav = (onClick: () => void) => (
        <SliderNavButton
            onClick={onClick}
            onFocus={enableArrowKeys}
            onBlur={disableArrowKeys}
            className='fullscreen-next-btn'
        />
    );
    const renderThumbInner = ({
        image,
        index,
        youtubeVideoId = '',
        cloudinaryVideoSrc = '',
        videoPlaceholder,
    }: ISliderItem) =>
        !!image ? (
            <HotelImage
                className='img-carousel-thumbnails__image'
                image={image}
                fallbackImage={fallbackImage && cmsUrls.media(fallbackImage)}
                defaultSize={ImageSize.Small}
                key={image.id ?? index}
            />
        ) : (
            <VideoThumbnailImage
                className='img-carousel-thumbnails__image'
                fallbackImage={fallbackImage}
                videoPlaceholder={videoPlaceholder}
                youtubeId={youtubeVideoId}
                publicId={cloudinaryVideoSrc}
                isSmall
                showPlayButton
            />
        );

    const onSlide = (e: number): void => {
        if (thumbsRef?.current && mainSlideRef) {
            if (isLandscapeOrientation && !isScreenLarge) {
                scrollVerticallyIfNedded();
            }

            if (!isLandscapeOrientation && !isScreenMedium) {
                scrollHorizontallyIfNeeded();
            }
        }

        onSetDescriptionToShow();
        handleSlide?.(e, true);
    };

    return (
        <Popup
            containerClass='fullscreen-carousel'
            isCloseButtonOutside
            onClose={(): void => onClose(mainSlideRef?.current?.getCurrentIndex())}
        >
            <>
                <div className='carousel-container'>
                    <div className='image-description image-description--top'>{currentDescription}</div>
                    {images?.length ? (
                        <div {...swipeHandlers} className={styles.carouselWrapper}>
                            <ImageGallery
                                onSlide={onSlide}
                                items={images}
                                renderItem={renderMainImage}
                                renderLeftNav={renderLeftNav}
                                renderRightNav={renderRightNav}
                                renderThumbInner={renderThumbInner}
                                disableArrowKeys={isDisabledArrowKeys}
                                showPlayButton={false}
                                showThumbnails={true}
                                showIndex
                                showNav
                                lazyLoad
                                ref={mainSlideRef}
                                slideDuration={350}
                                disableThumbnailScroll={!isScreenMedium}
                                onThumbnailClick={trackThumbnailClick}
                                startIndex={startIndex}
                            />
                        </div>
                    ) : (
                        <div
                            className='hotel-card-img'
                            data-tid='fallback-image'
                            style={{ backgroundImage: `url(${cmsUrls.media(fallbackImage)})` }}
                        />
                    )}
                </div>

                <div className='image-description image-description--bottom'>{currentDescription}</div>

                <div
                    ref={thumbsRef}
                    className='img-carousel-thumbnails'
                    aria-label='Hotel images gallery'
                    tabIndex={0}
                />
            </>
        </Popup>
    );
};

export default observer(FullScreenImageCarousel);
