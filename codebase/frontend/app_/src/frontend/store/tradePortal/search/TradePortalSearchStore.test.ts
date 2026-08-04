import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';

import { TradePortalSearchStore } from './TradePortalSearchStore';

describe('TradePortalSearchStore', () => {
    let tradePortalSearchStore;
    const rootStore = {
        layoutStore: {
            isTradePortal: true,
        },
    } as TradePortalRootStore;

    beforeEach(() => {
        tradePortalSearchStore = new TradePortalSearchStore(rootStore);
    });

    test('constructor assigns rootStore', () => {
        expect(tradePortalSearchStore.rootStore).toBe(rootStore);
    });

    test('setCountriesWithRegions action sets countriesWithRegions', () => {
        const destinations = [
            {
                id: 1,
                name: 'Test Country',
                regions: [{ id: 1, name: 'Test Region' }],
            },
        ];
        tradePortalSearchStore.setCountriesWithRegions(destinations);
        expect(tradePortalSearchStore.searchTo.countriesWithRegions).toEqual(destinations);
    });
});
