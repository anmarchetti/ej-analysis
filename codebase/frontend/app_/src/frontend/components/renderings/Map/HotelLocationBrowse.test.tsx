import { render, screen, waitFor } from '@testing-library/react';

import * as service from 'frontend/services/hotels.service';
import { IGeoPoint, IGeoPoints } from 'models/data/map/IMap';

import { HotelLocationBrowse } from './HotelLocationBrowse';

const mockMapComponent = jest.fn();
jest.mock('frontend/components/common/MapComponent/MapComponent', () => props => {
    mockMapComponent(props);

    return <div data-tid='map' />;
});

let mockProps;

describe('<HotelLocationBrowse />', () => {
    beforeEach(() => {
        mockProps = {
            isShown: true,
            isScreenExtraSmall: true,
            accommodationOrDestinationCode: 'accommodation-123',
            pageFields: {
                Code: { value: '123' },
                Name: { value: 'Test Hotel' },
                Latitude: { value: '10' },
                Longitude: { value: '20' },
            },
            params: {
                MinZoom: '18',
            },
            getSetting: jest.fn().mockReturnValue('fallback-image'),
            close: jest.fn(),
        };
    });

    it('should render when isShown is true', () => {
        mockProps.isShown = true;

        render(<HotelLocationBrowse {...mockProps} />);

        expect(screen.getByTestId('map')).toBeInTheDocument();
        expect(mockMapComponent).toHaveBeenCalledWith({
            hotel: {
                geometry: {
                    coordinates: [20, 10],
                    type: 'Point',
                },
                properties: {
                    id: 'accommodation-123',
                    name: 'Test Hotel',
                    price: undefined,
                    pricePP: undefined,
                },
                type: 'Feature',
            },
            center: {
                lat: 10,
                lng: 20,
            },
            defaultZoom: 16,
            maxZoom: 20,
            minZoom: 18,
            onCameraChanged: expect.any(Function),
            hotels: [],
            className: 'map priority',
            closeControlPosition: 3,
            gestureHandling: 'greedy',
            onUnmount: expect.any(Function),
            zoomControlPosition: 9,
        });
    });

    it('should NOT render isShown is false', () => {
        mockProps.isShown = false;

        render(<HotelLocationBrowse {...mockProps} />);

        expect(screen.queryByTestId('map')).not.toBeInTheDocument();
    });

    it('should call close when onUnmount is called', () => {
        const comp = new HotelLocationBrowse(mockProps);

        comp['hotels'] = [{} as IGeoPoint];

        comp.onUnmount();

        expect(comp['hotels']).toStrictEqual([]);
        expect(mockProps.close).toHaveBeenCalled();
    });

    it('should have valid params', () => {
        const comp = new HotelLocationBrowse(mockProps);

        expect(comp['params']).toStrictEqual({
            center: {
                lat: 10,
                lng: 20,
            },
            closeControlPosition: 3,
            defaultZoom: 16,
            gestureHandling: 'greedy',
            maxZoom: 20,
            minZoom: 18,
            zoomControlPosition: 9,
        });
    });

    it('should have valid params with default value', () => {
        mockProps.params = {};

        const comp = new HotelLocationBrowse(mockProps);

        expect(comp['params']).toStrictEqual({
            center: {
                lat: 10,
                lng: 20,
            },
            closeControlPosition: 3,
            defaultZoom: 16,
            gestureHandling: 'greedy',
            maxZoom: 20,
            minZoom: 15,
            zoomControlPosition: 9,
        });
    });

    it('should have valid hotel', () => {
        const comp = new HotelLocationBrowse(mockProps);

        expect(comp['hotel']).toStrictEqual({
            geometry: {
                coordinates: [20, 10],
                type: 'Point',
            },
            properties: {
                id: 'accommodation-123',
                name: 'Test Hotel',
                price: undefined,
                pricePP: undefined,
            },
            type: 'Feature',
        });
    });

    it('should have valid hotel with default value', () => {
        mockProps.pageFields = undefined;
        mockProps.accommodationOrDestinationCode = '';

        const comp = new HotelLocationBrowse(mockProps);

        expect(comp['hotel']).toStrictEqual({
            geometry: {
                coordinates: [0, 0],
                type: 'Point',
            },
            properties: {
                id: '',
                name: undefined,
                price: undefined,
                pricePP: undefined,
            },
            type: 'Feature',
        });
    });

    it('should fallback to page fields code when accommodation code is empty', () => {
        mockProps.accommodationOrDestinationCode = '';

        const comp = new HotelLocationBrowse(mockProps);

        expect(comp['hotel']).toStrictEqual({
            geometry: {
                coordinates: [20, 10],
                type: 'Point',
            },
            properties: {
                id: '123',
                name: 'Test Hotel',
                price: undefined,
                pricePP: undefined,
            },
            type: 'Feature',
        });
    });

    it('should fetch hotels on camera change', async () => {
        const features = [
            {
                geometry: {
                    coordinates: [20, 10],
                },
            },
            {
                geometry: {
                    coordinates: [21, 11],
                },
            },
            {
                geometry: {
                    coordinates: [20, 10],
                },
            },
            {
                geometry: {
                    coordinates: [22, 12],
                },
            },
        ];
        const fetchPolygonHotels = jest.spyOn(service.HotelsService, 'fetchPolygonHotels').mockImplementationOnce(() =>
            Promise.resolve({
                features,
            } as IGeoPoints),
        );

        const comp = new HotelLocationBrowse(mockProps);

        jest.useFakeTimers();

        await comp.onCameraChanged({
            detail: {
                bounds: { north: 1, east: 2, south: 3, west: 4 },
            },
        });

        jest.runAllTimers();

        expect(fetchPolygonHotels).toHaveBeenCalledWith({
            ln1: 2,
            ln2: 4,
            lt1: 1,
            lt2: 3,
        });

        await waitFor(() =>
            expect(comp['hotels']).toStrictEqual([
                {
                    geometry: {
                        coordinates: [21, 11],
                    },
                },
                {
                    geometry: {
                        coordinates: [22, 12],
                    },
                },
            ]),
        );
    });

    it('should NOT reset hotels on camera change failure', async () => {
        const fetchPolygonHotels = jest
            .spyOn(service.HotelsService, 'fetchPolygonHotels')
            .mockImplementationOnce(() => Promise.reject(new Error('Network error')));

        const comp = new HotelLocationBrowse(mockProps);

        comp['hotels'] = [{}, {}] as IGeoPoint[];

        jest.useFakeTimers();

        await comp.onCameraChanged({
            detail: {
                bounds: { north: 1, east: 2, south: 3, west: 4 },
            },
        });

        jest.runAllTimers();

        expect(fetchPolygonHotels).toHaveBeenCalledWith({
            ln1: 2,
            ln2: 4,
            lt1: 1,
            lt2: 3,
        });

        await waitFor(() => expect(comp['hotels']).toStrictEqual([{}, {}]));
    });
});
