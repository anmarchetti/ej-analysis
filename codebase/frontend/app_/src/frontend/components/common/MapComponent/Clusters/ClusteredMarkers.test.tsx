import { render, screen } from '@testing-library/react';
import Supercluster from 'supercluster';

import { ICluster, IGeoPoint } from 'models/data/map/IMap';
import * as hooks from 'frontend/components/common/MapComponent/hooks/useClusteredMarkers';
import {
    IUseClusteredMarkersData,
    IUseClusteredMarkersProps,
} from 'frontend/components/common/MapComponent/hooks/useClusteredMarkers';

import ClusteredMarkers from './ClusteredMarkers';

jest.mock('supercluster', () => () => ({ default: jest.fn() }));

const mockClusterComponent = jest.fn();
jest.mock('./Cluster', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockClusterComponent(props);

        return <div data-tid='cluster' />;
    },
}));

const mockMarkerComponent = jest.fn();
jest.mock('./Marker', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockMarkerComponent(props);

        return <div data-tid='marker' />;
    },
}));

const useClusteredMarkersSpy = jest.spyOn(hooks, 'default').mockReturnValue({
    clusters: [
        {
            id: 1,
            properties: { cluster_id: 33, cluster: true, point_count: 10 },
            geometry: { coordinates: [10, 20] },
        },
        {
            properties: { price: 100, pricePP: 50, id: 'marker-id' },
            geometry: { coordinates: [15, 25] },
            data: { id: 'marker1' },
        },
    ] as (IGeoPoint | ICluster)[],
    clusterer: {} as Supercluster,
    zIndexMap: new Map([
        [1, 1],
        [2, 2],
    ]),
    map: {} as google.maps.Map,
    getMarkerOnClick: jest.fn(),
    trackMapEvent: jest.fn(),
});

let mockProps: IUseClusteredMarkersProps;

describe('<ClusteredMarkers />', () => {
    beforeEach(() => {
        mockProps = {
            item: undefined,
            setSelected: jest.fn(),
            selected: null,
            items: [{} as IGeoPoint],
        };
    });

    it('should NOT render when hotels and hotel are NOT provided', () => {
        mockProps.items = [];
        mockProps.item = undefined;

        const { container } = render(<ClusteredMarkers {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render clusters and markers correctly', () => {
        render(<ClusteredMarkers {...mockProps} />);

        expect(screen.getAllByTestId('cluster')).toHaveLength(1);
        expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });

    it('should render main item marker when item is provided', () => {
        mockProps.item = { properties: { id: 'id' } } as IGeoPoint;

        render(<ClusteredMarkers {...mockProps} />);

        expect(screen.getAllByTestId('marker')).toHaveLength(2);
    });

    it('should NOT render main item marker when item is not provided', () => {
        useClusteredMarkersSpy.mockReturnValue({
            clusters: [],
            getMarkerOnClick: jest.fn(),
        } as unknown as IUseClusteredMarkersData);

        render(<ClusteredMarkers {...mockProps} />);

        expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
    });
});
