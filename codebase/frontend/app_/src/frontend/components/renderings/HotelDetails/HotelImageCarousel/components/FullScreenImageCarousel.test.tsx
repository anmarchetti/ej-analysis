import React from 'react';
import { SwipeableHandlers } from 'react-swipeable';
import { render, screen } from '@testing-library/react';

import FullScreenImageCarousel, {
    IFullScreenImageCarouselProps,
} from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/FullScreenImageCarousel';

const mockVideoThumbnailImageComponent = jest.fn();
jest.mock('frontend/components/common/VideoThumbnailImage/VideoThumbnailImage', () => ({
    __esModule: true,
    default: props => {
        mockVideoThumbnailImageComponent(props);

        return <div data-tid='video-thumbnail-image' />;
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

const createProps = (): IFullScreenImageCarouselProps => ({
    images: [
        {
            index: 1,
            image: { small: 'small1', medium: 'medium1', large: 'large1', description: 'desc1' },
            totalSlides: 4,
        },
        {
            index: 2,
            image: { small: 'small2', medium: 'medium2', large: 'large2', description: 'desc2' },
            totalSlides: 4,
        },
        {
            index: 3,
            image: { small: 'small3', medium: 'medium3', large: 'large3', description: 'desc3' },
            totalSlides: 4,
        },
        {
            index: 4,
            image: { small: 'small4', medium: 'medium4', large: 'large4', description: 'desc4' },
            totalSlides: 4,
        },
    ],
    fallbackImage: 'fallback',
    onClose: jest.fn(),
    currentImageIndex: 1,
    videoTitle: 'test title',
    youtubePlayerClassName: 'youtubePlayerClass',
    handleSlide: jest.fn(),
    onCarouselSync: jest.fn(),
    swipeHandlers: {} as SwipeableHandlers,
    trackThumbnailClick: jest.fn(),
    autoPlay: true,
    setAutoPlay: jest.fn(),
});

const createStores = () => ({
    layoutStore: { isFullMaintenance: false },
    appStore: { isScreenLarge: false, isLandscapeOrientation: false, isScreenMedium: false },
    bookingStore: { isValidatingPackage: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

const mockHotelImageProps = jest.fn();
jest.mock('frontend/components/common/HotelImage/HotelImage', () => ({
    __esModule: true,
    default: props => {
        mockHotelImageProps(props);

        return <div data-tid='hotel-image' />;
    },
}));

describe('<FullScreenImageCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render popup', () => {
        render(<FullScreenImageCarousel {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('should render image gallery when images are provided', () => {
        render(<FullScreenImageCarousel {...mockProps} />);

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(7);
        expect(buttons[3]).toHaveAttribute('aria-label', 'Go to Slide 1');
        expect(buttons[4]).toHaveAttribute('aria-label', 'Go to Slide 2');
        expect(buttons[5]).toHaveAttribute('aria-label', 'Go to Slide 3');
        expect(buttons[6]).toHaveAttribute('aria-label', 'Go to Slide 4');

        expect(screen.getAllByTestId('hotel-image').length).toBe(6);
        expect(mockHotelImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                image: {
                    small: 'small1',
                    medium: 'medium1',
                    large: 'large1',
                    description: 'desc1',
                },
                defaultSize: 'large',
                className: 'hotel-card-img',
                fallbackImage: 'fallback',
            }),
        );
    });

    it('should render fallback image when images are NOT provided', () => {
        mockProps.images = [];

        render(<FullScreenImageCarousel {...mockProps} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByTestId('fallback-image')).toBeInTheDocument();
    });

    it('should render 2 image-descriptions', async () => {
        render(<FullScreenImageCarousel {...mockProps} />);

        await expect(screen.getAllByText('desc1').length).toBe(2);
    });

    it('should render thumbnail', () => {
        const { container } = render(<FullScreenImageCarousel {...mockProps} />);

        expect(container.getElementsByClassName('img-carousel-thumbnails')[0]).toHaveAttribute(
            'aria-label',
            'Hotel images gallery',
        );
    });

    it('should render VideoPlayer with correct props', () => {
        mockProps.images[0].image = undefined;
        mockProps.images[0].youtubeVideoId = 'test';
        mockProps.images[0].videoPlaceholder = 'videoPlaceholder';

        render(<FullScreenImageCarousel {...mockProps} />);

        expect(mockVideoPlayerComponent).toHaveBeenCalledWith({
            wrapperClassName: mockProps.youtubePlayerClassName,
            fallbackImage: mockProps.fallbackImage,
            isBasicPreview: true,
            isDisplayed: false,
            youtubeVideoId: 'test',
            videoPlaceholder: mockProps.images[0].videoPlaceholder,
            title: 'test title',
            autoPlay: true,
            cloudinaryVideoSrc: '',
            setAutoPlay: mockProps.setAutoPlay,
        });
    });

    it('should render VideoPlayer with correct className', () => {
        mockProps.images[0].image = undefined;
        mockProps.images[0].youtubeVideoId = 'test';
        mockProps.images[0].videoPlaceholder = 'videoPlaceholder';
        mockProps.youtubePlayerClassName = undefined;

        render(<FullScreenImageCarousel {...mockProps} />);

        expect(mockVideoPlayerComponent).toHaveBeenCalledWith({
            wrapperClassName: 'media-video-carousel',
            fallbackImage: mockProps.fallbackImage,
            isBasicPreview: true,
            isDisplayed: false,
            youtubeVideoId: 'test',
            videoPlaceholder: mockProps.images[0].videoPlaceholder,
            title: 'test title',
            autoPlay: true,
            cloudinaryVideoSrc: '',
            setAutoPlay: mockProps.setAutoPlay,
        });
    });

    it('should render VideoPlayer', () => {
        mockProps.images[0].image = undefined;
        mockProps.images[0].youtubeVideoId = 'test';
        render(<FullScreenImageCarousel {...mockProps} />);

        expect(screen.getByTestId('video-player')).toBeInTheDocument();
    });

    it('should NOT render VideoPlayer when youtube video id is NOT provided', () => {
        render(<FullScreenImageCarousel {...mockProps} />);

        expect(screen.queryByTestId('custom-youtube-player')).not.toBeInTheDocument();
    });

    it('should render YoutubeThumbnailImage with correct props', () => {
        mockProps.images[0].image = undefined;
        mockProps.images[0].youtubeVideoId = 'test';
        mockProps.images[0].youtubeVideoPlaceholder = 'youtubeVideoPlaceholder';
        render(<FullScreenImageCarousel {...mockProps} />);

        expect(screen.getByTestId('video-thumbnail-image')).toBeInTheDocument();
        expect(mockVideoThumbnailImageComponent).toHaveBeenCalledWith({
            className: 'img-carousel-thumbnails__image',
            fallbackImage: mockProps.fallbackImage,
            youtubeId: mockProps.images[0].youtubeVideoId,
            isSmall: true,
            showPlayButton: true,
            videoPlaceholder: mockProps.images[0].videoPlaceholder,
            publicId: '',
        });
    });

    it('should NOT render YoutubeThumbnailImage when youtube video id is NOT provided', () => {
        render(<FullScreenImageCarousel {...mockProps} />);

        expect(screen.queryByTestId('youtube-thumbnail-image')).not.toBeInTheDocument();
    });
});
