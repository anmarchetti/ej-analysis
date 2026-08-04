import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { SearchStore } from 'frontend/store/holidays/search/SearchStore';

describe('SearchStore', () => {
    let searchStore;
    const rootStore = {
        layoutStore: {
            isTradePortal: false,
        },
    } as HolidaysRootStore;

    beforeEach(() => {
        searchStore = new SearchStore(rootStore);
    });

    test('constructor assigns rootStore', () => {
        expect(searchStore.rootStore).toBe(rootStore);
    });

    test('setCountriesWithRegions action sets countriesWithRegions', () => {
        const destinations = [
            {
                id: 1,
                name: 'Test Country',
                regions: [{ id: 1, name: 'Test Region' }],
            },
        ];
        searchStore.searchTo.setCountriesWithRegions = jest.fn();

        searchStore.setCountriesWithRegions(destinations);

        expect(searchStore.searchTo.setCountriesWithRegions).toHaveBeenCalledWith(destinations);
    });
});
