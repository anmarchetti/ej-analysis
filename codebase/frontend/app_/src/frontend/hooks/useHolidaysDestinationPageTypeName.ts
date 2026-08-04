import { useMemo } from 'react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';

export enum DestinationPageTemplateName {
    Country = 'Country',
    Region = 'Region: Non City',
    RegionCity = 'Region: City',
    Resort = 'Resort',
}

/**
 * Hook for getting labels before and after price from dictionary
 */
const useHolidaysDestinationPageTypeName = (): DestinationPageTemplateName | undefined => {
    const {
        isTradePortal,
        isCountryBrowsePage,
        isRegionBrowsePage,
        isVirtualRegionBrowsePage,
        isRegionCityBrowsePage,
        isResortBrowsePage,
    } = useStore(stores => ({
        isTradePortal: stores.layoutStore.isTradePortal,
        isCountryBrowsePage: stores.layoutStore.isCountryBrowsePage,
        isRegionBrowsePage: stores.layoutStore.isRegionBrowsePage,
        isVirtualRegionBrowsePage: stores.layoutStore.isVirtualRegionBrowsePage,
        isRegionCityBrowsePage: isHolidayStore(stores) && stores.layoutStore.isRegionCityBrowsePage,
        isResortBrowsePage: stores.layoutStore.isResortBrowsePage,
    }));

    return useMemo(() => {
        if (isTradePortal) {
            return undefined;
        }

        if (isCountryBrowsePage) {
            return DestinationPageTemplateName.Country;
        }

        if (isRegionBrowsePage || isVirtualRegionBrowsePage) {
            return DestinationPageTemplateName.Region;
        }

        if (isRegionCityBrowsePage) {
            return DestinationPageTemplateName.RegionCity;
        }

        if (isResortBrowsePage) {
            return DestinationPageTemplateName.Resort;
        }

        return undefined;
    }, [
        isTradePortal,
        isCountryBrowsePage,
        isRegionBrowsePage,
        isVirtualRegionBrowsePage,
        isResortBrowsePage,
        isRegionCityBrowsePage,
    ]);
};

export default useHolidaysDestinationPageTypeName;
