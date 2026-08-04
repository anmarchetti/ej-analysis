import { renderHook } from '@testing-library/react';
import Supercluster from 'supercluster';

import { createMockStores } from 'frontend/__mocks__';
import { IGeoPoint } from 'models/data/map/IMap';
import * as utils from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';

import useClusteredMarkers, { IUseClusteredMarkersProps } from './useClusteredMarkers';
import * as hook from './useSupercluster';
import { IUseClusterData } from './useSupercluster';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const superclusterData: IUseClusterData = {
    clusters: [],
    clusterer: {
        getLeaves: jest.fn(),
        getClusters: jest.fn(),
    } as unknown as Supercluster,
    zIndexMap: new Map(),
    version: 1,
};

const useSuperclusterSpy = jest.spyOn(hook, 'default').mockReturnValue(superclusterData);
const fitBoundsSpy = jest.spyOn(utils, 'fitBounds').mockImplementation(jest.fn());
const centerMapCardVerticallySpy = jest.spyOn(utils, 'centerMapCardVertically').mockImplementation(jest.fn());

const mockMap = {
    panTo: jest.fn(),
    setZoom: jest.fn(),
};
jest.mock('@vis.gl/react-google-maps', () => ({
    __esModule: true,
    useMap: jest.fn(() => mockMap),
}));

let mockStores;
let mockProps: IUseClusteredMarkersProps;

describe('useClusteredMarkers', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            trackingStore: {
                trackMapEvent: jest.fn(),
            },
        });
        mockProps = {
            items: [{}, {}] as IGeoPoint[],
            selected: null,
            setSelected: jest.fn(),
            autoFit: false,
            cache: {
                clear: jest.fn(),
            } as unknown as IUseClusteredMarkersProps['cache'],
            restoreState: jest.fn().mockReturnValue(null),
        };
    });

    it('should return data', () => {
        const { result } = renderHook(() => useClusteredMarkers(mockProps));

        expect(result.current).toStrictEqual({
            clusterer: {
                getLeaves: expect.any(Function),
                getClusters: expect.any(Function),
            },
            clusters: [],
            getMarkerOnClick: expect.any(Function),
            map: mockMap,
            zIndexMap: new Map(),
            trackMapEvent: mockStores.trackingStore.trackMapEvent,
        });
        expect(mockProps.setSelected).not.toHaveBeenCalled();
    });

    it('should call fitBounds when clusters are provided', () => {
        mockProps.autoFit = true;

        const cluster = {
            geometry: {
                coordinates: [0.1, 2.3],
            },
            properties: {
                point_count: 10,
                cluster_id: 2,
            },
        };
        const list = [cluster, cluster];
        const mockGetClusters = jest.fn().mockReturnValue(list);

        const data = {
            ...superclusterData,
            clusterer: {
                ...superclusterData.clusterer,
                getClusters: mockGetClusters,
                getChildren: jest.fn().mockReturnValue(list),
            } as unknown as Supercluster,
        };
        useSuperclusterSpy.mockReturnValue(data);

        renderHook(() => useClusteredMarkers(mockProps));

        expect(mockProps.setSelected).toHaveBeenCalledWith(null);
        expect(data.clusterer.getClusters).toHaveBeenCalledWith([-180, -90, 180, 90], 18);
        expect(fitBoundsSpy).toHaveBeenCalledWith({ list, map: mockMap, padding: 20 });
    });

    it('should NOT call fitBounds when 0 cluster-markers is provided', () => {
        mockProps.autoFit = true;
        mockProps.items = [];

        const mockGetClusters = jest.fn();

        const data = {
            ...superclusterData,
            clusterer: {
                ...superclusterData.clusterer,
                getClusters: mockGetClusters,
                getChildren: jest.fn(),
            } as unknown as Supercluster,
        };
        useSuperclusterSpy.mockReturnValue(data);

        renderHook(() => useClusteredMarkers(mockProps));

        expect(mockProps.setSelected).toHaveBeenCalledWith(null);
        expect(data.clusterer.getClusters).not.toHaveBeenCalled();
        expect(fitBoundsSpy).not.toHaveBeenCalled();
    });

    it('should restore saved state if restoreState returns data', () => {
        mockProps.autoFit = true;

        const zoomLevel = 5;
        const selected = {
            hotel: {
                geometry: {
                    coordinates: [0.1, 2.3],
                },
            },
        };
        mockProps.restoreState = jest.fn().mockReturnValue({ zoomLevel, selected });

        renderHook(() => useClusteredMarkers(mockProps));

        expect(mockProps.restoreState).toHaveBeenCalled();
        expect(mockMap.setZoom).toHaveBeenCalledWith(zoomLevel);
        expect(centerMapCardVerticallySpy).toHaveBeenCalledWith(mockMap, selected?.hotel?.geometry.coordinates ?? []);
        expect(mockProps.setSelected).toHaveBeenCalledWith(selected);

        expect(fitBoundsSpy).not.toHaveBeenCalled();
    });

    it('should NOT set zoom, position and selected if saved state has no selected hotel coordinates', () => {
        mockProps.autoFit = true;

        const zoomLevel = 5;
        const selected = {
            hotel: {
                geometry: {
                    coordinates: null,
                },
            },
        };
        mockProps.restoreState = jest.fn().mockReturnValue({ zoomLevel, selected });

        renderHook(() => useClusteredMarkers(mockProps));

        expect(mockProps.restoreState).toHaveBeenCalled();
        expect(mockMap.setZoom).not.toHaveBeenCalled();
        expect(centerMapCardVerticallySpy).not.toHaveBeenCalled();
        expect(mockProps.setSelected).toHaveBeenCalledWith(null);

        expect(fitBoundsSpy).toHaveBeenCalled();
    });
});
