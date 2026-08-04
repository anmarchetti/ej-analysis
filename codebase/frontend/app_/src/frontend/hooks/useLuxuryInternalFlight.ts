import { isHolidayStore } from 'frontend/store/holidays/create-stores';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import useStore from './useStore';

export const useLuxuryInternalFlight = (): boolean => {
    const { isFlightExternal, isLuxuryPackage } = useStore((stores: TStores) => ({
        isFlightExternal:
            stores.bookingStore.isFlightExternal ||
            stores.viewBookingStore.isFlightExternal ||
            (isHolidayStore(stores) &&
                (stores.payBalanceStore.isFlightExternal || stores.holidayCreditStore.isFlightExternal)),
        isLuxuryPackage:
            stores.bookingStore.isLuxuryPackage ||
            stores.viewBookingStore.isLuxuryPackage ||
            (isHolidayStore(stores) &&
                (stores.payBalanceStore.isLuxuryPackage || stores.holidayCreditStore.isLuxuryPackage)),
    }));

    return !isFlightExternal && isLuxuryPackage;
};

export const useLuxuryInternalFlightDefaultBagsLabel = (luggageCount: number): string | undefined => {
    const { getPhrase } = useStore(({ layoutStore }) => ({
        getPhrase: layoutStore.getPhrase,
    }));
    const isLuxuryInternalFlight = useLuxuryInternalFlight();
    const luxuryBagsLabel =
        luggageCount === 1
            ? `1 x ${getPhrase(SitecoreDictionary.LuggageLabels26kgHoldBagSingular)}`
            : `${luggageCount} x ${getPhrase(SitecoreDictionary.LuggageLabels26kgHoldBagPlural)}`;

    return isLuxuryInternalFlight ? luxuryBagsLabel : undefined;
};
