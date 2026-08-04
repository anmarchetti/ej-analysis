import { render, screen } from '@testing-library/react';

import { IGeoPoint } from 'models/data/map/IMap';

import MapComponent, { arePropsEqual, IMapComponentProps } from './MapComponent';

const mockProviderComponent = jest.fn();
const mockMapComponent = jest.fn();
jest.mock('@vis.gl/react-google-maps', () => ({
    __esModule: true,
    APIProvider: ({ children, ...props }) => {
        mockProviderComponent(props);

        return <div data-tid='api-provider'>{children}</div>;
    },
    Map: ({ children, ...props }) => {
        mockMapComponent(props);

        return <div data-tid='map'>{children}</div>;
    },
    ControlPosition: {
        TOP_RIGHT: 3,
    },
}));

const mockMapContentComponent = jest.fn();
jest.mock('./MapContent', () => props => {
    mockMapContentComponent(props);

    return <div data-tid='map-content' />;
});

const mockMapControlsComponent = jest.fn();
jest.mock('./MapControls/MapControls', () => props => {
    mockMapControlsComponent(props);

    return <div data-tid='map-controls' />;
});

let mockProps: IMapComponentProps;

describe('<MapComponent />', () => {
    describe('MapComponent', () => {
        beforeEach(() => {
            mockProps = {
                hotels: [{} as IGeoPoint],
                defaultZoom: 10,
                minZoom: 5,
                center: { lat: 0, lng: 0 },
                onCameraChanged: jest.fn(),
                clickableIcons: false,
            };
        });

        it('should render MapComponent with default props when optional props are not provided', () => {
            mockProps.defaultZoom = undefined;
            mockProps.minZoom = undefined;
            mockProps.maxZoom = undefined;
            mockProps.gestureHandling = undefined;
            mockProps.zoomControlPosition = undefined;
            mockProps.clickableIcons = undefined;

            render(<MapComponent {...mockProps} />);

            expect(screen.getByTestId('api-provider')).toBeInTheDocument();
            expect(mockMapComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    defaultZoom: 4,
                    minZoom: 4,
                    maxZoom: 20,
                    gestureHandling: 'cooperative',
                    clickableIcons: false,
                }),
            );
        });

        it('should render with provided props', () => {
            mockProps = {
                ...mockProps,
                center: { lat: 50, lng: 50 },
                zoomControlPosition: 1,
                closeControlPosition: 2,
            } as IMapComponentProps;

            render(<MapComponent {...mockProps} />);

            expect(mockMapComponent).toHaveBeenCalledWith({
                className: 'map',
                clickableIcons: false,
                defaultCenter: {
                    lat: 50,
                    lng: 50,
                },
                defaultZoom: 10,
                disableDefaultUI: true,
                gestureHandling: 'cooperative',
                mapId: '__googleMapsEasyJetHolidays',
                maxZoom: 20,
                minZoom: 5,
                onCameraChanged: expect.any(Function),
                scaleControl: true,
            });
            expect(mockMapContentComponent).toHaveBeenCalledWith({
                autoFit: false,
                hotels: [{}],
            });
            expect(mockMapControlsComponent).toHaveBeenCalledWith({
                closePosition: 2,
                zoomPosition: 1,
                maxZoom: 20,
                minZoom: 5,
            });
        });
    });

    describe('arePropsEqual', () => {
        it('should return true when all props are equal', () => {
            const prevProps = {
                hotel: { properties: { id: 1 } },
                selectedStop: { id: 2 },
                route: [{ id: 4 }],
                hotels: [{ id: 3 }],
                zoomControlPosition: 3,
            } as unknown as IMapComponentProps;

            const nextProps = {
                hotel: { properties: { id: 1 } },
                selectedStop: { id: 2 },
                route: [{ id: 4 }],
                hotels: [{ id: 3 }],
                zoomControlPosition: 3,
            } as unknown as IMapComponentProps;

            expect(arePropsEqual(prevProps, nextProps)).toBe(true);
        });

        it('should return false when zoomControlPosition differs', () => {
            const prevProps = { zoomControlPosition: 3 } as IMapComponentProps;
            const nextProps = { zoomControlPosition: 4 } as IMapComponentProps;

            expect(arePropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('should return false when hotel id differs', () => {
            const prevProps = { hotel: { properties: { id: 1 } } } as unknown as IMapComponentProps;
            const nextProps = { hotel: { properties: { id: 2 } } } as unknown as IMapComponentProps;

            expect(arePropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('should return false when selectedStop id differs', () => {
            const prevProps = { selectedStop: { id: 1 } } as unknown as IMapComponentProps;
            const nextProps = { selectedStop: { id: 2 } } as unknown as IMapComponentProps;

            expect(arePropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('should return false when routes are not equal', () => {
            const prevProps = { route: [{ id: 4 }] } as unknown as IMapComponentProps;
            const nextProps = { route: [{ id: 5 }] } as unknown as IMapComponentProps;

            expect(arePropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('should return false when hotels array differs', () => {
            const prevProps = { hotels: [{ id: 1 }] } as unknown as IMapComponentProps;
            const nextProps = { hotels: [{ id: 2 }] } as unknown as IMapComponentProps;

            expect(arePropsEqual(prevProps, nextProps)).toBe(false);
        });
    });
});
