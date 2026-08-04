import { Request, Response } from 'express';

import * as envUtils from 'code/env.server';
import { IHolidaysStores, SearchStore } from 'frontend/store/holidays';
import * as createStoresUtils from 'frontend/store/holidays/create-stores';
import * as utils from 'frontend/utils/dotComDeeplinkHelpers';
import { IMarketSettings } from 'models/data/MarketSettings';

import { searchResultCallback } from './dotcom';

jest.spyOn(createStoresUtils, 'createHolidaysAppStores').mockReturnValue({
    searchStore: {} as SearchStore,
} as IHolidaysStores);

const saveDotComDepplinkDestinationToSearchStore = jest
    .spyOn(utils, 'saveDotComDepplinkDestinationToSearchStore')
    .mockReturnValue(Promise.resolve(true));

const getMarketFromDotComDeeplink = jest
    .spyOn(utils, 'getMarketFromDotComDeeplink')
    .mockReturnValue(Promise.resolve([] as IMarketSettings));

describe('searchResultCallback', () => {
    it('should call next when any of query params is empty', () => {
        const req = {
            query: {
                destinations: '',
                departure_airports: 'LONDON',
                dd: '2024-05-10',
                rd: '2024-05-17',
            },
        } as Partial<Request>;

        const res = {
            locals: {
                lang: 'en',
            },
            redirect: jest.fn(),
        } as Partial<Response>;

        const next = jest.fn();

        searchResultCallback(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should NOT call next when query params are prefilled', () => {
        const req = {
            query: {
                destinations: '2271,221',
                departure_airports: 'LONDON',
                dd: '2024-05-10',
                rd: '2024-05-17',
            },
        } as Partial<Request>;

        const res = {
            locals: {
                lang: 'en',
            },
            redirect: jest.fn(),
        } as Partial<Response>;

        const next = jest.fn();

        searchResultCallback(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledTimes(0);
    });

    describe('departure-airports', () => {
        it('should be replaced when departure-airports are NOT codes', async () => {
            const env = jest.spyOn(envUtils, 'getEnv').mockReturnValue({
                DEEPLINK_AIRPORTS_MAPPING: {
                    LONDON: 'LGW,LTN,STN,SEN',
                },
            } as unknown as envUtils.IENVSERVER);

            const req = {
                query: {
                    destinations: '2271,221',
                    departure_airports: 'LONDON',
                    dd: '2024-05-10',
                    rd: '2024-05-17',
                    rooms: ['1'],
                },
                url: 'url',
            } as Partial<Request>;

            const res = {
                locals: {
                    lang: 'en',
                },
                redirect: jest.fn(),
            } as Partial<Response>;

            const next = jest.fn();

            searchResultCallback(req as Request, res as Response, next);

            await expect(saveDotComDepplinkDestinationToSearchStore).toHaveBeenNthCalledWith(
                1,
                req.query!.destinations,
                {},
            );

            expect(env).toHaveBeenCalledTimes(1);

            expect(getMarketFromDotComDeeplink).toHaveBeenNthCalledWith(1, ['LGW', 'LTN', 'STN', 'SEN'], 'en');
        });

        it('should NOT be replaced when departure-airports are codes', async () => {
            const env = jest.spyOn(envUtils, 'getEnv').mockReturnValue({} as envUtils.IENVSERVER);

            const req = {
                query: {
                    destinations: '2271,221',
                    departure_airports: 'LGW',
                    dd: '2024-05-10',
                    rd: '2024-05-17',
                    rooms: ['1'],
                },
                url: 'url',
            } as Partial<Request>;

            const res = {
                locals: {
                    lang: 'en',
                },
                redirect: jest.fn(),
            } as Partial<Response>;

            const next = jest.fn();

            searchResultCallback(req as Request, res as Response, next);

            await expect(saveDotComDepplinkDestinationToSearchStore).toHaveBeenNthCalledWith(
                1,
                req.query!.destinations,
                {},
            );

            expect(env).toHaveBeenCalledTimes(1);

            expect(getMarketFromDotComDeeplink).toHaveBeenNthCalledWith(1, ['LGW'], 'en');
        });
    });
});
