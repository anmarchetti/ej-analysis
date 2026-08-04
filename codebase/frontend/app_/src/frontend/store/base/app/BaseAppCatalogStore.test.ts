import { IDestination } from 'models/data/IDestination';

import BaseAppCatalogStore from './BaseAppCatalogStore';

const createRootStore = () =>
    ({
        layoutStore: {
            getPhrase: jest.fn(p => p),
            lang: 'en',
        },
    } as any);

let rootStore = createRootStore();

describe('BaseAppCatalogStore', () => {
    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('getCustomerTitlesSelectOptions', () => {
        it('should return customer titles for adult', () => {
            const store = new BaseAppCatalogStore(rootStore);

            const customerTitles = store.getCustomerTitlesSelectOptions(true);
            expect(customerTitles).toMatchObject([
                {
                    label: 'Globals.Labels.Titles.Mr',
                    value: 'MR',
                },
                {
                    label: 'Globals.Labels.Titles.Miss',
                    value: 'Miss',
                },
                {
                    label: 'Globals.Labels.Titles.Mrs',
                    value: 'MRS',
                },
                {
                    label: 'Globals.Labels.Titles.Ms',
                    value: 'MS',
                },
            ]);
        });

        it('should return customer titles relevant for lang', () => {
            rootStore.layoutStore.lang = 'ch-fr';
            const store = new BaseAppCatalogStore(rootStore);

            const customerTitles = store.getCustomerTitlesSelectOptions(true);
            expect(customerTitles).toMatchObject([
                {
                    label: 'Globals.Labels.Titles.Mr',
                    value: 'MR',
                },
                {
                    label: 'Globals.Labels.Titles.Miss',
                    value: 'Miss',
                },
                {
                    label: 'Globals.Labels.Titles.Mrs',
                    value: 'MRS',
                },
            ]);
        });

        it('should return customer titles for child', () => {
            const store = new BaseAppCatalogStore(rootStore);

            const customerTitles = store.getCustomerTitlesSelectOptions(false);
            expect(customerTitles).toMatchObject([
                {
                    label: 'Globals.Labels.Titles.Mr',
                    value: 'MR',
                },
                {
                    label: 'Globals.Labels.Titles.Miss',
                    value: 'Miss',
                },
            ]);
        });
    });

    describe('countryCodesSelectOptions', () => {
        const countries = [
            { code: 'FR', name: 'France', iso2: 'FR' },
            { code: 'GBR', name: 'United Kingdom', iso2: 'GB' },
            { code: 'DE', name: 'Germany', iso2: 'DE' },
        ];

        it('should return sorted country codes with default country code moved to the front', () => {
            rootStore.layoutStore.getSetting = jest.fn(() => 'GBR');

            const store = new BaseAppCatalogStore(rootStore);

            store.countries.data = countries;

            const result = store.countryCodesSelectOptions;

            expect(result).toEqual([
                { value: 'GBR', label: 'United Kingdom', iso2: 'GB' },
                { value: 'FR', label: 'France', iso2: 'FR' },
                { value: 'DE', label: 'Germany', iso2: 'DE' },
            ]);
        });

        it('should return initial array when default country code is not found', () => {
            rootStore.layoutStore.getSetting = jest.fn(() => 'XX');
            const store = new BaseAppCatalogStore(rootStore);

            const result = store.countryCodesSelectOptions;

            expect(result).toEqual([]);
        });

        it('should return an empty array when countries data is empty', () => {
            const store = new BaseAppCatalogStore(rootStore);
            store.countries.data = [];

            const result = store.countryCodesSelectOptions;

            expect(result).toEqual([]);
        });

        it('should return an empty array when countries data is null', () => {
            const store = new BaseAppCatalogStore(rootStore);

            store.countries.data = null as unknown as IDestination[];

            const result = store.countryCodesSelectOptions;

            expect(result).toEqual([]);
        });
    });
});
