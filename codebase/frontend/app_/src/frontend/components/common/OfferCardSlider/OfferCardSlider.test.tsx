import React from 'react';
import { SwipeableHandlers } from 'react-swipeable';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IOffer } from 'models/data/IOffer';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import * as hotelImageCarouselUtils from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarousel.utils';

import { IOfferCardSliderProps, OfferCardSlider } from './OfferCardSlider';

const mockFullScreenImageCarousel = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/HotelImageCarousel/components/FullScreenImageCarousel', () => ({
    __esModule: true,
    default: ({ onClose, ...props }) => {
        mockFullScreenImageCarousel(props);

        return <button onClick={onClose} onKeyDown={jest.fn()} data-tid='full-screen-image-carousel' />;
    },
}));

jest.mock('frontend/components/common/SliderNavButton', () => ({
    __esModule: true,
    default: ({ onClick, onFocus, onBlur }) => (
        <div data-tid='slider-nav-button'>
            <button onClick={onClick} onKeyDown={jest.fn()} data-tid='slider-nav-button-on-click' />;
            <button onClick={onFocus} onKeyDown={jest.fn()} data-tid='slider-nav-button-on-focus' />;
            <button onClick={onBlur} onKeyDown={jest.fn()} data-tid='slider-nav-button-on-blur' />;
        </div>
    ),
}));

jest.mock('frontend/components/icons-new/Enlarge', () => ({
    __esModule: true,
    default: () => <div data-tid='enlarge-icon' />,
}));

jest.mock('frontend/components/common/ImagesMultipleSortPopup/ImagesMultipleSortPopup', () => ({
    __esModule: true,
    default: ({ onClose, deleteSitecoreImages }) => (
        <div data-tid='images-multiple-sort-popup'>
            <button
                onClick={() =>
                    onClose([
                        {
                            id: '1',
                            image: { id: '1', large: 'large1', medium: 'medium1', small: 'small1' },
                        },
                    ])
                }
                onKeyDown={jest.fn()}
                data-tid='sort-on-close-button'
            />
            <button onClick={() => onClose()} onKeyDown={jest.fn()} data-tid='sort-on-close-button-without-props' />
            <button
                onClick={() =>
                    deleteSitecoreImages({ target: { classList: { add: jest.fn(), remove: jest.fn() } } }, [
                        {
                            id: '1',
                            image: { id: '1', large: 'large1', medium: 'medium1', small: 'small1' },
                        },
                        {
                            id: null,
                            image: { id: null, large: 'large2', medium: 'medium2', small: 'small2' },
                        },
                    ])
                }
                onKeyDown={jest.fn()}
                data-tid='sort-delete-button'
            />
            <button
                onClick={() => deleteSitecoreImages({ target: { classList: { add: jest.fn(), remove: jest.fn() } } })}
                onKeyDown={jest.fn()}
                data-tid='sort-delete-button-without-props'
            />
        </div>
    ),
}));

const mockSliderImage = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/SliderImage', () => ({
    __esModule: true,
    default: props => {
        mockSliderImage(props);

        return <div data-tid='slider-image' />;
    },
}));

const mockVideoPlayerComponent = jest.fn();
jest.mock('frontend/components/common/VideoPlayer/VideoPlayer', () => ({
    __esModule: true,
    default: props => {
        mockVideoPlayerComponent(props);

        return <div data-tid='video-player' />;
    },
}));

const mockImageGallery = jest.fn();
const mockLeftNav = jest.fn();
const mockRightNav = jest.fn();
const mockGetCurrentIndex = jest.fn().mockReturnValue(0);
let mockCurrentIndex = 0;

jest.mock('react-image-gallery', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef(
            ({ renderItem, onSlide, renderFullscreenButton, renderLeftNav, renderRightNav, ...props }, ref) => {
                mockImageGallery(props);

                ref.current = {
                    state: { currentIndex: mockCurrentIndex },
                    getCurrentIndex: mockGetCurrentIndex,
                    _imageGallery: {
                        getElementsByClassName: jest.fn().mockReturnValue([]),
                    },
                    slideToIndex: jest.fn(),
                };

                return (
                    <div data-tid='image-gallery'>
                        {renderItem(props.items[0])}
                        {renderFullscreenButton()}
                        {renderLeftNav(mockLeftNav)}
                        {renderRightNav(mockRightNav)}
                        <button onClick={onSlide} onKeyDown={jest.fn()} data-tid='image-gallery-on-slide-button' />
                    </div>
                );
            },
        ),
    };
});

const mockStateImages = (isNew = false) => {
    const prefix = isNew ? 'new-' : '';

    return [
        {
            id: `${prefix}test1`,
            image: {
                id: `${prefix}test1`,
                small: `${prefix}small1`,
                medium: `${prefix}medium1`,
                large: `${prefix}large1`,
            },
            index: 0,
            selected: undefined,
            thumbnailClass: 'img-carousel-manage',
            totalSlides: 3,
        },
        {
            id: `${prefix}test2`,
            image: {
                id: `${prefix}test2`,
                small: `${prefix}small2`,
                medium: `${prefix}medium2`,
                large: `${prefix}large2`,
            },
            index: 1,
            selected: undefined,
            thumbnailClass: 'img-carousel-manage',
            totalSlides: 3,
        },
        {
            id: `${prefix}test3`,
            image: {
                id: `${prefix}test3`,
                small: `${prefix}small3`,
                medium: `${prefix}medium3`,
                large: `${prefix}large3`,
            },
            index: 2,
            selected: undefined,
            thumbnailClass: 'img-carousel-manage',
            totalSlides: 3,
        },
    ];
};

const mockConfirm = jest.spyOn(window, 'confirm');
const mockShouldPreventFullScreenActivation = jest.spyOn(hotelImageCarouselUtils, 'shouldPreventFullScreenActivation');

describe('<OfferCardSlider />', () => {
    const resetMocks = (): IOfferCardSliderProps => ({
        showIndex: true,
        className: '',
        images: [
            {
                id: 'test1',
                small: 'small1',
                medium: 'medium1',
                large: 'large1',
            },
            {
                id: 'test2',
                small: 'small2',
                medium: 'medium2',
                large: 'large2',
            },
            {
                id: 'test3',
                small: 'small3',
                medium: 'medium3',
                large: 'large3',
            },
        ],
        fallbackImage: 'fallbackImage',
        roomImagesFolderId: 'roomImagesFolderId',
        roomItemId: 'roomItemId',
        isEditMode: false,
        addImage: jest.fn(),
        deleteImage: jest.fn(),
        deleteImages: jest.fn(),
        getImageByItemId: jest.fn(),
        sortImages: jest.fn(),
        isFullScreenEnabled: false,
        onArrowClick: jest.fn(),
        youtubeVideoId: '',
        videoPlaceholder: '',
        cloudinaryVideoSrc: '',
        isCloudinaryDisabled: false,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockConfirm.mockImplementation(jest.fn(() => true));
        mockShouldPreventFullScreenActivation.mockReturnValue(false);
    });

    it('should render offer-card-slider with fullScreenEnabled class when isFullScreenEnabled is true', () => {
        mocks.isFullScreenEnabled = true;

        render(<OfferCardSlider {...mocks} />);

        expect(screen.getByTestId('offer-card-slider')).toHaveClass('container fullScreenEnabled');
    });

    it('should render offer-card-slider with className from props', () => {
        mocks.className = 'test-class';

        render(<OfferCardSlider {...mocks} />);

        expect(screen.getByTestId('offer-card-slider')).toHaveClass('container test-class');
    });

    it('should render new images when images are updated', () => {
        const { rerender } = render(<OfferCardSlider {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                items: mockStateImages(),
            }),
        );

        mocks.images = [
            {
                id: 'new-test1',
                small: 'new-small1',
                medium: 'new-medium1',
                large: 'new-large1',
            },
            {
                id: 'new-test2',
                small: 'new-small2',
                medium: 'new-medium2',
                large: 'new-large2',
            },
            {
                id: 'new-test3',
                small: 'new-small3',
                medium: 'new-medium3',
                large: 'new-large3',
            },
        ];

        rerender(<OfferCardSlider {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                items: mockStateImages(true),
            }),
        );
    });

    describe('ImageGallery', () => {
        it('should render ImageGallery without fullscreen button when images are provided and isFullScreenEnabled is false', () => {
            render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('enlarge-icon')).not.toBeInTheDocument();
            expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
            expect(mockImageGallery).toHaveBeenCalledWith({
                disableArrowKeys: true,
                items: mockStateImages(),
                lazyLoad: true,
                showIndex: mocks.showIndex,
                showThumbnails: false,
                slideDuration: 350,
                showPlayButton: false,
            });
        });

        it('should NOT render ImageGallery when images are NOT provided', () => {
            mocks.images = [];

            render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
            expect(screen.getByTestId('fallback-image')).toHaveAttribute(
                'style',
                'background-image: url(fallbackImage);',
            );
        });

        it('should render SliderImage', () => {
            render(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('slider-image')).toBeInTheDocument();
            expect(mockSliderImage).toHaveBeenCalledWith({
                fallbackImage: mocks.fallbackImage,
                hadInteraction: false,
                item: {
                    id: 'test1',
                    image: {
                        id: 'test1',
                        large: 'large1',
                        medium: 'medium1',
                        small: 'small1',
                    },
                    index: 0,
                    selected: undefined,
                    thumbnailClass: 'img-carousel-manage',
                    totalSlides: 3,
                },
                slideIndex: 0,
            });
        });

        it('should render VideoPlayer with correct props when youtubeVideoId and videoPlaceholder are provided', () => {
            mocks.youtubeVideoId = 'youtube id';

            render(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('video-player')).toBeInTheDocument();

            expect(mockVideoPlayerComponent).toHaveBeenCalledWith({
                wrapperClassName: 'youtubePlayer',
                fallbackImage: mocks.fallbackImage,
                isBasicPreview: true,
                isDisplayed: true,
                youtubeVideoId: 'youtube id',
                videoPlaceholder: '',
                title: undefined,
                onPlayCallback: expect.any(Function),
                thumbnailClassName: 'thumbnailClassName',
                cloudinaryVideoSrc: '',
            });
        });

        it('should NOT render CustomYoutubePlayer when youtubeVideoId/cloudinaryVideoSrc is NOT provided', () => {
            render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
        });

        it('should change hadInteraction to true onSlide when hadInteraction is false', async () => {
            const { rerender } = render(<OfferCardSlider {...mocks} />);

            expect(mockSliderImage).toHaveBeenCalledWith(expect.objectContaining({ hadInteraction: false }));

            await userEvent.click(screen.getByTestId('image-gallery-on-slide-button'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(mockSliderImage).toHaveBeenCalledWith(expect.objectContaining({ hadInteraction: true }));

            await userEvent.click(screen.getByTestId('image-gallery-on-slide-button'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(mockSliderImage).toHaveBeenCalledWith(expect.objectContaining({ hadInteraction: true }));
        });

        it('should renderFullScreenBtn when isFullScreenEnabled is true', () => {
            mocks.isFullScreenEnabled = true;

            render(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('enlarge-icon')).toBeInTheDocument();
        });
    });

    describe('FullScreenImageCarousel', () => {
        it('should NOT render when isFullScreenActivated is false', () => {
            mocks.isFullScreenEnabled = true;

            render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('full-screen-image-carousel')).not.toBeInTheDocument();
        });

        it('should render when isFullScreenActivated, isFullScreenEnabled and images are provided', async () => {
            mocks.isFullScreenEnabled = true;

            const { rerender } = render(<OfferCardSlider {...mocks} />);

            await userEvent.click(screen.getByTestId('enlarge-icon'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('full-screen-image-carousel')).toBeInTheDocument();
            expect(mockFullScreenImageCarousel).toHaveBeenCalledWith({
                images: mockStateImages(),
                fallbackImage: mocks.fallbackImage,
                currentImageIndex: 0,
                youtubePlayerClassName: 'youtubePlayer',
            });

            mocks.offer = {
                hotel: { name: 'test title' },
            } as IOffer;
            mocks.youtubeVideoId = 'youtube id';
            mocks.videoPlaceholder = 'placeholder';

            rerender(<OfferCardSlider {...mocks} />);
            expect(mockVideoPlayerComponent).toHaveBeenCalledWith({
                wrapperClassName: 'youtubePlayer',
                thumbnailClassName: 'thumbnailClassName',
                fallbackImage: mocks.fallbackImage,
                isBasicPreview: true,
                isDisplayed: false,
                youtubeVideoId: 'youtube id',
                videoPlaceholder: 'placeholder',
                title: 'test title',
                onPlayCallback: expect.any(Function),
                cloudinaryVideoSrc: '',
            });

            await userEvent.click(screen.getByTestId('full-screen-image-carousel'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('full-screen-image-carousel')).not.toBeInTheDocument();
        });

        it('should set isDisplayed to false in FullScreenMode', () => {
            mocks.isFullScreenEnabled = true;
            mockGetCurrentIndex.mockReturnValue(1);
            mocks.youtubeVideoId = 'youtube id';
            mocks.videoPlaceholder = 'placeholder';
            mocks.offer = {
                hotel: { name: 'test title' },
            } as IOffer;

            render(<OfferCardSlider {...mocks} />);
            expect(mockVideoPlayerComponent).toHaveBeenCalledWith({
                wrapperClassName: 'youtubePlayer',
                thumbnailClassName: 'thumbnailClassName',
                fallbackImage: mocks.fallbackImage,
                isBasicPreview: true,
                isDisplayed: false,
                youtubeVideoId: 'youtube id',
                videoPlaceholder: 'placeholder',
                title: 'test title',
                onPlayCallback: expect.any(Function),
                cloudinaryVideoSrc: '',
            });
        });

        it('should render FullScreenImageCarousel with tracking props when they are provided', async () => {
            mockGetCurrentIndex.mockReturnValue(0);
            mocks.isFullScreenEnabled = true;
            mocks.offer = {
                hotel: { name: 'test title' },
            } as IOffer;
            mocks.trackingHandlers = {
                handleSlide: jest.fn(),
                onCarouselSync: jest.fn(),
                swipeHandlers: {} as SwipeableHandlers,
                trackFullScreenClose: jest.fn(),
                trackFullScreenOpen: jest.fn(),
                trackThumbnailClick: jest.fn(),
            };

            const { rerender } = render(<OfferCardSlider {...mocks} />);

            await userEvent.click(screen.getByTestId('enlarge-icon'));

            rerender(<OfferCardSlider {...mocks} />);

            expect(mockFullScreenImageCarousel).toHaveBeenCalledWith({
                images: mockStateImages(),
                fallbackImage: mocks.fallbackImage,
                currentImageIndex: 0,
                youtubePlayerClassName: 'youtubePlayer',
                handleSlide: expect.any(Function),
                swipeHandlers: {},
                onCarouselSync: expect.any(Function),
                trackThumbnailClick: expect.any(Function),
            });
        });
    });

    describe('SliderNavButton', () => {
        it('should render 2 SliderNavButton', () => {
            render(<OfferCardSlider {...mocks} />);

            expect(screen.getAllByTestId('slider-nav-button')).toHaveLength(2);
        });

        it('should call onClick on slider nav button click', async () => {
            render(<OfferCardSlider {...mocks} />);

            await userEvent.click(screen.getAllByTestId('slider-nav-button-on-click')[0]);
            await userEvent.click(screen.getAllByTestId('slider-nav-button-on-click')[1]);

            expect(mockRightNav).toHaveBeenCalled();
            expect(mockLeftNav).toHaveBeenCalled();
            expect(mocks.onArrowClick).toHaveBeenCalledTimes(2);
        });

        it('should call onClick on slider nav button click without onArrowClick when onArrowClick is NOT provided', async () => {
            mocks.onArrowClick = undefined;

            render(<OfferCardSlider {...mocks} />);

            await userEvent.click(screen.getAllByTestId('slider-nav-button-on-click')[0]);

            expect(mockLeftNav).toHaveBeenCalled();
        });

        it('should change isDisabledArrowKeys to false on nav button blur and to true on focus', async () => {
            const { rerender } = render(<OfferCardSlider {...mocks} />);

            expect(mockImageGallery).toHaveBeenCalledWith(expect.objectContaining({ disableArrowKeys: true }));

            await userEvent.click(screen.getAllByTestId('slider-nav-button-on-focus')[0]);
            rerender(<OfferCardSlider {...mocks} />);

            expect(mockImageGallery).toHaveBeenCalledWith(expect.objectContaining({ disableArrowKeys: false }));

            await userEvent.click(screen.getAllByTestId('slider-nav-button-on-blur')[0]);
            rerender(<OfferCardSlider {...mocks} />);

            expect(mockImageGallery).toHaveBeenCalledWith(expect.objectContaining({ disableArrowKeys: true }));
        });
    });

    describe('Edit buttons', () => {
        it('should render delete, add and curate buttons when isEditMode is true and addImage function is provided', () => {
            mocks.isEditMode = true;

            render(<OfferCardSlider {...mocks} />);

            expect(screen.getByText('Remove image')).toBeInTheDocument();
            expect(screen.getByText('Add image')).toBeInTheDocument();
            expect(screen.getByText('Curate images')).toBeInTheDocument();
        });

        it('should render only add button when images are NOT provided', () => {
            mocks.images = undefined;
            mocks.isEditMode = true;

            render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByText('Remove image')).not.toBeInTheDocument();
            expect(screen.getByText('Add image')).toBeInTheDocument();
            expect(screen.queryByText('Curate images')).not.toBeInTheDocument();
        });

        it('should NOT render delete, add curate buttons when isEditMode is false', () => {
            render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByText('Remove image')).not.toBeInTheDocument();
            expect(screen.queryByText('Add image')).not.toBeInTheDocument();
            expect(screen.queryByText('Curate images')).not.toBeInTheDocument();
        });

        it('should NOT render delete, add curate buttons when addImage function is NOT provided', () => {
            mocks.isEditMode = true;
            mocks.addImage = undefined;

            render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByText('Remove image')).not.toBeInTheDocument();
            expect(screen.queryByText('Add image')).not.toBeInTheDocument();
            expect(screen.queryByText('Curate images')).not.toBeInTheDocument();
        });

        it('should call addImage on add image button click', async () => {
            mocks.isEditMode = true;

            render(<OfferCardSlider {...mocks} />);

            await userEvent.click(screen.getByText('Add image'));

            expect(mocks.addImage).toHaveBeenCalled();
        });

        it('should NOT call deleteImage on delete image button click when getCurrentIndex() is undefined', async () => {
            mocks.isEditMode = true;
            mockGetCurrentIndex.mockReturnValue(undefined);
            render(<OfferCardSlider {...mocks} />);

            await userEvent.click(screen.getByText('Remove image'));

            expect(mocks.deleteImage).not.toHaveBeenCalled();
        });

        it('should NOT call deleteImage on delete image button click when confirm returns false', async () => {
            mockConfirm.mockImplementation(jest.fn(() => false));
            mocks.isEditMode = true;

            render(<OfferCardSlider {...mocks} />);

            await userEvent.click(screen.getByText('Remove image'));

            expect(mocks.deleteImage).not.toHaveBeenCalled();
        });
    });

    describe('ImagesMultipleSortPopup', () => {
        it('should NOT render ImagesMultipleSortPopup when showImagesSort is false', () => {
            render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();
        });

        it('should render ImagesMultipleSortPopup when showImagesSort is false', async () => {
            mocks.isEditMode = true;

            const { rerender } = render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();

            await userEvent.click(screen.getByText('Curate images'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('images-multiple-sort-popup')).toBeInTheDocument();
        });

        it('should close ImagesMultipleSortPopup and call sortImages on close click', async () => {
            mocks.isEditMode = true;

            const { rerender } = render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();

            await userEvent.click(screen.getByText('Curate images'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('images-multiple-sort-popup')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('sort-on-close-button'));
            rerender(<OfferCardSlider {...mocks} />);

            waitFor(() => {
                expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();
                expect(mocks.sortImages).toHaveBeenCalled();
            });
        });

        it('should close ImagesMultipleSortPopup and NOT call sortImages on close click when image is NOT provided', async () => {
            mocks.isEditMode = true;

            const { rerender } = render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();

            await userEvent.click(screen.getByText('Curate images'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('images-multiple-sort-popup')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('sort-on-close-button-without-props'));
            rerender(<OfferCardSlider {...mocks} />);

            waitFor(() => {
                expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();
                expect(mocks.sortImages).not.toHaveBeenCalled();
            });
        });

        it('should call deleteImages on deleteSitecoreImages', async () => {
            mocks.isEditMode = true;

            const { rerender } = render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();

            await userEvent.click(screen.getByText('Curate images'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('images-multiple-sort-popup')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('sort-delete-button'));

            waitFor(() => {
                expect(mocks.deleteImages).toHaveBeenCalled();
            });
        });

        it('should NOT call deleteImages on deleteSitecoreImages when confirm is false', async () => {
            mocks.isEditMode = true;
            mockConfirm.mockImplementation(jest.fn(() => false));

            const { rerender } = render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();

            await userEvent.click(screen.getByText('Curate images'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('images-multiple-sort-popup')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('sort-delete-button'));

            waitFor(() => {
                expect(mocks.deleteImages).toHaveBeenCalled();
            });
        });

        it('should NOT call deleteImages on deleteSitecoreImages when selected images are NOT provided', async () => {
            mocks.isEditMode = true;

            const { rerender } = render(<OfferCardSlider {...mocks} />);

            expect(screen.queryByTestId('images-multiple-sort-popup')).not.toBeInTheDocument();

            await userEvent.click(screen.getByText('Curate images'));
            rerender(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('images-multiple-sort-popup')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('sort-delete-button-without-props'));

            waitFor(() => {
                expect(mocks.deleteImages).toHaveBeenCalled();
            });
        });
    });

    describe('stopArrowKeyPropagation', () => {
        it('should call stopPropagation for ArrowLeft and ArrowRight keys on mount', () => {
            render(<OfferCardSlider {...mocks} />);

            const container = screen.getByTestId('offer-card-slider');

            [KeyboardKey.ArrowLeft, KeyboardKey.ArrowRight].forEach(key => {
                const stopPropagation = jest.fn();
                const event = new KeyboardEvent('keyup', { key, bubbles: true });
                Object.defineProperty(event, 'stopPropagation', { value: stopPropagation });

                container.dispatchEvent(event);

                expect(stopPropagation).toHaveBeenCalledTimes(1);
            });
        });

        it('should NOT call stopPropagation for non-arrow keys', () => {
            render(<OfferCardSlider {...mocks} />);

            const stopPropagation = jest.fn();
            const event = new KeyboardEvent('keyup', { key: KeyboardKey.ENTER, bubbles: true });
            Object.defineProperty(event, 'stopPropagation', { value: stopPropagation });

            screen.getByTestId('offer-card-slider').dispatchEvent(event);

            expect(stopPropagation).not.toHaveBeenCalled();
        });

        it('should NOT call stopPropagation after unmount', () => {
            const { unmount } = render(<OfferCardSlider {...mocks} />);
            const container = screen.getByTestId('offer-card-slider');

            unmount();

            const stopPropagation = jest.fn();
            const event = new KeyboardEvent('keyup', { key: KeyboardKey.ArrowLeft, bubbles: true });
            Object.defineProperty(event, 'stopPropagation', { value: stopPropagation });

            container.dispatchEvent(event);

            expect(stopPropagation).not.toHaveBeenCalled();
        });
    });

    describe('activateFullScreenMode', () => {
        it('should change isFullScreenActivated when shouldPreventFullScreenActivation returns false', () => {
            const comp = new OfferCardSlider(mocks);

            const setState = jest.spyOn(comp, 'setState');

            comp['activateFullScreenMode']({ target: {} } as MouseEvent);

            expect(setState).toHaveBeenCalledWith({ isFullScreenActivated: true });
        });

        it('should NOT change isFullScreenActivated when shouldPreventFullScreenActivation returns true', () => {
            mockShouldPreventFullScreenActivation.mockReturnValue(true);

            const comp = new OfferCardSlider(mocks);

            expect(comp.state.isFullScreenActivated).toBe(false);

            comp['activateFullScreenMode']({ target: {} } as MouseEvent);

            expect(comp.state.isFullScreenActivated).toBe(false);
        });
    });

    describe('image filtering', () => {
        it('should filter out large-only images (when no medium, no small are available)', () => {
            mocks.images = [
                { id: 'test1', small: 'small1', medium: 'medium1', large: 'large1' },
                { id: 'test2', small: '', medium: '', large: 'large2' },
                { id: 'test3', small: 'small3', medium: 'medium3', large: 'large3' },
            ];

            render(<OfferCardSlider {...mocks} />);

            const { items } = mockImageGallery.mock.lastCall[0];

            expect(items).toHaveLength(2);
            expect(items.map(i => i.image.id)).not.toContain('test2');
        });

        it('should keep images that have medium available', () => {
            mocks.images = [{ id: 'test1', small: '', medium: 'medium1', large: '' }];

            render(<OfferCardSlider {...mocks} />);

            const { items } = mockImageGallery.mock.lastCall[0];

            expect(items).toHaveLength(1);
            expect(items[0].image.id).toBe('test1');
        });

        it('should keep images that have both large and small (no medium)', () => {
            mocks.images = [{ id: 'test1', small: 'small1', medium: '', large: 'large1' }];

            render(<OfferCardSlider {...mocks} />);

            const { items } = mockImageGallery.mock.lastCall[0];

            expect(items).toHaveLength(1);
            expect(items[0].image.id).toBe('test1');
        });
    });

    describe('isSmallImageVariant prop', () => {
        it('should apply smallImageContainer class when isSmallImageVariant is true', () => {
            mocks.isSmallImageVariant = true;

            render(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('offer-card-slider')).toHaveClass('container smallImageContainer');
        });

        it('should NOT apply smallImageContainer class when isSmallImageVariant is undefined', () => {
            mocks.isSmallImageVariant = undefined;

            render(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('offer-card-slider')).toHaveClass('container');
            expect(screen.getByTestId('offer-card-slider')).not.toHaveClass('smallImageContainer');
        });

        it('should apply smallImageContainer, custom className, and fullScreenEnabled together', () => {
            mocks.isSmallImageVariant = true;
            mocks.isFullScreenEnabled = true;
            mocks.className = 'custom-class';

            render(<OfferCardSlider {...mocks} />);

            expect(screen.getByTestId('offer-card-slider')).toHaveClass(
                'container custom-class smallImageContainer fullScreenEnabled',
            );
        });
    });

    describe('videoIndex', () => {
        beforeEach(() => {
            mockCurrentIndex = 0;
        });

        it('should insert video at position 0 and shift all image indices by 1 when videoIndex is not provided', () => {
            mocks.youtubeVideoId = 'youtube id';

            render(<OfferCardSlider {...mocks} />);

            const { items } = mockImageGallery.mock.lastCall[0];

            expect(items).toHaveLength(4);
            expect(items[0]).toMatchObject({ index: 0, youtubeVideoId: 'youtube id' });
            expect(items[1]).toMatchObject({ index: 1, image: expect.objectContaining({ id: 'test1' }) });
            expect(items[2]).toMatchObject({ index: 2, image: expect.objectContaining({ id: 'test2' }) });
            expect(items[3]).toMatchObject({ index: 3, image: expect.objectContaining({ id: 'test3' }) });
        });

        it('should insert video at position 1 and assign correct indices when videoIndex is 1', () => {
            mocks.youtubeVideoId = 'youtube id';
            mocks.videoIndex = 1;

            render(<OfferCardSlider {...mocks} />);

            const { items } = mockImageGallery.mock.lastCall[0];

            expect(items).toHaveLength(4);
            expect(items[0]).toMatchObject({ index: 0, image: expect.objectContaining({ id: 'test1' }) });
            expect(items[1]).toMatchObject({ index: 1, youtubeVideoId: 'youtube id' });
            expect(items[2]).toMatchObject({ index: 2, image: expect.objectContaining({ id: 'test2' }) });
            expect(items[3]).toMatchObject({ index: 3, image: expect.objectContaining({ id: 'test3' }) });
        });

        it('should insert video at position 0 when a negative videoIndex is provided', () => {
            mocks.youtubeVideoId = 'youtube id';
            mocks.videoIndex = -1;

            render(<OfferCardSlider {...mocks} />);

            const { items } = mockImageGallery.mock.lastCall[0];

            expect(items).toHaveLength(4);
            expect(items[0]).toMatchObject({ index: 0, youtubeVideoId: 'youtube id' });
            expect(items[1]).toMatchObject({ index: 1, image: expect.objectContaining({ id: 'test1' }) });
            expect(items[2]).toMatchObject({ index: 2, image: expect.objectContaining({ id: 'test2' }) });
            expect(items[3]).toMatchObject({ index: 3, image: expect.objectContaining({ id: 'test3' }) });
        });

        it('should set isDisplayed to true on VideoPlayer when currentIndex matches default videoIndex (0)', () => {
            mocks.youtubeVideoId = 'youtube id';
            mockGetCurrentIndex.mockReturnValue(0);

            render(<OfferCardSlider {...mocks} />);

            expect(mockVideoPlayerComponent).toHaveBeenCalledWith(expect.objectContaining({ isDisplayed: true }));
        });

        it('should set isDisplayed to false on VideoPlayer when currentIndex does not match default videoIndex (0)', () => {
            mocks.youtubeVideoId = 'youtube id';
            mockGetCurrentIndex.mockReturnValue(2);

            render(<OfferCardSlider {...mocks} />);

            expect(mockVideoPlayerComponent).toHaveBeenCalledWith(expect.objectContaining({ isDisplayed: false }));
        });
    });
});
