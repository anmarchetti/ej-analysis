import { fireEvent, render, screen } from '@testing-library/react';

import { useImageCarouselRenderHelper } from './useImageCarouselRenderHelper';

const mockSliderImageComponent = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/SliderImage', () => props => {
    mockSliderImageComponent(props);

    return <div data-tid='slider-image' />;
});

const mockHotelImage = jest.fn();
jest.mock('frontend/components/common/HotelImage/HotelImage', () => props => {
    mockHotelImage(props);

    return <div data-tid='hotel-image' />;
});

const mockVideoThumbnailComponent = jest.fn();
jest.mock('frontend/components/common/VideoThumbnailImage/VideoThumbnailImage', () => props => {
    mockVideoThumbnailComponent(props);

    return <div data-tid='video-thumbnail-image' />;
});

const mockYoutubePlayerComponent = jest.fn();
jest.mock('frontend/components/common/VideoPlayer/VideoPlayer', () => props => {
    mockYoutubePlayerComponent(props);

    return <div data-tid='video-player' />;
});
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: jest.fn().mockReturnValue(false),
}));
jest.mock('frontend/components/icons-new/Enlarge', () => () => <div data-tid='svg-en-large' />);
jest.mock('frontend/components/common/SliderNavButton', () => () => <div data-tid='slider-nav-button' />);

const createProps = () => ({
    currentIndex: jest.fn(),
    mainSlideRef: { current: { state: { currentIndex: 0 } } },
    fallbackImage: 'fallbackImage',
    thumbnailFallbackImage: 'thumbnailFallbackImage',
    isFullScreenActive: false,
    isEditMode: false,
    withoutSelection: false,
    images: [
        { id: 'img1', large: 'large1', medium: 'medium1', small: 'small1' },
        { id: 'img2', large: 'large2', medium: 'medium2', small: 'small2' },
    ],
    viewRef: { current: { querySelector: jest.fn() } } as unknown as React.RefObject<HTMLDivElement>,
    enableArrowKeys: jest.fn(),
    disableArrowKeys: jest.fn(),
    isFullScreenEnabled: true,
    openFullScreen: jest.fn(),
});

let mockProps;
const TestComponent = props => {
    const { renderMainImage, renderThumbInner, renderLeftNav, renderRightNav, renderFullScreenBtn } =
        useImageCarouselRenderHelper(mockProps);

    return (
        <>
            <div data-tid='main-image'>{renderMainImage({ image: mockProps.images[0], index: 0, totalSlides: 1 })}</div>
            <div data-tid='thumb-inner'>
                {renderThumbInner({ image: mockProps.images[1], index: 0, totalSlides: 1 })}
            </div>

            {renderLeftNav(props.onClick)}
            {renderRightNav(props.onClick)}
            {renderFullScreenBtn()}
        </>
    );
};

describe('useImageCarouselRenderHelper', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render SliderImage when image is provided in renderMainImage', () => {
        render(<TestComponent {...mockProps} />);

        expect(screen.getByTestId('slider-image')).toBeInTheDocument();
        expect(mockSliderImageComponent).toHaveBeenCalledWith({
            fallbackImage: 'fallbackImage',
            item: { image: mockProps.images[0], index: 0, totalSlides: 1 },
            slideIndex: undefined,
            slideSize: 'large',
        });
    });

    it('should render HotelImage when image is provided in renderThumbInner', () => {
        render(<TestComponent {...mockProps} />);

        expect(screen.getByTestId('hotel-image')).toBeInTheDocument();
        expect(mockHotelImage).toHaveBeenCalledWith({
            className: 'img-carousel-thumbnails__image',
            defaultSize: 'small',
            fallbackImage: 'thumbnailFallbackImage',
            image: mockProps.images[1],
        });

        expect(screen.queryByTestId('select-image')).not.toBeInTheDocument();
        expect(screen.queryByTestId('remove-button')).not.toBeInTheDocument();
    });

    it('should render HotelImage when image is provided in renderThumbInner', () => {
        mockProps.isEditMode = true;
        mockProps.withoutSelection = false;
        render(<TestComponent {...mockProps} />);
        expect(screen.getByTestId('select-image')).toBeInTheDocument();
        expect(screen.getByTestId('remove-button')).toBeInTheDocument();
    });

    it('should render HotelImage when image is provided in renderThumbInner', () => {
        mockProps.isEditMode = true;
        mockProps.withoutSelection = true;
        render(<TestComponent {...mockProps} />);
        expect(screen.queryByTestId('select-image')).not.toBeInTheDocument();
        expect(screen.getByTestId('remove-button')).toBeInTheDocument();
    });

    it('should render VideoPlayer when no image and youtubeVideoId is provided in renderMainImage', () => {
        mockProps.images = [];
        render(<TestComponent {...mockProps} />);

        expect(screen.getByTestId('video-player')).toBeInTheDocument();
        expect(mockYoutubePlayerComponent).toHaveBeenCalledWith({
            cloudinaryVideoSrc: '',
            fallbackImage: 'fallbackImage',
            isBasicPreview: true,
            isDisplayed: true,
            onPlayCallback: expect.any(Function),
            title: undefined,
            videoPlaceholder: undefined,
            wrapperClassName: 'media-video-carousel',
            youtubeVideoId: '',
        });
    });

    it('should render VideoThumbnailImage when no image and youtubeVideoId is provided in renderThumbInner', () => {
        mockProps.images = [];
        render(<TestComponent {...mockProps} />);

        expect(screen.getByTestId('video-thumbnail-image')).toBeInTheDocument();
        expect(mockVideoThumbnailComponent).toHaveBeenCalledWith({
            className: 'img-carousel-thumbnails__image',
            fallbackImage: 'thumbnailFallbackImage',
            isSmall: true,
            showPlayButton: true,
            youtubeVideoPlaceholder: undefined,
            youtubeId: '',
            videoPlaceholder: undefined,
            publicId: '',
        });
    });

    it('should render SliderNavButton in renderLeftNav', () => {
        const onClick = jest.fn();
        render(<TestComponent onClick={onClick} />);

        expect(screen.getAllByTestId('slider-nav-button')).toHaveLength(2);
    });

    it('should render fullscreen button in renderFullScreenBtn when fullscreen is enabled', () => {
        render(<TestComponent {...mockProps} />);

        const button = screen.getByTestId('svg-en-large').parentNode;
        expect(screen.getByTestId('svg-en-large')).toBeInTheDocument();

        if (button) {
            fireEvent.click(button);
        }

        expect(mockProps.openFullScreen).toHaveBeenCalled();
    });

    it('should NOT render fullscreen button in renderFullScreenBtn when fullscreen is disabled', () => {
        const disabledFullScreenProps = { ...mockProps, isFullScreenEnabled: false };
        render(<TestComponent {...disabledFullScreenProps} />);

        expect(screen.queryByText('svg-en-large')).not.toBeInTheDocument();
    });
});
