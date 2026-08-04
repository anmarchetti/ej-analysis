import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import DestinationContent from './DestinationContent';

const createProps = () => ({
    onItineraryClick: jest.fn(),
    onRouteClick: jest.fn(),
    tours: [
        {
            id: 'tour-id',
            fields: {
                Description: { value: 'Description' },
                Duration: { value: 'Duration' },
                TotalDistance: { value: 'TotalDistance' },
                Name: { value: 'Name' },
            },
            children: [
                {
                    id: 'child-id',
                    fields: {
                        Duration: { value: 'Duration' },
                        Name: { value: 'Name' },
                        ActiveIcon: { value: 'ActiveIcon' },
                        Description: { value: 'Description' },
                        Latitude: { value: 'Latitude' },
                        NonActiveIcon: { value: 'NonActiveIcon' },
                        Longitude: { value: 'Longitude' },
                        RouteType: { value: 'Bus' },
                        Subtitle: { value: 'Subtitle' },
                        SelectedIcon: { value: 'SelectedIcon' },
                    },
                },
            ],
        },
    ],
    expanded: 'expanded',
    routes: [
        {
            route: {
                duration: {
                    text: 'route-text',
                },
            },
        },
    ],
    getPhrase: jest.fn(p => p),
    trackMapEvent: jest.fn(),
});

let mockProps;

jest.mock('../RouteInfoBlock', () => ({
    __esModule: true,
    default: () => <div>IconTourBus</div>,
}));

jest.mock('frontend/components/icons/TourBus', () => ({
    __esModule: true,
    default: () => <div>TourBus</div>,
}));
jest.mock('frontend/components/icons/RunMan', () => ({
    __esModule: true,
    default: () => <div>RunMan</div>,
}));
jest.mock('frontend/components/icons/Taxi', () => ({
    __esModule: true,
    default: () => <div>Taxi</div>,
}));

describe('<DestinationContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Should render unexpanded components', () => {
        const { getByText } = render(<DestinationContent {...mockProps} />);

        expect(getByText('Name')).toBeInTheDocument();
        expect(getByText('ChevronDown')).toBeInTheDocument();
    });

    it('Should render itinerary', () => {
        mockProps.expanded = 'tour-id';
        const { getByText, container, queryByText } = render(<DestinationContent {...mockProps} />);

        expect(getByText('Description')).toBeInTheDocument();
        expect(getByText('IconTourBus')).toBeInTheDocument();
        expect(getByText('TourBus')).toBeInTheDocument();
        expect(queryByText('RunMan')).not.toBeInTheDocument();
        expect(queryByText('Taxi')).not.toBeInTheDocument();
        expect(container.querySelector('.itinerary-title')).toHaveTextContent('Name');
        expect(container.querySelector('.route-info_item-label')).toHaveTextContent(
            'route-text Map.TravelMethods.Drive',
        );
    });

    it('Should render RouteType.Walking icon', () => {
        mockProps.expanded = 'tour-id';
        mockProps.tours[0].children[0].fields.RouteType.value = 'Walking';
        const { queryByText } = render(<DestinationContent {...mockProps} />);

        expect(queryByText('TourBus')).not.toBeInTheDocument();
        expect(queryByText('RunMan')).toBeInTheDocument();
        expect(queryByText('Taxi')).not.toBeInTheDocument();
    });

    it('Should render RouteType.Car icon', () => {
        mockProps.expanded = 'tour-id';
        mockProps.tours[0].children[0].fields.RouteType.value = 'Car';
        const { queryByText } = render(<DestinationContent {...mockProps} />);

        expect(queryByText('TourBus')).not.toBeInTheDocument();
        expect(queryByText('RunMan')).not.toBeInTheDocument();
        expect(queryByText('Taxi')).toBeInTheDocument();
    });

    it('Should click events be invoked', () => {
        mockProps.expanded = 'tour-id-2';
        const { getByTestId } = render(<DestinationContent {...mockProps} />);

        const toggleButton = getByTestId('tour-id');
        expect(toggleButton).toBeInTheDocument();

        fireEvent.click(toggleButton);
        expect(mockProps.onItineraryClick).toHaveBeenCalled();
    });
});
