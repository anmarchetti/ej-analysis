import { renderHook } from '@testing-library/react';

import { ICluster, IGeoPoint } from 'models/data/map/IMap';

import useSupercluster, { SUPERCLUSTER_OPTIONS } from './useSupercluster';

global.google = {
    maps: {
        LatLng: jest.fn(),
        Point: jest.fn(),
        LatLngBounds: jest.fn(),
        Map: {},
    },
} as any;

const mockLoad = jest.fn();
const mockGetClusters = jest.fn(d => d);
const mockGetLeaves = jest.fn(d => d);

jest.mock('supercluster', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        load: mockLoad,
        getClusters: mockGetClusters,
        getLeaves: mockGetLeaves,
    })),
}));

jest.mock('./useMapViewport', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({ bbox: [-180, -90, 180, 90], zoom: 5 }),
}));

describe('useSupercluster', () => {
    it('should return empty clusters when geojson has no features', () => {
        const geojson = { type: 'FeatureCollection', features: [] };
        mockGetClusters.mockReturnValue([]);

        const { result } = renderHook(() => useSupercluster({ items: geojson.features as IGeoPoint[] }));

        expect(mockLoad).toHaveBeenCalledWith([]);
        expect(mockGetClusters).toHaveBeenCalledWith([-180, -90, 180, 90], 5);
        expect(result.current.clusters).toEqual([]);
    });

    it('should return clusters sorted by latitude in descending order', () => {
        const geojson = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', geometry: { type: 'Point', coordinates: null }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [10, 20] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [15.124, 25.02304] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [30, 91] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [191, 11] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [null, 11] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [3, undefined] }, properties: {} },
                { type: 'Feature', geometry: undefined, properties: {} },
            ],
        };
        mockGetClusters.mockReturnValueOnce([
            { geometry: { coordinates: [10, 20] }, properties: {} },
            { geometry: { coordinates: [15, 25] }, properties: {} },
        ]);

        const { result } = renderHook(() => useSupercluster({ items: geojson.features as IGeoPoint[] }));

        expect(mockLoad).toHaveBeenCalledWith([geojson.features[1], geojson.features[2]]);

        expect(result.current.clusters[0].geometry.coordinates[1]).toBeGreaterThan(
            result.current.clusters[1].geometry.coordinates[1],
        );
    });

    it('should return cluster bounds for a given cluster ID', () => {
        const geojson = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', geometry: { type: 'Point', coordinates: [10, 20] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [15, 25] }, properties: {} },
            ],
        };
        mockGetLeaves.mockReturnValue([]);

        const { result } = renderHook(() => useSupercluster({ items: geojson.features as IGeoPoint[] }));

        const bounds = result.current.clusterer.getLeaves(1);

        expect(bounds).toStrictEqual([]);
    });

    it('should handle geojson with invalid feature geometry gracefully', () => {
        const geojson = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', geometry: null, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [15, 25] }, properties: {} },
            ],
        };
        const { result } = renderHook(() => useSupercluster({ items: geojson.features as IGeoPoint[] }));

        expect(result.current.clusters).toBeDefined();
    });

    it('should apply reduce function correctly when itemProps has price', () => {
        const geojson = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [10, 20] },
                    properties: { price: 10, pricePP: 10 },
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [15, 25] },
                    properties: { price: 80, pricePP: 40 },
                },
            ],
        };

        const minPriceItem = { price: 1000, pricePP: 1000 };

        geojson.features.forEach(feature =>
            SUPERCLUSTER_OPTIONS.reduce!(
                minPriceItem as ICluster['properties'],
                feature.properties as ICluster['properties'],
            ),
        );

        expect(minPriceItem).toEqual({ price: 10, pricePP: 10 });
    });
});
