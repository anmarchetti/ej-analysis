import { renderHook } from '@testing-library/react';

import useHolidaysDestinationPageTypeName, { DestinationPageTemplateName } from './useHolidaysDestinationPageTypeName';

let mockStores;

const createStores = () => ({
    layoutStore: {
        isTradePortal: false,
        isCountryBrowsePage: false,
        isRegionBrowsePage: false,
        isVirtualRegionBrowsePage: false,
        isRegionCityBrowsePage: false,
        isResortBrowsePage: false,
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useHolidaysDestinationPageTypeName', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should return undefined when it is not a destination page', () => {
        const { result } = renderHook(() => useHolidaysDestinationPageTypeName());

        expect(result.current).toBe(undefined);
    });

    it('should return undefined when isTradePortal', () => {
        mockStores.layoutStore.isTradePortal = true;
        const { result } = renderHook(() => useHolidaysDestinationPageTypeName());

        expect(result.current).toBe(undefined);
    });

    it('should return Country template name when it is a CountryBrowse page', () => {
        mockStores.layoutStore.isCountryBrowsePage = true;
        const { result } = renderHook(() => useHolidaysDestinationPageTypeName());

        expect(result.current).toBe(DestinationPageTemplateName.Country);
    });

    it('should return Region template name when it is a RegionBrowse page', () => {
        mockStores.layoutStore.isRegionBrowsePage = true;
        const { result } = renderHook(() => useHolidaysDestinationPageTypeName());

        expect(result.current).toBe(DestinationPageTemplateName.Region);
    });

    it('should return Region template name when it is a VirtualRegionBrowse page', () => {
        mockStores.layoutStore.isVirtualRegionBrowsePage = true;
        const { result } = renderHook(() => useHolidaysDestinationPageTypeName());

        expect(result.current).toBe(DestinationPageTemplateName.Region);
    });

    it('should return RegionCity template name when it is a RegionCityBrowse page', () => {
        mockStores.layoutStore.isRegionCityBrowsePage = true;
        const { result } = renderHook(() => useHolidaysDestinationPageTypeName());

        expect(result.current).toBe(DestinationPageTemplateName.RegionCity);
    });

    it('should return Resort template name when it is a ResortBrowse page', () => {
        mockStores.layoutStore.isResortBrowsePage = true;
        const { result } = renderHook(() => useHolidaysDestinationPageTypeName());

        expect(result.current).toBe(DestinationPageTemplateName.Resort);
    });
});
