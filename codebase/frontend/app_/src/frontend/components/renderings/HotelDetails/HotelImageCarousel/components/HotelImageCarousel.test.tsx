import React from 'react';
import { SwipeableHandlers } from 'react-swipeable';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockHotel } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockedOffer } from 'frontend/__mocks__/offer';
import * as trackingUtils from 'frontend/hooks/useCarouselTracking/useCarouselTracking';
import * as useMediaQuery from 'frontend/hooks/useMediaQuery';
import * as useShouldRenderVideoHooks from 'frontend/hooks/useShouldRenderVideo';
import * as offerUtils from 'frontend/utils/offer.utils';
import { ISinglePromotionInfo } from 'models/data/IPromocode';
import {
    HotelImageCarousel,
    IHotelImageCarouselProps,
} from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarousel';
import * as carouselRenderUtils from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/useImageCarouselRenderHelper';

import * as hotelImageCarouselUtils from './HotelImageCarousel.utils';

const mockImageGallery = jest.fn();
jest.mock('react-image-gallery', () => ({
    __esModule: true,
    default: ({ renderFullscreenButton, onThumbnailClick, renderItem, onSlide, ...props }) => {
        mockImageGallery(props);

        return (
            <div data-tid='image-gallery'>
                {renderFullscreenButton?.()}
                {renderItem?.()}
                <button onClick={onThumbnailClick} onKeyDown={jest.fn()} data-tid='thumbnail-from-gallery' />
                <button onClick={onSlide} onKeyDown={jest.fn()} data-tid='slide-from-gallery' />
            </div>
        );
    },
}));

const mockFullScreenImageCarousel = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/HotelImageCarousel/components/FullScreenImageCarousel', () => ({
    __esModule: true,
    default: ({ onClose, ...props }) => {
        mockFullScreenImageCarousel(props);

        return <button onClick={onClose} onKeyDown={jest.fn()} data-tid='full-screen-image-carousel' />;
    },
}));

jest.mock('frontend/components/common/LikeBadge', () => ({
    __esModule: true,
    default: ({ text }) => <div data-tid='like-badge'>{text}</div>,
}));

jest.mock('frontend/components/common/PromoBadge', () => ({
    __esModule: true,
    default: ({ text }) => {
        if (!text || text.trim() === '') {
            return null;
        }

        return <div data-tid='promo-badge'>{text}</div>;
    },
}));

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarouselShimmer',
    () => ({
        __esModule: true,
        default: () => <div data-tid='hotel-image-carousel-shimmer' />,
    }),
);

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('frontend/components/common/ImagesMultipleSortPopup/ImagesMultipleSortPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='images-multiple-sort-popup' />,
}));

jest.mock('frontend/components/renderings/HotelDetails/HotelImageCarousel/components/ImagesSortPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='images-sort-popup' />,
}));

const mockSocialProofingBanner = jest.fn();
jest.mock('frontend/components/common/SocialProofingBanner/SocialProofingBanner', () => ({
    __esModule: true,
    default: ({ onClose, ...props }) => {
        mockSocialProofingBanner(props);

        return <button onClick={onClose} onKeyDown={jest.fn()} data-tid='social-proofing-banner' />;
    },
}));

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: props => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{props.children}</div>;
    },
}));

const mockLuxuryImageCarousel = jest.fn();
jest.mock('./LuxuryImageCarousel', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLuxuryImageCarousel(props);

        return <div data-tid='luxury-image-carousel'>{children}</div>;
    },
}));

const mockHotelImageCarouselThumbnails = jest.fn();
jest.mock(
    'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarouselThumbnails',
    () => ({
        __esModule: true,
        default: ({ isLoading }) => {
            mockHotelImageCarouselThumbnails(isLoading);

            return (
                <div data-tid='img-carousel-thumbnails' className='img-carousel-thumbnails'>
                    <div data-tid='thumbnail-without-class' />
                    <div data-tid='thumbnail-with-class' className='img-carousel-thumbnails__image' />
                    <img data-tid='thumbnail-with-src' src='test-src' alt='test' />
                </div>
            );
        },
    }),
);

let mockStores;
const mockAddEventListener = jest.fn().mockImplementation((_, callback) => {
    if (mockStores.layoutStore.isHotelDetailsBookPage) {
        callback({ target: { src: 'src' } });
    }
});

const mockAdd = jest.fn();
const mockRemove = jest.fn();

const mockClosest = jest.fn().mockReturnValue({ classList: { add: mockAdd, remove: mockRemove } });

const mockGetCurrentIndex = jest.fn(() => 1);
const mockSlideToIndex = jest.fn();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useRef: () => ({
        current: {
            _imageGallery: {
                getElementsByClassName: () => [
                    { addEventListener: mockAddEventListener, removeEventListener: jest.fn() },
                ],
            },
            getCurrentIndex: mockGetCurrentIndex,
            removeEventListener: jest.fn(),
            slideToIndex: mockSlideToIndex,
        },
    }),
}));

const mockTrackThumbnailClick = jest.fn();
const mockTrackFullScreenClose = jest.fn();
const mockTrackFullScreenOpen = jest.fn();
jest.spyOn(trackingUtils, 'default').mockReturnValue({
    swipeHandlers: { className: 'test-class', ref: jest.fn() } as SwipeableHandlers,
    handleSlide: jest.fn(),
    onCarouselSync: jest.fn(),
    trackFullScreenClose: mockTrackFullScreenClose,
    trackFullScreenOpen: mockTrackFullScreenOpen,
    trackThumbnailClick: mockTrackThumbnailClick,
});

jest.spyOn(carouselRenderUtils, 'useImageCarouselRenderHelper').mockImplementation(args => ({
    renderMainImage: () => (
        <button onClick={() => args.setIsPromoBannerShown(false)} onKeyDown={jest.fn()} data-tid='helper-main-image' />
    ),
    renderThumbInner: jest.fn(),
    renderLeftNav: onClick => (
        <button onClick={onClick} onKeyDown={jest.fn()} data-tid='left-btn'>
            left
        </button>
    ),
    renderRightNav: onClick => (
        <button onClick={onClick} onKeyDown={jest.fn()} data-tid='right-btn'>
            right
        </button>
    ),
    renderFullScreenBtn: () => (
        <button onClick={args.openFullScreen} onKeyDown={jest.fn()} data-tid='fullscreen-btn'>
            Full Screen
        </button>
    ),
}));

jest.spyOn(useShouldRenderVideoHooks, 'default').mockImplementation(() => true);
const containsLuxuryPromoCode = jest.spyOn(offerUtils, 'containsLuxuryPromoCode');
const mockShouldPreventFullScreenActivation = jest.spyOn(hotelImageCarouselUtils, 'shouldPreventFullScreenActivation');
const mockChangeMainImageSrcInEditMode = jest.spyOn(hotelImageCarouselUtils, 'changeMainImageSrcInEditMode');

describe('<HotelImageCarousel />', () => {
    const resetMocks = (): IHotelImageCarouselProps => ({
        offer: {
            ...mockedOffer,
            hotel: {
                ...mockHotel,
                images: [
                    {
                        id: '1',
                        large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_l_001.jpg',
                        medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_l_001.jpg',
                        small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_l_001.jpg',
                        selected: true,
                    },
                    {
                        id: '2',
                        large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_f_001.jpg',
                        medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_f_001.jpg',
                        small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_f_001.jpg',
                    },
                ],
                youtubeVideoId: 'test',
                videoPlaceholder: 'youtube-video-placeholder',
                cloudinaryVideoSrc: 'https://cloudinary.com/video.mp4',
                name: 'hotel name',
            },
            promotion: {
                cardDescription: 'promo text',
            },
        },
        fallbackImage: 'image url',
        rendering: {},
    });

    let mocks = resetMocks();
    let useMoreTabletViewportSpy: jest.SpyInstance;

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            layoutStore: {
                isHotelDetailsBookPage: false,
                isHotelDetailsBrowsePage: false,
                isExperienceEditor: false,
                isEditMode: false,
                layoutId: 'layoutId',
                getSetting: jest.fn(setting => setting),
                isWeLovePillEnabled: true,
                isFullScreenEnabledHotelDetails: false,
                isCloudinaryDisabled: false,
                isHotelDetailsBrowseStateLivePriceEnabled: true,
                layout: {
                    sitecore: {
                        route: {
                            fields: {
                                GiataCode: {
                                    value: 'giata-code',
                                },
                            },
                        },
                    },
                },
            },
            editorStore: {
                addImage: jest.fn(),
                deleteItem: jest.fn(),
                deleteItems: jest.fn(),
                sortItems: jest.fn(),
                getImageByItemId: jest.fn(),
            },
            bookingStore: {
                isBookingSidebarLoaded: true,
            },
            marketStore: {
                currency: 'GBP',
                formatMoney: jest.fn().mockImplementation(value => `£${value}`),
            },
            queryParamStore: {
                roomsAllocationFromUrl: [{ children: 0 }],
                isPromotingIframe: jest.fn(() => false),
            },
            hotelsStore: {
                getLivePrice: jest.fn().mockImplementation(() => Promise.resolve([])),
            },
        });

        global.requestAnimationFrame = callback => {
            callback(0);

            return 1;
        };

        useMoreTabletViewportSpy = jest.spyOn(useMediaQuery, 'useMoreThenTabletViewport');
        mockShouldPreventFullScreenActivation.mockReturnValue(false);
    });

    it('should render carousel when offer data is available', () => {
        const { container } = render(<HotelImageCarousel {...mocks} />);

        expect(container.querySelector('.hotel-main-view')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
    });

    it('should render ImageGallery with video form offer when layout is NOT provided and prioritize cloudinary video over youtube', () => {
        mockStores.layoutStore.layout = undefined;

        render(<HotelImageCarousel {...mocks} />);

        expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
        expect(mockImageGallery).toHaveBeenCalledWith({
            additionalClass: 'hotel-main-image',
            disableArrowKeys: true,
            items: [
                {
                    id: mocks.offer!.hotel!.cloudinaryVideoSrc,
                    index: 0,
                    thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                    youtubeVideoId: mocks.offer!.hotel!.youtubeVideoId,
                    totalSlides: 3,
                    cloudinaryVideoSrc: mocks.offer!.hotel!.cloudinaryVideoSrc,
                    videoPlaceholder: 'youtube-video-placeholder',
                },
                {
                    id: '1',
                    image: {
                        id: '1',
                        large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_l_001.jpg',
                        medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_l_001.jpg',
                        selected: true,
                        small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_l_001.jpg',
                    },
                    index: 1,
                    selected: true,
                    thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                    totalSlides: 3,
                },
                {
                    id: '2',
                    image: {
                        id: '2',
                        large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_f_001.jpg',
                        medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_f_001.jpg',
                        small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_f_001.jpg',
                    },
                    index: 2,
                    selected: undefined,
                    thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                    totalSlides: 3,
                },
            ],
            lazyLoad: true,
            renderLeftNav: expect.any(Function),
            renderRightNav: expect.any(Function),
            renderThumbInner: expect.any(Function),
            showIndex: true,
            showNav: true,
            showPlayButton: false,
            showThumbnails: true,
            slideDuration: 350,
        });
    });

    it('should NOT include youtube video and cloudinary video when it is NOT provided', () => {
        mocks.offer!.hotel!.youtubeVideoId = undefined;
        mocks.offer!.hotel!.cloudinaryVideoSrc = undefined;

        render(<HotelImageCarousel {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                items: [
                    {
                        id: '1',
                        image: {
                            id: '1',
                            large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_l_001.jpg',
                            medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_l_001.jpg',
                            selected: true,
                            small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_l_001.jpg',
                        },
                        index: 0,
                        selected: true,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 2,
                    },
                    {
                        id: '2',
                        image: {
                            id: '2',
                            large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_f_001.jpg',
                            medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_f_001.jpg',
                            small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_f_001.jpg',
                        },
                        index: 1,
                        selected: undefined,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 2,
                    },
                ],
            }),
        );
    });

    it('should include youtube video when cloudinary video is NOT provided', () => {
        mocks.offer!.hotel!.cloudinaryVideoSrc = undefined;

        render(<HotelImageCarousel {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                items: [
                    {
                        id: `youtube-video-${mocks.offer!.hotel!.youtubeVideoId}`,
                        index: 0,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        youtubeVideoId: mocks.offer!.hotel!.youtubeVideoId,
                        totalSlides: 3,
                        cloudinaryVideoSrc: undefined,
                        videoPlaceholder: 'youtube-video-placeholder',
                    },
                    {
                        id: '1',
                        image: {
                            id: '1',
                            large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_l_001.jpg',
                            medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_l_001.jpg',
                            selected: true,
                            small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_l_001.jpg',
                        },
                        index: 1,
                        selected: true,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 3,
                    },
                    {
                        id: '2',
                        image: {
                            id: '2',
                            large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_f_001.jpg',
                            medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_f_001.jpg',
                            small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_f_001.jpg',
                        },
                        index: 2,
                        selected: undefined,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 3,
                    },
                ],
            }),
        );
    });

    it('should take video from sitecore when it is provided', () => {
        mocks.offer!.hotel!.youtubeVideoId = undefined;
        mocks.offer!.hotel!.cloudinaryVideoSrc = undefined;
        mockStores.layoutStore.layout = {
            sitecore: {
                route: {
                    fields: {
                        YoutubeVideoId: { value: 'sitecore-youtube-id' },
                        CloudinaryVideoSrc: { value: 'sitecore-cloudinary-video.mp4' },
                        VideoPlaceholder: { value: { src: 'sitecore-youtube-video-placeholder' } },
                        GiataCode: { value: 'code' },
                    },
                },
            },
        };
        render(<HotelImageCarousel {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                items: [
                    {
                        id: 'sitecore-cloudinary-video.mp4',
                        index: 0,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        youtubeVideoId: 'sitecore-youtube-id',
                        totalSlides: 3,
                        cloudinaryVideoSrc: 'sitecore-cloudinary-video.mp4',
                        videoPlaceholder: 'sitecore-youtube-video-placeholder',
                    },
                    {
                        id: '1',
                        image: {
                            id: '1',
                            large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_l_001.jpg',
                            medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_l_001.jpg',
                            selected: true,
                            small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_l_001.jpg',
                        },
                        index: 1,
                        selected: true,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 3,
                    },
                    {
                        id: '2',
                        image: {
                            id: '2',
                            large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_f_001.jpg',
                            medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_f_001.jpg',
                            small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_f_001.jpg',
                        },
                        index: 2,
                        selected: undefined,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 3,
                    },
                ],
            }),
        );
    });

    it('should render carousel thumbnails when on desktop', () => {
        useMoreTabletViewportSpy.mockReturnValue(true);

        render(<HotelImageCarousel {...mocks} />);

        expect(screen.getByTestId('img-carousel-thumbnails')).toBeInTheDocument();
    });

    it('should NOT render carousel thumbnails when screen is less large', () => {
        useMoreTabletViewportSpy.mockReturnValue(false);

        render(<HotelImageCarousel {...mocks} />);

        expect(screen.queryByTestId('img-carousel-thumbnails')).not.toBeInTheDocument();
    });

    it('should show shimmer when imagesReady is false', () => {
        jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, jest.fn()]);

        mocks.offer!.hotel!.images = [];

        render(<HotelImageCarousel {...mocks} />);

        expect(screen.getByTestId('hotel-image-carousel-shimmer')).toBeInTheDocument();
    });

    it('should handle image thumbnail click', async () => {
        mockStores.layoutStore.isEditMode = true;

        render(<HotelImageCarousel {...mocks} />);
        const addButton = screen.getByTestId('add-image');
        await userEvent.click(addButton);
        expect(mockStores.editorStore.addImage).toHaveBeenCalled();
    });

    it('should delete selected image by click', () => {
        mockStores.layoutStore.isEditMode = true;
        useMoreTabletViewportSpy.mockReturnValue(true);
        window.confirm = jest.fn(() => true);

        render(<HotelImageCarousel {...mocks} />);

        expect(screen.queryByTestId('popup-dialog-0')).not.toBeInTheDocument();
        const batchDelete = screen.getByTestId('batch-delete');
        expect(batchDelete).toBeInTheDocument();
        fireEvent.click(batchDelete);

        expect(window.confirm).toHaveBeenCalled();
        expect(batchDelete).toHaveClass('btn--loading');
        expect(mockStores.editorStore.deleteItems).toHaveBeenCalledWith(['1']);
    });

    it('should set imagesReady when offer and images are loaded', () => {
        render(<HotelImageCarousel {...mocks} />);

        expect(screen.getByTestId('hotel-images')).toBeInTheDocument();
        expect(screen.queryByTestId('hotel-image-carousel-shimmer')).not.toBeInTheDocument();
    });

    it('should not delete selected image by click', () => {
        mockStores.layoutStore.isEditMode = true;
        useMoreTabletViewportSpy.mockReturnValue(true);
        window.confirm = jest.fn(() => false);

        render(<HotelImageCarousel {...mocks} />);

        const batchDelete = screen.getByTestId('batch-delete');
        fireEvent.click(batchDelete);

        expect(window.confirm).toHaveBeenCalled();
        expect(batchDelete).toHaveClass('btn--loading');
        expect(mockStores.editorStore.deleteItems).not.toHaveBeenCalled();
    });

    it('should not delete selected image by click when no selected', async () => {
        mockStores.layoutStore.isEditMode = true;
        mocks.offer!.hotel!.images[0].selected = false;
        useMoreTabletViewportSpy.mockReturnValue(true);
        window.confirm = jest.fn(() => true);

        render(<HotelImageCarousel {...mocks} />);

        const batchDelete = screen.getByTestId('batch-delete');
        fireEvent.click(batchDelete);

        expect(window.confirm).not.toHaveBeenCalled();
        expect(batchDelete).not.toHaveClass('btn--loading');
        expect(mockStores.editorStore.deleteItems).not.toHaveBeenCalled();
    });

    it('should render ImagesMultipleSortPopup when clicking on curate image button', async () => {
        mockStores.layoutStore.isEditMode = true;
        useMoreTabletViewportSpy.mockReturnValue(true);
        mocks.withoutSelection = true;
        window.confirm = jest.fn(() => true);

        render(<HotelImageCarousel {...mocks} />);
        const curateButton = screen.getByTestId('curate-images');
        expect(curateButton).toBeInTheDocument();
        expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();
        expect(screen.queryByTestId('batch-delete')).not.toBeInTheDocument();

        await userEvent.click(curateButton);

        expect(screen.getByTestId('images-multiple-sort-popup')).toBeInTheDocument();
    });

    it('should render HotelImageCarouselThumbnails with isLoading set to true when images is empty', () => {
        mocks.offer!.hotel!.images = [];

        render(<HotelImageCarousel {...mocks} />);

        mockHotelImageCarouselThumbnails(true);
    });

    it('should render ImageCarouselComponent when offer is defined and isBookingSidebarLoaded is true', () => {
        render(<HotelImageCarousel {...mocks} />);

        expect(screen.getByTestId('hotel-images')).toBeInTheDocument();
    });

    it('should NOT render FullScreenImageCarousel when isFullScreenEnabled is false', () => {
        mockStores.layoutStore.isFullScreenEnabledHotelDetails = false;

        render(<HotelImageCarousel {...mocks} />);

        expect(screen.queryByTestId('full-screen-image-carousel')).not.toBeInTheDocument();
    });

    it('should NOT render FullScreenImageCarousel when isFullScreenActive is false', () => {
        mockStores.layoutStore.isFullScreenEnabledHotelDetails = true;

        render(<HotelImageCarousel {...mocks} />);

        expect(screen.queryByTestId('full-screen-image-carousel')).not.toBeInTheDocument();
    });

    it('should render FullScreenImageCarousel when isFullScreenActive and isFullScreenEnabled are true', async () => {
        mockStores.layoutStore.isFullScreenEnabledHotelDetails = true;

        render(<HotelImageCarousel {...mocks} />);

        await userEvent.click(screen.getByTestId('fullscreen-btn'));

        expect(screen.getByTestId('full-screen-image-carousel')).toBeInTheDocument();
        expect(mockTrackFullScreenOpen).toHaveBeenCalled();
        expect(mockFullScreenImageCarousel).toHaveBeenCalledWith({
            currentImageIndex: 1,
            fallbackImage: 'image url',
            handleSlide: expect.any(Function),
            images: [
                {
                    id: mocks.offer!.hotel!.cloudinaryVideoSrc,
                    index: 0,
                    thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                    totalSlides: 3,
                    youtubeVideoId: 'test',
                    videoPlaceholder: 'youtube-video-placeholder',
                    cloudinaryVideoSrc: mocks.offer!.hotel!.cloudinaryVideoSrc,
                },
                {
                    id: '1',
                    image: {
                        id: '1',
                        large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_l_001.jpg',
                        medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_l_001.jpg',
                        selected: true,
                        small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_l_001.jpg',
                    },
                    index: 1,
                    selected: true,
                    thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                    totalSlides: 3,
                },
                {
                    id: '2',
                    image: {
                        id: '2',
                        large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_f_001.jpg',
                        medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_f_001.jpg',
                        small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_f_001.jpg',
                    },
                    index: 2,
                    selected: undefined,
                    thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                    totalSlides: 3,
                },
            ],
            onCarouselSync: expect.any(Function),
            swipeHandlers: { className: 'test-class', ref: expect.any(Function) },
            trackThumbnailClick: expect.any(Function),
            setAutoPlay: expect.any(Function),
            videoTitle: 'hotel name',
            autoPlay: false,
            startIndex: 1,
        });
    });

    it('should close FullScreenImageCarousel when on closeFullScreenMode', async () => {
        mockStores.layoutStore.isFullScreenEnabledHotelDetails = true;

        render(<HotelImageCarousel {...mocks} />);

        await userEvent.click(screen.getByTestId('fullscreen-btn'));

        expect(screen.getByTestId('full-screen-image-carousel')).toBeInTheDocument();

        await userEvent.click(screen.getByTestId('full-screen-image-carousel'));

        expect(screen.queryByTestId('full-screen-image-carousel')).not.toBeInTheDocument();
        expect(mockTrackFullScreenClose).toHaveBeenCalled();
    });

    it('should call trackFullScreenOpen on activateFullScreenMode when shouldPreventFullScreenActivation returns false', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;
        useMoreTabletViewportSpy.mockReturnValue(true);

        render(<HotelImageCarousel {...mocks} />);

        expect(mockTrackFullScreenOpen).toHaveBeenCalled();
    });

    it('should NOT call trackFullScreenOpen on activateFullScreenMode when shouldPreventFullScreenActivation returns true', () => {
        mockShouldPreventFullScreenActivation.mockReturnValue(true);
        mockStores.layoutStore.isHotelDetailsBookPage = true;
        useMoreTabletViewportSpy.mockReturnValue(true);

        render(<HotelImageCarousel {...mocks} />);

        expect(mockTrackFullScreenOpen).not.toHaveBeenCalled();
    });

    it('should call trackThumbnailClick on thumbnail click', async () => {
        render(<HotelImageCarousel {...mocks} />);

        await userEvent.click(screen.getByTestId('thumbnail-from-gallery'));

        expect(mockTrackThumbnailClick).toHaveBeenCalled();
    });

    it('should pass swipeHandlers to ImageGallery wrapper', () => {
        const { container } = render(<HotelImageCarousel {...mocks} />);

        expect(container.querySelector('.test-class')).toBeInTheDocument();
    });

    describe('Promotion Badge Integration', () => {
        it('should render promo badge with processed card description when promotion exists', () => {
            jest.spyOn(hotelImageCarouselUtils, 'getCardDescription').mockReturnValue('Save £50 off on your booking');

            mocks.offer!.promotion = {
                cardDescription: 'Save {discount} on your booking',
                discountAmountPerBooking: 50,
            };

            render(<HotelImageCarousel {...mocks} />);

            expect(hotelImageCarouselUtils.getCardDescription).toHaveBeenCalledWith({
                isPromoBannerShown: true,
                offer: mocks.offer,
                currency: 'GBP',
                formatMoney: expect.any(Function),
                labelBeforePrice: 'Globals.PriceLabels.PerPerson',
                labelAfterPrice: undefined,
            });
            expect(screen.getByTestId('promo-badge')).toHaveTextContent('Save £50 off on your booking');
        });

        it('should NOT render promo badge when getCardDescription returns empty string', () => {
            jest.spyOn(hotelImageCarouselUtils, 'getCardDescription').mockReturnValue('');

            mocks.offer!.promotion = {
                cardDescription: '',
                discountAmountPerBooking: 50,
            };

            render(<HotelImageCarousel {...mocks} />);

            expect(screen.queryByTestId('promo-badge')).not.toBeInTheDocument();
        });

        it('should NOT render promo badge when getCardDescription returns undefined', () => {
            jest.spyOn(hotelImageCarouselUtils, 'getCardDescription').mockReturnValue(undefined);

            mocks.offer!.promotion = {
                cardDescription: null,
                discountAmountPerBooking: 50,
            } as unknown as ISinglePromotionInfo;

            render(<HotelImageCarousel {...mocks} />);

            expect(screen.queryByTestId('promo-badge')).not.toBeInTheDocument();
        });

        it('should hide and show promo badge based on isPromoBannerShown state', async () => {
            const getCardDescriptionSpy = jest.spyOn(hotelImageCarouselUtils, 'getCardDescription');
            getCardDescriptionSpy.mockReturnValue('Save £50 off on your booking');

            mocks.offer!.promotion = {
                cardDescription: 'Save {discount} on your booking',
                discountAmountPerBooking: 50,
            };

            render(<HotelImageCarousel {...mocks} />);

            expect(screen.getByTestId('promo-badge')).toBeInTheDocument();

            getCardDescriptionSpy.mockReturnValue('');

            await userEvent.click(screen.getByTestId('helper-main-image'));

            expect(screen.queryByTestId('promo-badge')).not.toBeInTheDocument();

            getCardDescriptionSpy.mockReturnValue('Save £50 off on your booking');

            await userEvent.click(screen.getByTestId('slide-from-gallery'));

            expect(screen.getByTestId('promo-badge')).toBeInTheDocument();
        });
    });

    it('should call changeMainImageSrcInEditMode when in edit mode user clicks on img-carousel-thumbnails__image', async () => {
        useMoreTabletViewportSpy.mockReturnValue(true);
        mockStores.layoutStore.isEditMode = true;

        render(<HotelImageCarousel {...mocks} />);

        await userEvent.click(screen.getByTestId('thumbnail-with-class'));

        expect(mockChangeMainImageSrcInEditMode).toHaveBeenCalled();
    });

    it('should call changeMainImageSrcInEditMode when in edit mode user clicks on element with src', async () => {
        useMoreTabletViewportSpy.mockReturnValue(true);
        mockStores.layoutStore.isEditMode = true;

        render(<HotelImageCarousel {...mocks} />);

        await userEvent.click(screen.getByTestId('thumbnail-with-src'));

        expect(mockChangeMainImageSrcInEditMode).toHaveBeenCalled();
    });

    it('should NOT call changeMainImageSrcInEditMode when in edit mode user clicks on element without src and class', async () => {
        useMoreTabletViewportSpy.mockReturnValue(true);
        mockStores.layoutStore.isEditMode = true;

        render(<HotelImageCarousel {...mocks} />);

        await userEvent.click(screen.getByTestId('thumbnail-without-class'));

        expect(mockChangeMainImageSrcInEditMode).not.toHaveBeenCalled();
    });

    describe('Social Proofing Banner', () => {
        it('should render SocialProofingBanner with shouldHide equal to true when isHotelDetailsBookPage is false', () => {
            render(<HotelImageCarousel {...mocks} />);

            expect(screen.getByTestId('social-proofing-banner')).toBeInTheDocument();
            expect(mockSocialProofingBanner).toHaveBeenCalledWith({
                shouldHide: true,
                dataIdToObserve: 'hotel-main-view',
                isLuxury: false,
            });
        });

        it('should render SocialProofingBanner with shouldHide equal to true when isCarouselLoaded is false', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = true;
            jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, jest.fn()]);
            mocks.offer!.hotel!.images = [];

            render(<HotelImageCarousel {...mocks} />);

            expect(mockSocialProofingBanner).toHaveBeenCalledWith({
                shouldHide: true,
                dataIdToObserve: 'hotel-main-view',
                isLuxury: false,
            });
        });

        it('should render SocialProofingBanner with shouldHide equal to false when isCarouselLoaded and isHotelDetailsBookPage are true', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = true;

            render(<HotelImageCarousel {...mocks} />);

            expect(mockSocialProofingBanner).toHaveBeenCalledWith({
                shouldHide: false,
                dataIdToObserve: 'hotel-main-view',
                isLuxury: false,
            });
        });

        it('should render SocialProofingBanner with shouldHide equal to true when wasSocialProofingClosed is true', async () => {
            mockStores.layoutStore.isHotelDetailsBookPage = true;

            const { rerender } = render(<HotelImageCarousel {...mocks} />);

            expect(mockSocialProofingBanner).toHaveBeenCalledWith({
                shouldHide: false,
                dataIdToObserve: 'hotel-main-view',
                isLuxury: false,
            });

            await userEvent.click(screen.getByTestId('social-proofing-banner'));

            rerender(<HotelImageCarousel {...mocks} />);

            expect(mockSocialProofingBanner).toHaveBeenCalledWith({
                shouldHide: true,
                dataIdToObserve: 'hotel-main-view',
                isLuxury: false,
            });
        });
    });

    describe('<LuxuryImageCarousel />', () => {
        it('should render LuxuryImageCarousel when isLuxuryDesktop is true', () => {
            containsLuxuryPromoCode.mockImplementation(() => true);
            jest.spyOn(hotelImageCarouselUtils, 'getCardDescription').mockReturnValue('promo text');

            render(<HotelImageCarousel {...mocks} />);

            const carousel = screen.getByTestId('luxury-image-carousel');
            expect(carousel).toBeInTheDocument();
            expect(mockLuxuryImageCarousel).toHaveBeenCalledWith({
                imageSrc: mocks.offer!.hotel!.videoPlaceholder,
                getPhrase: expect.any(Function),
                onExpand: expect.any(Function),
                onPlayVideo: expect.any(Function),
                renderCard: expect.anything(),
                promoText: 'promo text',
                renderSocialProofing: expect.any(Function),
            });
            expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalledWith(['giata-code'], true);
        });

        it('should NOT render LuxuryImageCarousel when isLuxuryDesktop is false', () => {
            containsLuxuryPromoCode.mockImplementation(() => false);

            render(<HotelImageCarousel {...mocks} />);

            expect(screen.queryByTestId('luxury-image-carousel')).not.toBeInTheDocument();
        });

        it('should render content', async () => {
            containsLuxuryPromoCode.mockImplementation(() => true);

            render(<HotelImageCarousel {...mocks} />);

            const carousel = screen.getByTestId('luxury-image-carousel');
            expect(carousel).toBeInTheDocument();
            expect(mockImageGallery).toHaveBeenNthCalledWith(2, {
                items: [
                    {
                        cloudinaryVideoSrc: mocks.offer!.hotel!.cloudinaryVideoSrc,
                        id: mocks.offer!.hotel!.cloudinaryVideoSrc,
                        index: 0,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 3,
                        videoPlaceholder: mocks.offer!.hotel!.videoPlaceholder,
                        youtubeVideoId: 'test',
                    },
                    {
                        id: '1',
                        image: {
                            id: '1',
                            large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_l_001.jpg',
                            medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_l_001.jpg',
                            selected: true,
                            small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_l_001.jpg',
                        },
                        index: 1,
                        selected: true,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 3,
                    },
                    {
                        id: '2',
                        image: {
                            id: '2',
                            large: 'http://photos.hotelbeds.com/giata/xl/00/000001/000001a_hb_f_001.jpg',
                            medium: 'http://photos.hotelbeds.com/giata/bigger/00/000001/000001a_hb_f_001.jpg',
                            small: 'http://photos.hotelbeds.com/giata/00/000001/000001a_hb_f_001.jpg',
                        },
                        index: 2,
                        selected: undefined,
                        thumbnailClass: 'img-carousel-thumbnails__thumbnail',
                        totalSlides: 3,
                    },
                ],
                lazyLoad: true,
                renderThumbInner: expect.any(Function),
                showThumbnails: true,
            });

            const left = screen.getByTestId('left-btn');
            await userEvent.click(left);

            expect(mockGetCurrentIndex).toHaveBeenCalledTimes(1);
            expect(mockSlideToIndex).toHaveBeenNthCalledWith(1, 0);
            expect(mockChangeMainImageSrcInEditMode).toHaveBeenCalled();

            const right = screen.getByTestId('right-btn');
            await userEvent.click(right);

            expect(mockGetCurrentIndex).toHaveBeenCalledTimes(2);
            expect(mockSlideToIndex).toHaveBeenNthCalledWith(2, 2);
            expect(mockChangeMainImageSrcInEditMode).toHaveBeenCalledTimes(2);
        });

        it('should call changeMainImageSrcInEditMode when edit mode is true', async () => {
            containsLuxuryPromoCode.mockImplementation(() => true);
            mockStores.layoutStore.isEditMode = true;

            render(<HotelImageCarousel {...mocks} />);

            const left = screen.getByTestId('left-btn');
            await userEvent.click(left);

            expect(mockChangeMainImageSrcInEditMode).toHaveBeenCalled();

            const right = screen.getByTestId('right-btn');
            await userEvent.click(right);

            expect(mockChangeMainImageSrcInEditMode).toHaveBeenCalledTimes(2);
        });
    });

    describe('<LuxuryWrapper />', () => {
        it('should render LuxuryImageCarousel when isLuxury is true', () => {
            containsLuxuryPromoCode.mockImplementation(() => true);

            render(<HotelImageCarousel {...mocks} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(mockLuxuryWrapper).toHaveBeenNthCalledWith(1, {
                children: expect.anything(),
                bannerClassName: 'banner',
                label: 'Globals.Labels.LuxuryCollection',
                wrapperClassName: 'cardWrapper',
            });
        });

        it('should render LuxuryImageCarousel when useMoreTabletViewport/isLuxury is true', () => {
            containsLuxuryPromoCode.mockImplementation(() => true);
            useMoreTabletViewportSpy.mockReturnValue(false);

            render(<HotelImageCarousel {...mocks} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(mockLuxuryWrapper).toHaveBeenCalledWith({
                children: expect.anything(),
                bannerClassName: 'banner',
                label: 'Globals.Labels.LuxuryCollection',
                renderChildrenOnly: false,
                wrapperClassName: 'cardWrapper',
            });
        });

        it('should renderChildrenOnly be true (not render) when isLuxury is false', () => {
            containsLuxuryPromoCode.mockImplementation(() => false);
            useMoreTabletViewportSpy.mockReturnValue(false);

            render(<HotelImageCarousel {...mocks} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(mockLuxuryWrapper).toHaveBeenCalledWith({
                children: expect.anything(),
                bannerClassName: 'banner',
                label: 'Globals.Labels.LuxuryCollection',
                renderChildrenOnly: true,
                wrapperClassName: 'cardWrapper',
            });
        });
    });

    describe('Luxury wrapper class', () => {
        beforeEach(() => {
            Element.prototype.closest = mockClosest;
            containsLuxuryPromoCode.mockImplementation(() => true);
        });

        it('should add wrapper-component-container--full-width class when closest returns element and isLuxury is true', () => {
            render(<HotelImageCarousel {...mocks} />);

            expect(Element.prototype.closest).toHaveBeenCalled();
            expect(mockAdd).toHaveBeenCalledWith('wrapper-component-container--full-width');
        });

        it('should remove wrapper-component-container--full-width class on unmount', () => {
            const { unmount } = render(<HotelImageCarousel {...mocks} />);

            unmount();

            expect(mockRemove).toHaveBeenCalledWith('wrapper-component-container--full-width');
        });

        it('should NOT add wrapper-component-container--full-width class when isLuxury is false', () => {
            containsLuxuryPromoCode.mockImplementation(() => false);

            render(<HotelImageCarousel {...mocks} />);

            expect(mockAdd).not.toHaveBeenCalled();
        });

        it('should NOT add wrapper-component-container--full-width class when closest does NOT return element', () => {
            Element.prototype.closest = jest.fn().mockReturnValue(null);

            render(<HotelImageCarousel {...mocks} />);

            expect(mockAdd).not.toHaveBeenCalled();
        });
    });

    describe('livePrice', () => {
        it('should call livePrice on mount', () => {
            const { rerender } = render(<HotelImageCarousel {...mocks} />);

            expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalledWith(['giata-code'], true);

            expect(mockPlaceholderComponent).toHaveBeenCalledWith({
                name: 'hotel-image-sidebar',
                prices: [],
                rendering: {},
            });

            rerender(<HotelImageCarousel {...mocks} />);

            expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalledTimes(1);
        });

        it('should NOT call livePrice when code is not provided', () => {
            mockStores.layoutStore.layout = undefined;

            render(<HotelImageCarousel {...mocks} />);

            expect(mockStores.hotelsStore.getLivePrice).not.toHaveBeenCalled();
        });

        it('should NOT call livePrice when isHotelDetailsBrowseStateLivePriceEnabled is false', () => {
            mockStores.layoutStore.isHotelDetailsBrowseStateLivePriceEnabled = false;

            render(<HotelImageCarousel {...mocks} />);

            expect(mockStores.hotelsStore.getLivePrice).not.toHaveBeenCalled();
        });

        it('should NOT call livePrice when roomsAllocationFromUrl has children', () => {
            mockStores.queryParamStore.roomsAllocationFromUrl = [{ children: 1 }];
            mockStores.queryParamStore.isPromotingIframe.mockImplementationOnce(() => true);

            render(<HotelImageCarousel {...mocks} />);

            expect(mockStores.hotelsStore.getLivePrice).not.toHaveBeenCalled();
        });
    });
});
