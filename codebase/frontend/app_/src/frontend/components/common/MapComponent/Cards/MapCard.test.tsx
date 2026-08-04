import { fireEvent, render, screen } from '@testing-library/react';

import { IGeoPoint } from 'models/data/map/IMap';

import MapCard from './MapCard';
import * as mapCardUtils from './MapCard.utils';
import { IUseMapCardProps } from './MapCard.utils';

jest.mock('./MapCardSkeleton', () => ({
    __esModule: true,
    default: () => <div data-tid='skeleton' />,
}));

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn(url => (url ? `-/jssmedia/${url}` : '')),
    },
}));

const mockLuxuryWrapperComponent = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLuxuryWrapperComponent(props);

        return <div data-tid='luxury-wrapper'>{children}</div>;
    },
}));

const mockStarRatingComponent = jest.fn();
jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockStarRatingComponent(props);

        return <div data-tid='star-rating' />;
    },
}));

const mockTripadvisorInfoComponent = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockTripadvisorInfoComponent(props);

        return <div data-tid='tripadvisor-info' />;
    },
}));

jest.mock('frontend/components/icons/Clock', () => ({
    __esModule: true,
    default: () => <div data-tid='clock' />,
}));

const mockOfferCardSliderComponent = jest.fn();
jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    OfferCardSlider: props => {
        mockOfferCardSliderComponent(props);

        return <div data-tid='offer-card-slider' />;
    },
}));

const mockUseXSMobileViewport = jest.fn();
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useXSMobileViewport: () => mockUseXSMobileViewport(),
}));

const data = {
    isLoading: false,
    onClose: jest.fn(),
    isLuxury: false,
    content: {
        hidden: false,
        starRating: 5,
        rating: 4.5,
        list: [],
        images: [
            {
                small: "example.com/133801_-_L'Elysee_Val_D'Europe/small/133801_01.jpg",
                medium: "example.com/133801_-_L'Elysee_Val_D'Europe/medium/133801_01.jpg",
                large: "example.com/133801_-_L'Elysee_Val_D'Europe/large/133801_01.jpg",
            },
        ],
        fallbackImage: '-/jssmedia/fallback.jpg',
    },
    button: {
        link: 'link',
        onClick: jest.fn(),
        title: 'title',
    },
};

const mockProps: IUseMapCardProps = {
    hotel: {
        geometry: {
            coordinates: [11, 22],
        },
        properties: {
            name: 'Hotel Name',
            id: '1',
            price: 200,
            pricePP: 100,
        },
    } as IGeoPoint,
    stop: undefined,
    setSelected: jest.fn(),
    cache: new Map(),
};

const useMapCardSpy = jest.spyOn(mapCardUtils, 'default').mockReturnValue(data);

const mapDiv = document.createElement('div');
document.body.appendChild(mapDiv);

const mockMap = {
    setOptions: jest.fn(),
    getDiv: jest.fn(() => mapDiv),
};
jest.mock('@vis.gl/react-google-maps', () => ({
    __esModule: true,
    useMap: jest.fn(() => mockMap),
}));

describe('MapCard', () => {
    it('should be rendered when isLoading is false', () => {
        render(<MapCard {...mockProps} />);

        expect(screen.queryByTestId('skeleton')).toBeNull();

        expect(mockLuxuryWrapperComponent).toHaveBeenCalledWith({
            bannerClassName: 'luxuryBanner priority',
            wrapperClassName: 'luxuryWrapper',
            renderChildrenOnly: true,
        });
        expect(screen.queryByTestId('star-rating')).toBeInTheDocument();
        expect(mockStarRatingComponent).toHaveBeenCalledWith({
            rating: 5,
        });
        expect(screen.queryByTestId('tripadvisor-info')).toBeInTheDocument();
        expect(mockTripadvisorInfoComponent).toHaveBeenCalledWith({
            hasIcon: true,
            rating: 4.5,
            reviews: undefined,
        });
    });

    it('should render loader when isLoading is true', () => {
        useMapCardSpy.mockReturnValueOnce({ ...data, isLoading: true });

        render(<MapCard {...mockProps} />);

        expect(screen.getByTestId('skeleton')).toBeInTheDocument();

        expect(mockLuxuryWrapperComponent).not.toHaveBeenCalled();
        expect(mockStarRatingComponent).not.toHaveBeenCalled();
        expect(mockTripadvisorInfoComponent).not.toHaveBeenCalled();
    });

    it('should render list when list is provided', () => {
        useMapCardSpy.mockReturnValueOnce({
            ...data,
            content: {
                ...data.content,
                list: [
                    { content: 'Option 1', icon: <i>icon</i>, key: 1 },
                    { content: 'Option 2', icon: <i>icon</i>, key: 2 },
                ],
            },
        });

        render(<MapCard {...mockProps} />);

        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(screen.getByTestId('tripadvisor-info')).toBeInTheDocument();

        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getAllByText('icon')).toHaveLength(2);
    });

    it('should render OfferCardSlider when images are provided', () => {
        useMapCardSpy.mockReturnValueOnce({
            ...data,
        });

        render(<MapCard {...mockProps} />);

        expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
        expect(mockOfferCardSliderComponent).toHaveBeenCalledWith({
            images: data.content.images,
            showIndex: false,
            fallbackImage: '-/jssmedia/fallback.jpg',
            className: 'imageSlider',
            carouselWrapperClassName: 'carouselWrapper',
        });
    });

    describe('Double click zoom prevention', () => {
        it('should not propagate the double click event', () => {
            const onOuterDoubleClick = jest.fn();

            render(
                <div onDoubleClick={onOuterDoubleClick}>
                    <MapCard {...mockProps} />
                </div>,
            );
            const offerCardSlider = screen.getByTestId('offer-card-slider');

            fireEvent.doubleClick(offerCardSlider);

            expect(onOuterDoubleClick).toHaveBeenCalledTimes(0);
        });

        it('should set disableDoubleClickZoom to true on double click on mobile', () => {
            mockUseXSMobileViewport.mockReturnValue(true);

            render(<MapCard {...mockProps} />, { container: mapDiv });

            const offerCardSlider = screen.getByTestId('offer-card-slider');

            fireEvent.touchStart(offerCardSlider);

            expect(mockMap.setOptions).toHaveBeenCalledWith({ disableDoubleClickZoom: true });
        });

        it('should NOT set disableDoubleClickZoom to true on double click on desktop', () => {
            mockUseXSMobileViewport.mockReturnValue(false);

            render(<MapCard {...mockProps} />);

            const offerCardSlider = screen.getByTestId('offer-card-slider');

            fireEvent.doubleClick(offerCardSlider);

            expect(mockMap.setOptions).not.toHaveBeenCalledWith({ disableDoubleClickZoom: true });
        });
    });

    describe('Map dragging prevention on slider interaction', () => {
        it('should set map draggable to false on slider touch start on mobile', () => {
            mockUseXSMobileViewport.mockReturnValue(true);

            render(<MapCard {...mockProps} />);

            const offerCardSlider = screen.getByTestId('offer-card-slider');

            fireEvent.touchStart(offerCardSlider);

            expect(mockMap.setOptions).toHaveBeenLastCalledWith({ draggable: false });
        });

        it('should NOT set map draggable to false on slider touch start on desktop', () => {
            mockUseXSMobileViewport.mockReturnValue(false);

            render(<MapCard {...mockProps} />);

            const offerCardSlider = screen.getByTestId('offer-card-slider');

            fireEvent.touchStart(offerCardSlider);

            expect(mockMap.setOptions).not.toHaveBeenLastCalledWith({ draggable: false });
        });
    });

    it('should render description and duration when list is not provided and description and duration are provided', () => {
        useMapCardSpy.mockReturnValueOnce({
            ...data,
            content: {
                ...data.content,
                list: undefined,
                description: 'Description text',
                duration: ['Approx.', '2', 'hrs'],
            },
        });

        render(<MapCard {...mockProps} />);

        expect(screen.getByText('Description text')).toBeInTheDocument();
        expect(screen.getByTestId('clock')).toBeInTheDocument();
        expect(screen.getByTestId('map-card-duration')).toBeInTheDocument();
        expect(screen.getByTestId('map-card-duration-text').textContent).toBe('Approx. 2 hrs');
    });

    it('should render description without duration when list and duration are not provided and description is provided', () => {
        useMapCardSpy.mockReturnValueOnce({
            ...data,
            content: {
                ...data.content,
                list: undefined,
                description: 'Description text',
                duration: undefined,
            },
        });

        render(<MapCard {...mockProps} />);

        expect(screen.getByText('Description text')).toBeInTheDocument();
        expect(screen.getByTestId('clock')).toBeInTheDocument();
        expect(screen.getByTestId('map-card-duration')).toBeInTheDocument();
        expect(screen.getByTestId('map-card-duration-text').textContent).toBe('  ');
    });

    it('should NOT render neither rating nor star-rating when it is 0', () => {
        useMapCardSpy.mockReturnValueOnce({
            ...data,
            content: {
                ...data.content,
                rating: 0,
                starRating: 0,
            },
        });

        render(<MapCard {...mockProps} />);

        expect(screen.queryByTestId('star-rating')).toBeNull();
        expect(screen.queryByTestId('tripadvisor-info')).toBeNull();
    });
});
