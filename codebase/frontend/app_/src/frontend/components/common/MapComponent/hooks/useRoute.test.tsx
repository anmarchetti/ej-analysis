import { act, renderHook } from '@testing-library/react';
import googleMaps from '@vis.gl/react-google-maps';

import { IStop } from 'models/data/map/IItinerary';
import * as utils from 'frontend/components/common/MapComponent/Route/Route.utils';

import useRoute from './useRoute';

const spyGetOnStopClick = jest.spyOn(utils, 'getOnStopClick');

const map = { name: 'map', panTo: jest.fn(), fitBounds: jest.fn(), getZoom: jest.fn(), getProjection: jest.fn() };
const spyUseMap = jest.spyOn(googleMaps, 'useMap').mockReturnValue(map as unknown as google.maps.Map);

describe('useRoute', () => {
    it('should fetch and draw polyline when stops are updated', async () => {
        const mockPolyline = jest.fn(() => ({}));
        global.google = {
            maps: {
                DirectionsService: jest.fn(() => ({
                    route: jest.fn((_, callback) =>
                        callback({ routes: [{ legs: [{ overview_path: ['path1', 'path2'] }] }] }, 'OK'),
                    ),
                })),
                LatLngBounds: jest.fn(() => ({ extend: jest.fn() })),
                Polyline: mockPolyline,
                TravelMode: { WALKING: 'WALKING', TRANSIT: 'TRANSIT' },
            } as unknown as typeof google.maps,
        };

        const stops = [
            { id: '1', position: { lat: 0, lng: 0 }, travelMode: 'WALKING' },
            { id: '2', position: { lat: 1, lng: 1 }, travelMode: 'TRANSIT' },
        ] as IStop[];

        const onChange = jest.fn();
        const setSelected = jest.fn();

        renderHook(() => useRoute({ route: stops, onChange, setSelected }));

        await act(async () => {});

        expect(onChange).toHaveBeenCalledWith([{ route: expect.any(Object) }]);
        expect(mockPolyline).toHaveBeenCalledWith({
            icons: [
                {
                    icon: {
                        fillColor: '#ff4600',
                        fillOpacity: 1,
                        path: 'M 0, 0 m -2, 0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0',
                        scale: 1.7,
                        strokeColor: '#ff4600',
                        strokeOpacity: 1,
                    },
                    offset: '0',
                    repeat: '18px',
                },
            ],
            map: {
                name: 'map',
                panTo: expect.any(Function),
                fitBounds: expect.any(Function),
                getZoom: expect.any(Function),
                getProjection: expect.any(Function),
            },
            path: [undefined],
            strokeOpacity: 0,
        });
    });

    it('should NOT fetch polyline when stops are unchanged', async () => {
        const mockRoute = jest.fn();
        global.google = {
            maps: {
                LatLngBounds: jest.fn(() => ({ extend: jest.fn() })),
                DirectionsService: jest.fn(() => ({ route: mockRoute })),
            } as unknown as typeof google.maps,
        };

        const stops = [{ id: '1', position: { lat: 0, lng: 0 }, travelMode: 'WALKING' }] as IStop[];

        const onChange = jest.fn();
        const setSelected = jest.fn();

        const { result } = renderHook(() => useRoute({ route: stops, onChange, setSelected }));

        await act(async () => {
            result.current.helper.current['stops'] = stops;
        });

        expect(mockRoute).not.toHaveBeenCalled();
    });

    it('should NOT fetch polyline when map is null', async () => {
        const mockRoute = jest.fn();
        global.google = {
            maps: {
                LatLngBounds: jest.fn(() => ({ extend: jest.fn() })),
                DirectionsService: jest.fn(() => ({ route: mockRoute })),
            } as unknown as typeof google.maps,
        };

        spyUseMap.mockReturnValueOnce(null);

        const stops = [{ id: '1', position: { lat: 0, lng: 0 }, travelMode: 'WALKING' }] as IStop[];

        const onChange = jest.fn();
        const setSelected = jest.fn();

        renderHook(() => useRoute({ route: stops, onChange, setSelected }));

        expect(mockRoute).not.toHaveBeenCalled();
    });

    it('should simulate stop selection when externallySelectedStop is provided', async () => {
        const mockSetSelected = jest.fn();
        const externallySelectedStop = { id: 'stop-1', position: { lat: 10, lng: 20 } } as IStop;
        const stops = [
            { id: 'stop-1', position: { lat: 10, lng: 20 }, travelMode: 'WALKING' },
            { id: 'stop-2', position: { lat: 30, lng: 40 }, travelMode: 'WALKING' },
        ] as IStop[];

        global.google = {
            maps: {
                DirectionsService: jest.fn(() => ({
                    route: jest.fn((_, callback) =>
                        callback({ routes: [{ legs: [{}], overview_path: ['path1', 'path2'] }] }, 'OK'),
                    ),
                })),
                LatLngBounds: jest.fn(() => ({ extend: jest.fn() })),
                Polyline: jest.fn(),
                TravelMode: { WALKING: 'WALKING', TRANSIT: 'TRANSIT' },
            } as unknown as typeof google.maps,
        };

        renderHook(() =>
            useRoute({
                route: stops,
                externallySelectedStop,
                onChange: jest.fn(),
                setSelected: mockSetSelected,
            }),
        );

        expect(spyGetOnStopClick).toHaveBeenCalledWith({
            map,
            setSelected: mockSetSelected,
            stop: stops[0],
        });
    });

    it('should NOT simulate stop selection when externallySelectedStop is null', () => {
        const mockSetSelected = jest.fn();

        renderHook(() =>
            useRoute({
                route: [],
                externallySelectedStop: undefined,
                onChange: jest.fn(),
                setSelected: mockSetSelected,
            }),
        );

        expect(spyGetOnStopClick).not.toHaveBeenCalled();
    });
});
