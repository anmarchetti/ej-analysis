import { createMockStores } from 'frontend/__mocks__';
import { QueryParamName } from 'models/enum/QueryParamName';

import { TradePortalQueryParamsStore } from './TradePortalQueryParamsStore';

let queryStore: TradePortalQueryParamsStore;

describe('TradePortalQueryParamsStore', () => {
    beforeEach(() => {
        queryStore = new TradePortalQueryParamsStore(
            createMockStores({
                routerStore: {
                    updateCurrentPage: jest.fn(),
                },
            }),
        );
    });

    describe('buildBD4HotelParam', () => {
        it('should invokes parent "buildBD4HotelParam"', () => {
            queryStore.buildBD4HotelParam = jest.fn();
            queryStore.buildBD4HotelParam(1, QueryParamName.EjReco);

            expect(queryStore.buildBD4HotelParam).toHaveBeenCalledWith(1, QueryParamName.EjReco);
        });
    });

    describe('updatePageWithLCBQuery', () => {
        it('should be invoked "updatePageWithLCBQuery" from parent', () => {
            queryStore.buildHotelDetailsQuery = jest.fn().mockReturnValue('url');
            queryStore.updatePageWithLCBQueryBase = jest.fn();
            queryStore.updatePageWithLCBQuery();

            expect(queryStore.updatePageWithLCBQueryBase).toHaveBeenCalled();
            expect(queryStore.rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('url');
        });
    });

    describe('buildHotelDetailsQuery', () => {
        it('should be invoked "buildHotelDetailsQuery" from parent', () => {
            queryStore.buildHotelDetailsQueryBase = jest.fn();
            queryStore.hotelParamsBase = jest.fn().mockReturnValue({
                [QueryParamName.AirportParkingCode]: 'LGW1',
            });
            queryStore.buildHotelDetailsQuery(undefined, {}, {});

            expect(queryStore.buildHotelDetailsQueryBase).toHaveBeenCalledWith(
                {},
                {
                    [QueryParamName.AirportParkingCode]: 'LGW1',
                },
            );
        });
    });
});
