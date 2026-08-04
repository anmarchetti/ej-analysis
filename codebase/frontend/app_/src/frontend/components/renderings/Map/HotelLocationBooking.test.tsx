import { render, screen } from '@testing-library/react';

import { IGeoPoint } from 'models/data/map/IMap';

import { HotelLocationBooking, IHotelLocationBookingProps } from './HotelLocationBooking';

const mockMapComponent = jest.fn();
jest.mock('frontend/components/common/MapComponent/MapComponent', () => props => {
    mockMapComponent(props);

    return <div data-tid='map' />;
});

let mockProps: IHotelLocationBookingProps;

describe('<HotelLocationBooking />', () => {
    beforeEach(() => {
        mockProps = {
            isShown: true,
            isScreenExtraSmall: true,
            getSetting: jest.fn(setting => setting),
            onUnmount: jest.fn(),
            params: {
                MinZoom: 18,
            },
            onCameraChanged: jest.fn(),
            selectedOffer: {
                price: 100,
                pricePP: 50,
                accom: {
                    id: 'hotel-1',
                },
                hotel: {
                    name: 'hotel',
                    longitude: 20,
                    latitude: 10,
                },
            },
            hotels: [],
        } as unknown as IHotelLocationBookingProps;
    });

    it('should render when isShown is true', () => {
        mockProps.isShown = true;

        render(<HotelLocationBooking {...mockProps} />);

        expect(screen.getByTestId('map')).toBeInTheDocument();
        expect(mockMapComponent).toHaveBeenCalledWith({
            center: {
                lat: 10,
                lng: 20,
            },
            className: 'map priority',
            closeControlPosition: 3,
            defaultZoom: 16,
            gestureHandling: 'greedy',
            hotel: {
                geometry: {
                    coordinates: [20, 10],
                    type: 'Point',
                },
                properties: {
                    id: 'hotel-1',
                    name: 'hotel',
                    price: 100,
                    pricePP: 50,
                },
                type: 'Feature',
            },
            hotels: [],
            maxZoom: 20,
            minZoom: 18,
            onCameraChanged: expect.any(Function),
            onUnmount: expect.any(Function),
            zoomControlPosition: 9,
        });
    });

    it('should NOT render when isShown is false', () => {
        mockProps.isShown = false;

        render(<HotelLocationBooking {...mockProps} />);

        expect(screen.queryByTestId('map')).not.toBeInTheDocument();
    });

    it('should call onUnmount', () => {
        const comp = new HotelLocationBooking(mockProps);

        comp.onUnmount();

        expect(mockProps.onUnmount).toHaveBeenCalled();
    });

    it('should have valid params', () => {
        const comp = new HotelLocationBooking(mockProps);

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
        mockProps.params = {} as IHotelLocationBookingProps['params'];
        mockProps.isScreenExtraSmall = false;

        const comp = new HotelLocationBooking(mockProps);

        expect(comp['params']).toStrictEqual({
            center: {
                lat: 10,
                lng: 20,
            },
            closeControlPosition: undefined,
            defaultZoom: 16,
            gestureHandling: undefined,
            maxZoom: 20,
            minZoom: 15,
            zoomControlPosition: undefined,
        });
    });

    it('should have valid hotel', () => {
        const comp = new HotelLocationBooking(mockProps);

        expect(comp['hotel']).toStrictEqual({
            geometry: {
                coordinates: [20, 10],
                type: 'Point',
            },
            properties: {
                id: 'hotel-1',
                name: 'hotel',
                price: 100,
                pricePP: 50,
            },
            type: 'Feature',
        });
    });

    it('should have valid hotels', () => {
        mockProps.hotels = [
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
        ] as IGeoPoint[];

        const comp = new HotelLocationBooking(mockProps);

        expect(comp['hotels']).toStrictEqual([mockProps['hotels']![1], mockProps['hotels']![3]]);
    });
});
