import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { createMockStores, destinationTour } from 'frontend/__mocks__';

import DestinationGuides from './DestinationGuides';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = () => ({
    tours: [destinationTour],
});

let mockStores;
let mockProps;

const mockCarouselWrapper = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children, ...rest }) => {
        mockCarouselWrapper(rest);

        return <div data-tid='carousel'>{children}</div>;
    },
}));

const mockItineraryItem = jest.fn();
jest.mock('./ItineraryItem/ItineraryItem', () => ({
    __esModule: true,
    default: props => {
        mockItineraryItem(props);

        return <div data-tid='itinerary-item' />;
    },
}));

const mockDestinationMapModal = jest.fn();
jest.mock('./DestinationMapModal/DestinationMapModal', () => ({
    __esModule: true,
    default: props => {
        mockDestinationMapModal(props);

        return <div data-tid='destination-map-modal' />;
    },
}));

describe('<DestinationGuides />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            trackingStore: {
                trackMapEvent: jest.fn(),
            },
        });
    });

    it('should render correct', async () => {
        render(<DestinationGuides {...mockProps} />);

        expect(screen.getByTestId('destination-guides-carousel-wrapper')).toHaveClass('tourGuideBlockSmart');
        expect(mockCarouselWrapper).toHaveBeenCalledWith({
            containerClass: 'carouselContainer',
            draggable: false,
            itemClass: 'carouselItem',
            responsive: expect.any(Object),
            showDots: true,
            customButtonGroup: expect.any(Object),
            arrows: false,
        });
        expect(screen.getByTestId('destination-guides-desc-wrapper')).toBeInTheDocument();
        expect(mockDestinationMapModal).not.toHaveBeenCalled();
        expect(mockItineraryItem).toHaveBeenCalledTimes(2);
        expect(mockItineraryItem).toHaveBeenCalledWith({
            Description: mockProps.tours[0].fields.Description,
            Duration: mockProps.tours[0].fields.Duration,
            Image: mockProps.tours[0].fields.Image,
            Name: mockProps.tours[0].fields.Name,
            TotalDistance: mockProps.tours[0].fields.TotalDistance,
            id: mockProps.tours[0].id,
            itinerary: mockProps.tours[0].children,
            onOpenRouteMap: expect.any(Function),
        });
        const event = { currentTarget: { dataset: { tid: mockProps.tours[0].id } } };
        mockItineraryItem.mock.calls[0][0].onOpenRouteMap(event);

        await waitFor(() => expect(screen.getByTestId('destination-map-modal')).toBeInTheDocument());

        expect(mockDestinationMapModal).toHaveBeenCalledWith(
            expect.objectContaining({
                tours: mockProps.tours,
                expandedSection: mockProps.tours[0].id,
                onClose: expect.any(Function),
            }),
        );

        mockDestinationMapModal.mock.calls[0][0].onClose();
        await waitFor(() => expect(screen.queryByTestId('destination-map-modal')).not.toBeInTheDocument());
    });

    it('should render only guide carousel', () => {
        mockProps.tours = [destinationTour, destinationTour, destinationTour, destinationTour];
        render(<DestinationGuides {...mockProps} />);
        expect(screen.getByTestId('destination-guides-carousel-wrapper')).not.toHaveClass('tourGuideBlockSmart');
        expect(screen.queryByTestId('destination-guides-desc-wrapper')).not.toBeInTheDocument();
        expect(mockItineraryItem).toHaveBeenCalledTimes(4);
    });
});
