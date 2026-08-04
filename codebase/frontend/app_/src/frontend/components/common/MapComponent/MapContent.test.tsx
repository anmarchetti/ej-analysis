import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IStop } from 'models/data/map/IItinerary';
import { IGeoPoint, TSelectedMapCardData } from 'models/data/map/IMap';

import MapContent, { IMapContentProps } from './MapContent';

const mockUseState = jest.fn(init => [init, jest.fn()]);
const mockUseRef = {
    current: {
        clear: jest.fn(),
    },
};
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useState: init => mockUseState(init),
    useContext: () => mockStores,
    useRef: () => mockUseRef,
}));

const mockClusteredMarkersComponent = jest.fn();
jest.mock('./Clusters/ClusteredMarkers', () => props => {
    mockClusteredMarkersComponent(props);

    return <div data-tid='clustered-markers' />;
});

const mockRouteComponent = jest.fn();
jest.mock('./Route/Route', () => props => {
    mockRouteComponent(props);

    return <div data-tid='route' />;
});

const mockCustomOverlayComponent = jest.fn();
jest.mock('./Cards/CustomOverlay', () => ({ children, ...props }) => {
    mockCustomOverlayComponent(props);

    return <div data-tid='custom-overlay'>{children}</div>;
});

const mockMapCardComponent = jest.fn();
jest.mock('./Cards/MapCard', () => ({ children, ...props }) => {
    mockMapCardComponent(props);

    return <div data-tid='map-card' />;
});

const mockMap = {
    getZoom: jest.fn().mockReturnValue(10),
};
jest.mock('@vis.gl/react-google-maps', () => ({
    __esModule: true,
    useMap: jest.fn(() => mockMap),
}));

let mockProps: IMapContentProps;
let mockStores;

describe('<MapContent />', () => {
    beforeEach(() => {
        mockProps = {
            hotels: [],
            autoFit: false,
            hotel: undefined,
            onRouteChange: jest.fn(),
            route: undefined,
            selectedStop: undefined,
            onUnmount: jest.fn(),
            onSaveState: jest.fn(),
            restoreState: jest.fn().mockReturnValue(null),
        };

        mockStores = createMockStores({
            routerStore: {
                pathname: '/some-path',
            },
        });
    });

    it('should render ClusteredMarkers', () => {
        mockProps.hotels = [{}] as IGeoPoint[];
        mockProps.hotel = {} as IGeoPoint;

        const { unmount } = render(<MapContent {...mockProps} />);

        expect(screen.getByTestId('clustered-markers')).toBeInTheDocument();
        expect(mockClusteredMarkersComponent).toHaveBeenCalledWith({
            autoFit: false,
            item: mockProps.hotel,
            items: mockProps.hotels,
            selected: null,
            setSelected: expect.any(Function),
            cache: mockUseRef.current,
            restoreState: mockProps.restoreState,
        });

        unmount();

        expect(mockUseRef.current.clear).toHaveBeenCalled();
    });

    it('should render Route when route is provided', () => {
        mockProps.route = [{ position: { lat: 0, lng: 0 } }] as IStop[];

        render(<MapContent {...mockProps} />);

        expect(screen.getByTestId('route')).toBeInTheDocument();
        expect(mockRouteComponent).toHaveBeenCalledWith({
            route: mockProps.route,
            externallySelectedStop: mockProps.selectedStop,
            selectedStop: undefined,
            setSelected: expect.any(Function),
            onChange: mockProps.onRouteChange,
        });
    });

    it('should NOT render Route when no route is provided', () => {
        mockProps.route = undefined;

        render(<MapContent {...mockProps} />);

        expect(screen.queryByTestId('route')).not.toBeInTheDocument();
    });

    it('should render CustomOverlay when a marker is selected', () => {
        const selectedData: TSelectedMapCardData = {
            hotel: { geometry: { coordinates: [11, 22] } } as IGeoPoint,
            stop: undefined,
        };

        mockUseState.mockReturnValueOnce([selectedData, jest.fn()]);

        render(<MapContent {...mockProps} />);

        expect(screen.getByTestId('custom-overlay')).toBeInTheDocument();
        expect(mockCustomOverlayComponent).toHaveBeenCalledWith({
            position: {
                lat: 22,
                lng: 11,
            },
            stop: selectedData.stop,
        });
        expect(screen.getByTestId('map-card')).toBeInTheDocument();
        expect(mockMapCardComponent).toHaveBeenCalledWith({
            hotel: selectedData.hotel,
            stop: selectedData.stop,
            setSelected: expect.any(Function),
            cache: mockUseRef.current,
        });
    });

    it('should NOT render CustomOverlay when no marker is selected', () => {
        render(<MapContent {...mockProps} />);

        expect(screen.queryByTestId('custom-overlay')).toBeNull();
        expect(screen.queryByTestId('map-card')).toBeNull();
    });

    it('should call onUnmount when pathname changes', () => {
        const { rerender } = render(<MapContent {...mockProps} />);

        mockStores.routerStore.pathname = '/new-path';

        rerender(<MapContent {...mockProps} />);

        expect(mockProps.onUnmount).toHaveBeenCalled();
    });

    it('should call onSaveState when selected changes', () => {
        const selectedData: TSelectedMapCardData = {
            hotel: { geometry: { coordinates: [11, 22] } } as IGeoPoint,
            stop: undefined,
        };

        mockUseState.mockReturnValueOnce([selectedData, jest.fn()]);

        render(<MapContent {...mockProps} />);

        expect(mockProps.onSaveState).toHaveBeenCalledWith(10, selectedData);
    });
});
