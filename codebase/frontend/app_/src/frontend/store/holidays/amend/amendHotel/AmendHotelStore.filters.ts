import { action, makeObservable, observable } from 'mobx';

import { BaseSearchFilterStore } from 'frontend/store/base/search/BaseSearchFilterStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { IFilters } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

export class AmendHotelStoreFilters extends BaseSearchFilterStore {
    @observable isMobileDrawerOpen = false;

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);
        this.setIsCountHidden(true);
    }

    public isFilterGroupDisabled = (filters: IFilters): boolean => {
        if (!this.rootStore.amendHotelStore.totalNumberOfHotels) {
            return true;
        }

        if (filters.code !== FilterGroupCodes.PriceRange) {
            /** specific logic for the price filter, because it based on max/min price. */
            return !filters.options?.some(el => el.count > 0);
        }

        return false;
    };

    @action toggleFilterMobileDrawer = (): void => {
        this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
    };

    onClearAll = action(() => {
        this.onClearAllSelectedFilters();
        this.rootStore.amendHotelStore.getInitialAlternativeHotels();
    });

    onApply = action(() => {
        this.loadContent();
    });

    loadContent = action(() => {
        this.rootStore.amendHotelStore.getInitialAlternativeHotels();
    });
}
