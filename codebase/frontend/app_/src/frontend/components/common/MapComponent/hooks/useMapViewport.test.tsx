import { renderHook } from '@testing-library/react';
import { useMap } from '@vis.gl/react-google-maps';

import useMapViewport from './useMapViewport';

jest.mock('@vis.gl/react-google-maps', () => ({
    useMap: jest.fn(),
}));

describe('useMapViewport', () => {
    it('should return default bbox and undefined zoom when map is not available', () => {
        (useMap as jest.Mock).mockReturnValue(null);

        const { result } = renderHook(() => useMapViewport());

        expect(result.current.bbox).toEqual([-180, -90, 180, 90]);
        expect(result.current.zoom).toBeUndefined();
    });

    it('should update bbox and zoom when map bounds and zoom are available', () => {
        const mockBounds = {
            getSouthWest: jest.fn(() => ({ lat: () => -10, lng: () => -20 })),
            getNorthEast: jest.fn(() => ({ lat: () => 10, lng: () => 20 })),
        };
        const mockMap = {
            getBounds: jest.fn(() => mockBounds),
            getZoom: jest.fn(() => 5),
            getProjection: jest.fn(() => ({})),
            addListener: jest.fn((event, callback) => {
                if (event === 'idle') callback();

                return { remove: jest.fn() };
            }),
        };

        (useMap as jest.Mock).mockReturnValue(mockMap);

        const { result } = renderHook(() => useMapViewport());

        expect(result.current.bbox).toEqual([-20, -10, 20, 10]);
        expect(result.current.zoom).toBe(5);
    });

    it('should NOT update bbox and zoom if map bounds or projection are unavailable', () => {
        const mockMap = {
            getBounds: jest.fn(() => undefined),
            getZoom: jest.fn(() => undefined),
            getProjection: jest.fn(() => undefined),
            addListener: jest.fn(() => ({ remove: jest.fn() })),
        };

        (useMap as jest.Mock).mockReturnValue(mockMap);

        const { result } = renderHook(() => useMapViewport());

        expect(result.current.bbox).toEqual([-180, -90, 180, 90]);
        expect(result.current.zoom).toBeUndefined();
    });

    it('should handle map listener cleanup on unmount', () => {
        const removeListenerMock = jest.fn();
        const mockMap = {
            addListener: jest.fn(() => ({ remove: removeListenerMock })),
        };

        (useMap as jest.Mock).mockReturnValue(mockMap);

        const { unmount } = renderHook(() => useMapViewport());
        unmount();

        expect(removeListenerMock).toHaveBeenCalled();
    });
});
