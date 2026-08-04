import React, { PureComponent, ReactNode } from 'react';
import ImageGallery from 'react-image-gallery';
import { SwipeableHandlers } from 'react-swipeable';
import classnames from 'classnames';
import { inject, observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { TStores } from 'frontend/store/IStores';
import { removeNullOrUndefined } from 'frontend/utils/array.utils';
import isBackend from 'frontend/utils/isBackend';
import { incrementByCondition } from 'frontend/utils/numbers';
import { extendSitecoreImage } from 'frontend/utils/url.utils';
import { IImage } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import Button from 'frontend/components/common/Button';
import ImagesMultipleSortPopup from 'frontend/components/common/ImagesMultipleSortPopup/ImagesMultipleSortPopup';
import SliderNavButton from 'frontend/components/common/SliderNavButton';
import { getVideoId } from 'frontend/components/common/VideoPlayer/video.utils';
import VideoPlayer from 'frontend/components/common/VideoPlayer/VideoPlayer';
import SvgEnlarge from 'frontend/components/icons-new/Enlarge';
import FullScreenImageCarousel from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/FullScreenImageCarousel';
import { shouldPreventFullScreenActivation } from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarousel.utils';
import SliderImage from 'frontend/components/renderings/SearchResults/components/SliderImage';

import styles from './OfferCardSlider.module.scss';

export interface IOfferCardSliderProps {
    fallbackImage: string;
    images: Nullable<IImage[]>;
    showIndex: boolean;
    addImage?: (imagesItemId: string | null, callback?, itemId?: string) => void;
    carouselWrapperClassName?: string;
    className?: string;
    cloudinaryVideoSrc?: string;
    deleteImage?: (id: string) => Promise<void>;
    deleteImages?: (id: string[]) => Promise<void>;
    getImageByItemId?: (itemId: string) => Promise<IImage | null>;
    isCloudinaryDisabled?: boolean;
    isEditMode?: boolean;
    isFullScreenEnabled?: boolean | null;
    isPromoPage?: boolean;
    isSearchResultsPage?: boolean;
    isSmallImageVariant?: boolean;
    offer?: IOffer;
    onArrowClick?: () => void;
    roomImagesFolderId?: string | null;
    roomItemId?: string;
    setShowPills?: (canShow: boolean) => void;
    sortImages?: (itemsIds: string[]) => Promise<void>;
    trackingHandlers?: {
        handleSlide?: (currentIndex: number, isFullScreen?: boolean) => void;
        onCarouselSync?: (currentIndex: number, nextIndex: number) => void;
        swipeHandlers?: SwipeableHandlers;
        trackFullScreenClose?: (index: number) => void;
        trackFullScreenOpen?: (index: number, isImageClick?: boolean) => void;
        trackThumbnailClick?: () => void;
    };
    videoIndex?: number;
    videoPlaceholder?: string;
    youtubeVideoId?: string;
}

export interface ISliderImage extends ISliderBasicParams {
    image: IImage;
}

interface ISliderBasicParams {
    index: number;
    totalSlides: number;
    id?: string;
    selected?: boolean;
}

export interface ISliderVideo extends ISliderBasicParams {
    cloudinaryVideoSrc?: string;
    thumbnailClass?: string;
    videoPlaceholder?: string;
    youtubeVideoId?: string;
}

export interface ISliderItem extends ISliderBasicParams {
    cloudinaryVideoSrc?: string;
    image?: IImage;
    thumbnailClass?: string;
    videoPlaceholder?: string;
    youtubeVideoId?: string;
}

interface IOfferCardSliderState {
    addingImage: boolean;
    hadInteraction: boolean;
    images: IImage[];
    isFullScreenActivated: boolean;
    isLeftNavAdded: boolean;
    isRightNavAdded: boolean;
    showImagesSort: boolean;
    isDisabledArrowKeys?: boolean;
}

export class OfferCardSlider extends PureComponent<IOfferCardSliderProps, IOfferCardSliderState> {
    private ref = React.createRef<any>();

    state = {
        images: this.props.images || [],
        isDisabledArrowKeys: true,
        hadInteraction: false,
        isFullScreenActivated: false,

        // Experience Editor specific flags
        isLeftNavAdded: false,
        isRightNavAdded: false,
        addingImage: false,
        showImagesSort: false,
    };

    private viewRef = React.createRef<HTMLDivElement>();

    componentDidMount(): void {
        const carousel = this.ref?.current?._imageGallery.getElementsByClassName('image-gallery-slides')[0];
        carousel?.addEventListener('click', this.activateFullScreenMode);
        this.viewRef.current?.addEventListener('keyup', this.stopArrowKeyPropagation);

        if (this.props.isEditMode && this.viewRef.current) {
            // we use addEventListener here, because React events don't work in Experience Editor
            this.viewRef.current
                ?.querySelector('.img-carousel-manage .add-image-btn')
                ?.addEventListener('click', this.addImage);
            this.viewRef.current
                ?.querySelector('.img-carousel-manage .sort-images-btn')
                ?.addEventListener('click', this.showImageSort);
            this.viewRef.current
                ?.querySelector('.img-carousel-manage .delete-image-btn')
                ?.addEventListener('click', this.onImageRemove);
        }
    }

    componentDidUpdate(prevProps: IOfferCardSliderProps): void {
        const image = this.props.images?.length ? this.props.images[0] : null;
        const prevImage = prevProps.images?.length ? prevProps.images[0] : null;
        // Update images in state if props images updated (compare first image by id or type (id can be undefined))

        if (image?.id !== prevImage?.id || image?.medium !== prevImage?.medium) {
            this.setState({ images: this.props.images || [] });
        }
    }

    componentWillUnmount(): void {
        const carousel = this.ref?.current?._imageGallery.getElementsByClassName('image-gallery-slides')[0];
        carousel?.removeEventListener('click', this.activateFullScreenMode);
        this.viewRef.current?.removeEventListener('keyup', this.stopArrowKeyPropagation);

        if (this.props.isEditMode && this.viewRef.current) {
            this.viewRef.current
                ?.querySelector('.img-carousel-manage .add-image-btn')
                ?.removeEventListener('click', this.addImage);
            this.viewRef.current
                ?.querySelector('.img-carousel-manage .sort-images-btn')
                ?.removeEventListener('click', this.showImageSort);
            this.viewRef.current
                ?.querySelector('.img-carousel-manage .delete-image-btn')
                ?.removeEventListener('click', this.onImageRemove);
        }
    }

    private readonly activateFullScreenMode = (e: MouseEvent): void => {
        const target = e.target as HTMLImageElement;

        if (shouldPreventFullScreenActivation(target)) {
            return;
        }

        this.props.trackingHandlers?.trackFullScreenOpen?.(this.ref.current?.getCurrentIndex(), true);
        this.setState({ isFullScreenActivated: true });
    };

    private deleteSitecoreImages = async (e: THTMLElementEvent<HTMLButtonElement>, selectedImages?: ISliderImage[]) => {
        const shouldDelete = confirm('Are you sure you want to delete these images?');

        if (!shouldDelete || !selectedImages?.length || !this.props.deleteImages) {
            return false;
        }

        const target = e.target;

        try {
            target.classList?.add('btn--loading');

            const selectedItemIds = removeNullOrUndefined(selectedImages.map(image => image.id));

            await this.props.deleteImages(selectedItemIds);

            return true;
        } catch {
            return false;
        } finally {
            target.classList?.remove('btn--loading');
        }
    };

    private onImageRemove = (e: THTMLElementEvent<HTMLButtonElement>) => {
        const target = e.target;

        const shouldDelete = confirm('Are you sure you want to delete this image?');

        if (!shouldDelete) {
            return;
        }

        try {
            target.classList?.add('btn--loading');

            // index to remove
            const currentIndex = this.ref.current?.getCurrentIndex();

            const imageItemId = this.state.images[currentIndex]?.id;
            imageItemId && this.props.deleteImage?.(imageItemId);

            const newImages = [...this.state.images];
            newImages.splice(currentIndex, 1);
            const currentLength = newImages.length || 0;

            this.setState({ images: newImages }, () => {
                // slide to current image or last (if last image was deleted)
                this.ref.current?.slideToIndex(currentLength < currentIndex + 1 ? currentLength - 1 : currentIndex);
            });
        } catch {
        } finally {
            target.classList?.remove('btn--loading');
        }
    };

    private get filteredImages(): IImage[] {
        return this.state.images.filter(image => image.medium || (image.large && image.small));
    }

    // Ensure videoIndex is not negative and does not exceed the number of images (if videoIndex is greater than the number of images, it will be set to the last index)
    private get resolvedVideoIndex(): number {
        const videoIndex = Math.max(this.props.videoIndex ?? 0, 0);
        const maxIndex = this.filteredImages.length;

        return Math.min(videoIndex, maxIndex);
    }

    private get images(): ISliderImage[] {
        if (!this.state.images) {
            return [];
        }

        const hasVideo = !!this.props.youtubeVideoId || !!this.props.cloudinaryVideoSrc;

        return this.filteredImages.map((image, i, arr) => ({
            index: incrementByCondition(i, hasVideo && i >= this.resolvedVideoIndex),
            image: {
                id: image.id ?? String(i),
                large: extendSitecoreImage(image.large),
                medium: extendSitecoreImage(image.medium),
                small: extendSitecoreImage(image.small),
            },
            totalSlides: incrementByCondition(arr.length, hasVideo),
            selected: image.selected,
            thumbnailClass: 'img-carousel-manage',
            id: image.id,
        }));
    }

    private get currentIndex(): number {
        return this.ref?.current ? this.ref.current.getCurrentIndex() : 0;
    }

    private readonly stopArrowKeyPropagation = (e: KeyboardEvent): void => {
        if (e.key === KeyboardKey.ArrowLeft || e.key === KeyboardKey.ArrowRight) {
            e.stopPropagation();
        }
    };

    private disableArrowKeys = () => {
        this.setState({ isDisabledArrowKeys: true });
    };

    private enableArrowKeys = () => {
        this.setState({ isDisabledArrowKeys: false });
    };

    private readonly activateFullScreen = (): void => {
        if (this.props.isFullScreenEnabled) {
            this.props.trackingHandlers?.trackFullScreenOpen?.(this.ref.current?.getCurrentIndex());
            this.setState({ isFullScreenActivated: true });
        }
    };

    private readonly deactivateFullScreen = (idx: number): void => {
        if (this.props.isFullScreenEnabled) {
            this.props.trackingHandlers?.trackFullScreenClose?.(idx);
            const currentIndex = this.ref.current?.getCurrentIndex();

            this.props.trackingHandlers?.onCarouselSync?.(currentIndex, idx);

            this.setState({ isFullScreenActivated: false });
            this.ref.current?.slideToIndex(idx);
        }
    };

    private readonly additionalClickHandler = (): void => {
        this.props.onArrowClick?.();
        this.props.setShowPills?.(true);
    };

    private readonly renderLeftNav = (onClick: () => void): React.JSX.Element => {
        // addEventListener so it can work in EE, but add only once
        if (this.props.isEditMode && !this.state.isLeftNavAdded && this.viewRef.current && !isBackend()) {
            const element = this.viewRef.current.querySelector('.slider-nav--prev');

            if (element) {
                element.addEventListener('click', onClick);
                this.setState({ isLeftNavAdded: true });
            }
        }

        return (
            <SliderNavButton
                isLeftNav
                onClick={(): void => {
                    onClick();
                    this.additionalClickHandler();
                }}
                onFocus={this.enableArrowKeys}
                onBlur={this.disableArrowKeys}
            />
        );
    };

    private readonly renderRightNav = (onClick: () => void): React.JSX.Element => {
        // addEventListener so it can work in EE, but add only once
        if (this.props.isEditMode && !this.state.isRightNavAdded && this.viewRef.current && !isBackend()) {
            const element = this.viewRef.current.querySelector('.slider-nav--next');

            if (element) {
                element.addEventListener('click', onClick);
                this.setState({ isRightNavAdded: true });
            }
        }

        return (
            <SliderNavButton
                onClick={(): void => {
                    onClick();
                    this.additionalClickHandler();
                }}
                onFocus={this.enableArrowKeys}
                onBlur={this.disableArrowKeys}
            />
        );
    };

    private readonly renderFullScreenBtn = (): Nullable<React.JSX.Element> =>
        this.props.isFullScreenEnabled ? (
            <button
                type='button'
                className='fullscreen-btn'
                onClick={this.activateFullScreen}
                aria-label='Open Fullscreen'
            >
                <SvgEnlarge />
            </button>
        ) : null;

    private readonly onSortPopupClose = async (images?: ISliderImage[]): Promise<void> => {
        if (images && this.props.sortImages) {
            await this.props.sortImages(images.map(i => i.image.id).filter(i => !!i) as string[]);
            this.setState({ images: images.map(i => i.image) });
        }

        this.setState({ showImagesSort: false });
    };

    private readonly addImage = (): void => {
        this.setState({ addingImage: true });

        this.props.addImage?.(
            this.props.roomImagesFolderId || null,
            async (itemId: string) => {
                const image = this.props.getImageByItemId && (await this.props.getImageByItemId(itemId));

                if (image) {
                    this.setState({ images: [...this.state.images, image] }, () => {
                        this.ref.current?.slideToIndex(this.images.length - 1);
                    });
                }

                this.setState({ addingImage: false });
            },
            this.props.roomItemId,
        );
    };

    private readonly showImageSort = (): void => {
        this.setState({ showImagesSort: true });
    };

    onSlide = (): void => {
        if (!this.state.hadInteraction) {
            this.setState({ hadInteraction: true });
        }

        this.props.trackingHandlers?.handleSlide?.(this.currentIndex, this.state.isFullScreenActivated);
    };

    private get imagesWithVideo(): (ISliderImage | ISliderVideo)[] {
        const videoId = this.props.youtubeVideoId || this.props.cloudinaryVideoSrc;
        const numberOfItems = incrementByCondition(this.filteredImages.length, !!videoId);

        if (!videoId) {
            return this.images;
        }

        const videoItem: ISliderVideo = {
            index: this.resolvedVideoIndex,
            totalSlides: numberOfItems,
            youtubeVideoId: this.props.youtubeVideoId,
            cloudinaryVideoSrc: this.props.cloudinaryVideoSrc,
            videoPlaceholder: this.props.videoPlaceholder,
            id: `video-${videoId}`,
            thumbnailClass: 'img-carousel-thumbnails__thumbnail',
        };

        const result: (ISliderImage | ISliderVideo)[] = [...this.images];
        result.splice(this.resolvedVideoIndex, 0, videoItem);

        return result;
    }

    renderItems = (slideItem: ISliderItem): JSX.Element => {
        const { youtubeVideoId, image, index, videoPlaceholder, cloudinaryVideoSrc } = slideItem;
        const { offer } = this.props;

        if (image) {
            return (
                <SliderImage
                    key={image.id ?? index}
                    item={slideItem as ISliderImage}
                    slideIndex={this.currentIndex}
                    fallbackImage={cmsUrls.media(this.props.fallbackImage)}
                    hadInteraction={this.state.hadInteraction}
                />
            );
        }

        return (
            <VideoPlayer
                youtubeVideoId={youtubeVideoId}
                cloudinaryVideoSrc={cloudinaryVideoSrc}
                wrapperClassName={styles.youtubePlayer}
                thumbnailClassName={styles.thumbnailClassName}
                fallbackImage={this.props.fallbackImage}
                videoPlaceholder={videoPlaceholder}
                isBasicPreview
                isDisplayed={this.currentIndex === this.resolvedVideoIndex && !this.state.isFullScreenActivated}
                title={offer?.hotel?.name}
                onPlayCallback={(): void => this.props.setShowPills?.(false)}
            />
        );
    };

    render(): ReactNode {
        const { images } = this.state;
        const { className, isFullScreenEnabled, trackingHandlers, isSmallImageVariant } = this.props;
        const videoId = getVideoId(
            this.props.isCloudinaryDisabled,
            this.props.cloudinaryVideoSrc,
            this.props.youtubeVideoId,
        );

        return (
            <div
                ref={this.viewRef}
                data-tid='offer-card-slider'
                className={classnames(styles.container, className, {
                    [styles.smallImageContainer]: isSmallImageVariant,
                    [styles.fullScreenEnabled]: isFullScreenEnabled,
                })}
            >
                {this.state.isFullScreenActivated && isFullScreenEnabled && !!images.length && (
                    <FullScreenImageCarousel
                        images={videoId ? this.imagesWithVideo : this.images}
                        fallbackImage={this.props.fallbackImage}
                        onClose={this.deactivateFullScreen}
                        currentImageIndex={this.currentIndex}
                        youtubePlayerClassName={styles.youtubePlayer}
                        handleSlide={trackingHandlers?.handleSlide}
                        swipeHandlers={trackingHandlers?.swipeHandlers}
                        onCarouselSync={trackingHandlers?.onCarouselSync}
                        trackThumbnailClick={trackingHandlers?.trackThumbnailClick}
                    />
                )}
                {images.length ? (
                    <div
                        className={classnames(styles.carouselWrapper, this.props.carouselWrapperClassName)}
                        {...trackingHandlers?.swipeHandlers}
                    >
                        <ImageGallery
                            items={videoId ? this.imagesWithVideo : this.images}
                            showThumbnails={false}
                            showIndex={this.props.showIndex}
                            renderItem={this.renderItems}
                            onSlide={this.onSlide}
                            renderFullscreenButton={this.renderFullScreenBtn}
                            renderLeftNav={this.renderLeftNav}
                            renderRightNav={this.renderRightNav}
                            disableArrowKeys={this.state.isDisabledArrowKeys}
                            lazyLoad
                            ref={this.ref}
                            slideDuration={350}
                            showPlayButton={false}
                        />
                    </div>
                ) : (
                    <div
                        className='hotel-card-img'
                        data-tid='fallback-image'
                        style={{ backgroundImage: `url(${cmsUrls.media(this.props.fallbackImage)})` }}
                    />
                )}
                {this.props.isEditMode && this.props.addImage && (
                    <div className='img-carousel-manage'>
                        {!!images && !!images.length && (
                            <Button onClick={() => {}} className='delete-image-btn p-1'>
                                Remove image
                            </Button>
                        )}
                        <Button onClick={() => {}} className='add-image-btn p-1' isLoading={this.state.addingImage}>
                            Add image
                        </Button>
                        {!!images && !!images.length && (
                            <button className='btn sort-images-btn p-1'>Curate images</button>
                        )}
                    </div>
                )}
                {this.state.showImagesSort && (
                    <ImagesMultipleSortPopup
                        images={this.images}
                        onClose={this.onSortPopupClose}
                        deleteSitecoreImages={this.deleteSitecoreImages}
                    />
                )}
            </div>
        );
    }
}

const ConnectedHotelImageCarousel = inject((stores: TStores) => ({
    deleteImages: stores.editorStore.deleteItems,
    sortImages: stores.editorStore.sortItems,
    isCloudinaryDisabled: stores.layoutStore.isCloudinaryDisabled,
}))(observer(OfferCardSlider));

export default ConnectedHotelImageCarousel;
