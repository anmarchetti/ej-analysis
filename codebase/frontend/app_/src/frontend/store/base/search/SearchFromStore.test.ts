import { waitFor } from '@testing-library/dom';

import { createHolidaysAppStores } from 'frontend/store/holidays/create-stores';
import * as searchUtils from 'frontend/utils/search/search.utils';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { MarketCode } from 'models/data/MarketSettings';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

jest.mock('frontend/services/offers.service');

describe('SearchFromStore', () => {
    describe('country', () => {
        it('should return airports of country', () => {
            const stores = createHolidaysAppStores();

            const airports = [{}, {}] as IAirport[];

            jest.spyOn(stores.marketStore, 'marketCode', 'get').mockReturnValue(MarketCode.UK);
            stores.searchStore.searchFrom.countries = [{ name: 'UK', code: '', hasDepartureAirports: true, airports }];

            expect(stores.searchStore.searchFrom.country).toStrictEqual(airports);
        });

        it('should return airports with countryName of country', () => {
            const stores = createHolidaysAppStores();

            const airports = [{}, {}] as IAirport[];

            jest.spyOn(stores.marketStore, 'marketCode', 'get').mockReturnValue(MarketCode.UK);
            stores.searchStore.searchFrom.countries = [
                { name: 'UK', itemName: 'UK', code: '', hasDepartureAirports: true, airports },
            ];

            expect(stores.searchStore.searchFrom.country).toStrictEqual([{ countryName: 'UK' }, { countryName: 'UK' }]);
        });

        it('should return empty array when there is no countries', () => {
            const stores = createHolidaysAppStores();

            expect(stores.searchStore.searchFrom.country).toStrictEqual([]);
        });

        it('should return airports of countries with country name when marketCode is not equal to country code', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.marketStore, 'marketCode', 'get').mockReturnValue(MarketCode.CH);
            stores.searchStore.searchFrom.countries = [
                {
                    name: 'France',
                    code: MarketCode.FR,
                    hasDepartureAirports: true,
                    airports: [{ name: 'Lyon' } as IAirport],
                },
                {
                    name: 'Switzerland',
                    code: MarketCode.CH,
                    hasDepartureAirports: true,
                    airports: [{ name: 'Zurich' } as IAirport],
                },
            ];

            expect(stores.searchStore.searchFrom.country).toStrictEqual([
                { name: '(France) Lyon' },
                { name: 'Zurich' },
            ]);
        });

        it('should return airports of countries with countryName when marketCode is not UK', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.marketStore, 'marketCode', 'get').mockReturnValue(MarketCode.CH);
            stores.searchStore.searchFrom.countries = [
                {
                    name: 'France',
                    itemName: 'France',
                    code: MarketCode.FR,
                    hasDepartureAirports: true,
                    airports: [{ name: 'Lyon' } as IAirport],
                },
                {
                    name: 'Switzerland',
                    itemName: 'Switzerland',
                    code: MarketCode.CH,
                    hasDepartureAirports: true,
                    airports: [{ name: 'Zurich' } as IAirport],
                },
            ];

            expect(stores.searchStore.searchFrom.country).toStrictEqual([
                { name: '(France) Lyon', countryName: 'France' },
                { name: 'Zurich', countryName: 'Switzerland' },
            ]);
        });

        it('should return empty array when there are no airports in countries', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.marketStore, 'marketCode', 'get').mockReturnValue(MarketCode.CH);
            stores.searchStore.searchFrom.countries = [
                {
                    name: 'France',
                    itemName: 'France',
                    code: MarketCode.FR,
                    hasDepartureAirports: true,
                } as IAirportCountry,
                {
                    name: 'Switzerland',
                    itemName: 'Switzerland',
                    code: MarketCode.CH,
                    hasDepartureAirports: true,
                    airports: [],
                },
            ];

            expect(stores.searchStore.searchFrom.country).toStrictEqual([]);
        });

        it('should return airports of countries without country name when marketCode is equal UK', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.marketStore, 'marketCode', 'get').mockReturnValue(MarketCode.UK);
            stores.searchStore.searchFrom.countries = [
                {
                    name: 'United Kingdom',
                    code: MarketCode.UK,
                    hasDepartureAirports: true,
                    airports: [{ name: 'London' } as IAirport],
                },
            ];

            expect(stores.searchStore.searchFrom.country).toStrictEqual([{ name: 'London' }]);
        });
    });

    describe('airports', () => {
        it('should return Map of airports', () => {
            const stores = createHolidaysAppStores();

            const airports = [{ code: 'code-1' }, { code: 'code-2' }] as IAirport[];
            const map: Map<string, IAirport> = new Map(
                airports.reduce((acc: Array<[string, IAirport]>, next: IAirport) => {
                    acc.push([next.code, next]);

                    return acc;
                }, []),
            );

            stores.searchStore.searchFrom.countries = [{ name: 'UK', code: '', hasDepartureAirports: true, airports }];

            expect(stores.searchStore.searchFrom.airports).toStrictEqual(map);
        });

        it('should return empty Map when there is no countries', () => {
            const stores = createHolidaysAppStores();

            expect(stores.searchStore.searchFrom.airports).toStrictEqual(new Map());
        });
    });

    describe('isFromParamsValid', () => {
        it('should return false when origins are undefined', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.origins = undefined;

            expect(stores.searchStore.searchFrom.isFromParamsValid).toBe(false);
        });

        it('should return true when there are origins', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.origins = ['test-code'];

            expect(stores.searchStore.searchFrom.isFromParamsValid).toBe(true);
        });

        it('should return false when there are no origins', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.origins = [];

            expect(stores.searchStore.searchFrom.isFromParamsValid).toBe(false);
        });
    });

    describe('availableOrigins', () => {
        it('should return Set of available origins when there is availableOriginsCodes', () => {
            const stores = createHolidaysAppStores();

            const codes = ['code-1', 'code-2'];

            stores.searchStore.searchFrom.availableOriginsCodes = codes;

            expect(stores.searchStore.searchFrom.availableOrigins).toStrictEqual(new Set(codes));
        });

        it('should return an empty Set when availableOriginsCodes is empty', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.availableOriginsCodes = [];

            expect(stores.searchStore.searchFrom.availableOrigins).toStrictEqual(new Set());
        });
    });

    describe('selectedOrigins', () => {
        it('should return Set of selected origins when there is origins', () => {
            const stores = createHolidaysAppStores();

            const codes = ['code-1', 'code-2'];

            jest.spyOn(stores.searchStore.searchFrom, 'origins', 'get').mockReturnValue(codes);

            expect(stores.searchStore.searchFrom.selectedOrigins).toStrictEqual(new Set(codes));
        });

        it('should return an empty Set when origins is empty', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.searchStore.searchFrom, 'origins', 'get').mockReturnValue([]);

            expect(stores.searchStore.searchFrom.selectedOrigins).toStrictEqual(new Set());
        });
    });

    describe('displayValue', () => {
        it('should return originsDisplayValue', () => {
            const stores = createHolidaysAppStores();

            const displayValue = {
                main: 'display-value',
            };

            stores.searchStore.searchFrom.originsDisplayValue = displayValue;

            expect(stores.searchStore.searchFrom.displayValue).toStrictEqual(displayValue);
        });
    });

    describe('fullDisplayValue', () => {
        it('should return only main value when add is not present', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.originsDisplayValue = {
                main: 'London Gatwick',
            };

            expect(stores.searchStore.searchFrom.fullDisplayValue).toBe('London Gatwick');
        });

        it('should return main and add values concatenated when add is present', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.originsDisplayValue = {
                main: 'London Gatwick',
                add: '+2',
            };

            expect(stores.searchStore.searchFrom.fullDisplayValue).toBe('London Gatwick +2');
        });

        it('should return only main value when add is empty string', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.originsDisplayValue = {
                main: 'London Gatwick',
                add: '',
            };

            expect(stores.searchStore.searchFrom.fullDisplayValue).toBe('London Gatwick');
        });

        it('should return empty string when main is empty and add is not present', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.originsDisplayValue = {
                main: '',
            };

            expect(stores.searchStore.searchFrom.fullDisplayValue).toBe('');
        });
    });

    describe('setNormalOrigins', () => {
        it('should set data', () => {
            const stores = createHolidaysAppStores();
            const codes = ['code-1', 'code-2'];

            stores.searchStore.searchFrom.setNormalOrigins(codes);

            expect(stores.searchStore.searchFrom.origins).toStrictEqual(codes);
        });
    });

    describe('setCountries', () => {
        it('should set countries', () => {
            const stores = createHolidaysAppStores();
            const countries = [{} as IAirportCountry];

            stores.searchStore.searchFrom.setCountries(countries);

            expect(stores.searchStore.searchFrom.countries).toStrictEqual(countries);
        });
    });

    describe('isDisabledItem', () => {
        it('should return false when availableOriginsCodes is null', () => {
            const stores = createHolidaysAppStores();

            expect(stores.searchStore.searchFrom.isDisabledItem({} as IAirport)).toBe(false);
        });

        it('should return true when availableOrigins has NOT any of item.airports', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.availableOriginsCodes = [];

            expect(
                stores.searchStore.searchFrom.isDisabledItem({
                    airports: [{ code: 'code-1' } as IAirport],
                } as IAirport),
            ).toBe(true);
        });

        it('should return false when availableOrigins has any of item.airports', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.availableOriginsCodes = [];
            jest.spyOn(stores.searchStore.searchFrom, 'availableOrigins', 'get').mockReturnValue(new Set(['code-1']));

            expect(
                stores.searchStore.searchFrom.isDisabledItem({
                    airports: [{ code: 'code-1' } as IAirport],
                } as IAirport),
            ).toBe(false);
        });

        it('should return true when availableOrigins has NOT code', () => {
            const stores = createHolidaysAppStores();

            expect(stores.searchStore.searchFrom.isDisabledItem({ code: 'code-1' } as IAirport)).toBe(false);
        });

        it('should return false when availableOrigins has code', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.searchStore.searchFrom, 'availableOrigins', 'get').mockReturnValue(new Set(['code-1']));

            expect(stores.searchStore.searchFrom.isDisabledItem({ code: 'code-1' } as IAirport)).toBe(false);
        });
    });

    describe('isCheckedItem', () => {
        it('should return false when item is disabled', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.searchStore.searchFrom, 'isDisabledItem').mockImplementation(() => true);

            expect(stores.searchStore.searchFrom.isCheckedItem({ code: 'code-1' } as IAirport)).toBe(false);
        });

        it('should return false when some of item.airports is NOT selected', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.searchStore.searchFrom, 'isDisabledItem').mockImplementation(() => false);
            jest.spyOn(stores.searchStore.searchFrom, 'selectedOrigins', 'get').mockReturnValue(new Set(['code-1']));

            expect(
                stores.searchStore.searchFrom.isCheckedItem({
                    airports: [{ code: 'code-1' } as IAirport, { code: 'code-2' } as IAirport],
                } as IAirport),
            ).toBe(false);
        });

        it('should return true when all item.airports is selected', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.searchStore.searchFrom, 'isDisabledItem').mockImplementation(() => false);
            jest.spyOn(stores.searchStore.searchFrom, 'selectedOrigins', 'get').mockReturnValue(new Set(['code-1']));

            expect(
                stores.searchStore.searchFrom.isCheckedItem({ airports: [{ code: 'code-1' } as IAirport] } as IAirport),
            ).toBe(true);
        });

        it('should return true when item is selected', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.searchStore.searchFrom, 'isDisabledItem').mockImplementation(() => false);
            jest.spyOn(stores.searchStore.searchFrom, 'selectedOrigins', 'get').mockReturnValue(new Set(['code-1']));

            expect(stores.searchStore.searchFrom.isCheckedItem({ code: 'code-1' } as IAirport)).toBe(true);
        });
    });

    describe('setOrigins', () => {
        it('should follow default behavior', () => {
            const stores = createHolidaysAppStores();
            const codes = ['code-1', 'code-2'];
            stores.searchStore.originsUpdated = jest.fn();

            stores.searchStore.searchFrom.setOrigins(codes);

            expect(stores.searchStore.searchFrom.origins).toStrictEqual(codes);
            expect(stores.searchStore.originsUpdated).toHaveBeenCalled();
        });

        it('should call clearErrorMessage when hasErrorInField returns true', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.hasErrorInField = jest.fn().mockReturnValue(true);
            stores.searchStore.clearErrorMessage = jest.fn();
            stores.searchStore.originsUpdated = jest.fn();

            stores.searchStore.searchFrom.setOrigins([]);

            expect(stores.searchStore.clearErrorMessage).toHaveBeenCalled();
        });

        it('should NOT call clearErrorMessage when hasErrorInField returns false', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.hasErrorInField = jest.fn().mockReturnValue(false);
            stores.searchStore.clearErrorMessage = jest.fn();
            stores.searchStore.originsUpdated = jest.fn();

            stores.searchStore.searchFrom.setOrigins([]);

            expect(stores.searchStore.clearErrorMessage).not.toHaveBeenCalled();
        });
    });

    describe('onAddOrigin', () => {
        it('should follow default behavior', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.searchFrom.origins = ['code-1'];
            stores.searchStore.originsUpdated = jest.fn();

            stores.searchStore.searchFrom.onAddOrigin('code-2');

            expect(stores.searchStore.searchFrom.origins).toStrictEqual(['code-1', 'code-2']);
            expect(stores.searchStore.originsUpdated).toHaveBeenCalled();
        });

        it('should call clearErrorMessage when hasErrorInField returns true', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.hasErrorInField = jest.fn().mockReturnValue(true);
            stores.searchStore.clearErrorMessage = jest.fn();
            stores.searchStore.originsUpdated = jest.fn();

            stores.searchStore.searchFrom.onAddOrigin('code-2');

            expect(stores.searchStore.clearErrorMessage).toHaveBeenCalled();
        });

        it('should NOT call clearErrorMessage when hasErrorInField returns false', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.originsUpdated = jest.fn();
            stores.searchStore.hasErrorInField = jest.fn().mockReturnValue(false);
            stores.searchStore.clearErrorMessage = jest.fn();

            stores.searchStore.searchFrom.onAddOrigin('code-2');

            expect(stores.searchStore.clearErrorMessage).not.toHaveBeenCalled();
        });
    });

    describe('onRemoveOrigin', () => {
        it('should follow default behavior', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.searchFrom.origins = ['code-1', 'code-2'];
            stores.searchStore.originsUpdated = jest.fn();
            stores.searchStore.searchFrom.onRemoveOrigin('code-2');

            expect(stores.searchStore.searchFrom.origins).toStrictEqual(['code-1']);
            expect(stores.searchStore.originsUpdated).toBeCalled();
        });

        it('should call clearOriginFromGeo when code equals originFromGeo', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.originsUpdated = jest.fn();
            stores.searchStore.searchFrom.originFromGeo = 'code-1';
            stores.searchStore.searchFrom.clearOriginFromGeo = jest.fn();
            stores.searchStore.searchFrom.origins = ['code-1', 'code-2'];

            stores.searchStore.searchFrom.onRemoveOrigin('code-1');

            expect(stores.searchStore.searchFrom.clearOriginFromGeo).toBeCalled();
        });
    });

    describe('onClearOrigins', () => {
        it('should clear origins', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.searchFrom.origins = ['code-1', 'code-2'];
            stores.searchStore.originsUpdated = jest.fn();
            stores.searchStore.searchFrom.onClearOrigins();

            expect(stores.searchStore.searchFrom.origins).toStrictEqual([]);
            expect(stores.searchStore.originsUpdated).toBeCalled();
        });

        it('should NOT call originsUpdated when noUpdate argument is true', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.searchFrom.origins = ['code-1', 'code-2'];
            stores.searchStore.originsUpdated = jest.fn();
            stores.searchStore.searchFrom.onClearOrigins(true);

            expect(stores.searchStore.searchFrom.origins).toStrictEqual([]);
            expect(stores.searchStore.originsUpdated).toBeCalledTimes(0);
        });
    });

    describe('clearOriginFromGeo', () => {
        it('should clear originFromGeo', () => {
            const stores = createHolidaysAppStores();
            stores.searchStore.searchFrom.originFromGeo = 'code-1';

            stores.searchStore.searchFrom.clearOriginFromGeo();

            expect(stores.searchStore.searchFrom.originFromGeo).toBe(null);
        });
    });

    describe('onAddOriginFromGeo', () => {
        it('should add origin', () => {
            const stores = createHolidaysAppStores();
            const item = { code: 'code-1' } as IAirport;
            stores.searchStore.searchFrom.onAddOrigin = jest.fn();

            stores.searchStore.searchFrom.onAddOriginFromGeo(item);

            expect(stores.searchStore.searchFrom.onAddOrigin).toBeCalled();
        });
    });

    describe('setAvailableOrigins', () => {
        it('should call updateOriginsDisplayValue when value argument is null', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.setAvailableOrigins(null);

            expect(stores.searchStore.searchFrom.availableOriginsCodes).toStrictEqual(null);
        });

        it('should NOT call updateOriginsDisplayValue when value argument is null', () => {
            const stores = createHolidaysAppStores();
            const value = ['code-1', 'code-2'];

            stores.searchStore.searchFrom.setAvailableOrigins(value);

            expect(stores.searchStore.searchFrom.availableOriginsCodes).toStrictEqual(value);
        });
    });

    describe('setAllAvailableOrigins', () => {
        it('should call setOrigins', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.setOrigins = jest.fn();

            jest.spyOn(stores.searchStore.searchFrom, 'availableOriginsCodes', 'get').mockReturnValue([
                'code-1',
                'code-2',
                'code-3',
            ]);

            stores.searchStore.searchFrom.setAllAvailableOrigins();

            waitFor(() => expect(stores.searchStore.searchFrom.setOrigins).toBeCalledWith(['code-1', 'code-2']));
        });

        it('should NOT call setOrigins when availableOriginsCodes is null', () => {
            const stores = createHolidaysAppStores();

            stores.searchStore.searchFrom.setOrigins = jest.fn();

            stores.searchStore.searchFrom.setAllAvailableOrigins();

            expect(stores.searchStore.searchFrom.setOrigins).toBeCalledTimes(0);
        });
    });

    describe('updateAvailableOrigins', () => {
        it('should update available origins based on destinations', async () => {
            const stores = createHolidaysAppStores();

            const result = ['code-1', 'code-2', 'code-3'];
            const origins = ['code-3', 'code-4'];

            const getAvailableOriginsCodesSpy = jest
                .spyOn(stores.searchStore, 'getAvailableOriginsCodes')
                .mockResolvedValue(result);

            stores.searchStore.searchFrom.origins = origins;
            stores.searchStore.searchFrom.clearOriginFromGeo = jest.fn();
            stores.searchStore.searchFrom.updateOriginsDisplayValue = jest.fn();
            stores.searchStore.searchFrom.originFromGeo = 'geo-code';

            await stores.searchStore.searchFrom.updateAvailableOrigins();

            expect(getAvailableOriginsCodesSpy).toHaveBeenCalledTimes(1);
            expect(stores.searchStore.searchFrom.availableOriginsCodes).toStrictEqual(result);
            expect(stores.searchStore.searchFrom.clearOriginFromGeo).toHaveBeenCalledTimes(1);
            expect(stores.searchStore.searchFrom.updateOriginsDisplayValue).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateOriginsDisplayValue', () => {
        it('should set value to originsDisplayValue', () => {
            const stores = createHolidaysAppStores();

            jest.spyOn(stores.layoutStore, 'isDestinationPage', 'get').mockReturnValue(true);
            stores.searchStore.searchFrom.availableOriginsCodes = ['code-1', 'code-2', 'code-3'];

            jest.spyOn(stores.layoutStore, 'isDestinationPage', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchFrom, 'airports', 'get').mockReturnValue(
                new Map([
                    ['code-1', {} as IAirport],
                    ['code-2', {} as IAirport],
                ]),
            );

            const createOriDisplayValueByCodes = jest
                .spyOn(searchUtils, 'createOriDisplayValueByCodes')
                .mockImplementation(jest.fn());

            stores.searchStore.searchFrom.origins = ['code-1', 'code-2', 'code-3'];
            stores.searchStore.originsWithNames = [{} as IDestinationCountry];

            stores.searchStore.searchFrom.updateOriginsDisplayValue();

            expect(createOriDisplayValueByCodes).toHaveBeenCalledWith(
                stores.searchStore.searchFrom.origins,
                stores.searchStore.originsWithNames,
                ['code-1', 'code-2'],
                stores.layoutStore.getPhrase,
                stores.layoutStore.isDestinationPage,
                MarketCode.UK,
            );
        });
    });

    describe('selectedAvailableOrigins', () => {
        const stores = createHolidaysAppStores();

        beforeEach(() => {
            stores.searchStore.searchFrom.origins = ['MAA'];
            stores.searchStore.searchFrom.availableOriginsCodes = ['MAA'];
        });

        it('should return selected origin when availableOriginsCodes includes selected origin code', () => {
            expect(stores.searchStore.searchFrom.selectedAvailableOrigins).toStrictEqual(['MAA']);
        });

        it('should return an empty array when availableOriginsCodes NOT includes selected origin code', () => {
            stores.searchStore.searchFrom.availableOriginsCodes = ['LMA'];

            expect(stores.searchStore.searchFrom.selectedAvailableOrigins).toStrictEqual([]);
        });

        it('should return an empty array when origins is undefined', () => {
            stores.searchStore.searchFrom.origins = undefined;

            expect(stores.searchStore.searchFrom.selectedAvailableOrigins).toStrictEqual([]);
        });
    });
});
