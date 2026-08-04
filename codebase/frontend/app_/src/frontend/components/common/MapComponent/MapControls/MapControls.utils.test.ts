import { changeZoom, onZoomChangedCallback } from './MapControls.utils';

describe('MapControls.utils', () => {
    describe('onZoomChangedCallback', () => {
        it('should set zoom status to 1 when zoom level equals maxZoom', () => {
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(10),
            } as unknown as google.maps.Map;
            const setZoomStatus = jest.fn();

            const callback = onZoomChangedCallback({
                map: mockMap,
                setZoomStatus,
                maxZoom: 10,
                minZoom: 5,
            });

            callback();

            expect(setZoomStatus).toHaveBeenCalledWith(1);
        });

        it('should set zoom status to -1 when zoom level equals minZoom', () => {
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(5),
            } as unknown as google.maps.Map;
            const setZoomStatus = jest.fn();

            const callback = onZoomChangedCallback({
                map: mockMap,
                setZoomStatus,
                maxZoom: 10,
                minZoom: 5,
            });

            callback();

            expect(setZoomStatus).toHaveBeenCalledWith(-1);
        });

        it('should set zoom status to 0 when zoom level is between minZoom and maxZoom', () => {
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(7),
            } as unknown as google.maps.Map;
            const setZoomStatus = jest.fn();

            const callback = onZoomChangedCallback({
                map: mockMap,
                setZoomStatus,
                maxZoom: 10,
                minZoom: 5,
            });

            callback();

            expect(setZoomStatus).toHaveBeenCalledWith(0);
        });
    });

    describe('changeZoom', () => {
        it('should increase zoom level by the given positive value', () => {
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(5),
                setZoom: jest.fn(),
            } as unknown as google.maps.Map;

            changeZoom({ value: 1, map: mockMap });

            expect(mockMap.setZoom).toHaveBeenCalledWith(6);
        });

        it('should decrease zoom level by the given negative value', () => {
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(5),
                setZoom: jest.fn(),
            } as unknown as google.maps.Map;

            changeZoom({ value: -1, map: mockMap });

            expect(mockMap.setZoom).toHaveBeenCalledWith(4);
        });
    });
});
