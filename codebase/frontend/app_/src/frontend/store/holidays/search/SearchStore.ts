import { action, makeObservable } from 'mobx';

import { BaseSearchStore } from 'frontend/store/base/search/BaseSearchStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { IDestinationCountry } from 'models/data/IDestinationCountries';

export class SearchStore extends BaseSearchStore {
    @action setCountriesWithRegions = (destinations: IDestinationCountry[]) => {
        this.searchTo.setCountriesWithRegions(destinations);
    };

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);
    }
}
