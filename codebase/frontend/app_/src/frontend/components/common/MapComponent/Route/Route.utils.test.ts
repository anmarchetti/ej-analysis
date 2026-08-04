import { IStop } from 'models/data/map/IItinerary';
import * as utils from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';

import { createInfoWindow, equalRoute, fetchRoute, getOnStopClick } from './Route.utils';

describe('Route.utils', () => {
    describe('fetchRoute', () => {
        it('should return routes when directions service succeeds for all stops', async () => {
            const mockRoute = jest.fn((_, callback) =>
                callback({ routes: [{ overview_path: ['path1', 'path2'] }] }, 'OK'),
            );

            global.google = {
                maps: {
                    DirectionsService: jest.fn(() => ({ route: mockRoute })),
                    TravelMode: { WALKING: 'WALKING', TRANSIT: 'TRANSIT' },
                } as unknown as typeof google.maps,
            };

            const stops = [
                { position: { lat: 0, lng: 0 }, travelMode: 'WALKING' },
                { position: { lat: 1, lng: 1 }, travelMode: 'TRANSIT' },
            ] as IStop[];

            const result = await fetchRoute({ stops });

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ overview_path: ['path1', 'path2'] });
            expect(mockRoute).toHaveBeenCalledTimes(1);
        });

        it('should return null for a stop pair when directions service fails', async () => {
            const mockRoute = jest.fn((_, callback) => callback(null, 'ZERO_RESULTS'));

            global.google = {
                maps: {
                    DirectionsService: jest.fn(() => ({ route: mockRoute })),
                    TravelMode: { WALKING: 'WALKING', TRANSIT: 'TRANSIT' },
                } as unknown as typeof google.maps,
            };

            const stops = [
                { position: { lat: 0, lng: 0 }, travelMode: 'WALKING' },
                { position: { lat: 1, lng: 1 }, travelMode: 'TRANSIT' },
            ] as IStop[];

            const result = await fetchRoute({ stops });

            expect(result).toHaveLength(1);
            expect(result[0]).toBeNull();
            expect(mockRoute).toHaveBeenCalledTimes(1);
        });

        it('should NOT call directions service when there is only one stop', async () => {
            const mockRoute = jest.fn();

            global.google = {
                maps: {
                    DirectionsService: jest.fn(() => ({ route: mockRoute })),
                    TravelMode: { WALKING: 'WALKING', TRANSIT: 'TRANSIT' },
                } as unknown as typeof google.maps,
            };

            const stops = [{ position: { lat: 0, lng: 0 }, travelMode: 'WALKING' }] as IStop[];

            const result = await fetchRoute({ stops });

            expect(result).toEqual([]);
            expect(mockRoute).not.toHaveBeenCalled();
        });

        it('should handle mixed success and failure for multiple stop pairs', async () => {
            const mockRoute = jest
                .fn()
                .mockImplementationOnce((_, callback) =>
                    callback({ routes: [{ overview_path: ['path1', 'path2'] }] }, 'OK'),
                )
                .mockImplementationOnce((_, callback) => callback(null, 'ZERO_RESULTS'));

            global.google = {
                maps: {
                    DirectionsService: jest.fn(() => ({ route: mockRoute })),
                    TravelMode: { WALKING: 'WALKING', TRANSIT: 'TRANSIT' },
                } as unknown as typeof google.maps,
            };

            const stops = [
                { position: { lat: 0, lng: 0 }, travelMode: 'WALKING' },
                { position: { lat: 1, lng: 1 }, travelMode: 'TRANSIT' },
                { position: { lat: 2, lng: 2 }, travelMode: 'WALKING' },
            ] as IStop[];

            const result = await fetchRoute({ stops });

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ overview_path: ['path1', 'path2'] });
            expect(result[1]).toBeNull();
            expect(mockRoute).toHaveBeenCalledTimes(2);
        });
    });

    describe('getOnStopClick', () => {
        it('should pan map to stop position and sets selected stop', () => {
            const stop = { id: 'stop-1', position: { lat: 10, lng: 20 } } as IStop;

            const mockSetSelected = jest.fn();
            const mockPanTo = jest.fn();
            const mockMap = {
                panTo: mockPanTo,
                getZoom: jest.fn().mockReturnValue(10),
                getProjection: jest.fn().mockReturnValue({
                    fromLatLngToPoint: jest.fn().mockReturnValue({}),
                    fromPointToLatLng: jest.fn().mockReturnValue(stop.position),
                }),
            };

            global.google = {
                maps: {
                    Point: jest.fn(),
                } as unknown as typeof google.maps,
            };

            getOnStopClick({
                map: mockMap as unknown as google.maps.Map,
                setSelected: mockSetSelected,
                stop,
            });

            expect(mockPanTo).toHaveBeenCalledWith(stop.position);
            expect(mockSetSelected).toHaveBeenCalledWith({
                hotel: undefined,
                stop,
            });
        });
    });

    describe('equalRoute', () => {
        it('should return true when routes are identical', () => {
            const route1 = [{ id: '1' }, { id: '2' }] as IStop[];
            const route2 = [{ id: '1' }, { id: '2' }] as IStop[];

            const result = equalRoute(route1, route2);

            expect(result).toBe(true);
        });

        it('should return false when routes have different lengths', () => {
            const route1 = [{ id: '1' }, { id: '2' }] as IStop[];
            const route2 = [{ id: '1' }] as IStop[];

            const result = equalRoute(route1, route2);

            expect(result).toBe(false);
        });

        it('should return false when routes have different start or end points', () => {
            const route1 = [{ id: '1' }, { id: '2' }] as IStop[];
            const route2 = [{ id: '1' }, { id: '3' }] as IStop[];

            const result = equalRoute(route1, route2);

            expect(result).toBe(false);
        });

        it('should return true when both routes are undefined', () => {
            const result = equalRoute(undefined, undefined);

            expect(result).toBe(true);
        });

        it('should return false when one route is undefined and the other is not', () => {
            const route1 = [{ id: '1' }, { id: '2' }] as IStop[];

            const result = equalRoute(route1, undefined);

            expect(result).toBe(false);
        });
    });

    describe('createInfoWindow', () => {
        it('should create an info window with correct content, position, z-index and open it on the map', () => {
            const stop = { id: 'stop-1', name: 'Stop Name', position: { lat: 10, lng: 20 } } as IStop;

            const mockSetPosition = jest.fn();
            const mockSetZIndex = jest.fn();
            const mockOpen = jest.fn();

            const MockInfoWindow = jest.fn().mockImplementation(() => ({
                setPosition: mockSetPosition,
                setZIndex: mockSetZIndex,
                open: mockOpen,
            }));

            global.google = {
                maps: {
                    InfoWindow: MockInfoWindow,
                },
            } as unknown as typeof global.google;

            const offsetPos = { lat: 9.7, lng: 19.8 };
            jest.spyOn(utils, 'getOffsetLatLng').mockReturnValue(offsetPos as any);

            const mockMap = {} as unknown as google.maps.Map;

            createInfoWindow({ map: mockMap, stop });

            expect(MockInfoWindow).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining(stop.name),
                    headerDisabled: true,
                }),
            );
            expect(mockSetPosition).toHaveBeenCalledWith(offsetPos);
            expect(mockSetZIndex).toHaveBeenCalledWith(1);
            expect(mockOpen).toHaveBeenCalledWith(mockMap);
        });
    });
});
