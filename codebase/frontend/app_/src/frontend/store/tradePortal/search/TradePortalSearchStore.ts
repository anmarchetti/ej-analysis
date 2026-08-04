import { action, makeObservable } from 'mobx';

import { BaseSearchStore } from 'frontend/store/base/search/BaseSearchStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { IDestinationCountry } from 'models/data/IDestinationCountries';

export class TradePortalSearchStore extends BaseSearchStore {
    @action setCountriesWithRegions = (destinations: IDestinationCountry[]): void => {
        this.searchTo.setCountriesWithRegions(destinations);
    };

    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }
}
