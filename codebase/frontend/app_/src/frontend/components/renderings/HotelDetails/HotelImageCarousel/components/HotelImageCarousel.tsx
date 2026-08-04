import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useCarouselTracking from 'frontend/hooks/useCarouselTracking/useCarouselTracking';
import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useShouldRenderVideo from 'frontend/hooks/useShouldRenderVideo';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IImage } from 'models/data/IHotel';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import ImagesMultipleSortPopup from 'frontend/components/common/ImagesMultipleSortPopup/ImagesMultipleSortPopup';
import LikeBadge from 'frontend/components/common/LikeBadge';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import { ISliderImage, ISliderVideo } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import PromoBadge from 'frontend/components/common/PromoBadge';
import SocialProofingBanner from 'frontend/components/common/SocialProofingBanner/SocialProofingBanner';
import { getVideoId } from 'frontend/components/common/VideoPlayer/video.utils';
import { useImageCarouselRenderHelper } from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/useImageCarouselRenderHelper';

import FullScreenImageCarousel from './FullScreenImageCarousel';
import useIsLuxuryStatus, {
    changeMainImageSrcInEditMode,
    getCardDescription,
    getDesktopLuxuryProps,
    handleThumbnailClickInEditMode,
    shouldPreventFullScreenActivation,
} from './HotelImageCarousel.utils';
import HotelImageCarouselEditMode from './HotelImageCarouselEditMode';
import HotelImageCarouselShimmer from './HotelImageCarouselShimmer';
import HotelImageCarouselThumbnails from './HotelImageCarouselThumbnails';
import ImagesSortPopup from './ImagesSortPopup';
import LuxuryImageCarousel from './LuxuryImageCarousel';

import styles from './HotelImageCarousel.module.scss';

export interface IHotelImageCarouselProps {
    fallbackImage: string;
    rendering: any;
    offer?: Nullable<IOfferWithoutAltBoards | IOffer>;
    withoutSelection?: boolean;
}

export const HotelImageCarousel: React.FC<IHotelImageCarouselProps> = ({
    rendering,
    fallbackImage,
    offer,
    withoutSelection,
}) => {
    const {
        isEditMode,
        layoutId,
        layout,
        getPhrase,
        getSetting,
        addImage,
        deleteImage,
        deleteImages,
        sortImages,
        getImageByItemId,
        isCloudinaryDisabled,
        isWeLovePillEnabled,
        isFullScreenEnabled,
        isBookingSidebarLoaded,
        isHotelDetailsBookPage,
        isHotelDetailsBrowsePage,
        currency,
        formatMoney,
        getLivePrice,
    } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        layoutId: stores.layoutStore.layoutId,
        layout: stores.layoutStore.layout,
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        addImage: stores.editorStore.addImage,
        deleteImage: stores.editorStore.deleteItem,
        deleteImages: stores.editorStore.deleteItems,
        sortImages: stores.editorStore.sortItems,
        getImageByItemId: stores.editorStore.getImageByItemId,
        isCloudinaryDisabled: stores.layoutStore.isCloudinaryDisabled,
        isWeLovePillEnabled: stores.layoutStore.isWeLovePillEnabled,
        isFullScreenEnabled: stores.layoutStore.isFullScreenEnabledHotelDetails,
        isBookingSidebarLoaded: stores.bookingStore.isBookingSidebarLoaded,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
        currency: stores.marketStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        getLivePrice: async (code): Promise<ILivePrice[]> => {
            const { isPromotingIframe, roomsAllocationFromUrl: rooms } = stores.queryParamStore;

            const hasChildren = rooms.some(room => room.children > 0);
            const ignoreLivePrice = isPromotingIframe() && hasChildren;

            if (!stores.layoutStore.isHotelDetailsBrowseStateLivePriceEnabled || ignoreLivePrice || !code) {
                return [];
            }

            return await stores.hotelsStore.getLivePrice([code], true);
        },
    }));

    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPerson);

    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const [images, setImages] = useState<IImage[]>(offer?.hotel?.images || []);
    const [isLocallyLoaded, setIsLocallyLoaded] = useState(false);
    const [isDisabledArrowKeys, setIsDisabledArrowKeys] = useState(true);
    const [isFullScreenActive, setIsFullScreenActive] = useState(false);
    const [addingImage, setAddingImage] = useState(false);
    const [showImagesSort, setShowImagesSort] = useState(false);
    const [imagesReady, setImagesReady] = useState(false);
    const [isPromoBannerShown, setIsPromoBannerShown] = useState(true);
    const [autoPlay, setAutoPlay] = useState(false);
    const [wasSocialProofingClosed, setWasSocialProofingClosed] = useState(false);
    const cookiesAccepted = useShouldRenderVideo();
    const [prices, setPrices] = useState<ILivePrice[]>([]);

    const viewRef = useRef<HTMLDivElement>(null);
    const mainSlideRef = useRef<ImageGallery>(null);
    const thumbsRef = useRef<HTMLDivElement>(null);

    const giataCode = layout?.sitecore?.route?.fields?.GiataCode?.value;

    // moved from HotelImageSideBarBrowse to here
    // because the sidebar mounts two times on luxury hotels
    // and makes double requests for live prices;
    // load live prices when giataCode changes
    // and set to empty array on unmount
    useEffect(() => {
        getLivePrice(giataCode).then(prices => setPrices(prices));

        return () => setPrices([]);
    }, [giataCode]);

    const isLuxury = useIsLuxuryStatus(offer?.promoCollections);
    const isLuxuryDesktop = isLuxury && isMoreThenTabletViewport;

    const thumbnailFallbackImage = getSetting(SiteSettings.HotelThumbnailFallbackImage);

    const currentIndex = (imageGalleryRef: MutableRefObject<ImageGallery>): number =>
        imageGalleryRef.current?.getCurrentIndex() ?? 0;

    const disableArrowKeys = (): void => {
        setIsDisabledArrowKeys(true);
    };

    const enableArrowKeys = (): void => {
        setIsDisabledArrowKeys(false);
    };

    const youtubeVideoId = layout?.sitecore?.route?.fields?.YoutubeVideoId?.value ?? offer?.hotel?.youtubeVideoId;
    const cloudinaryVideoSrc =
        layout?.sitecore?.route?.fields?.CloudinaryVideoSrc?.value ?? offer?.hotel?.cloudinaryVideoSrc;
    const videoId = getVideoId(isCloudinaryDisabled, cloudinaryVideoSrc, youtubeVideoId);
    const videoPlaceholderLayoutSitecore = layout?.sitecore?.route?.fields?.VideoPlaceholder?.value?.src;
    const videoPlaceholderOffer = offer?.hotel?.videoPlaceholder && cmsUrls.media(offer.hotel.videoPlaceholder);
    const videoPlaceholder = videoPlaceholderLayoutSitecore || videoPlaceholderOffer || '';

    const imagesList: ISliderImage[] = images
        .filter(image => image.medium || (image.large && image.small))
        .map((image, i, arr) => ({
            index: videoId ? i + 1 : i,
            image: image,
            totalSlides: videoId ? arr.length + 1 : arr.length,
            thumbnailClass: 'img-carousel-thumbnails__thumbnail',
            selected: image.selected,
            id: image.id,
        }));

    const imagesWithVideo: (ISliderImage | ISliderVideo)[] = useMemo(() => {
        const result: (ISliderImage | ISliderVideo)[] = [];
        const numberOfItems = videoId ? imagesList.length + 1 : imagesList.length;

        if (videoId) {
            result.push({
                index: 0,
                totalSlides: numberOfItems,
                youtubeVideoId,
                cloudinaryVideoSrc,
                videoPlaceholder,
                id: cloudinaryVideoSrc || `youtube-video-${videoId}`,
                thumbnailClass: 'img-carousel-thumbnails__thumbnail',
            });
        }

        result.push(...imagesList);

        return result;
    }, [images, imagesList, youtubeVideoId, cloudinaryVideoSrc, videoPlaceholder]);

    const carouselItems = videoId ? imagesWithVideo : imagesList;
    const selectedImages: ISliderImage[] = imagesList.filter(image => image.selected);

    const {
        swipeHandlers,
        handleSlide,
        trackThumbnailClick,
        onCarouselSync,
        trackFullScreenClose,
        trackFullScreenOpen,
    } = useCarouselTracking({
        isVideo: !!videoId,
        numberOfItems: carouselItems.length,
    });

    const openFullScreen = (): void => {
        setIsFullScreenActive(true);
        trackFullScreenOpen(mainSlideRef.current?.getCurrentIndex());
    };

    const onCarouselSlide = (currentIndex: number): void => {
        handleSlide(currentIndex);
        setIsPromoBannerShown(true);
    };

    const { renderMainImage, renderThumbInner, renderLeftNav, renderRightNav, renderFullScreenBtn } =
        useImageCarouselRenderHelper({
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
        });

    const addImageHandler = useCallback(() => {
        setAddingImage(true);

        addImage(
            rendering.fields?.id,
            async (itemId: string) => {
                const image = await getImageByItemId(itemId);

                if (image) {
                    setImages(prev => [...prev, image]);
                    mainSlideRef.current?.slideToIndex(images.length - 1);
                }

                setAddingImage(false);
            },
            layoutId,
        );
    }, [rendering.fields?.id, layoutId, images, addImage, getImageByItemId]);

    const showImageSort = useCallback(() => {
        setShowImagesSort(true);
    }, []);

    const onNextButtonClick = useCallback((): void => {
        mainSlideRef.current?.slideToIndex(currentIndex(mainSlideRef) + 1);

        changeMainImageSrcInEditMode(isEditMode && isLuxuryDesktop, mainSlideRef, imagesWithVideo);
    }, [isLuxuryDesktop, imagesWithVideo, isEditMode]);

    const onPrevButtonClick = useCallback((): void => {
        mainSlideRef.current?.slideToIndex(currentIndex(mainSlideRef) - 1);

        changeMainImageSrcInEditMode(isEditMode && isLuxuryDesktop, mainSlideRef, imagesWithVideo);
    }, [isLuxuryDesktop, imagesWithVideo, isEditMode]);

    const handleImageThumbClick = useCallback(
        (target: HTMLElement): void => {
            handleThumbnailClickInEditMode(target, mainSlideRef);
            changeMainImageSrcInEditMode(isLuxuryDesktop, mainSlideRef, imagesWithVideo);
        },
        [imagesWithVideo, isLuxuryDesktop],
    );

    const handleImageDelete = useCallback(
        async (itemId: string): Promise<void> => {
            await deleteImage(itemId);
            const imageIndex = images.findIndex(im => im.id === itemId);
            const currentIndex = mainSlideRef.current?.getCurrentIndex();

            if (imageIndex === undefined || imageIndex < 0) {
                return;
            }

            const newImages = [...images];
            newImages.splice(imageIndex, 1);
            const currentLength = newImages.length;

            setImages(newImages);
            mainSlideRef.current?.slideToIndex(currentLength < currentIndex + 1 ? currentLength - 1 : currentIndex);
        },
        [images, deleteImage],
    );

    // Extract image selection logic
    const handleImageSelect = useCallback(
        (itemId: string, itemIndex: string): void => {
            const currentIndex = +itemIndex;

            const newImages = images.map(image =>
                image.id === itemId ? { ...image, selected: !image.selected } : image,
            );

            setImages(newImages);
            mainSlideRef.current?.slideToIndex(currentIndex);
        },
        [images],
    );

    const handleLoadingState = useCallback(
        async (target: HTMLElement, action: () => Promise<boolean>): Promise<boolean> => {
            target.classList?.add('btn--loading');
            try {
                return await action();
            } catch {
                return false;
            } finally {
                target.classList?.remove('btn--loading');
            }
        },
        [],
    );

    const confirmAndDeleteImages = useCallback(
        async (imageIds: string[], deleteFn: (ids: string[]) => Promise<void>): Promise<boolean> => {
            const shouldDelete = confirm(
                imageIds.length > 1
                    ? 'Are you sure you want to delete this images?'
                    : 'Are you sure you want to delete this image?',
            );

            if (!shouldDelete) return false;

            await deleteFn(imageIds);

            return true;
        },
        [],
    );

    const onThumbnailsClickInEditor = useCallback(
        async (e: MouseEvent): Promise<void> => {
            const target = e.target;

            if (!(target instanceof HTMLElement)) {
                return;
            }

            if (target.className.includes('img-carousel-thumbnails__image') || target.hasAttribute('src')) {
                handleImageThumbClick(target);

                return;
            }

            if (target.className.includes('delete-image-btn')) {
                const itemId = target.dataset.itemId;

                if (!itemId) return;

                await handleLoadingState(target, () =>
                    confirmAndDeleteImages([itemId], async () => handleImageDelete(itemId)),
                );

                return;
            }

            if (!withoutSelection && target.className.includes('select-image-btn')) {
                const { itemId, itemIndex } = target.dataset;

                if (!itemId || !itemIndex) return;

                handleImageSelect(itemId, itemIndex);
            }
        },
        [
            withoutSelection,
            handleImageThumbClick,
            handleLoadingState,
            confirmAndDeleteImages,
            handleImageDelete,
            handleImageSelect,
        ],
    );

    const activateFullScreenMode = useCallback((e: MouseEvent): void => {
        const target = e.target as HTMLImageElement;

        if (shouldPreventFullScreenActivation(target)) {
            return;
        }

        trackFullScreenOpen(mainSlideRef.current?.getCurrentIndex(), true);
        setIsFullScreenActive(true);
    }, []);

    const deleteSitecoreImages = useCallback(
        async (e: MouseEvent, selectedImages: ISliderImage[]): Promise<boolean> => {
            if (selectedImages.length === 0) return false;

            const target = e.target as HTMLElement;
            const selectedItemIds = selectedImages.map(image => image.id).filter(Boolean) as string[];

            const action = async (): Promise<void> => {
                await deleteImages(selectedItemIds);
                const newImages = images.filter(image => !selectedItemIds.includes(image.id ?? ''));
                setImages(newImages);

                if (!withoutSelection) {
                    // slide to first image
                    mainSlideRef.current?.slideToIndex(0);
                }
            };

            return handleLoadingState(target, () => confirmAndDeleteImages(selectedItemIds, action));
        },
        [deleteImages, images, withoutSelection, handleLoadingState, confirmAndDeleteImages],
    );

    useEffect(() => {
        const initCustomThumbnails = (): void => {
            if (mainSlideRef.current?._thumbnailsWrapper && thumbsRef.current) {
                thumbsRef.current.appendChild(mainSlideRef.current._thumbnailsWrapper);
                thumbsRef.current.addEventListener('focus', enableArrowKeys);
                thumbsRef.current.addEventListener('blur', disableArrowKeys);
            }
        };

        const destroyCustomThumbnails = (): void => {
            if (thumbsRef.current) {
                thumbsRef.current.removeEventListener('focus', enableArrowKeys);
                thumbsRef.current.removeEventListener('blur', disableArrowKeys);
                document.querySelectorAll('.image-gallery-thumbnails').forEach(el => {
                    if (el?.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            }
        };

        if (isMoreThenTabletViewport) {
            initCustomThumbnails();

            const carousel = mainSlideRef?.current?._imageGallery.getElementsByClassName('image-gallery-slides')[0];
            carousel?.addEventListener('click', activateFullScreenMode);
        }

        return () => {
            destroyCustomThumbnails();

            if (isMoreThenTabletViewport) {
                const carousel = mainSlideRef?.current?._imageGallery.getElementsByClassName('image-gallery-slides')[0];
                carousel?.removeEventListener('click', activateFullScreenMode);
            }
        };
    }, [isMoreThenTabletViewport, images, isFullScreenActive, isEditMode, activateFullScreenMode, imagesReady]);

    useEffect(() => {
        if (offer && images.length > 0) {
            setIsLocallyLoaded(true);

            const checkImagesLoaded = (): void => {
                requestAnimationFrame(() => {
                    setImagesReady(true);
                });
            };

            checkImagesLoaded();
        } else {
            setImagesReady(false);
        }
    }, [offer, images]);

    useEffect(() => {
        const handleDeleteImages = (e: MouseEvent): Promise<boolean> => deleteSitecoreImages(e, selectedImages);
        const addImageBtn = viewRef.current?.querySelector('.img-carousel-manage .add-image-btn');
        const sortImagesBtn = viewRef.current?.querySelector('.img-carousel-manage .sort-images-btn');
        const thumbnails = viewRef.current?.querySelector('.img-carousel-thumbnails');
        const deleteImagesBtn = viewRef.current?.querySelector('.batch-delete-images-btn');
        const nextBtn = viewRef.current?.querySelector('.slider-nav--next');
        const prevBtn = viewRef.current?.querySelector('.slider-nav--prev');

        if (isEditMode) {
            addImageBtn?.addEventListener('click', addImageHandler);
            sortImagesBtn?.addEventListener('click', showImageSort);
            thumbnails?.addEventListener('click', onThumbnailsClickInEditor);
            nextBtn?.addEventListener('click', onNextButtonClick);
            prevBtn?.addEventListener('click', onPrevButtonClick);

            if (!withoutSelection) {
                deleteImagesBtn?.addEventListener('click', handleDeleteImages);
            }
        }

        return () => {
            if (isEditMode) {
                addImageBtn?.removeEventListener('click', addImageHandler);
                sortImagesBtn?.removeEventListener('click', showImageSort);
                thumbnails?.removeEventListener('click', onThumbnailsClickInEditor);
                nextBtn?.removeEventListener('click', onNextButtonClick);
                prevBtn?.removeEventListener('click', onPrevButtonClick);

                if (!withoutSelection) {
                    deleteImagesBtn?.removeEventListener('click', handleDeleteImages);
                }
            }
        };
    }, [
        isEditMode,
        addImageHandler,
        deleteSitecoreImages,
        onThumbnailsClickInEditor,
        selectedImages,
        showImageSort,
        withoutSelection,
        onNextButtonClick,
        onPrevButtonClick,
    ]);

    useEffect(() => {
        if (offer?.hotel?.images !== images) {
            setImages(offer?.hotel?.images || []);
        }

        const el = viewRef.current?.closest('.wrapper-component-container');

        if (!el || !isLuxury) {
            return;
        }

        const fullWidthClass = 'wrapper-component-container--full-width';
        el.classList.add(fullWidthClass);

        return () => el.classList.remove(fullWidthClass);
    }, [offer]);

    const slideDuration = 350;

    const onThumbnailClick = (): void => {
        trackThumbnailClick();
        // IE fix (In IE parent thumbnails container doesn't focused automatically by click on child thumbnail)
        thumbsRef.current?.focus?.();
    };

    const onSortPopupClose = async (images?: ISliderImage[]): Promise<void> => {
        if (images) {
            await sortImages(images.map(img => img.image.id).filter(i => !!i) as string[]);
            setImages(images.map(img => img.image));
        }

        setShowImagesSort(false);
    };

    const closeFullScreenMode = (idx: number): void => {
        const prevIndex = currentIndex(mainSlideRef);
        trackFullScreenClose(idx);

        onCarouselSync(prevIndex, idx);
        mainSlideRef?.current?.slideToIndex(idx);

        setIsFullScreenActive(false);
    };

    const isSidebarLoaded = !!offer && isBookingSidebarLoaded;
    const isCarouselLoaded = (isSidebarLoaded || isLocallyLoaded) && (imagesReady || isEditMode);

    const cardDescription = getCardDescription({
        isPromoBannerShown,
        offer,
        currency,
        formatMoney,
        labelBeforePrice,
        labelAfterPrice,
    });

    const ImageCarouselComponent = (
        <div className='img-slider-box' data-tid='hotel-images'>
            {imagesWithVideo?.length ? (
                <div {...swipeHandlers}>
                    <ImageGallery
                        items={carouselItems}
                        renderItem={renderMainImage}
                        renderLeftNav={renderLeftNav}
                        renderRightNav={renderRightNav}
                        renderThumbInner={renderThumbInner}
                        renderFullscreenButton={renderFullScreenBtn}
                        disableArrowKeys={isDisabledArrowKeys}
                        onThumbnailClick={onThumbnailClick}
                        additionalClass={classNames('hotel-main-image', {
                            'fullscreen-enabled': isFullScreenEnabled,
                        })}
                        showPlayButton={false}
                        showThumbnails={isMoreThenTabletViewport}
                        showIndex
                        showNav
                        lazyLoad
                        ref={mainSlideRef}
                        slideDuration={slideDuration}
                        onSlide={onCarouselSlide}
                    />
                </div>
            ) : (
                <div
                    className='hotel-card-img'
                    data-tid='fallback-image'
                    style={{ backgroundImage: `url(${cmsUrls.media(fallbackImage)})` }}
                />
            )}

            {!offer?.accom?.isExt && isWeLovePillEnabled && (
                <LikeBadge text={getPhrase(SitecoreDictionary.HotelDetailsLabelsWeLove)} />
            )}

            <PromoBadge text={cardDescription} />
        </div>
    );

    const isFullScreenCarousel = isFullScreenEnabled && isFullScreenActive && !!imagesList?.length;
    const thumbnails = isMoreThenTabletViewport && !isLuxuryDesktop;
    const wrapperDataId = 'hotel-main-view';

    const renderSocialProofing = (isLuxury: boolean): JSX.Element => (
        <SocialProofingBanner
            shouldHide={!isCarouselLoaded || !isHotelDetailsBookPage || wasSocialProofingClosed}
            dataIdToObserve={wrapperDataId}
            isLuxury={isLuxury}
            onClose={(): void => setWasSocialProofingClosed(true)}
        />
    );

    return (
        <div
            ref={viewRef}
            className={classNames(styles.wrapper, {
                [styles.luxury]: isLuxury,
                'hotel-main-view': !isLuxuryDesktop,
            })}
            data-tid={wrapperDataId}
        >
            {isFullScreenCarousel && (
                <FullScreenImageCarousel
                    images={carouselItems}
                    fallbackImage={fallbackImage}
                    onClose={closeFullScreenMode}
                    currentImageIndex={currentIndex(mainSlideRef)}
                    videoTitle={offer?.hotel?.name}
                    handleSlide={handleSlide}
                    swipeHandlers={swipeHandlers}
                    onCarouselSync={onCarouselSync}
                    trackThumbnailClick={trackThumbnailClick}
                    startIndex={currentIndex(mainSlideRef)}
                    autoPlay={autoPlay}
                    setAutoPlay={setAutoPlay}
                />
            )}

            {isLuxuryDesktop ? (
                <LuxuryWrapper
                    label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}
                    wrapperClassName={classNames(styles.cardWrapper, { [styles.fixed]: isHotelDetailsBrowsePage })}
                    bannerClassName={styles.banner}
                >
                    <LuxuryImageCarousel
                        getPhrase={getPhrase}
                        renderCard={
                            <Placeholder
                                name={PlaceholderNames.HotelImageSidebar}
                                rendering={rendering}
                                prices={prices}
                            />
                        }
                        promoText={cardDescription}
                        renderSocialProofing={renderSocialProofing}
                        {...getDesktopLuxuryProps({
                            videoId,
                            videoPlaceholder,
                            images,
                            cookiesAccepted,
                            mainSlideRef,
                            setAutoPlay,
                            onThumbnailClick,
                            setIsFullScreenActive,
                        })}
                    >
                        <>
                            <div className={styles.renderThumbnailsOnly}>
                                <ImageGallery
                                    items={carouselItems}
                                    renderItem={null}
                                    renderThumbInner={(image: ISliderImage): JSX.Element => renderThumbInner(image)}
                                    onThumbnailClick={(): void => {
                                        onThumbnailClick();
                                        setTimeout(() => {
                                            setIsFullScreenActive(true);
                                        });
                                    }}
                                    showThumbnails
                                    lazyLoad
                                    ref={mainSlideRef}
                                />
                            </div>

                            {mainSlideRef.current && renderLeftNav(onPrevButtonClick)}

                            <HotelImageCarouselThumbnails isLoading={false} ref={thumbsRef} />

                            {mainSlideRef.current && renderRightNav(onNextButtonClick)}
                        </>
                    </LuxuryImageCarousel>
                </LuxuryWrapper>
            ) : (
                <div className='card'>
                    <div className='img-carousel-container'>
                        {isCarouselLoaded ? ImageCarouselComponent : <HotelImageCarouselShimmer />}
                        <LuxuryWrapper
                            label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}
                            renderChildrenOnly={!isLuxury || !isCarouselLoaded}
                            wrapperClassName={styles.cardWrapper}
                            bannerClassName={styles.banner}
                        >
                            {renderSocialProofing(isLuxury)}

                            <Placeholder
                                name={PlaceholderNames.HotelImageSidebar}
                                rendering={rendering}
                                prices={prices}
                            />
                        </LuxuryWrapper>
                    </div>
                </div>
            )}

            {isEditMode && (
                <HotelImageCarouselEditMode
                    amount={selectedImages.length}
                    isLoading={addingImage}
                    withoutSelection={withoutSelection}
                />
            )}

            {thumbnails && <HotelImageCarouselThumbnails isLoading={!images.length} ref={thumbsRef} />}

            {showImagesSort && withoutSelection && (
                <ImagesMultipleSortPopup
                    images={imagesList}
                    onClose={onSortPopupClose}
                    deleteSitecoreImages={deleteSitecoreImages}
                />
            )}
            {showImagesSort && !withoutSelection && <ImagesSortPopup images={imagesList} onClose={onSortPopupClose} />}
        </div>
    );
};

export default observer(HotelImageCarousel);
