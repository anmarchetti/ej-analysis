import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { createMockStores as createDefaultMockStores } from 'frontend/__mocks__';
import * as service from 'frontend/services/hotels.service';

import ItineraryGuide from './ItineraryGuide';

const createProps = () => ({
    shouldMapUpdate: false,
    tour: {
        fields: {
            CentralPointLatidiute: { value: 'CentralPointLatidiute' },
            CentralPointLongitude: { value: 'CentralPointLongitude' },
            Zoom: { value: 'Zoom' },
        },
        children: [
            {
                fields: {
                    Duration: { value: 'Duration' },
                    Name: { value: 'Name' },
                    ActiveIcon: { value: 'ActiveIcon' },
                    Description: { value: 'Description' },
                    Latitude: { value: 'Latitude' },
                    NonActiveIcon: { value: 'NonActiveIcon' },
                    Longitude: { value: 'Longitude' },
                    RouteType: { value: 'RouteType' },
                    Subtitle: { value: 'Subtitle' },
                    SelectedIcon: { value: 'SelectedIcon' },
                },
                children: [
                    {
                        name: 'Images',
                        children: [
                            {
                                fields: { Image: { value: { src: 'image-src' } } },
                            },
                        ],
                    },
                ],
            },
        ],
    },
    selectedPOI: 'selectedPOI',
    onRouteChange: jest.fn(),
});

const createMockStores = () =>
    createDefaultMockStores({
        layoutStore: {
            destinationCode: 'ALL',
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockMapComponent = jest.fn();
jest.mock('frontend/components/common/MapComponent/MapComponent', () => ({
    __esModule: true,
    default: props => {
        mockMapComponent(props);

        return <div id='map' />;
    },
}));

const hotels = [
    {
        geometry: {
            coordinates: [11, 22],
        },
        properties: { id: 'hotel-1' },
    },
    {
        geometry: {
            coordinates: [12, 21],
        },
        properties: { id: 'hotel-2' },
    },
];

const fetchDestinationHotelsSpy = jest
    .spyOn(service.HotelsService, 'fetchDestinationHotels')
    .mockImplementation(() => Promise.resolve({ features: hotels } as any));

describe('<ItineraryGuide />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render passed props', () => {
        render(<ItineraryGuide {...mockProps} />);

        expect(mockMapComponent).toHaveBeenCalledWith({
            route: [
                {
                    description: 'Description',
                    duration: 'Duration',
                    id: undefined,
                    images: [{ medium: 'image-src' }],
                    name: 'Name',
                    position: expect.any(Object),
                    subtitle: 'Subtitle',
                    travelMode: 'RouteType',
                },
            ],
            onRouteChange: expect.any(Function),
            hotels: [],
            selectedStop: undefined,
            clickableIcons: true,
            className: 'map',
        });
    });

    it('should fetch hotels when destCode is provided', async () => {
        render(<ItineraryGuide {...mockProps} />);

        expect(fetchDestinationHotelsSpy).toHaveBeenCalledWith('ALL');

        await waitFor(() => {
            expect(mockMapComponent).toHaveBeenCalledWith(expect.objectContaining({ hotels }));
        });
    });
});
