import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { destinationTour, mockInboundFlight } from 'frontend/__mocks__';
import { ITour } from 'models/data/map/IItinerary';

import DestinationMapModal, { IDestinationMapModalProps } from './DestinationMapModal';

const createProps = (): IDestinationMapModalProps => ({
    tours: [destinationTour] as unknown as ITour[],
    onClose: jest.fn(),
    expandedSection: destinationTour.id,
});

const createMockStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    trackingStore: {
        trackMapEvent: jest.fn(),
    },
});

let mockProps = createProps();
let mockStores;
// To avoid "out-of-scope error"
const getRouteMock = () => mockInboundFlight;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/DestinationGuides/ItineraryGuide/ItineraryGuide', () => ({
    __esModule: true,
    default: ({ onRouteChange, selectedStop }) => (
        <div onClick={() => onRouteChange([getRouteMock()])}>
            <span>ItineraryGuid</span>
            <span>{selectedStop?.id}</span>
        </div>
    ),
}));

jest.mock('frontend/components/common/DestinationGuides/DestinationContent/DestinationContent', () => ({
    __esModule: true,
    default: ({ onItineraryClick, onRouteClick, routes }) => (
        <div className='DestinationContent'>
            <div onClick={() => onItineraryClick('non-exists-id')}>Itinerary</div>
            <div onClick={() => onRouteClick(mockProps.tours[0].children[0].id)}>Route</div>
            <div className='routes'>
                {routes?.map(({ id }) => (
                    <span key={id}>{id}</span>
                ))}
            </div>
        </div>
    ),
}));

describe('<DestinationMapModal />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('should render passed props', () => {
        const { getByText, container } = render(<DestinationMapModal {...mockProps} />);

        expect(getByText('Itineraries.Labels.BackToTheGuide')).toBeInTheDocument();
        expect(container.querySelector('.DestinationContent')).toBeInTheDocument();
        expect(getByText('ItineraryGuid')).toBeInTheDocument();
    });

    it('should react on clicks', () => {
        const { getByText, queryByText, container } = render(<DestinationMapModal {...mockProps} />);

        const itineraryGuide = getByText('ItineraryGuid');
        const itinerary = getByText('Itinerary');
        const route = getByText('Route');

        expect(itineraryGuide).toBeInTheDocument();
        expect(itinerary).toBeInTheDocument();
        expect(route).toBeInTheDocument();

        fireEvent.click(itineraryGuide);
        expect(container.querySelector('.routes')).toHaveTextContent(getRouteMock().id);

        fireEvent.click(route);
        expect(getByText('children-id')).toBeInTheDocument();

        fireEvent.click(itinerary);
        expect(queryByText('ItineraryGuid')).not.toBeInTheDocument();
    });

    it('should not render tour props', () => {
        mockProps.tours[0].id = 'no-exists-id';
        const { getByText, queryByText, container } = render(<DestinationMapModal {...mockProps} />);

        const route = getByText('Route');
        fireEvent.click(route);

        expect(container.querySelector('.routes')!.firstChild).toBeNull();
        expect(queryByText('children-id')).not.toBeInTheDocument();
    });
});
