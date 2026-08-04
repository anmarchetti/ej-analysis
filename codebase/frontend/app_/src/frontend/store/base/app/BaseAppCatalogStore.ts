import { computed, makeObservable, observable } from 'mobx';

import { GuestsService } from 'frontend/services/guests.service';
import { TRootStore } from 'frontend/store/IStores';
import { moveToFrontOfArray } from 'frontend/utils/array.utils';
import { DataCatalogItem } from 'models/data/DataCatalogItem';
import { IDestination } from 'models/data/IDestination';
import { IDialingCode } from 'models/data/IDialingCode';
import { ICountryCodeSelectOption, ISelectOption } from 'models/data/ISelectOption';
import { AdultTitles, ChildTitles } from 'models/enum/CustomerTitles';
import SiteSettings from 'models/enum/SiteSettings';

/** Store is used for storing common data (e.g. forms select options)  */
export class BaseAppCatalogStore {
    countries: DataCatalogItem<IDestination[]> = new DataCatalogItem([], GuestsService.getCountries);
    dialingCodes: DataCatalogItem<IDialingCode[]> = new DataCatalogItem([], GuestsService.getDialingCodes);

    constructor(public rootStore: TRootStore) {
        makeObservable(this, {
            countries: observable,
            countryCodesSelectOptions: computed,

            dialingCodes: observable,
            dialingCodesSelectOptions: computed,
        });
    }

    get countryCodesSelectOptions(): ICountryCodeSelectOption[] {
        const { getSetting } = this.rootStore.layoutStore;

        const countryCodes = (this.countries.data || [])
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(el => ({
                value: el.code,
                label: el.name,
                iso2: el.iso2,
            })) as ICountryCodeSelectOption[];

        return moveToFrontOfArray<ICountryCodeSelectOption>(
            countryCodes,
            x => x.value === getSetting(SiteSettings.DefaultCountryCode),
        );
    }

    get dialingCodesSelectOptions(): ISelectOption[] {
        const { getSetting } = this.rootStore.layoutStore;
        const dialingCodes = (this.dialingCodes.data || [])
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(el => ({
                value: el.code,
                label: `(+${el.code}) ${el.name}`,
            }));

        return moveToFrontOfArray(dialingCodes, x => x.value === getSetting(SiteSettings.DefaultDialingCode));
    }

    getCustomerTitlesSelectOptions = (isAdult: boolean = true): ISelectOption[] => {
        const { getPhrase } = this.rootStore.layoutStore;
        const { lang } = this.rootStore.layoutStore;
        const titles = isAdult ? AdultTitles : ChildTitles;

        return titles.reduce((acc, currentValue) => {
            const newItem = {
                value: currentValue.value,
                label: getPhrase(currentValue.label),
            };

            if (newItem.label !== '' && currentValue.langs.includes(lang)) {
                return [...acc, newItem];
            }

            return acc;
        }, [] as ISelectOption[]);
    };
}

export default BaseAppCatalogStore;
