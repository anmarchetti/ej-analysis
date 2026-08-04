import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IStop } from 'models/data/map/IItinerary';
import { IGeoPoint } from 'models/data/map/IMap';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventActions } from 'models/enum/tracking/GenericEventParams';

import {
    centerMapCardVertically,
    fitBounds,
    getFormattedPrice,
    getMarkerOnClick,
    getOffsetLatLng,
    getOverlayPosition,
    HOVERED_Z_INDEX,
    isValidGeoPoint,
    onMouseEnter,
    onMouseLeave,
    panToWithOffset,
    removeDuplicates,
} from './ClusteredMarkers.utils';

global.google = {
    maps: {
        LatLng: jest.fn(),
        Point: jest.fn(),
        LatLngBounds: jest.fn(),
        Map: {
            getZoom: jest.fn(),
        },
    },
} as any;

describe('ClusteredMarkers.utils', () => {
    describe('getOffsetLatLng', () => {
        it('should return null when map projection is unavailable', () => {
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(10),
                getProjection: jest.fn().mockReturnValue(null),
            } as unknown as google.maps.Map;

            const result = getOffsetLatLng(mockMap, { lat: 40.7128, lng: -74.006 }, 100, 50);

            expect(result).toBeNull();
        });

        it('should return null when fromLatLngToPoint returns null', () => {
            const mockProjection = {
                fromLatLngToPoint: jest.fn().mockReturnValue(null),
            };
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(10),
                getProjection: jest.fn().mockReturnValue(mockProjection),
            } as unknown as google.maps.Map;

            const result = getOffsetLatLng(mockMap, { lat: 40.7128, lng: -74.006 }, 100, 50);

            expect(result).toBeNull();
        });

        it('should return correct LatLng for valid inputs', () => {
            const mockProjection = {
                fromLatLngToPoint: jest.fn().mockReturnValue({ x: 1, y: 1 }),
                fromPointToLatLng: jest.fn().mockReturnValue({ lat: 40.7138, lng: -74.005 }),
            };
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(10),
                getProjection: jest.fn().mockReturnValue(mockProjection),
            } as unknown as google.maps.Map;

            const result = getOffsetLatLng(mockMap, { lat: 40.7128, lng: -74.006 }, 100, 50);

            expect(mockProjection.fromLatLngToPoint).toHaveBeenCalledWith({ lat: 40.7128, lng: -74.006 });
            expect(mockProjection.fromPointToLatLng).toHaveBeenCalledWith(expect.any(Object));
            expect(result).toEqual({ lat: 40.7138, lng: -74.005 });
        });

        it('should handle zero offset correctly', () => {
            const mockProjection = {
                fromLatLngToPoint: jest.fn().mockReturnValue({ x: 1, y: 1 }),
                fromPointToLatLng: jest.fn().mockReturnValue({ lat: 40.7128, lng: -74.006 }),
            };
            const mockMap = {
                getZoom: jest.fn().mockReturnValue(10),
                getProjection: jest.fn().mockReturnValue(mockProjection),
            } as unknown as google.maps.Map;

            const result = getOffsetLatLng(mockMap, { lat: 40.7128, lng: -74.006 }, 0, 0);

            expect(result).toEqual({ lat: 40.7128, lng: -74.006 });
        });
    });

    describe('panToWithOffset', () => {
        it('should pan to the offset position when offset is provided', () => {
            const mockProjection = {
                fromLatLngToPoint: jest.fn().mockReturnValue({ x: 1, y: 1 }),
                fromPointToLatLng: jest.fn().mockReturnValue({ lat: 40.7128, lng: -74.006 }),
            };
            const mockMap = {
                panTo: jest.fn(),
                getProjection: jest.fn().mockReturnValue(mockProjection),
                getZoom: jest.fn().mockReturnValue(10),
            } as unknown as google.maps.Map;

            panToWithOffset(mockMap, { lat: 40.7128, lng: -74.006 }, 100, 50);

            expect(mockMap.panTo).toHaveBeenCalledWith({ lat: 40.7128, lng: -74.006 });
        });

        it('should NOT pan when offset position is null', () => {
            const mockMap = {
                panTo: jest.fn(),
                getProjection: jest.fn().mockReturnValue(null),
                getZoom: jest.fn().mockReturnValue(10),
            } as unknown as google.maps.Map;

            panToWithOffset(mockMap, { lat: 40.7128, lng: -74.006 }, 100, 50);

            expect(mockMap.panTo).not.toHaveBeenCalled();
        });

        it('should handle zero offset correctly and pan to the original position', () => {
            const mockProjection = {
                fromLatLngToPoint: jest.fn().mockReturnValue({ x: 1, y: 1 }),
                fromPointToLatLng: jest.fn().mockReturnValue({ lat: 40.7128, lng: -74.006 }),
            };
            const mockMap = {
                panTo: jest.fn(),
                getProjection: jest.fn().mockReturnValue(mockProjection),
                getZoom: jest.fn().mockReturnValue(10),
            } as unknown as google.maps.Map;

            panToWithOffset(mockMap, { lat: 40.7128, lng: -74.006 }, 0, 0);

            expect(mockMap.panTo).toHaveBeenCalledWith({ lat: 40.7128, lng: -74.006 });
        });
    });

    describe('fitBounds', () => {
        it('should NOT modify map bounds when map is null', () => {
            const mockMap = null;
            const mockList = [{ geometry: { coordinates: [10, 20] } }] as IGeoPoint[];
            fitBounds({ map: mockMap!, list: mockList });

            expect(mockMap).toBeNull();
        });

        it('should NOT modify map bounds when list is empty', () => {
            const mockMap = { fitBounds: jest.fn() } as unknown as google.maps.Map;
            const mockList: any[] = [];

            fitBounds({ map: mockMap, list: mockList });

            expect(mockMap.fitBounds).not.toHaveBeenCalled();
        });

        it('should extend bounds for each item with geometry', () => {
            const mockMap = { fitBounds: jest.fn() } as unknown as google.maps.Map;
            const mockBounds = { extend: jest.fn() };
            jest.spyOn(google.maps, 'LatLngBounds').mockImplementation(
                () => mockBounds as unknown as google.maps.LatLngBounds,
            );

            const mockList = [
                { geometry: { coordinates: [10, 20] } },
                { geometry: { coordinates: [30, 40] } },
            ] as IGeoPoint[];

            fitBounds({ map: mockMap, list: mockList });

            expect(mockBounds.extend).toHaveBeenCalledWith({ lat: 20, lng: 10 });
            expect(mockBounds.extend).toHaveBeenCalledWith({ lat: 40, lng: 30 });
            expect(mockMap.fitBounds).toHaveBeenCalledWith(mockBounds, 100);
        });

        it('should extend bounds for each item with position when geometry is missing', () => {
            const mockMap = { fitBounds: jest.fn() } as unknown as google.maps.Map;
            const mockBounds = { extend: jest.fn() };
            jest.spyOn(google.maps, 'LatLngBounds').mockImplementation(
                () => mockBounds as unknown as google.maps.LatLngBounds,
            );

            const mockList = [{ position: { lat: 50, lng: 60 } }, { position: { lat: 70, lng: 80 } }] as IStop[];

            fitBounds({ map: mockMap, list: mockList });

            expect(mockBounds.extend).toHaveBeenCalledWith({ lat: 50, lng: 60 });
            expect(mockBounds.extend).toHaveBeenCalledWith({ lat: 70, lng: 80 });
            expect(mockMap.fitBounds).toHaveBeenCalledWith(mockBounds, 100);
        });

        it('should use provided padding when fitting bounds', () => {
            const mockMap = { fitBounds: jest.fn() } as unknown as google.maps.Map;
            const mockBounds = { extend: jest.fn() };
            jest.spyOn(google.maps, 'LatLngBounds').mockImplementation(
                () => mockBounds as unknown as google.maps.LatLngBounds,
            );

            const mockList = [{ geometry: { coordinates: [10, 20] } }] as IGeoPoint[];
            const padding = 50;

            fitBounds({ map: mockMap, list: mockList, padding });
            expect(mockMap.fitBounds).toHaveBeenCalledWith(mockBounds, padding);
        });
    });

    describe('onMouseEnter', () => {
        it('should set HOVERED_Z_INDEX to the target element on mouse enter', () => {
            const mockEvent = {
                target: { style: { zIndex: '' } },
            };

            onMouseEnter(mockEvent);

            expect(mockEvent.target.style.zIndex).toBe(HOVERED_Z_INDEX);
        });
    });

    describe('onMouseLeave', () => {
        it('should reset zIndex to the previous value on mouse leave', () => {
            const marker = { style: { zIndex: '10' }, dataset: { zIndex: 2 } };
            const mockEvent = {
                target: {
                    style: { zIndex: '' },
                    querySelector: jest.fn().mockReturnValue(marker),
                },
            };

            onMouseLeave(mockEvent);

            expect(mockEvent.target.style.zIndex).toBe(2);
        });
    });

    describe('centerMapCardVertically', () => {
        it('should pan the map to the position with vertical offset', () => {
            const mockMap = {
                panTo: jest.fn(),
                getZoom: jest.fn().mockReturnValue(10),
                getProjection: jest.fn().mockReturnValue({
                    fromLatLngToPoint: jest.fn().mockReturnValue({ x: 1, y: 1 }),
                    fromPointToLatLng: jest.fn().mockReturnValue({ lat: 40.7128, lng: -72.006 }),
                }),
            } as unknown as google.maps.Map;

            centerMapCardVertically(mockMap, [40.7128, -74.006]);

            expect(mockMap.panTo).toHaveBeenCalledWith({ lat: 40.7128, lng: -72.006 });
        });
    });

    describe('getMarkerOnClick', () => {
        it('should set selected with item', () => {
            const mockSetSelected = jest.fn();
            const mockTrackMapEvent = jest.fn();
            const mockMap = {
                getProjection: jest.fn().mockReturnValue({ fromLatLngToPoint: jest.fn() }),
                getZoom: jest.fn().mockReturnValue(10),
            } as unknown as google.maps.Map;
            const mockItem = { geometry: { coordinates: [10, 20] }, properties: { id: 'id' } } as IGeoPoint;

            const onClick = getMarkerOnClick({
                setSelected: mockSetSelected,
                item: mockItem,
                map: mockMap,
                trackMapEvent: mockTrackMapEvent,
            });

            onClick();

            expect(mockTrackMapEvent).toHaveBeenCalledWith({
                action: EventActions.MapPinClick,
                label: 'id',
            });
            expect(mockSetSelected).toHaveBeenCalledWith({ hotel: mockItem });
        });

        it('should NOT call setSelected when item has no id', () => {
            const mockSetSelected = jest.fn();
            const mockTrackMapEvent = jest.fn();
            const mockMap = {
                getProjection: jest.fn().mockReturnValue({ fromLatLngToPoint: jest.fn() }),
                getZoom: jest.fn().mockReturnValue(10),
            } as unknown as google.maps.Map;
            const mockItem = { geometry: { coordinates: [10, 20] }, properties: {} } as IGeoPoint;

            const onClick = getMarkerOnClick({
                setSelected: mockSetSelected,
                item: mockItem,
                map: mockMap,
                trackMapEvent: mockTrackMapEvent,
            });

            onClick();

            expect(mockTrackMapEvent).not.toHaveBeenCalled();
            expect(mockSetSelected).not.toHaveBeenCalled();
        });
    });

    describe('getFormattedPrice', () => {
        it('should return empty string when prices are hidden', () => {
            const mockFormatMoney = jest.fn();
            const mockGetPhrase = jest.fn();

            const result = getFormattedPrice({
                formatMoney: mockFormatMoney,
                price: 100,
                isPricePerPerson: false,
                getPhrase: mockGetPhrase,
                pricesHidden: true,
            });

            expect(result).toBe('');
        });

        it('should return formatted price when prices are not hidden and isPricePerPerson is false', () => {
            const mockFormatMoney = jest.fn().mockReturnValue('$100');
            const mockGetPhrase = jest.fn();

            const result = getFormattedPrice({
                formatMoney: mockFormatMoney,
                price: 100,
                isPricePerPerson: false,
                getPhrase: mockGetPhrase,
            });

            expect(result).toBe('$100');
            expect(mockFormatMoney).toHaveBeenCalledWith(100, {
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            });
        });

        it('should return formatted price with per person label when isPricePerPerson is true', () => {
            const mockFormatMoney = jest.fn().mockReturnValue('$100');
            const mockGetPhrase = jest.fn().mockReturnValue('Price per person: {Price}');
            jest.spyOn(Tokenizer, 'replaceToken').mockReturnValue('Price per person: $100');

            const result = getFormattedPrice({
                formatMoney: mockFormatMoney,
                price: 100,
                isPricePerPerson: true,
                getPhrase: mockGetPhrase,
            });

            expect(result).toBe('Price per person: $100');
            expect(mockFormatMoney).toHaveBeenCalledWith(100, {
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            });
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsPriceLabelsPerPerson);
            expect(Tokenizer.replaceToken).toHaveBeenCalledWith('Price per person: {Price}', Tokens.Price, '$100');
        });
    });

    describe('getOverlayPosition', () => {
        it('should return stop position when stop is provided', () => {
            const selected = { stop: { position: { lat: 10, lng: 20 } } as IStop, hotel: undefined };

            const result = getOverlayPosition(selected);

            expect(result).toEqual({ lat: 10, lng: 20 });
        });

        it('should return hotel coordinates when stop is not provided', () => {
            const selected = { stop: undefined, hotel: { geometry: { coordinates: [30, 40] } } as IGeoPoint };

            const result = getOverlayPosition(selected);

            expect(result).toEqual({ lat: 40, lng: 30 });
        });
    });

    describe('removeDuplicates', () => {
        it('should remove duplicate features based on coordinates', () => {
            const features = [
                { geometry: { coordinates: [1, 2] } },
                { geometry: { coordinates: [1, 2] } },
                { geometry: { coordinates: [3, 4] } },
            ] as IGeoPoint[];

            const result = removeDuplicates(features);

            expect(result).toHaveLength(2);
            expect(result).toEqual([{ geometry: { coordinates: [1, 2] } }, { geometry: { coordinates: [3, 4] } }]);
        });

        it('should remove specific coordinates if provided', () => {
            const features = [
                { geometry: { coordinates: [1, 2] } },
                { geometry: { coordinates: [3, 4] } },
            ] as IGeoPoint[];

            const result = removeDuplicates(features, '1,2');

            expect(result).toHaveLength(1);
            expect(result).toEqual([{ geometry: { coordinates: [3, 4] } }]);
        });

        it('should return empty array when input is empty', () => {
            const features = [];

            const result = removeDuplicates(features);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('should return features when it is not array', () => {
            const features = null;

            const result = removeDuplicates(features as unknown as IGeoPoint[]);

            expect(result).toEqual(null);
        });

        it('should handle no removal when coordinates do not match', () => {
            const features = [
                { geometry: { coordinates: [1, 2] } },
                { geometry: { coordinates: [3, 4] } },
            ] as IGeoPoint[];

            const result = removeDuplicates(features, '5,6');

            expect(result).toHaveLength(2);
            expect(result).toEqual(features);
        });
    });

    describe('isValidGeoPoint', () => {
        const geoPoint = {
            geometry: { coordinates: [50, 40], type: 'Point' },
            properties: {
                id: '1',
            },
            type: 'Feature',
        } as IGeoPoint;

        it('should return true for valid longitude and latitude within bounds', () => {
            expect(isValidGeoPoint(geoPoint)).toBe(true);
        });

        it('should return true for valid longitude and latitude when coordinates are string', () => {
            geoPoint.geometry.coordinates = ['50', '40'] as unknown as number[];

            expect(isValidGeoPoint(geoPoint)).toBe(true);
        });

        it('should return false for longitude out of bounds', () => {
            geoPoint.geometry.coordinates = [200, 40];

            expect(isValidGeoPoint(geoPoint)).toBe(false);
        });

        it('should return false for latitude out of bounds', () => {
            geoPoint.geometry.coordinates = [50, 100];

            expect(isValidGeoPoint(geoPoint)).toBe(false);
        });

        it('should return false for null longitude', () => {
            geoPoint.geometry.coordinates = [null, 40] as unknown as number[];

            expect(isValidGeoPoint(geoPoint)).toBe(false);
        });

        it('should return false for null latitude', () => {
            geoPoint.geometry.coordinates = [50, null] as unknown as number[];

            expect(isValidGeoPoint(geoPoint)).toBe(false);
        });

        it('should return false for both longitude and latitude are not provided', () => {
            geoPoint.geometry.coordinates = [null, null] as unknown as number[];

            expect(isValidGeoPoint(geoPoint)).toBe(false);
            expect(isValidGeoPoint(null as unknown as IGeoPoint)).toBe(false);
            expect(isValidGeoPoint({ geometry: undefined } as unknown as IGeoPoint)).toBe(false);
            expect(isValidGeoPoint({ geometry: { coordinates: undefined } } as unknown as IGeoPoint)).toBe(false);
            expect(isValidGeoPoint({ geometry: { coordinates: {} } } as unknown as IGeoPoint)).toBe(false);
            expect(isValidGeoPoint({ geometry: { coordinates: [] } } as unknown as IGeoPoint)).toBe(false);
        });
    });

    describe('isValidGeoPoint', () => {
        it('should return false when item is null', () => {
            const result = isValidGeoPoint(null as unknown as IGeoPoint);

            expect(result).toBe(false);
        });

        it('should return false when geometry is undefined', () => {
            const result = isValidGeoPoint({ geometry: undefined } as unknown as IGeoPoint);

            expect(result).toBe(false);
        });

        it('should return false when coordinates is not an array', () => {
            const result = isValidGeoPoint({ geometry: { coordinates: null } } as unknown as IGeoPoint);

            expect(result).toBe(false);
        });

        it('should return false when coordinates array is empty', () => {
            const result = isValidGeoPoint({ geometry: { coordinates: [] } } as unknown as IGeoPoint);

            expect(result).toBe(false);
        });

        it('should return false when coordinates contain null values', () => {
            const result = isValidGeoPoint({ geometry: { coordinates: [null, null] } } as unknown as IGeoPoint);

            expect(result).toBe(false);
        });

        it('should return false when longitude exceeds maximum allowed value', () => {
            const result = isValidGeoPoint({ geometry: { coordinates: [180, 45] } } as IGeoPoint);

            expect(result).toBe(false);
        });

        it('should return false when latitude exceeds maximum allowed value', () => {
            const result = isValidGeoPoint({ geometry: { coordinates: [45, 91] } } as IGeoPoint);

            expect(result).toBe(false);
        });

        it('should return true for valid longitude and latitude within bounds', () => {
            const result = isValidGeoPoint({ geometry: { coordinates: [45, 45] } } as IGeoPoint);

            expect(result).toBe(true);
        });
    });
});
