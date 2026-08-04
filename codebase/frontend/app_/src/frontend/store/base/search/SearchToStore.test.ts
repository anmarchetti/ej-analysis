import offersService from 'frontend/services/offers.service';
import { createHolidaysAppStores, IHolidaysStores } from 'frontend/store/holidays/create-stores';
import * as destinationUtils from 'frontend/utils/destinations.utils';
import * as offerUtils from 'frontend/utils/offer.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { ITypeAheadResponse } from 'models/data/ITypeAheadResponse';
import { DestinationType } from 'models/enum/DestinationType';
import { GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ISearchToInitialState } from './SearchToStore';

let stores: IHolidaysStores;

jest.mock('frontend/services/offers.service');

describe('SearchToStore', () => {
    beforeEach(() => {
        stores = createHolidaysAppStores();
    });

    describe('addDestination', () => {
        const regularDestination = {
            code: 'ES',
            name: 'Spain',
            type: DestinationType.Country,
        } as IDestination;

        const singleSelectableDestination = {
            code: 'MA',
            name: 'Marocco',
            type: DestinationType.VirtualResort,
        } as IDestination;

        const hotelDestination = {
            code: 'HOTEL-2',
            name: 'Hotel 2',
            type: DestinationType.Hotel,
            giataCode: 'G-1',
        } as IDestination;

        beforeEach(() => {
            stores.searchStore.searchTo.selectedDestinations = [];
            stores.searchStore.searchTo.clearDestinations = jest.fn();
            stores.searchStore.searchTo.setSelectedDestinations = jest.fn();
            stores.searchStore.searchTo.selectSingleDestination = jest.fn();
            stores.searchStore.searchTo.updateDestinationCodes = jest.fn();
            stores.searchStore.isSingleSelectableDestination = false;
        });

        it('should clear destinations and reset single selectable flag when single selectable destination was previously chosen', () => {
            stores.searchStore.isSingleSelectableDestination = true;

            stores.searchStore.searchTo.addDestination(regularDestination);

            expect(stores.searchStore.searchTo.clearDestinations).toHaveBeenCalledWith({ noUpdate: false });
            expect(stores.searchStore.isSingleSelectableDestination).toBe(false);
            expect(stores.searchStore.searchTo.selectedDestinations).toContain(regularDestination);
            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalled();
        });

        it('should do nothing when destination is already selected', () => {
            stores.searchStore.searchTo.selectedDestinations = [regularDestination];

            stores.searchStore.searchTo.addDestination(regularDestination);

            expect(stores.searchStore.searchTo.selectSingleDestination).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateDestinationCodes).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.selectedDestinations).toHaveLength(1);
        });

        it('should keep only destinations with the same giataCode when isAddHotelWithGiataCode is true', () => {
            const sameGiata = {
                code: 'HOTEL-1',
                name: 'Hotel 1',
                type: DestinationType.Hotel,
                giataCode: hotelDestination.giataCode,
            } as IDestination;

            const differentGiata = {
                code: 'HOTEL-3',
                name: 'Hotel 3',
                type: DestinationType.Hotel,
                giataCode: `${hotelDestination.giataCode}-DIFF`,
            } as IDestination;

            stores.searchStore.searchTo.selectedDestinations = [sameGiata, differentGiata];

            stores.searchStore.searchTo.addDestination(hotelDestination, false, true);

            expect(stores.searchStore.searchTo.setSelectedDestinations).toHaveBeenCalledWith([sameGiata]);
            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalled();
        });

        it('should call selectSingleDestination for single selectable destination types', () => {
            stores.searchStore.searchTo.addDestination(singleSelectableDestination);

            expect(stores.searchStore.searchTo.selectSingleDestination).toHaveBeenCalledWith(
                singleSelectableDestination,
            );
            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalled();
        });

        it('should push to selectedDestinations selectSingleDestination which is has virtual country', () => {
            singleSelectableDestination.type = DestinationType.Resort;
            singleSelectableDestination.parents = [
                { ...singleSelectableDestination, type: DestinationType.VirtualCountry },
            ];
            stores.searchStore.searchTo.addDestination(singleSelectableDestination);

            expect(stores.searchStore.searchTo.selectSingleDestination).not.toHaveBeenCalledWith();
            expect(stores.searchStore.searchTo.selectedDestinations).toStrictEqual([singleSelectableDestination]);
        });

        it('should push destination to selectedDestinations for non single selectable destination types', () => {
            stores.searchStore.searchTo.addDestination(regularDestination);

            expect(stores.searchStore.searchTo.selectedDestinations).toContain(regularDestination);
            expect(stores.searchStore.searchTo.selectSingleDestination).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalled();
        });

        it('should not call updateDestinationCodes when noUpdate is true', () => {
            stores.searchStore.searchTo.addDestination(regularDestination, true);

            expect(stores.searchStore.searchTo.selectedDestinations).toContain(regularDestination);
            expect(stores.searchStore.searchTo.updateDestinationCodes).not.toHaveBeenCalled();
        });

        it('should pass noUpdate=true to clearDestinations when resetting single selectable destination', () => {
            stores.searchStore.searchTo.clearDestinations = jest.fn();
            stores.searchStore.isSingleSelectableDestination = true;

            stores.searchStore.searchTo.addDestination(regularDestination, true);

            expect(stores.searchStore.searchTo.clearDestinations).toHaveBeenCalledWith({ noUpdate: true });
        });

        it('should push Hotel destination to selectedDestinations and NOT call selectSingleDestination', () => {
            stores.searchStore.searchTo.addDestination(hotelDestination);

            expect(stores.searchStore.searchTo.selectedDestinations).toContain(hotelDestination);
            expect(stores.searchStore.searchTo.selectSingleDestination).not.toHaveBeenCalled();
        });
    });

    describe('serialize', () => {
        it('should return initial state object', () => {
            stores.searchStore.searchTo.selectedDestinationCodes = ['selectedDestinationCodes'];
            stores.searchStore.searchTo.selectedDestinationCodesQuery = 'selectedDestinationCodesQuery';
            stores.searchStore.searchTo.selectedDestinations = ['selectedDestinations'] as any;
            stores.searchStore.searchTo.selectedAccommodationCodes = 'selectedAccommodationCodes';
            const mockParentDestination = 'parentDestination';
            const spyGetParentDestination = jest
                .spyOn(offerUtils, 'getParentDestination')
                .mockReturnValue(mockParentDestination);

            const res = stores.searchStore.searchTo.serialize();

            expect(spyGetParentDestination).toHaveBeenCalledWith(
                stores.searchStore.searchTo.selectedDestinationCodesQuery,
            );
            expect(res).toEqual({
                selectedDestinationCodes: ['SELECTEDDESTINATIONCODES'],
                selectedParentDestinationCodesQuery: mockParentDestination,
                selectedDestinationCodesQuery: stores.searchStore.searchTo.selectedDestinationCodesQuery,
                selectedDestinations: stores.searchStore.searchTo.selectedDestinations,
                selectedAccommodationCodes: stores.searchStore.searchTo.selectedAccommodationCodes,
            });
        });
    });

    describe('deserialize', () => {
        beforeEach(() => {
            stores.searchStore.searchTo.setSelectedParentDestinationCodesQuery = jest.fn();
            stores.searchStore.searchTo.setSelectedDestinationCodes = jest.fn();
            stores.searchStore.searchTo.setSelectedDestinationCodesQuery = jest.fn();
            stores.searchStore.searchTo.setSelectedAccommodationCodes = jest.fn();
            stores.searchStore.searchTo.setSelectedDestinations = jest.fn();
        });

        it('should do nothing when no initialState', () => {
            stores.searchStore.searchTo.deserialize();

            expect(stores.searchStore.searchTo.setSelectedParentDestinationCodesQuery).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.setSelectedDestinationCodesQuery).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.setSelectedAccommodationCodes).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.setSelectedDestinations).not.toHaveBeenCalled();
        });

        it('should initialize store using initial state', () => {
            const initialState: ISearchToInitialState = {
                selectedAccommodationCodes: 'selectedAccommodationCodes',
                selectedDestinationCodes: ['dstCode'],
                selectedDestinationCodesQuery: 'selectedDestinationCodesQuery',
                selectedDestinations: [{ code: 'code', name: 'name' }],
                selectedParentDestinationCodesQuery: 'selectedParentDestinationCodesQuery',
            };
            const mockParentDestination = 'parentDestination';
            const spyGetParentDestination = jest
                .spyOn(offerUtils, 'getParentDestination')
                .mockReturnValue(mockParentDestination);

            stores.searchStore.searchTo.deserialize(initialState);

            expect(spyGetParentDestination).toHaveBeenCalledWith(initialState.selectedDestinationCodesQuery);
            expect(stores.searchStore.searchTo.setSelectedParentDestinationCodesQuery).toHaveBeenCalledWith(
                mockParentDestination,
            );
            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith(['DSTCODE']);
            expect(stores.searchStore.searchTo.setSelectedDestinationCodesQuery).toHaveBeenCalledWith(
                initialState.selectedDestinationCodesQuery,
            );
            expect(stores.searchStore.searchTo.setSelectedAccommodationCodes).toHaveBeenCalledWith(
                initialState.selectedAccommodationCodes,
            );
            expect(stores.searchStore.searchTo.setSelectedDestinations).toHaveBeenCalledWith(
                initialState.selectedDestinations,
            );
        });

        it('should initialize with default values when initial state does not contain fields', () => {
            const mockParentDestination = 'parentDestination';
            const spyGetParentDestination = jest
                .spyOn(offerUtils, 'getParentDestination')
                .mockReturnValue(mockParentDestination);

            stores.searchStore.searchTo.deserialize({});

            expect(spyGetParentDestination).toHaveBeenCalledWith('');
            expect(stores.searchStore.searchTo.setSelectedParentDestinationCodesQuery).toHaveBeenCalledWith(
                mockParentDestination,
            );
            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith([]);
            expect(stores.searchStore.searchTo.setSelectedDestinationCodesQuery).toHaveBeenCalledWith('');
            expect(stores.searchStore.searchTo.setSelectedAccommodationCodes).toHaveBeenCalledWith('');
            expect(stores.searchStore.searchTo.setSelectedDestinations).toHaveBeenCalledWith([]);
        });
    });

    describe('isAnywhereSelected', () => {
        it('should be true when selectedDestinations/selectedDestinationCodes includes ALL', () => {
            stores.searchStore.searchTo.selectedDestinations = [{ code: GEOGRAPHY_ALL_CODE, name: 'all' }];

            expect(stores.searchStore.searchTo.isAnywhereSelected).toBe(true);

            stores.searchStore.searchTo.selectedDestinations = [];
            stores.searchStore.searchTo.selectedDestinationCodes = [GEOGRAPHY_ALL_CODE];

            expect(stores.searchStore.searchTo.isAnywhereSelected).toBe(true);
        });

        it('should be false when there is no ALL in selectedDestinations/selectedDestinationCodes', () => {
            stores.searchStore.searchTo.selectedDestinations = [];
            stores.searchStore.searchTo.selectedDestinationCodes = [];

            expect(stores.searchStore.searchTo.isAnywhereSelected).toBe(false);
        });
    });

    describe('setAvailableDestinationCodes', () => {
        it('should set availableDestinationCodes to null', () => {
            stores.searchStore.searchTo.availableDestinationsCodes = ['code'];
            stores.searchStore.searchTo.setAvailableDestinationCodes(null);

            expect(stores.searchStore.searchTo.availableDestinationsCodes).toBeNull();
        });

        it('should set availableDestinationCodes to an array', () => {
            stores.searchStore.searchTo.availableDestinationsCodes = null;
            stores.searchStore.searchTo.setAvailableDestinationCodes(['code']);

            expect(stores.searchStore.searchTo.availableDestinationsCodes).toStrictEqual(['code']);
        });
    });

    describe('updateAvailableDstCodes', () => {
        const mockAvailableDestinations = ['dst-1', 'dst-2', 'dst-3'];

        beforeEach(() => {
            stores.searchStore.searchTo.setAvailableDestinationCodes = jest.fn();
            stores.searchStore.searchTo.updateDestinationsDisplayValue = jest.fn();
            (offersService.getAvailableDestinations as jest.Mock).mockResolvedValue(mockAvailableDestinations);
        });

        afterAll(() => {
            (offersService.getAvailableDestinations as jest.Mock).mockReset();
        });

        it('should NOT call anything when onlyIfEmpty is true and availableDestinationsCodes exists', async () => {
            stores.searchStore.searchTo.availableDestinationsCodes = ['code-1', 'code-3'];

            await stores.searchStore.searchTo.updateAvailableDstCodes(true);

            expect(offersService.getAvailableDestinations).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.setAvailableDestinationCodes).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateDestinationsDisplayValue).not.toHaveBeenCalled();
        });

        it('should fetch and update destinations when onlyIfEmpty is false', async () => {
            stores.searchStore.searchTo.availableDestinationsCodes = null;
            stores.searchStore.searchFrom.origins = ['NYC'];
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWhen, 'whenParamsForRequest', 'get').mockReturnValue({
                fromParam: '2025-01-01',
                toParam: '2025-01-10',
                duration: 7,
                flexDays: 0,
            });

            await stores.searchStore.searchTo.updateAvailableDstCodes(false);

            expect(offersService.getAvailableDestinations).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.setAvailableDestinationCodes).toHaveBeenCalledWith(
                mockAvailableDestinations,
            );
            expect(stores.searchStore.searchTo.updateDestinationsDisplayValue).toHaveBeenCalled();
        });

        it('should set availableDestinationsCodes to null when error occurs', async () => {
            (offersService.getAvailableDestinations as jest.Mock).mockRejectedValue(new Error('network failed'));

            await stores.searchStore.searchTo.updateAvailableDstCodes();

            expect(stores.searchStore.searchTo.setAvailableDestinationCodes).toHaveBeenCalledWith(null);
        });
    });

    describe('availableDestinations', () => {
        it('should return Set of availableDestinationsCodes', () => {
            const codes = ['code-1', 'code-2'];

            stores.searchStore.searchTo.availableDestinationsCodes = codes;

            expect(stores.searchStore.searchTo.availableDestinations).toStrictEqual(new Set(codes));
        });
    });

    describe('selectedData', () => {
        it('should return Set of available selectedDestinationCodes', () => {
            const codes = ['code-1', 'code-2', 'code-3'];
            const availableCodes = ['code-1', 'code-3'];

            stores.searchStore.searchTo.selectedDestinationCodes = codes;
            stores.searchStore.searchTo.availableDestinationsCodes = ['code-1', 'code-3'];

            jest.spyOn(stores.searchStore.searchTo, 'availableDestinations', 'get').mockReturnValue(
                new Set(availableCodes),
            );

            expect(stores.searchStore.searchTo.selectedData).toStrictEqual(new Set(availableCodes));
        });

        it('should return Set of selectedDestinationCodes when availableDestinationsCodes are null', () => {
            const codes = ['code-1', 'code-2', 'code-3'];

            stores.searchStore.searchTo.selectedDestinationCodes = codes;
            stores.searchStore.searchTo.availableDestinationsCodes = null;

            expect(stores.searchStore.searchTo.selectedData).toStrictEqual(new Set(codes));
        });

        it('should return empty Set when availableDestinationsCodes are empty', () => {
            const codes = ['code-1', 'code-2', 'code-3'];

            stores.searchStore.searchTo.selectedDestinationCodes = codes;
            stores.searchStore.searchTo.availableDestinationsCodes = [];

            expect(stores.searchStore.searchTo.selectedData).toStrictEqual(new Set());
        });
    });

    describe('countries', () => {
        it('should return selected countries when selectedData has a country code', () => {
            stores.searchStore.searchTo.countriesWithRegions = [{ code: 'IT', name: 'Italy' }];

            jest.spyOn(stores.searchStore.searchTo, 'selectedData', 'get').mockReturnValue(new Set(['IT']));

            expect(stores.searchStore.searchTo.countries).toStrictEqual(
                new Map([['IT', { code: 'IT', name: 'Italy' }]]),
            );
        });

        it('should return selected countries when regions selected', () => {
            const country = {
                code: 'IT',
                name: 'Italy',
                children: [
                    { code: 'code-1', name: 'name-1' },
                    { code: 'code-2', name: 'name-2' },
                ],
            };
            const codes = ['code-1', 'code-2'];

            stores.searchStore.searchTo.countriesWithRegions = [country];

            jest.spyOn(stores.searchStore.searchTo, 'selectedData', 'get').mockReturnValue(new Set(codes));
            jest.spyOn(stores.searchStore.searchTo, 'availableDestinations', 'get').mockReturnValue(new Set(codes));

            expect(stores.searchStore.searchTo.countries).toStrictEqual(new Map([['IT', country]]));
        });

        it('should NOT return selected countries when region is deselected', () => {
            const country = {
                code: 'IT',
                name: 'Italy',
                children: [
                    { code: 'code-1', name: 'name-1' },
                    { code: 'code-2', name: 'name-2' },
                ],
            };
            const codes = ['code-1', 'code-2'];

            stores.searchStore.searchTo.countriesWithRegions = [country];

            jest.spyOn(stores.searchStore.searchTo, 'selectedData', 'get').mockReturnValue(new Set([codes[0]]));
            jest.spyOn(stores.searchStore.searchTo, 'availableDestinations', 'get').mockReturnValue(new Set(codes));

            expect(stores.searchStore.searchTo.countries).toStrictEqual(new Map());
        });
    });

    describe('displayValue', () => {
        it('should return empty value when selectedDestinations is empty', () => {
            stores.searchStore.searchTo.selectedDestinations = [];

            expect(stores.searchStore.searchTo.displayValue).toStrictEqual({ main: '' });
        });

        it('should return value when isAnywhereSelected is true', () => {
            const stores = createHolidaysAppStores();

            stores.layoutStore.getPhrase = jest.fn(p => p);
            stores.searchStore.searchTo.selectedDestinations = [{} as IDestination];
            jest.spyOn(stores.searchStore.searchTo, 'isAnywhereSelected', 'get').mockReturnValue(true);

            expect(stores.searchStore.searchTo.displayValue).toStrictEqual({
                main: SitecoreDictionary.SearchPodLabelsAnywhere,
            });
        });

        it('should return value when isAnywhereSelected is false and selectedDestinations is not empty', () => {
            const destinationsDisplayValue = { main: 'display-value' };

            stores.searchStore.searchTo.destinationsDisplayValue = destinationsDisplayValue;
            stores.searchStore.searchTo.selectedDestinations = [{} as IDestination];

            jest.spyOn(stores.searchStore.searchTo, 'isAnywhereSelected', 'get').mockReturnValue(false);

            expect(stores.searchStore.searchTo.displayValue).toStrictEqual(destinationsDisplayValue);
        });
    });

    describe('fullDisplayValue', () => {
        it('should return only main value when add is not present', () => {
            stores.searchStore.searchTo.destinationsDisplayValue = {
                main: 'Spain',
            };
            stores.searchStore.searchTo.selectedDestinations = [{} as IDestination];

            expect(stores.searchStore.searchTo.fullDisplayValue).toBe('Spain');
        });

        it('should return main and add values concatenated when add is present', () => {
            stores.searchStore.searchTo.destinationsDisplayValue = {
                main: 'Spain',
                add: '+2',
            };
            stores.searchStore.searchTo.selectedDestinations = [{} as IDestination];

            expect(stores.searchStore.searchTo.fullDisplayValue).toBe('Spain +2');
        });

        it('should return only main value when add is empty string', () => {
            stores.searchStore.searchTo.destinationsDisplayValue = {
                main: 'Spain',
                add: '',
            };
            stores.searchStore.searchTo.selectedDestinations = [{} as IDestination];

            expect(stores.searchStore.searchTo.fullDisplayValue).toBe('Spain');
        });

        it('should return empty string when selectedDestinations is empty', () => {
            stores.searchStore.searchTo.selectedDestinations = [];

            expect(stores.searchStore.searchTo.fullDisplayValue).toBe('');
        });

        it('should handle whitespace in main and add values', () => {
            stores.searchStore.searchTo.destinationsDisplayValue = {
                main: 'Greece',
                add: '+3 more',
            };
            stores.searchStore.searchTo.selectedDestinations = [{} as IDestination];

            expect(stores.searchStore.searchTo.fullDisplayValue).toBe('Greece +3 more');
        });
    });

    describe('setSelectedDestinations', () => {
        it('should set selectedDestinations', () => {
            const destinations: IDestination[] = [{} as IDestination];

            stores.searchStore.searchTo.setSelectedDestinations(destinations);

            expect(stores.searchStore.searchTo.selectedDestinations).toStrictEqual(destinations);
        });
    });

    describe('setSelectedDestinationCodes', () => {
        it('should set selectedDestinationCodes', () => {
            const codes = ['code-1', 'code-2'];

            stores.searchStore.searchTo.setSelectedDestinationCodes(codes);

            expect(stores.searchStore.searchTo.selectedDestinationCodes).toStrictEqual(codes);
        });
    });

    describe('searchTypeAheadDestinations', () => {
        it('should set null to typeAheadDestinations when hasEnoughSymbolsToSearch returns true', () => {
            const value = '';
            stores.searchStore.searchTo.typeAheadDestinations = {} as ITypeAheadResponse;

            stores.searchStore.searchTo.searchTypeAheadDestinations(value);

            expect(stores.searchStore.searchTo.typeAheadDestinations).toBeNull();
        });

        it('should NOT set null to typeAheadDestinations when hasEnoughSymbolsToSearch returns false', () => {
            const value = 'value';
            stores.searchStore.searchTo.typeAheadDestinations = {} as ITypeAheadResponse;

            stores.searchStore.searchTo.searchTypeAheadDestinations(value);

            expect(stores.searchStore.searchTo.typeAheadDestinations).not.toBeNull();
        });
    });

    describe('setAvailableDestinationCodes', () => {
        it('should set availableDestinationsCodes', () => {
            const codes = ['code-1', 'code-2'];

            stores.searchStore.searchTo.setAvailableDestinationCodes(codes);

            expect(stores.searchStore.searchTo.availableDestinationsCodes).toStrictEqual(codes);
        });
    });

    describe('setCountriesWithRegions', () => {
        it('should set countriesWithRegions', () => {
            const countries = [{} as IDestinationCountry];

            stores.searchStore.searchTo.setCountriesWithRegions(countries);

            expect(stores.searchStore.searchTo.countriesWithRegions).toStrictEqual(countries);
        });
    });

    describe('setSelectedDestinationCodesQuery', () => {
        it('should set countriesWithRegions', () => {
            const query = 'query';

            stores.searchStore.searchTo.setSelectedDestinationCodesQuery(query);

            expect(stores.searchStore.searchTo.selectedDestinationCodesQuery).toStrictEqual(query);
        });
    });

    describe('setSelectedParentDestinationCodesQuery', () => {
        it('should set selectedParentDestinationCodesQuery', () => {
            const query = 'query';
            stores.searchStore.searchTo.selectedParentDestinationCodesQuery = '';

            stores.searchStore.searchTo.setSelectedParentDestinationCodesQuery(query);

            expect(stores.searchStore.searchTo.selectedParentDestinationCodesQuery).toStrictEqual(query);
        });
    });

    describe('setSelectedAccommodationCodes', () => {
        it('should set selectedAccommodationCodes', () => {
            const code = 'TEST';
            stores.searchStore.searchTo.selectedAccommodationCodes = '';

            stores.searchStore.searchTo.setSelectedAccommodationCodes(code);

            expect(stores.searchStore.searchTo.selectedAccommodationCodes).toStrictEqual(code);
        });
    });

    describe('isDisabledItem', () => {
        it('should return true when isAnywhereSelected is true', () => {
            jest.spyOn(stores.searchStore.searchTo, 'isAnywhereSelected', 'get').mockReturnValue(true);

            expect(stores.searchStore.searchTo.isDisabledItem({} as IDestination)).toBe(true);
        });

        it('should return false when isAnywhereSelected is false and availableDestinationsCodes is null', () => {
            expect(stores.searchStore.searchTo.isDisabledItem({} as IDestination)).toBe(false);
        });

        it('should return true when availableDestinations has not code', () => {
            jest.spyOn(stores.searchStore.searchTo, 'availableDestinations', 'get').mockReturnValue(
                new Set(['code-1']),
            );
            stores.searchStore.searchTo.availableDestinationsCodes = [];

            expect(stores.searchStore.searchTo.isDisabledItem({ code: 'code-2' } as IDestination)).toBe(true);
        });
    });

    describe('isCheckedItem', () => {
        it('should return false when availableDestinationsCodes value is null', () => {
            jest.spyOn(stores.searchStore.searchTo, 'availableDestinationsCodes', 'get').mockReturnValue(null);

            expect(stores.searchStore.searchTo.isCheckedItem({} as IDestination)).toBe(false);
        });

        it('should return false when availableDestinationsCodes are empty array', () => {
            jest.spyOn(stores.searchStore.searchTo, 'availableDestinationsCodes', 'get').mockReturnValue([]);

            expect(stores.searchStore.searchTo.isCheckedItem({} as IDestination)).toBe(false);
        });

        it('should return true when countries have parent code', () => {
            jest.spyOn(stores.searchStore.searchTo, 'countries', 'get').mockReturnValue(
                new Map([['IT', { name: 'Italy', code: 'IT' }]]),
            );

            expect(
                stores.searchStore.searchTo.isCheckedItem({} as IDestination, { code: 'IT' } as IDestinationCountry),
            ).toBe(true);
        });

        it('should return true when item is country/virtual-country and countries its code', () => {
            jest.spyOn(stores.searchStore.searchTo, 'countries', 'get').mockReturnValue(
                new Map([['IT', { name: 'Italy', code: 'IT' }]]),
            );

            expect(
                stores.searchStore.searchTo.isCheckedItem({
                    type: DestinationType.Country,
                    code: 'IT',
                } as IDestination),
            ).toBe(true);
            expect(
                stores.searchStore.searchTo.isCheckedItem({
                    type: DestinationType.VirtualCountry,
                    code: 'IT',
                } as IDestination),
            ).toBe(true);
        });

        it('should return true when item is region/resort and selectedData has its code', () => {
            jest.spyOn(stores.searchStore.searchTo, 'selectedData', 'get').mockReturnValue(new Set(['region-1']));

            expect(
                stores.searchStore.searchTo.isCheckedItem({
                    type: DestinationType.Region,
                    code: 'region-1',
                } as IDestination),
            ).toBe(true);
            expect(
                stores.searchStore.searchTo.isCheckedItem({
                    type: DestinationType.Resort,
                    code: 'region-1',
                } as IDestination),
            ).toBe(true);
        });

        it('should return true when item is virtual-region and selectedData has its code', () => {
            jest.spyOn(stores.searchStore.searchTo, 'availableDestinations', 'get').mockReturnValue(
                new Set(['region-2', 'code-2']),
            );
            jest.spyOn(stores.searchStore.searchTo, 'countries', 'get').mockReturnValue(
                new Map([['region-1', { name: 'region-1', code: 'code-1' }]]),
            );
            jest.spyOn(stores.searchStore.searchTo, 'selectedData', 'get').mockReturnValue(
                new Set(['code-1', 'code-2']),
            );

            expect(
                stores.searchStore.searchTo.isCheckedItem({
                    type: DestinationType.VirtualRegion,
                    code: 'code-1',
                    relatedRegions: ['code-2'],
                } as IDestination),
            ).toBe(true);
        });

        it('should return false when item.type is NOT Country, VirtualCountry, Region, Resort or VirtualRegion', () => {
            jest.spyOn(stores.searchStore.searchTo, 'countries', 'get').mockReturnValue(
                new Map([['IT', { name: 'Italy', code: 'IT' }]]),
            );

            expect(
                stores.searchStore.searchTo.isCheckedItem({
                    type: DestinationType.Airport,
                    code: 'IT',
                } as IDestination),
            ).toBe(false);
        });
    });

    describe('selectedParentDestination ', () => {
        it('should call getCombinedDestinationCodes and other handlers', () => {
            stores.searchStore.searchTo.clearDestinations = jest.fn();
            stores.searchStore.searchTo.addDestination = jest.fn();
            stores.searchStore.searchTo.updateDestinationCodes = jest.fn();

            const parsedCodes = ['parent-code'];
            const spyGetCombinedDestinationCodes = jest
                .spyOn(destinationUtils, 'getCombinedDestinationCodes')
                .mockReturnValue(parsedCodes);
            jest.spyOn(destinationUtils, 'getIDestinationByCode').mockReturnValue({
                type: DestinationType.Country,
            } as IDestination);

            stores.searchStore.searchTo.selectedParentDestination([
                { type: DestinationType.Country } as IDestinationCountry,
            ]);

            expect(stores.searchStore.searchTo.clearDestinations).toHaveBeenCalledWith({ noUpdate: true });
            expect(spyGetCombinedDestinationCodes).toHaveBeenCalledWith('', '');
            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalled();
        });
    });

    describe('syncDestinationItems ', () => {
        beforeEach(() => {
            stores.searchStore.searchTo.selectedDestinations = [
                { code: 'TEST', name: 'testName' },
                { code: 'TEST2', name: 'test2Name' },
                { code: 'ITA', name: 'itaName' },
            ];
            stores.searchStore.searchTo.selectedDestinationCodes = ['SPA', 'TEST3', 'ITA'];
            stores.searchStore.searchTo.setSelectedDestinations = jest.fn();
            stores.searchStore.searchTo.setSelectedDestinationCodes = jest.fn();
            stores.searchStore.searchTo.updateDestinationsDisplayValue = jest.fn();
            stores.searchStore.loadPlacesTitlesByCodes = jest.fn().mockReturnValue([]);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should call setSelectedDestinations, setSelectedDestinationCodes and updateDestinationsDisplayValue when dsts2Add exists', () => {
            jest.spyOn(destinationUtils, 'getIDestinationByCode').mockReturnValue({
                code: '1',
                name: 'name1',
                type: DestinationType.VirtualResort,
            });

            stores.searchStore.searchTo.syncDestinationItems();

            expect(stores.searchStore.searchTo.setSelectedDestinations).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateDestinationsDisplayValue).toHaveBeenCalled();
            expect(stores.searchStore.isSingleSelectableDestination).toBe(true);
        });

        it('should NOT call setSelectedDestinations, setSelectedDestinationCodes and updateDestinationsDisplayValue when dsts2Add does NOT exist', () => {
            jest.spyOn(destinationUtils, 'getIDestinationByCode').mockReturnValue(undefined as any);
            jest.spyOn(stores.searchStore.searchTo, 'selectedDestinationCodes', 'get').mockReturnValue(['SPA', 'TEST']);
            stores.searchStore.searchTo.selectedDestinationCodes = [];

            stores.searchStore.searchTo.syncDestinationItems();

            expect(stores.searchStore.searchTo.setSelectedDestinations).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateDestinationsDisplayValue).not.toHaveBeenCalled();
        });

        it('should NOT call loadPlacesTitlesByCodes if selectedDestinations contains all codes from selectedDestinationCodes', () => {
            jest.spyOn(destinationUtils, 'getIDestinationByCode').mockReturnValue({ code: '1', name: 'name1' });
            jest.spyOn(stores.searchStore, 'loadPlacesTitlesByCodes').mockReturnValue(
                Promise.resolve(stores.searchStore.searchTo.selectedDestinations),
            );
            stores.searchStore.searchTo.syncDestinationItems();

            expect(stores.searchStore.loadPlacesTitlesByCodes).not.toHaveBeenCalled();
        });

        it('should call loadPlacesTitlesByCodes if selectedDestinations contains NOT all codes from selectedDestinationCodes', async () => {
            jest.spyOn(destinationUtils, 'getIDestinationByCode').mockReturnValue(undefined as unknown as IDestination);
            stores.searchStore.searchTo.selectedDestinations = [{ code: 'TEST', name: 'testName' }];
            jest.spyOn(stores.searchStore, 'loadPlacesTitlesByCodes').mockReturnValue(
                Promise.resolve(stores.searchStore.searchTo.selectedDestinations),
            );
            await stores.searchStore.searchTo.syncDestinationItems();

            expect(stores.searchStore.loadPlacesTitlesByCodes).toHaveBeenCalledWith(
                stores.searchStore.searchTo.selectedDestinationCodes,
                true,
            );
        });

        it('should NOT call loadPlacesTitlesByCodes if selectedDestinations contains NOT all codes, but these missed codes are only null value', async () => {
            jest.spyOn(destinationUtils, 'getIDestinationByCode').mockReturnValue(undefined as unknown as IDestination);
            stores.searchStore.searchTo.selectedDestinations = [{ code: 'TEST', name: 'testName' }];
            stores.searchStore.searchTo.selectedDestinationCodes = [null as unknown as string];
            jest.spyOn(stores.searchStore, 'loadPlacesTitlesByCodes').mockReturnValue(
                Promise.resolve(stores.searchStore.searchTo.selectedDestinations),
            );
            await stores.searchStore.searchTo.syncDestinationItems();

            expect(stores.searchStore.loadPlacesTitlesByCodes).not.toHaveBeenCalled();
        });
    });

    describe('prefillDestinations', () => {
        beforeEach(() => {
            const cyprus: IDestinationCountry = {
                code: 'CY',
                name: 'Cyprus',
                type: DestinationType.Country,
                children: [
                    { code: 'CYLN', name: 'Larnaca', type: DestinationType.Region },
                    { code: 'CYPF', name: 'Paphos', type: DestinationType.Region },
                ],
            };
            stores.searchStore.searchTo.countriesWithRegions = [cyprus];
            stores.searchStore.searchTo.clearDestinations = jest.fn();
            stores.searchStore.loadPlacesTitlesByCodes = jest.fn().mockReturnValue([]);
        });

        it('should call changeDestinations when anywhere is selected', () => {
            stores.searchStore.searchTo.changeDestinations = jest.fn();
            jest.spyOn(stores.searchStore, 'anywhereWord', 'get').mockReturnValue('anywhere');

            stores.searchStore.searchTo.prefillDestinations({ dest: 'ALL' } as IPrefilledSearchParams);

            expect(stores.searchStore.searchTo.clearDestinations).toHaveBeenCalledWith({ noUpdate: true });
            expect(stores.searchStore.searchTo.changeDestinations).toHaveBeenCalledWith([
                { code: 'ALL', name: 'anywhere' },
            ]);
        });

        it('should call loadPlacesTitlesByCodes if prefilledParams contains a valid non-null code', async () => {
            await stores.searchStore.searchTo.prefillDestinations({ dest: 'CY' } as IPrefilledSearchParams);

            expect(stores.searchStore.loadPlacesTitlesByCodes).toHaveBeenCalled();
        });

        it('should NOT call loadPlacesTitlesByCodes when prefilledParams contains invalid codes', async () => {
            await stores.searchStore.searchTo.prefillDestinations({ dest: '' } as IPrefilledSearchParams);

            expect(stores.searchStore.loadPlacesTitlesByCodes).not.toHaveBeenCalled();
        });
    });

    describe('updateDestinationCodes', () => {
        beforeEach(() => {
            stores.searchStore.searchWhen.updateAvailableDates = jest.fn();
        });

        it('should call manageVirtualRegions', () => {
            stores.searchStore.manageVirtualRegions = jest.fn();

            stores.searchStore.searchTo.updateDestinationCodes();

            expect(stores.searchStore.manageVirtualRegions).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.typeAheadDestinations).toBe(null);
        });

        it('should call clearErrorMessage when dstClone count is greater than 0 hasErrorInField returns true', async () => {
            stores.searchStore.searchTo.selectedDestinations = [{ code: GEOGRAPHY_ALL_CODE, name: 'all' }];
            stores.searchStore.hasErrorInField = jest.fn().mockReturnValue(true);
            stores.searchStore.clearErrorMessage = jest.fn();
            stores.searchStore.searchTo.updateDestinationsDisplayValue = jest.fn();

            await stores.searchStore.searchTo.updateDestinationCodes();

            expect(stores.searchStore.clearErrorMessage).toHaveBeenCalled();
        });

        describe('syncCountryAndRegionCodes', () => {
            const cyprus: IDestinationCountry = {
                code: 'CY',
                name: 'Cyprus',
                type: DestinationType.Country,
                children: [
                    { code: 'CYLN', name: 'Larnaca', type: DestinationType.Region },
                    { code: 'CYPF', name: 'Paphos', type: DestinationType.Region },
                ],
            };

            const greece: IDestinationCountry = {
                code: 'GR',
                name: 'Greece',
                type: DestinationType.Country,
                children: [{ code: 'GRLN', name: 'Athens', type: DestinationType.Region }],
            };

            it('should add all country regions to geog query when country is selected alongside a region from another country', async () => {
                stores.searchStore.manageVirtualRegions = jest.fn().mockReturnValue([]);
                stores.searchStore.getSelectedVirtualResortRelatedResorts = jest.fn().mockResolvedValue([]);
                stores.searchStore.searchWhen.resetDateAvailabilityInterval = jest.fn();
                stores.searchStore.searchTo.updateDestinationsDisplayValue = jest.fn();
                stores.searchStore.searchTo.countriesWithRegions = [cyprus, greece];
                stores.searchStore.searchTo.selectedDestinations = [
                    { code: 'CY', name: 'Cyprus', type: DestinationType.Country, parents: [] },
                    {
                        code: 'GRLN',
                        name: 'Athens',
                        type: DestinationType.Region,
                        parents: [{ code: 'GR', name: 'Greece', type: DestinationType.Country }],
                    },
                ];

                await stores.searchStore.searchTo.updateDestinationCodes(false, false);

                const query = stores.searchStore.searchTo.selectedDestinationCodesQuery;

                expect(query).toContain('CY');
                expect(query).toContain('GR');
                expect(query).toContain('CYLN');
                expect(query).toContain('CYPF');
                expect(query).toContain('GRLN');
            });
        });
    });

    describe('loadAllDestinations', () => {
        beforeEach(() => {
            stores.searchStore.searchTo.collectLoadedDestinationsTitles = jest.fn();
            stores.searchStore.searchTo.selectedParentDestination = jest.fn();
            stores.searchStore.searchTo.syncDestinationItems = jest.fn();
        });

        it('should call expected actions', async () => {
            const mockDestinationCountries = [
                { code: 'ES', name: 'Spain' },
                { code: 'IT', name: 'Italy' },
            ];
            stores.searchStore.searchTo.setCountriesWithRegions = jest.fn();
            stores.searchStore.searchTo.setAvailableDestinationCodes = jest.fn();
            offersService.getAllDestinations = jest.fn().mockResolvedValue({
                destinations: mockDestinationCountries,
            });
            stores.searchStore.searchTo.isLoadingDestinations = false;

            await stores.searchStore.searchTo.loadAllDestinations();

            expect(stores.searchStore.searchTo.setCountriesWithRegions).toHaveBeenCalledWith(mockDestinationCountries);
            expect(stores.searchStore.searchTo.collectLoadedDestinationsTitles).toHaveBeenCalledWith(
                stores.searchStore.searchTo.countriesWithRegions,
            );
            expect(stores.searchStore.searchTo.selectedParentDestination).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.syncDestinationItems).toHaveBeenCalled();
        });

        it('should call setCountriesWithRegions with an empty array when getAllDestinations returns undefined', async () => {
            offersService.getAllDestinations = jest.fn().mockResolvedValue(undefined);
            stores.searchStore.searchTo.setCountriesWithRegions = jest.fn();
            stores.searchStore.searchTo.isLoadingDestinations = false;

            await stores.searchStore.searchTo.loadAllDestinations();

            expect(stores.searchStore.searchTo.setCountriesWithRegions).toHaveBeenCalledWith([]);
        });

        it('should call setCountriesWithRegions with an empty array when catch exception', async () => {
            offersService.getAllDestinations = jest.fn().mockRejectedValue(new Error());
            stores.searchStore.searchTo.setCountriesWithRegions = jest.fn();
            stores.searchStore.searchTo.isLoadingDestinations = false;

            await stores.searchStore.searchTo.loadAllDestinations();

            expect(stores.searchStore.searchTo.setCountriesWithRegions).toHaveBeenCalledWith([]);
        });
    });

    describe('changeDestinations', () => {
        const destinations = [
            { code: 'ES', name: 'Spain' },
            { code: 'IT', name: 'Italy' },
        ];

        beforeEach(() => {
            stores.searchStore.searchTo.setSelectedDestinations = jest.fn();
            stores.searchStore.searchTo.updateDestinationCodes = jest.fn();
        });

        it('should set isSingleSelectableDestination to true when destination type is Hotel', () => {
            stores.searchStore.isSingleSelectableDestination = false;
            stores.searchStore.searchTo.changeDestinations([
                { ...destinations[0], type: DestinationType.Hotel },
                ...destinations,
            ]);

            expect(stores.searchStore.isSingleSelectableDestination).toBe(true);
        });

        it('should call setSelectedDestinations and updateDestinationCodes', () => {
            stores.searchStore.searchTo.changeDestinations(destinations);

            expect(stores.searchStore.searchTo.setSelectedDestinations).toHaveBeenCalledWith(destinations);
            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalledWith(true, true);
        });

        it('should pass update params to updateDestinationCodes', () => {
            stores.searchStore.searchTo.changeDestinations(destinations, false, false);

            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalledWith(false, false);
        });
    });

    describe('getAvailableDestinationsCodes', () => {
        let mockGetAvailableDestinations: jest.SpyInstance;

        beforeEach(() => {
            mockGetAvailableDestinations = jest.spyOn(offersService, 'getAvailableDestinations');
        });

        it('should not call getAvailableOrigins when no selected origins and when params', async () => {
            stores.searchStore.searchFrom.origins = [];
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(false);

            await (stores.searchStore.searchTo as any).getAvailableDestinationsCodes();

            expect(mockGetAvailableDestinations).not.toHaveBeenCalled();
        });

        it('should call getAvailableOrigins with params', async () => {
            stores.searchStore.searchFrom.origins = ['LLL'];
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWhen, 'whenParamsForRequest', 'get').mockReturnValue({
                fromParam: '2025-01-01',
                toParam: '2025-01-10',
                duration: 7,
                flexDays: 0,
            });

            await (stores.searchStore.searchTo as any).getAvailableDestinationsCodes();

            expect(mockGetAvailableDestinations).toHaveBeenCalledWith('LLL', '2025-01-01', '2025-01-10', 0, 7);
        });
    });

    describe('getTypeAheadDestinations', () => {
        it('should call getAvailableOrigins with params', async () => {
            const mockDestinationCountries = [
                { code: 'ES', name: 'Spain' },
                { code: 'IT', name: 'Italy' },
            ];
            const mockInputValue = 'mockInputValue';
            const mockSearchDestinations = jest.spyOn(offersService, 'searchDestinations').mockResolvedValue({
                destinations: mockDestinationCountries,
                page: 1,
                take: 10,
                total: 10,
            });
            stores.searchStore.searchFrom.origins = ['LLL'];
            jest.spyOn(stores.searchStore.searchWhen, 'whenParamsForRequest', 'get').mockReturnValue({
                fromParam: '2025-01-01',
                toParam: '2025-01-10',
                duration: 7,
                flexDays: 0,
            });

            await stores.searchStore.searchTo.getTypeAheadDestinations(mockInputValue);

            expect(mockSearchDestinations).toHaveBeenCalledWith(
                mockInputValue,
                'LLL',
                '2025-01-01',
                '2025-01-10',
                0,
                7,
                undefined,
            );
        });
    });

    describe('selectedFullyAvailableDestinations', () => {
        beforeEach(() => {
            stores.searchStore.searchTo.selectedDestinations = [
                { code: 'MAA', name: 'Mali', children: [{ code: 'LTW', name: 'Lati' }], relatedRegions: ['CRO'] },
            ];
            stores.searchStore.searchTo.availableDestinationsCodes = ['MAA', 'CIT', 'RGB'];
        });

        it('should return selected destination when availableDestinationsCodes includes selectedDestinations code', () => {
            expect(stores.searchStore.searchTo.selectedFullyAvailableDestinations).toStrictEqual([
                { code: 'MAA', name: 'Mali', children: [], relatedRegions: [] },
            ]);
        });

        it('should return an empty array when availableDestinationsCodes NOT includes selectedDestinations code', () => {
            stores.searchStore.searchTo.availableDestinationsCodes = ['LMA'];

            expect(stores.searchStore.searchTo.selectedFullyAvailableDestinations).toStrictEqual([]);
        });
    });

    describe('selectSingleDestination', () => {
        const mockDestination = {
            name: 'marocco',
            code: 'MA',
            type: DestinationType.VirtualResort,
        };

        it('should set isSingleSelectableDestination to true, call setSelectedDestinations and updateDestinationCodes', () => {
            stores.searchStore.searchTo.setSelectedDestinations = jest.fn();
            stores.searchStore.searchTo.updateDestinationCodes = jest.fn();

            stores.searchStore.searchTo.selectSingleDestination(mockDestination);

            expect(stores.searchStore.isSingleSelectableDestination).toBe(true);
            expect(stores.searchStore.searchTo.setSelectedDestinations).toHaveBeenCalledWith([mockDestination]);
            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalledWith(undefined, undefined);
        });
    });
});
