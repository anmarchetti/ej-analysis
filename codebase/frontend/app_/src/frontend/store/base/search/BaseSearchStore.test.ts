import { trackingApi } from '@sitecore-jss/sitecore-jss-nextjs';
import { waitFor } from '@testing-library/dom';
import { toJS } from 'mobx';

import { mockMonthsAvailability } from 'frontend/__mocks__/monthsAvailability';
import { mockedOffer } from 'frontend/__mocks__/offer';
import offersService from 'frontend/services/offers.service';
import { createHolidaysAppStores, IHolidaysStores } from 'frontend/store/holidays/create-stores';
import isBackend from 'frontend/utils/isBackend';
import AxiosRequest from 'frontend/utils/request';
import * as searchUtils from 'frontend/utils/search/search.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { ITypeAheadResponse } from 'models/data/ITypeAheadResponse';
import { MarketCode } from 'models/data/MarketSettings';
import { DestinationType } from 'models/enum/DestinationType';
import { GuestType } from 'models/enum/GuestType';
import { OffersAndPromotionsSettings } from 'models/enum/OffersAndPromotionsSettings';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { QueryParamName } from 'models/enum/QueryParamName';
import { DEPARTURE_ALL_CODE, GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { GuestInfo } from 'models/GuestInfo';
import { RoomAllocation } from 'models/RoomAllocation';
import { IAirportCountry } from 'models/sitecore/IAirportsData';

import { BaseSearchStore as AbstractBaseSearchStore, ISearchStoreInitialState } from './BaseSearchStore';
import { ISearchFromInitialState } from './SearchFromStore';
import { ISearchToInitialState } from './SearchToStore';
import { ISearchWhenInitialState } from './SearchWhenStore';
import { ISearchWhoInitialState } from './SearchWhoStore';

jest.mock('frontend/services/logging');
jest.mock('frontend/utils/isBackend');
jest.mock('frontend/utils/request');

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    trackingApi: { trackEvent: jest.fn() },
}));

Object.defineProperty(window, 'NO_ANALYTICS', {
    configurable: true,
});

Object.defineProperty(window, 'dataLayer', {
    configurable: true,
    value: [],
});

Object.defineProperty(global['navigator'], 'serviceWorker', {
    value: {
        addEventListener: jest.fn(),
        getRegistration: jest.fn(),
    },
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
        matches: false,
    })),
});

Object.defineProperty(global['screen'], 'orientation', {
    value: {
        addEventListener: jest.fn(),
    },
});

document.body.innerHTML =
    '<div>' +
    '  <input id="search-from" />' +
    '  <input id="search-to" />' +
    '  <input id="search-when" />' +
    '  <input id="search-who" />' +
    '</div>';

class BaseSearchStore extends AbstractBaseSearchStore {
    setCountriesWithRegions = jest.fn();
}

describe('BaseSearchStore', () => {
    let stores: IHolidaysStores;

    beforeEach(() => {
        stores = createHolidaysAppStores();
    });

    describe('getSelectedVirtualResortRelatedResorts', () => {
        const mockDestination = { code: 'MA', name: 'Marocco', type: DestinationType.Resort, relatedResorts: ['MAA'] };

        it('should return an empty array when selectedDestinations not contain a virtual resort', async () => {
            stores.searchStore.searchTo.selectedDestinations = [mockDestination];

            const result = await stores.searchStore.getSelectedVirtualResortRelatedResorts();

            expect(result).toStrictEqual([]);
        });

        it('should return the result of offersService.fetchDestinationsByCodes when selectedDestinations is contain a virtual resort', async () => {
            mockDestination.type = DestinationType.VirtualResort;
            stores.searchStore.searchTo.selectedDestinations = [mockDestination];
            offersService.fetchDestinationsByCodes = jest.fn().mockResolvedValue({});

            const result = await stores.searchStore.getSelectedVirtualResortRelatedResorts();

            expect(result).toStrictEqual({});
        });
    });

    describe('deserialize', () => {
        it('should do nothing when no initialState', () => {
            stores.searchStore.deserialize();

            expect(stores.searchStore.take).toBeUndefined();
            expect(stores.searchStore.page).toBeUndefined();
            expect(stores.searchStore.orderBy).toBeUndefined();
            expect(stores.searchStore.orderDirection).toBeUndefined();
            expect(stores.searchStore.sortConfig).toEqual([]);
        });

        it('should initialize store using initial state', () => {
            stores.searchStore.searchWhen.deserialize = jest.fn();
            stores.searchStore.searchTo.deserialize = jest.fn();
            stores.searchStore.searchFrom.deserialize = jest.fn();
            stores.searchStore.searchWho.deserialize = jest.fn();

            const initialState: ISearchStoreInitialState = {
                searchFrom: {} as ISearchFromInitialState,
                searchTo: {} as ISearchToInitialState,
                searchWhen: {} as ISearchWhenInitialState,
                searchWho: {} as ISearchWhoInitialState,
                orderBy: OrderBy.DiscPercent,
                orderDirection: OrderDirection.Desc,
                page: 4,
                sortConfig: [
                    {
                        title: 'Rec',
                        code: 'RMD',
                        orderBy: OrderBy.Recommended,
                        orderDirection: OrderDirection.Default,
                    },
                ],
                take: 10,
            };

            stores.searchStore.deserialize(initialState);

            expect(stores.searchStore.searchWhen.deserialize).toHaveBeenCalledWith(initialState.searchWhen);
            expect(stores.searchStore.searchTo.deserialize).toHaveBeenCalledWith(initialState.searchTo);
            expect(stores.searchStore.searchFrom.deserialize).toHaveBeenCalledWith(initialState.searchFrom);
            expect(stores.searchStore.searchWho.deserialize).toHaveBeenCalledWith(initialState.searchWho);
            expect(stores.searchStore.orderBy).toBe(initialState.orderBy);
            expect(stores.searchStore.orderDirection).toBe(initialState.orderDirection);
            expect(stores.searchStore.page).toBe(initialState.page);
            expect(stores.searchStore.sortConfig).toEqual(initialState.sortConfig);
            expect(stores.searchStore.take).toBe(initialState.take);
        });

        it('should NOT call searchFrom deserialize when searchFrom is not defined in initialState', () => {
            stores.searchStore.searchFrom.deserialize = jest.fn();
            stores.searchStore.deserialize({} as ISearchStoreInitialState);

            expect(stores.searchStore.searchFrom.deserialize).not.toHaveBeenCalled();
        });

        it('should NOT call searchWhen deserialize when searchFrom is not defined in initialState', () => {
            stores.searchStore.searchWhen.deserialize = jest.fn();
            stores.searchStore.deserialize({} as ISearchStoreInitialState);

            expect(stores.searchStore.searchWhen.deserialize).not.toHaveBeenCalled();
        });

        it('should NOT call searchTo deserialize when searchFrom is not defined in initialState', () => {
            stores.searchStore.searchTo.deserialize = jest.fn();
            stores.searchStore.deserialize({} as ISearchStoreInitialState);

            expect(stores.searchStore.searchTo.deserialize).not.toHaveBeenCalled();
        });

        it('should NOT call searchWho deserialize when searchFrom is not defined in initialState', () => {
            stores.searchStore.searchWho.deserialize = jest.fn();
            stores.searchStore.deserialize({} as ISearchStoreInitialState);

            expect(stores.searchStore.searchWho.deserialize).not.toHaveBeenCalled();
        });
    });

    describe('selectedDestinationsQuery', () => {
        describe('Should return null', () => {
            it('Should return null when is anywhere selected', () => {
                stores.searchStore.searchTo.setSelectedDestinations([
                    {
                        name: 'anywhere',
                        code: GEOGRAPHY_ALL_CODE,
                    },
                ]);

                expect(stores.searchStore.selectedDestinationsQuery).toBe(null);
            });

            it('Should return null when there is no Virtual Regions', () => {
                stores.searchStore.searchTo.setSelectedDestinations([
                    {
                        name: 'Majorca',
                        code: 'ESMJ',
                        type: DestinationType.Region,
                    },
                ]);
                stores.searchStore.searchTo.setSelectedDestinationCodes(['ESMJ']);

                expect(stores.searchStore.selectedDestinationsQuery).toEqual(['region:ESMJ']);
            });
        });

        describe('Should return correct bd4 query', () => {
            it('Should return correct bd4 query when selected Destinations include virtual regions', () => {
                stores.searchStore.searchTo.setSelectedDestinations([
                    {
                        name: 'Canary Islands',
                        code: 'CIV',
                        type: DestinationType.VirtualRegion,
                        relatedRegions: ['ESMJ'],
                    },
                    {
                        name: 'Majorca',
                        code: 'ESMJ',
                        type: DestinationType.Region,
                    },
                ]);
                stores.searchStore.searchTo.setSelectedDestinationCodes(['CIV', 'ESMJ']);

                expect(stores.searchStore.selectedDestinationsQuery).toEqual(['virtualregion:CIV']);
            });
        });
    });

    describe('setSelectedOfferIndex', () => {
        it('should set new value to selectedOfferIndex field', () => {
            const mockValue = 5;
            stores.searchStore.selectedOfferIndex = 0;

            expect(stores.searchStore.selectedOfferIndex).toBe(0);

            stores.searchStore.setSelectedOfferIndex(mockValue);

            expect(stores.searchStore.selectedOfferIndex).toBe(mockValue);
        });
    });

    describe('setSeachPerformWithNewParams', () => {
        it('should set new value to isSeachPerformWithNewParams field', () => {
            stores.searchStore.isSeachPerformWithNewParams = false;

            stores.searchStore.setSeachPerformWithNewParams(true);

            expect(stores.searchStore.isSeachPerformWithNewParams).toBe(true);
        });
    });

    describe('changeActiveField', () => {
        beforeEach(() => {
            stores.searchStore.errorMessages = { key: SearchBarDropdown.From, message: 'message' };
        });

        it('should return true when errorMessages key is the same as passed field type', () => {
            expect(stores.searchStore.hasErrorInField(SearchBarDropdown.From)).toBe(true);
        });

        it('should return false when errorMessages key is not the same as passed field type', () => {
            expect(stores.searchStore.hasErrorInField(SearchBarDropdown.When)).toBe(false);
        });

        it('should return false when errorMessages is not defined', () => {
            stores.searchStore.errorMessages = null;

            expect(stores.searchStore.hasErrorInField(SearchBarDropdown.From)).toBe(false);
        });
    });

    describe('validateWhoParameters', () => {
        it('should return false when number of guests is more than maximum number', () => {
            stores.layoutStore.getSettingAsNumber = () => 1;

            expect(stores.searchStore.validateWhoParameters()).toBe(true);
            expect(stores.searchStore.errorMessages).toEqual({
                key: SearchBarDropdown.Who,
                message: SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
            });
        });
    });

    describe('validateSearchParameters', () => {
        describe('should return true', () => {
            it('should have error for from input when mandatory Search Parameters missed', () => {
                stores.layoutStore.dictionary = {
                    lang: 'en',
                    app: 'Holidays',
                    phrases: {
                        ['SearchPod.Errors.NoDepartureIsEntered']: 'Please enter a departure airport',
                    },
                };

                const res = stores.searchStore.validateSearchParameters();

                expect(stores.searchStore.searchFrom.origins).toBeUndefined();
                expect(stores.searchStore.searchTo.selectedDestinationCodes).toEqual([]);
                expect(stores.searchStore.searchWhen.from).toBeUndefined();
                expect(stores.searchStore.searchWhen.to).toBeUndefined();
                expect(stores.searchStore.errorMessages).toEqual({
                    key: SearchBarDropdown.From,
                    message: SitecoreDictionary.SearchPodErrorsNoDepartureIsEntered,
                });
                expect(res).toBe(true);
            });

            it('should have error for from input when only dates are search set up', () => {
                stores.layoutStore.dictionary = {
                    lang: 'en',
                    app: 'Holidays',
                    phrases: {
                        ['SearchPod.Errors.NoDepartureIsEntered']: 'Please enter a departure airport',
                    },
                };
                stores.searchStore.searchWhen.from = new Date();
                stores.searchStore.searchWhen.to = new Date();

                const res = stores.searchStore.validateSearchParameters();

                expect(stores.searchStore.searchFrom.origins).toBeUndefined();
                expect(stores.searchStore.searchTo.selectedDestinationCodes).toEqual([]);
                expect(stores.searchStore.errorMessages).toEqual({
                    key: SearchBarDropdown.From,
                    message: SitecoreDictionary.SearchPodErrorsNoDepartureIsEntered,
                });
                expect(res).toBe(true);
            });

            it('should have error for when input when airport and destination are selected', () => {
                stores.layoutStore.dictionary = {
                    lang: 'en',
                    app: 'Holidays',
                    phrases: {
                        ['SearchPod.Errors.NoDateIsSelected']:
                            'You need to choose a date. Try selecting from the calendar provided.',
                    },
                };
                stores.searchStore.searchFrom.setNormalOrigins(['LTN']);
                stores.searchStore.searchTo.setSelectedDestinationCodes(['MAJ']);

                const res = stores.searchStore.validateSearchParameters();

                expect(stores.searchStore.searchWhen.from).toBeUndefined();
                expect(stores.searchStore.searchWhen.to).toBeUndefined();
                expect(stores.searchStore.errorMessages).toEqual({
                    key: SearchBarDropdown.When,
                    message: SitecoreDictionary.SearchPodErrorsNoDateIsSelected,
                });
                expect(res).toBe(true);
            });

            it('should have error for to input when only airport is selected', () => {
                stores.layoutStore.dictionary = {
                    lang: 'en',
                    app: 'Holidays',
                    phrases: {
                        ['SearchPod.Errors.NoDepartureIsEntered']: 'Please enter a departure airport',
                    },
                };
                stores.searchStore.searchFrom.setNormalOrigins(['LTN']);

                const res = stores.searchStore.validateSearchParameters();

                expect(stores.searchStore.searchFrom.origins?.length).toEqual(1);
                expect(stores.searchStore.searchTo.selectedDestinationCodes).toEqual([]);
                expect(stores.searchStore.searchWhen.from).toBeUndefined();
                expect(stores.searchStore.searchWhen.to).toBeUndefined();
                expect(stores.searchStore.errorMessages).toEqual({
                    key: SearchBarDropdown.To,
                    message: SitecoreDictionary.SearchPodErrorsNoDestinationIsEntered,
                });
                expect(res).toBe(true);
            });

            it('should have max guests error for who input when max guests exceeded and all other search params are selected', () => {
                stores.layoutStore.dictionary = {
                    lang: 'en',
                    app: 'Holidays',
                    phrases: {
                        ['RoomAllocation.Errors.MaximumNumberOfGuestsHTML']: 'Max guests exceeded',
                    },
                };
                stores.searchStore.searchFrom.setNormalOrigins(['LTN']);
                stores.searchStore.searchTo.setSelectedDestinationCodes(['MAJ']);
                stores.searchStore.searchWhen.from = new Date();
                stores.searchStore.searchWhen.to = new Date();
                jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(false);

                const res = stores.searchStore.validateSearchParameters();
                expect(stores.searchStore.errorMessages).toEqual({
                    key: SearchBarDropdown.Who,
                    message: SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
                });
                expect(res).toBe(true);
            });

            it('should have max guests per room error for who input when max guests per room exceeded and all other search params are selected', () => {
                stores.layoutStore.dictionary = {
                    lang: 'en',
                    app: 'Holidays',
                    phrases: {
                        ['RoomAllocation.Errors.MaximumNumberOfGuestsHTML']: 'Max guests exceeded',
                    },
                };
                stores.searchStore.searchFrom.setNormalOrigins(['LTN']);
                stores.searchStore.searchTo.setSelectedDestinationCodes(['MAJ']);
                stores.searchStore.searchWhen.from = new Date();
                stores.searchStore.searchWhen.to = new Date();
                jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(true);
                jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(
                    false,
                );

                const res = stores.searchStore.validateSearchParameters();
                expect(stores.searchStore.errorMessages).toEqual({
                    key: SearchBarDropdown.Who,
                    message: SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
                });
                expect(res).toBe(true);
            });

            it('should return true when children age are is not valid and all other search params are selected', () => {
                stores.searchStore.searchFrom.setNormalOrigins(['LTN']);
                stores.searchStore.searchTo.setSelectedDestinationCodes(['MAJ']);
                stores.searchStore.searchWhen.from = new Date();
                stores.searchStore.searchWhen.to = new Date();
                jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(true);
                jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(
                    true,
                );
                stores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(false);

                const res = stores.searchStore.validateSearchParameters();
                expect(stores.searchStore.errorMessages).toBe(null);
                expect(res).toBe(true);
            });
        });

        it('should return false when all search params are selected correctly', () => {
            stores.layoutStore.getSettingAsNumber = () => 16;

            stores.searchStore.searchFrom.setNormalOrigins(['LTN']);
            stores.searchStore.searchTo.setSelectedDestinationCodes(['MAJ']);
            stores.searchStore.searchWhen.from = new Date();
            stores.searchStore.searchWhen.to = new Date();
            jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(true);
            stores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(true);

            const res = stores.searchStore.validateSearchParameters();

            expect(stores.searchStore.errorMessages).toBe(null);
            expect(res).toBe(false);
        });
    });

    describe('isAllSearchParametersSelected', () => {
        describe('isAllSearchParametersSelected should be falsy', () => {
            it('should be falsy if origins array is empty', () => {
                const searchStore = new BaseSearchStore({ layoutStore: { isPromoPage: false } } as any);

                searchStore.searchFrom.setNormalOrigins([]);
                searchStore.searchWhen.from = new Date();
                searchStore.searchWhen.to = new Date();
                searchStore.searchTo.setSelectedDestinationCodes([]);

                expect(searchStore.isAllSearchParametersSelected).toBe(false);
            });

            it(`should be falsy if both selectedDestinationCodes
            and selectedAccommodationCodes are empty`, () => {
                stores.searchStore.searchFrom.setNormalOrigins(['']);
                stores.searchStore.searchWhen.from = new Date();
                stores.searchStore.searchWhen.to = new Date();

                expect(stores.searchStore.isAllSearchParametersSelected).toBe(false);
            });

            it('should be falsy if from property is empty', () => {
                stores.searchStore.searchFrom.setNormalOrigins(['']);
                stores.searchStore.searchWhen.to = new Date();
                stores.searchStore.searchTo.setSelectedDestinationCodes([]);

                expect(stores.searchStore.isAllSearchParametersSelected).toBe(false);
            });

            it('should be falsy if to property is empty', () => {
                stores.searchStore.searchFrom.setNormalOrigins(['']);
                stores.searchStore.searchWhen.from = new Date();
                stores.searchStore.searchTo.setSelectedDestinationCodes([]);

                expect(stores.searchStore.isAllSearchParametersSelected).toBe(false);
            });

            it('should be falsy when origins are undefined', () => {
                stores.searchStore.searchFrom.origins = undefined;

                expect(stores.searchStore.isAllSearchParametersSelected).toBe(false);
            });

            it('should be falsy when selectedDestinationCodes are undefined', () => {
                stores.searchStore.searchTo.selectedDestinationCodes = undefined as any;

                expect(stores.searchStore.isAllSearchParametersSelected).toBe(false);
            });
        });

        describe('isAllSearchParametersSelected should be truthy', () => {
            it('should be truthy if is Promo Page', () => {
                jest.spyOn(stores.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);

                expect(stores.searchStore.isAllSearchParametersSelected).toBe(true);
            });

            it('should be truthy if all properties are correct', () => {
                jest.spyOn(stores.queryParamStore, 'selectedDestinationCodesFromUrl', 'get').mockReturnValue(['']);

                stores.searchStore.searchFrom.setNormalOrigins(['']);
                stores.searchStore.searchWhen.from = new Date();
                stores.searchStore.searchWhen.to = new Date();
                stores.searchStore.searchTo.setSelectedDestinationCodes(['']);

                expect(stores.searchStore.isAllSearchParametersSelected).toBe(true);

                stores.searchStore.searchTo.setSelectedDestinationCodes([]);

                expect(stores.searchStore.isAllSearchParametersSelected).toBe(true);
            });
        });
    });

    describe('isAnySearchParametersSelected', () => {
        describe('isAnySearchParametersSelected should be falsy', () => {
            it('should be falsy if there is no filled property', () => {
                const searchStore = new BaseSearchStore({ layoutStore: { isPromoPage: false } } as any);

                searchStore.searchFrom.setNormalOrigins([]);
                searchStore.searchWhen.from = null;
                searchStore.searchWhen.to = null;
                searchStore.searchTo.setSelectedDestinationCodes([]);
                searchStore.searchTo.selectedAccommodationCodes = '';

                expect(searchStore.isAnySearchParametersSelected).toBe(false);
            });
        });

        describe('isAnySearchParametersSelected should be truthy', () => {
            it('should be truthy if is Promo Page', () => {
                const searchStore = new BaseSearchStore({ layoutStore: { isPromoPage: true } } as any);

                expect(searchStore.isAnySearchParametersSelected).toBe(true);
            });

            it('should be truthy if origins array is not empty', () => {
                const searchStore = new BaseSearchStore({ layoutStore: { isPromoPage: false } } as any);

                searchStore.searchFrom.setNormalOrigins(['']);

                expect(searchStore.isAnySearchParametersSelected).toBe(true);
            });

            it(`should be truthy if selectedDestinationCodes is not empty`, () => {
                const searchStore = new BaseSearchStore({ layoutStore: { isPromoPage: false } } as any);

                searchStore.searchFrom.setNormalOrigins([]);
                searchStore.searchTo.setSelectedDestinationCodes(['']);

                expect(searchStore.isAnySearchParametersSelected).toBe(true);
            });

            it(`should be truthy if selectedAccommodationCodes is not empty`, () => {
                const searchStore = new BaseSearchStore({ layoutStore: { isPromoPage: false } } as any);

                searchStore.searchFrom.setNormalOrigins([]);
                searchStore.searchTo.selectedAccommodationCodes = 'LTN';

                expect(searchStore.isAnySearchParametersSelected).toBe(true);
            });

            it('should be truthy if from property is not empty', () => {
                const searchStore = new BaseSearchStore({ layoutStore: { isPromoPage: false } } as any);

                searchStore.searchFrom.setNormalOrigins([]);
                searchStore.searchWhen.from = new Date();

                expect(searchStore.isAnySearchParametersSelected).toBe(true);
            });

            it('should be truthy if to property is not empty', () => {
                const searchStore = new BaseSearchStore({ layoutStore: { isPromoPage: false } } as any);

                searchStore.searchFrom.setNormalOrigins([]);
                searchStore.searchWhen.to = new Date();

                expect(searchStore.isAnySearchParametersSelected).toBe(true);
            });
        });
    });

    describe('Changing origin', () => {
        beforeEach(() => {
            stores.searchStore.originsUpdated = jest.fn();
        });

        it('should set origin', () => {
            const testCodes = ['test'];

            stores.searchStore.searchFrom.setOrigins(testCodes);

            expect(toJS(stores.searchStore.searchFrom.origins)).toEqual(testCodes);
            expect(stores.searchStore.originsUpdated).toBeCalled();
        });

        it('should add origin', () => {
            const testCode = 'test';

            stores.searchStore.originsUpdated = jest.fn();

            stores.searchStore.searchFrom.setOrigins([]);
            stores.searchStore.searchFrom.onAddOrigin(testCode);

            expect(toJS(stores.searchStore.searchFrom.origins)).toEqual([testCode]);
            expect(stores.searchStore.originsUpdated).toBeCalled();
        });

        it('should remove origin', () => {
            const testCode = 'test';

            stores.searchStore.searchFrom.setNormalOrigins([testCode]);
            stores.searchStore.searchFrom.onRemoveOrigin(testCode);

            expect(stores.searchStore.searchFrom.origins).toEqual([]);
            expect(stores.searchStore.originsUpdated).toBeCalled();
        });

        it('should clear origins', () => {
            stores.searchStore.searchFrom.setNormalOrigins(['test', 'test2']);
            stores.searchStore.searchFrom.onClearOrigins();

            expect(stores.searchStore.searchFrom.origins).toEqual([]);
            expect(stores.searchStore.originsUpdated).toBeCalled();
        });
    });

    describe('Changing destination', () => {
        beforeEach(() => {
            stores.searchStore.searchTo.updateDestinationCodes = jest.fn();
        });

        it('should set selected destination', () => {
            const testDest = { code: '', name: '' };
            stores.searchStore.searchTo.selectSingleDestination(testDest);

            expect(toJS(stores.searchStore.searchTo.selectedDestinations)).toEqual([testDest]);
            expect(stores.searchStore.searchTo.updateDestinationCodes).toBeCalled();
        });

        it('should set selected destination type', () => {
            const testDest = { code: '', name: '', type: DestinationType.Hotel };
            stores.searchStore.searchTo.selectSingleDestination(testDest);

            expect(toJS(stores.searchStore.searchTo.selectedDestinations)).toEqual([testDest]);
            expect(stores.searchStore.searchTo.updateDestinationCodes).toBeCalled();
        });

        it('should change destinations', () => {
            const testDest = { code: '', name: '' };
            stores.searchStore.searchTo.changeDestinations([testDest]);

            expect(toJS(stores.searchStore.searchTo.selectedDestinations)).toEqual([testDest]);
            expect(stores.searchStore.searchTo.updateDestinationCodes).toBeCalled();
        });

        it('should add destinations', () => {
            const testDest = { code: '', name: '' };
            stores.searchStore.searchTo.addDestination(testDest);

            expect(toJS(stores.searchStore.searchTo.selectedDestinations)).toEqual([testDest]);
            expect(stores.searchStore.searchTo.updateDestinationCodes).toBeCalled();
        });

        it('should trigger clear destinations', () => {
            const testDest = { code: '', name: '' };
            stores.searchStore.searchTo.clearDestinations = jest.fn();

            stores.searchStore.isSingleSelectableDestination = true;
            stores.searchStore.searchTo.addDestination(testDest);

            expect(stores.searchStore.isSingleSelectableDestination).toBe(false);
            expect(stores.searchStore.searchTo.clearDestinations).toBeCalled();
        });

        it('should clear destinations', () => {
            const testDest = { code: '', name: '' };

            stores.searchStore.searchTo.setSelectedDestinations([testDest]);
            stores.searchStore.searchTo.clearDestinations();

            expect(stores.searchStore.searchTo.selectedDestinations).toEqual([]);
        });

        it('should clear destinations', () => {
            const testDest = { code: '', name: '' };

            stores.searchStore.searchTo.setSelectedDestinations([testDest]);
            stores.searchStore.searchTo.removeDestination(testDest);

            expect(stores.searchStore.searchTo.selectedDestinations).toEqual([]);
        });
    });

    describe('Pagination', () => {
        it('should update order', () => {
            const orderBy = OrderBy.Price;
            const orderDirection = OrderDirection.Desc;

            stores.searchStore.updateOrder(orderBy, orderDirection);

            expect(stores.searchStore.orderBy).toEqual(orderBy);
            expect(stores.searchStore.orderDirection).toEqual(orderDirection);
        });
    });

    describe('validateWhenParameters', () => {
        beforeEach(() => {
            stores.rootStore.trackingStore.trackValidation = jest.fn();
        });

        it('should return false when to & from fields are correct', () => {
            stores.searchStore.searchWhen.from = new Date();
            stores.searchStore.searchWhen.to = new Date();

            const res = stores.searchStore.validateWhenParameters();

            expect(res).toBe(false);
        });

        it('should return true and set SearchPodErrorsNoDateIsSelected error when both to & from fields are empty', () => {
            (document.activeElement as HTMLElement)?.blur();
            stores.searchStore.searchWhen.from = null;
            stores.searchStore.searchWhen.to = null;

            const res = stores.searchStore.validateWhenParameters();

            expect(res).toBe(true);
            expect(stores.searchStore.errorMessages!.key).toBe(SearchBarDropdown.When);
            expect(stores.searchStore.errorMessages!.message).toBe(SitecoreDictionary.SearchPodErrorsNoDateIsSelected);
            expect(document.getElementById('search-when')).toHaveFocus();
        });

        it('should return true and set SearchPodErrorsNoReturnDateIsSelected error when to field is empty and page is promo', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValueOnce(true);
            stores.searchStore.searchWhen.from = new Date();
            stores.searchStore.searchWhen.to = null;

            const res = stores.searchStore.validateWhenParameters();

            expect(res).toBe(true);
            expect(stores.searchStore.errorMessages!.key).toBe(SearchBarDropdown.When);
            expect(stores.searchStore.errorMessages!.message).toBe(
                SitecoreDictionary.SearchPodErrorsNoReturnDateIsSelected,
            );
        });

        it('should not set focus whe called with false param ', () => {
            (document.activeElement as HTMLElement)?.blur();
            stores.searchStore.searchWhen.from = null;
            stores.searchStore.searchWhen.to = null;

            stores.searchStore.validateWhenParameters(false);

            expect(document.getElementById('search-when')).not.toHaveFocus();
        });
    });

    describe('prefillSearchParams', () => {
        let prefilledParams: IPrefilledSearchParams;
        let storeParams;
        let searchStore;

        beforeEach(() => {
            prefilledParams = {
                departure: 'test1,test2',
                dest: 'C1,C2,C3,R1,R2,R3',
                startDate: '15-05-2099',
                durations: ['7'],
                geog: 'test',
                rooms: [
                    { adults: 2, children: 0, infants: 0, roomCode: 'room1', childrenAges: [] },
                    { adults: 1, children: 0, infants: 1, roomCode: 'room2', childrenAges: [] },
                ],
                flexDays: 3,
                autoAllocation: true,
                isMonthSearch: undefined,
                isVirtualResort: false,
            };
            storeParams = {
                queryParamsStore: {
                    query: {
                        [QueryParamName.Origin]: 'test',
                        [QueryParamName.Destination]: 'test',
                        [QueryParamName.From]: 'test',
                        [QueryParamName.To]: 'test',
                        [QueryParamName.Geog]: 'test',
                        [QueryParamName.Rooms]: 'test',
                        [QueryParamName.AutoAllocation]: 'test',
                        [QueryParamName.FlexDays]: 1,
                    },
                },
                layoutStore: {
                    isPromoPage: false,
                    getSettingAsNumber: jest.fn(),
                },
                searchStore: {
                    errorMessage: null,
                    originsWithNames: [],
                },
                marketStore: {
                    marketCode: MarketCode.UK,
                },
            } as any;
            searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();
        });

        it('Should prefill origins', async () => {
            storeParams.queryParamsStore.query[QueryParamName.Origin] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();

            searchStore.searchTo.typeAheadDestinations = {} as ITypeAheadResponse;
            searchStore.searchFrom.setOrigins = jest.fn();
            searchStore.searchWhen.resetDateAvailabilityInterval = jest.fn();
            searchStore.searchFrom.updateOriginsDisplayValue = jest.fn();
            searchStore.searchTo.updateAvailableDstCodes = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchFrom.setOrigins).toHaveBeenCalledWith(['test1', 'test2'], false);
            expect(searchStore.searchWhen.resetDateAvailabilityInterval).toHaveBeenCalled();
            expect(searchStore.searchFrom.updateOriginsDisplayValue).toHaveBeenCalled();
            expect(searchStore.searchTo.updateAvailableDstCodes).toHaveBeenCalled();
            expect(searchStore.searchTo.typeAheadDestinations).toBeNull();
        });

        it('Should NOT prefill origins', async () => {
            searchStore.searchTo.typeAheadDestinations = {} as ITypeAheadResponse;
            searchStore.searchFrom.setOrigins = jest.fn();
            searchStore.searchWhen.resetDateAvailabilityInterval = jest.fn();
            searchStore.searchFrom.updateOriginsDisplayValue = jest.fn();
            searchStore.searchTo.updateAvailableDstCodes = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchFrom.setOrigins).not.toHaveBeenCalled();
            expect(searchStore.searchWhen.resetDateAvailabilityInterval).not.toHaveBeenCalled();
            expect(searchStore.searchFrom.updateOriginsDisplayValue).not.toHaveBeenCalled();
            expect(searchStore.searchTo.updateAvailableDstCodes).not.toHaveBeenCalled();
            expect(searchStore.searchTo.typeAheadDestinations).toEqual({});
        });

        it('Should prefill destinations', async () => {
            storeParams.queryParamsStore.query[QueryParamName.Destination] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();

            searchStore.searchTo.prefillDestinations = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            await waitFor(() => expect(searchStore.searchTo.prefillDestinations).toHaveBeenCalledWith(prefilledParams));
        });

        it('Should NOT prefill destinations', async () => {
            searchStore.searchTo.prefillDestinations = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchTo.prefillDestinations).not.toHaveBeenCalled();
            expect(searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
        });

        it('Should prefill dates and set isMonthSearch to false', async () => {
            storeParams.queryParamsStore.query[QueryParamName.To] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.From] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();
            searchStore.searchWhen.setIsMonthSearch = jest.fn();
            searchStore.searchWhen.onChangeDates = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith(
                [new Date('2099-05-15T00:00:00.000Z'), new Date('2099-05-22T00:00:00.000Z')],
                false,
            );
            expect(searchStore.searchWhen.setIsMonthSearch).toHaveBeenCalledWith(false);
        });

        it('Should prefill dates and set isMonthSearch to true when prefilledParams.isMonthSearch is true', async () => {
            storeParams.queryParamsStore.query[QueryParamName.To] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.From] = undefined;
            prefilledParams.isMonthSearch = true;
            prefilledParams.startDate = '01-01-2099';
            prefilledParams.durations = ['3'];
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.onChangeDates = jest.fn();
            searchStore.searchWhen.updateAvailableDates = jest.fn();
            searchStore.searchWhen.setIsMonthSearch = jest.fn();
            searchStore.searchWhen.setMonthSearchDuration = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith(
                [new Date('2099-01-01T00:00:00.000Z'), new Date('2099-01-31T23:59:59.999Z')],
                false,
            );
            expect(searchStore.searchWhen.setIsMonthSearch).toHaveBeenCalledWith(true);
            expect(searchStore.searchWhen.setMonthSearchDuration).toHaveBeenCalledWith(3);
        });

        it('Should NOT prefill dates and NOT call setIsMonthSearch when prefilledParams.isMonthSearch is true and prefilledParams.startDate is invalid', async () => {
            storeParams.queryParamsStore.query[QueryParamName.To] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.From] = undefined;
            prefilledParams.isMonthSearch = true;
            prefilledParams.startDate = '';
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.onChangeDates = jest.fn();
            searchStore.searchWhen.updateAvailableDates = jest.fn();
            searchStore.searchWhen.setIsMonthSearch = jest.fn();
            searchStore.searchWhen.setMonthSearchDuration = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWhen.onChangeDates).not.toHaveBeenCalled();
            expect(searchStore.searchWhen.setIsMonthSearch).not.toHaveBeenCalled();
            expect(searchStore.searchWhen.setMonthSearchDuration).not.toHaveBeenCalled();
        });

        it('Should NOT prefill dates if one of dates unavailable', async () => {
            storeParams.queryParamsStore.query[QueryParamName.To] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();

            searchStore.searchWhen.onChangeDates = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWhen.onChangeDates).not.toHaveBeenCalled();
        });

        it('Should NOT prefill dates if both dates unavailable', async () => {
            searchStore.searchWhen.onChangeDates = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWhen.onChangeDates).not.toHaveBeenCalled();
        });

        it('Should prefill geog', async () => {
            storeParams.queryParamsStore.query[QueryParamName.Geog] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();

            searchStore.searchTo.setSelectedDestinationCodesQuery = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchTo.setSelectedDestinationCodesQuery).toHaveBeenCalledWith(prefilledParams.geog);
        });

        it('Should NOT prefill geog', async () => {
            searchStore.searchTo.setSelectedDestinationCodesQuery = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchTo.setSelectedDestinationCodesQuery).not.toHaveBeenCalled();
        });

        it('Should prefill rooms', async () => {
            storeParams.queryParamsStore.query[QueryParamName.Rooms] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();
            jest.spyOn(searchUtils, 'getRoomAllocationFromQueryRoom').mockImplementation(el => el as any);

            searchStore.searchWho.setRoomsAllocation = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWho.setRoomsAllocation).toHaveBeenCalledWith(prefilledParams.rooms);
        });

        it('Should NOT prefill rooms', async () => {
            searchStore.searchWho.setRoomsAllocation = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWho.setRoomsAllocation).not.toHaveBeenCalled();
        });

        it('Should prefill autoAllocation by calling setIsAutoAllocation when AutoAllocation query param is not defined & autoAllocation is false in passed prefilledParams', async () => {
            storeParams.queryParamsStore.query[QueryParamName.AutoAllocation] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();

            searchStore.searchWho.onChangeRooms = jest.fn();
            searchStore.searchWho.setIsAutoAllocation = jest.fn();

            await searchStore.prefillSearchParams({ ...prefilledParams, autoAllocation: false });

            expect(searchStore.searchWho.onChangeRooms).not.toHaveBeenCalled();
            expect(searchStore.searchWho.setIsAutoAllocation).toHaveBeenCalledWith(false);
        });

        it('Should prefill autoAllocation by calling onChangeRooms when AutoAllocation query param is not defined', async () => {
            storeParams.queryParamsStore.query[QueryParamName.AutoAllocation] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();

            searchStore.searchWho.onChangeRooms = jest.fn();
            searchStore.searchWho.setIsAutoAllocation = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWho.onChangeRooms).toHaveBeenCalledWith(-1);
            expect(searchStore.searchWho.setIsAutoAllocation).not.toHaveBeenCalled();
        });

        it('Should NOT prefill autoAllocation when AutoAllocation query param is defined', async () => {
            searchStore.searchWho.onChangeRooms = jest.fn();
            searchStore.searchWho.setIsAutoAllocation = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWho.onChangeRooms).not.toHaveBeenCalled();
            expect(searchStore.searchWho.setIsAutoAllocation).not.toHaveBeenCalled();
        });

        it('Should prefill flexDays', async () => {
            storeParams.queryParamsStore.query[QueryParamName.FlexDays] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();

            searchStore.searchWhen.onChangeFlexible = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledWith(prefilledParams.flexDays);
        });

        it('Should NOT prefill flexDays', async () => {
            searchStore.searchWhen.onChangeFlexible = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams);

            expect(searchStore.searchWhen.onChangeFlexible).not.toHaveBeenCalled();
        });

        it('Should prefill all fields when force = true in prefillSearchParams', async () => {
            storeParams.queryParamsStore.query[QueryParamName.Origin] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.Destination] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.From] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.To] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.Geog] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.Rooms] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.AutoAllocation] = undefined;
            storeParams.queryParamsStore.query[QueryParamName.FlexDays] = undefined;
            const searchStore = new BaseSearchStore(storeParams);
            searchStore.searchWhen.updateAvailableDates = jest.fn();

            searchStore.searchFrom.setOrigins = jest.fn();
            searchStore.searchWhen.onChangeDates = jest.fn();
            searchStore.searchTo.prefillDestinations = jest.fn();
            searchStore.searchTo.setSelectedDestinationCodesQuery = jest.fn();
            searchStore.searchWho.setRoomsAllocation = jest.fn();
            searchStore.searchWho.onChangeRooms = jest.fn();
            searchStore.searchWhen.onChangeFlexible = jest.fn();

            await searchStore.prefillSearchParams(prefilledParams, true);

            expect(searchStore.searchFrom.setOrigins).toHaveBeenCalled();
            expect(searchStore.searchTo.prefillDestinations).toHaveBeenCalled();
            expect(searchStore.searchWhen.onChangeDates).toHaveBeenCalled();
            expect(searchStore.searchTo.setSelectedDestinationCodesQuery).toHaveBeenCalled();
            expect(searchStore.searchWho.setRoomsAllocation).toHaveBeenCalled();
            expect(searchStore.searchWho.onChangeRooms).toHaveBeenCalled();
            expect(searchStore.searchWhen.onChangeFlexible).toHaveBeenCalled();
        });
    });

    describe('isSearchValid', () => {
        beforeEach(() => {
            stores.searchStore.isOldParamSet = true;
            stores.searchStore.searchWhen.isMonthSearch = false;
            stores.searchStore.searchWhen.from = new Date('2020-01-15');
            stores.searchStore.searchWhen.to = new Date('2020-01-20');
            stores.searchStore.searchFrom.origins = ['LGW', 'LTN'];
            stores.searchStore.searchTo.selectedDestinations = [
                {
                    code: 'ES',
                    name: 'Spain',
                    type: DestinationType.Country,
                    children: [],
                },
            ];
            stores.searchStore.searchWho.roomsAllocation = [
                {
                    id: 0.33461314006223475,
                    adults: [
                        {
                            id: '2b198631-7795-eb2d-417a-30f45b9ad397',
                            isLead: false,
                            age: 30,
                            notBornYet: false,
                            Sex: 'SEX_UNKNOWN',
                            useSurnameAsLead: false,
                            type: GuestType.Adult,
                            firstName: '',
                            lastName: '',
                            title: '',
                        },
                    ] as GuestInfo[],
                    children: [],
                    infants: [],
                    roomCode: '',
                },
            ] as any;

            stores.searchStore.oldOrigins = stores.searchStore.searchFrom.origins;
            stores.searchStore.oldSelectedDestinations = stores.searchStore.searchTo.selectedDestinations;
            stores.searchStore.oldFrom = stores.searchStore.searchWhen.from;
            stores.searchStore.oldTo = stores.searchStore.searchWhen.to;
            stores.searchStore.oldMonthSearchDuration = stores.searchStore.searchWhen.monthSearchDuration;
            stores.searchStore.oldRooms = stores.searchStore.searchWho.roomsAllocation;
        });

        it('Should return false if search has not changed', () => {
            expect(stores.searchStore.isSearchValid).toBe(false);
        });

        it('Should return true when from changes', () => {
            stores.searchStore.searchWhen.from = new Date('2020-01-10');
            expect(stores.searchStore.isSearchValid).toBe(true);
        });

        it('Should return false when from is null', () => {
            stores.searchStore.searchWhen.from = null;
            expect(stores.searchStore.isSearchValid).toBe(false);
        });

        it('Should return false when to is null', () => {
            stores.searchStore.searchWhen.to = null;
            expect(stores.searchStore.isSearchValid).toBe(false);
        });

        it('Should return false when destinations are NOT selected', () => {
            stores.searchStore.searchTo.selectedDestinations = [];
            expect(stores.searchStore.isSearchValid).toBe(false);
        });

        it('Should return false when origins are NOT selected', () => {
            stores.searchStore.searchFrom.origins = [];
            expect(stores.searchStore.isSearchValid).toBe(false);
        });

        it('Should return true when to changes', () => {
            stores.searchStore.searchWhen.to = new Date('2020-01-30');
            expect(stores.searchStore.isSearchValid).toBe(true);
        });

        it('Should return true when isMonthSearch and monthSearchDuration changes', () => {
            stores.searchStore.searchWhen.isMonthSearch = true;
            stores.searchStore.oldMonthSearchDuration = 10;
            expect(stores.searchStore.isSearchValid).toBe(true);
        });

        it('Should return true when origins change', () => {
            stores.searchStore.searchFrom.origins = ['LGW'];
            expect(stores.searchStore.isSearchValid).toBe(true);
        });

        it('Should return true when selectedDestinations changes', () => {
            stores.searchStore.searchTo.selectedDestinations = [
                {
                    code: 'IT',
                    name: 'Italy',
                    type: DestinationType.Country,
                    children: [],
                },
            ];
            expect(stores.searchStore.isSearchValid).toBe(true);
        });

        it('Should return true when Rooms changes', () => {
            stores.searchStore.searchWho.roomsAllocation = [
                {
                    id: 0.33461314006223475,
                    adults: [
                        {
                            id: '2b198631-7795-eb2d-417a-30f45b9ad397',
                            isLead: false,
                            age: 30,
                            notBornYet: false,
                            Sex: 'SEX_UNKNOWN',
                            useSurnameAsLead: false,
                            type: GuestType.Adult,
                            firstName: '',
                            lastName: '',
                            title: '',
                        },
                        {
                            id: '2b198631-7795-eb2d-417a-30f45b9ad397',
                            isLead: false,
                            age: 30,
                            notBornYet: false,
                            Sex: 'SEX_UNKNOWN',
                            useSurnameAsLead: false,
                            type: GuestType.Adult,
                            firstName: '',
                            lastName: '',
                            title: '',
                        },
                    ],
                    children: [],
                    infants: [],
                    roomCode: '',
                } as any,
            ];
            expect(stores.searchStore.isSearchValid).toBe(true);
        });

        it('Should return true when value changes then changes back to original search parameters', () => {
            stores.searchStore.searchFrom.origins = ['LGW'];
            expect(stores.searchStore.isSearchValid).toBe(true);
            stores.searchStore.searchFrom.origins = ['LGW', 'LTN'];
            expect(stores.searchStore.isSearchValid).toBe(false);
        });
    });

    describe('isDestinationsSearchLoading', () => {
        beforeEach(() => {
            stores.searchStore.searchTo.isDestinationsSearchLoading = false;
        });

        it('should return correct isDestinationsSearchLoading', () => {
            const isLoading = stores.searchStore.searchTo.isDestinationsSearchLoading;
            expect(isLoading).toEqual(false);
        });
    });

    describe('originsUpdated', () => {
        it('Should have default behavior', () => {
            const resetDateAvailabilityInterval = jest
                .spyOn(stores.searchStore.searchWhen, 'resetDateAvailabilityInterval')
                .mockImplementation(jest.fn());
            const updateOriginsDisplayValue = jest
                .spyOn(stores.searchStore.searchFrom, 'updateOriginsDisplayValue')
                .mockImplementation(jest.fn());
            const updateAvailableDstCodes = jest
                .spyOn(stores.searchStore.searchTo, 'updateAvailableDstCodes')
                .mockImplementation(jest.fn());
            const updateAvailableDates = jest
                .spyOn(stores.searchStore.searchWhen, 'updateAvailableDates')
                .mockImplementation(jest.fn());

            stores.searchStore.originsUpdated();

            expect(resetDateAvailabilityInterval).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.typeAheadDestinations).toBeNull();
            expect(updateOriginsDisplayValue).toHaveBeenCalled();
            expect(updateAvailableDstCodes).toHaveBeenCalled();
            expect(updateAvailableDates).toHaveBeenCalled();
        });
    });

    describe('onAnywhereCheck', () => {
        it('should not call removeDestinations when both isAnywhereSelected/onAdd is true', () => {
            jest.spyOn(stores.searchStore, 'anywhereWord', 'get').mockReturnValue('Anywhere');
            jest.spyOn(stores.searchStore.searchTo, 'isAnywhereSelected', 'get').mockReturnValue(true);
            const removeDestination = jest
                .spyOn(stores.searchStore.searchTo, 'removeDestination')
                .mockImplementation(jest.fn());

            stores.searchStore.onAnywhereCheck(true);

            expect(removeDestination).not.toHaveBeenCalled();
        });

        it('should call removeDestinations when isAnywhereSelected is true and onAdd is false', () => {
            jest.spyOn(stores.searchStore, 'anywhereWord', 'get').mockReturnValue('Anywhere');
            jest.spyOn(stores.searchStore.searchTo, 'isAnywhereSelected', 'get').mockReturnValue(true);
            const removeDestination = jest
                .spyOn(stores.searchStore.searchTo, 'removeDestination')
                .mockImplementation(jest.fn());

            stores.searchStore.onAnywhereCheck(false);

            expect(removeDestination).toHaveBeenCalledWith({
                code: GEOGRAPHY_ALL_CODE,
                name: 'Anywhere',
            });
        });

        it('should call addDestination when isAnywhereSelected is false', () => {
            jest.spyOn(stores.searchStore, 'anywhereWord', 'get').mockReturnValue('Anywhere');
            jest.spyOn(stores.searchStore.searchTo, 'isAnywhereSelected', 'get').mockReturnValue(false);
            const clearDestinations = jest
                .spyOn(stores.searchStore.searchTo, 'clearDestinations')
                .mockImplementation(() => {});
            const addDestination = jest
                .spyOn(stores.searchStore.searchTo, 'addDestination')
                .mockImplementation(() => {});

            stores.searchStore.onAnywhereCheck();

            expect(clearDestinations).toHaveBeenCalledWith({ noUpdate: true });
            expect(addDestination).toHaveBeenCalledWith({
                code: GEOGRAPHY_ALL_CODE,
                name: 'Anywhere',
            });
        });
    });

    describe('getValuesFromQueryParamsStore', () => {
        beforeEach(() => {
            jest.spyOn(stores.rootStore.queryParamsStore, 'originFromUrl', 'get').mockReturnValue(['LGW']);
            jest.spyOn(stores.rootStore.queryParamsStore, 'selectedDestinationCodesFromUrl', 'get').mockReturnValue([
                'SP',
            ]);
            jest.spyOn(
                stores.rootStore.queryParamsStore,
                'selectedDestinationCodesQueryFromUrl',
                'get',
            ).mockReturnValue('SP');

            stores.searchStore.searchFrom.origins = ['LGW'];
            stores.searchStore.searchTo.selectedDestinationCodes = ['SP'];
            stores.searchStore.searchFrom.setNormalOrigins = jest.fn();
            stores.searchStore.searchTo.setSelectedDestinationCodes = jest.fn();
            stores.searchStore.searchWhen.flexDays = 0;
            stores.searchStore.searchWhen.setMonthSearchDuration = jest.fn();
            stores.searchStore.searchWhen.setIsMonthSearch = jest.fn();
        });

        it('should call setNormalOrigins with origins from searchFrom when forceQuery is false and origins are provided', () => {
            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchFrom.setNormalOrigins).toHaveBeenCalledWith(
                stores.searchStore.searchFrom.origins,
            );
        });

        it('should call setNormalOrigins with originFromUrl when forceQuery is false and origins are NOT provided', () => {
            stores.searchStore.searchFrom.origins = undefined;

            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchFrom.setNormalOrigins).toHaveBeenCalledWith(
                stores.rootStore.queryParamsStore.originFromUrl,
            );
        });

        it('should call setNormalOrigins with empty array when forceQuery is false, origins and originFromUrl are NOT provided', () => {
            stores.searchStore.searchFrom.origins = undefined;
            jest.spyOn(stores.rootStore.queryParamsStore, 'originFromUrl', 'get').mockReturnValue(undefined as any);

            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchFrom.setNormalOrigins).toHaveBeenCalledWith([]);
        });

        it('should call setNormalOrigins with originFromUrl when forceQuery is true', () => {
            stores.searchStore.getValuesFromQueryParamsStore(true);

            expect(stores.searchStore.searchFrom.setNormalOrigins).toHaveBeenCalledWith(
                stores.rootStore.queryParamsStore.originFromUrl,
            );
        });

        it('should call setSelectedDestinationCodes with selectedDestinationCodes when forceQuery is false and selectedDestinationCodes are provided', () => {
            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith(
                stores.searchStore.searchTo.selectedDestinationCodes,
            );
        });

        it('should call setSelectedDestinationCodes with selectedDestinationCodesFromUrl when forceQuery is false and selectedDestinationCodes are NOT provided', () => {
            stores.searchStore.searchTo.selectedDestinationCodes = undefined as any;

            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith(
                stores.rootStore.queryParamsStore.selectedDestinationCodesFromUrl,
            );
        });

        it('should call setSelectedDestinationCodes with empty array when forceQuery is false, selectedDestinationCodes and selectedDestinationCodesFromUrl are NOT provided', () => {
            stores.searchStore.searchTo.selectedDestinationCodes = undefined as any;
            jest.spyOn(stores.rootStore.queryParamsStore, 'selectedDestinationCodesFromUrl', 'get').mockReturnValue(
                undefined as any,
            );

            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith([]);
        });

        it('should call setSelectedDestinationCodes with selectedDestinationCodesFromUrl when forceQuery is true', () => {
            stores.searchStore.getValuesFromQueryParamsStore(true);

            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith(
                stores.rootStore.queryParamsStore.selectedDestinationCodesFromUrl,
            );
        });

        it('should call updateRoomsAllocationFromQueryParamsStore', () => {
            const mockForce = true;
            stores.searchStore.searchWho.updateRoomsAllocationFromQueryParamsStore = jest.fn();

            stores.searchStore.getValuesFromQueryParamsStore(mockForce);

            expect(stores.searchStore.searchWho.updateRoomsAllocationFromQueryParamsStore).toHaveBeenCalledWith(
                mockForce,
            );
        });

        it('should set flexDays from Url', () => {
            const mockFlexDaysFromUrl = 2;
            jest.spyOn(stores.rootStore.queryParamsStore, 'flexDaysFromUrl', 'get').mockReturnValue(
                mockFlexDaysFromUrl,
            );

            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchWhen.flexDays).toBe(mockFlexDaysFromUrl);
        });

        it("should set flexDays from store when we don't have flexDaysFromUrl in paramStore", () => {
            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchWhen.flexDays).toBe(stores.searchStore.searchWhen.flexDays);
        });

        it('should set monthSearchDuration from Url', () => {
            const mockMonthSearchDurationFromUrl = 2;
            jest.spyOn(stores.rootStore.queryParamsStore, 'monthSearchDurationFromUrl', 'get').mockReturnValue(
                mockMonthSearchDurationFromUrl,
            );

            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchWhen.setMonthSearchDuration).toHaveBeenCalledWith(
                mockMonthSearchDurationFromUrl,
            );
        });

        it('should set monthSearchDuration from store when monthSearchDurationFromUrl is not defined in paramStore', () => {
            const mockMonthSearchDuration = 10;
            stores.searchStore.searchWhen.setMonthSearchDuration(mockMonthSearchDuration);
            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchWhen.setMonthSearchDuration).toHaveBeenCalledWith(mockMonthSearchDuration);
        });

        it('should set isMonthSearch from Url', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isMonthSearchEnabled', 'get').mockReturnValue(true);
            const mockIsMonthSearchFromUrl = true;
            jest.spyOn(stores.rootStore.queryParamsStore, 'isMonthSearchFromUrl', 'get').mockReturnValue(
                mockIsMonthSearchFromUrl,
            );

            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchWhen.setIsMonthSearch).toHaveBeenCalledWith(mockIsMonthSearchFromUrl);
        });

        it('should set isMonthSearch from store when isMonthSearchFromUrl is not defined in paramStore and isMonthSearchEnabled is true', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isMonthSearchEnabled', 'get').mockReturnValue(true);
            stores.searchStore.searchWhen.isMonthSearch = false;
            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.searchStore.searchWhen.setIsMonthSearch).toHaveBeenCalledWith(
                stores.searchStore.searchWhen.isMonthSearch,
            );
        });

        it('should redirect to HomePage when isMonthSearchFromUrl is true, but Month Search is disabled in Sitecore', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isMonthSearchEnabled', 'get').mockReturnValue(false);
            const mockIsMonthSearchFromUrl = true;
            jest.spyOn(stores.rootStore.queryParamsStore, 'isMonthSearchFromUrl', 'get').mockReturnValue(
                mockIsMonthSearchFromUrl,
            );
            stores.routerStore.redirectToHomePage = jest.fn();

            stores.searchStore.getValuesFromQueryParamsStore();

            expect(stores.routerStore.redirectToHomePage).toHaveBeenCalled();
        });
    });

    describe('resortsInVirtual', () => {
        beforeEach(() => {
            stores.searchStore.searchTo.countriesWithRegions = [
                {
                    type: DestinationType.VirtualCountry,
                    children: [{}, { code: 'code1' }],
                },
                {
                    type: DestinationType.VirtualCountry,
                    children: [{ code: 'code2' }, { code: 'code3' }],
                },
                {
                    type: DestinationType.Country,
                    children: [{ code: 'code4' }, { code: 'code5' }],
                },
            ] as any;
        });

        it('should be empty array when countriesWithRegions are undefined', () => {
            stores.searchStore.searchTo.countriesWithRegions = undefined as any;

            expect(stores.searchStore.resortsInVirtual).toStrictEqual([]);
        });

        it('should be correct array of codes', () => {
            expect(stores.searchStore.resortsInVirtual).toStrictEqual([undefined, 'code1', 'code2', 'code3']);
        });
    });

    describe('isHotelBookSelectedDestination', () => {
        beforeEach(() => {
            stores.rootStore.bookingStore.selectedOffer = { accom: { id: 'ES' } } as IOfferWithoutAltBoards;
            stores.searchStore.searchTo.selectedDestinations = [
                { code: 'ES', name: 'Spain' },
                { code: 'IT', name: 'Italy' },
            ];
        });

        it('should be true when hotelCode is provided and one of selectedDestinations is the same as hotel code', () => {
            expect(stores.searchStore.isHotelBookSelectedDestination).toBe(true);
        });

        it('should be false when hotelCode is NOT provided', () => {
            stores.rootStore.bookingStore.selectedOffer = null;

            expect(stores.searchStore.isHotelBookSelectedDestination).toBe(false);
        });

        it('should be false when none of selectedDestinations is the same as hotel code', () => {
            stores.searchStore.searchTo.selectedDestinations = [{ code: 'IT', name: 'Italy' }];

            expect(stores.searchStore.isHotelBookSelectedDestination).toBe(false);
        });
    });

    describe('manageVirtualRegions', () => {
        beforeEach(() => {
            stores.searchStore.searchTo.countriesWithRegions = [
                {
                    children: [
                        { code: '1', type: DestinationType.Region, relatedRegions: ['2', '3'] },
                        { code: '2', type: DestinationType.Region, relatedRegions: [] },
                        { code: '4', type: DestinationType.Region, relatedRegions: [] },
                    ],
                },
                {
                    children: [{ code: '3', type: DestinationType.VirtualRegion, relatedRegions: ['1', '2', '4'] }],
                },
            ] as IDestinationCountry[];

            stores.searchStore.searchTo.isDestinationAvailable = jest.fn().mockImplementation(code => code !== '2');

            stores.searchStore.searchTo.selectedDestinations = [{ code: '1' }] as IDestination[];
        });

        it('should NOT add virtual regions if only 1 region is selected', () => {
            stores.searchStore.manageVirtualRegions();

            expect(stores.searchStore.searchTo.selectedDestinations).not.toEqual(
                expect.arrayContaining([{ code: '3' }]),
            );
        });

        it('should add virtual regions if all other regions are selected', () => {
            stores.searchStore.searchTo.selectedDestinations = [{ code: '1' }, { code: '4' }] as IDestination[];

            stores.searchStore.manageVirtualRegions();

            expect(stores.searchStore.searchTo.selectedDestinations).toStrictEqual([
                { code: '1' },
                { code: '4' },
                {
                    code: '3',
                    parents: [{ children: [{ code: '3', relatedRegions: ['1', '2', '4'], type: 'VirtualRegion' }] }],
                    relatedRegions: ['1', '2', '4'],
                    type: DestinationType.VirtualRegion,
                },
            ]);
        });

        it('should add related regions even if some are unavailable', () => {
            stores.searchStore.searchTo.selectedDestinations = [
                { code: '1' },
                { code: '2' },
                { code: '3' },
            ] as IDestination[];

            stores.searchStore.manageVirtualRegions();

            expect(stores.searchStore.searchTo.selectedDestinations).toStrictEqual([
                { code: '1' },
                { code: '2' },
                { code: '3' },
            ]);
        });

        it('should NOT add virtual region if selectedDestinations are empty', () => {
            stores.searchStore.searchTo.selectedDestinations = [];

            stores.searchStore.manageVirtualRegions();

            expect(stores.searchStore.searchTo.selectedDestinations).not.toEqual(
                expect.arrayContaining([{ code: '3' }]),
            );
        });

        it('should return undefined when last region is unavailable', () => {
            stores.searchStore.searchTo.selectedDestinations = [
                { code: 'ES', name: 'Spain' },
                { code: 'IT', name: 'Italy' },
            ];

            const regionsToNotAddButSearch = stores.searchStore.manageVirtualRegions();

            expect(regionsToNotAddButSearch).toEqual(undefined);
        });

        it('should return undefined when selectedDestinations are undefined', () => {
            stores.searchStore.searchTo.countriesWithRegions = undefined as any;

            const regionsToNotAddButSearch = stores.searchStore.manageVirtualRegions();

            expect(regionsToNotAddButSearch).toEqual(undefined);
        });
    });

    describe('isToParamsValid', () => {
        it('should be undefined when selectedDestinationCodes and selectedAccommodationCodes are undefined', () => {
            stores.searchStore.searchTo.selectedAccommodationCodes = undefined as any;
            stores.searchStore.searchTo.selectedDestinationCodes = undefined as any;

            expect(stores.searchStore.isToParamsValid).toBe(undefined);
        });

        it('should be selectedAccommodationCodes when selectedDestinationCodes are undefined', () => {
            stores.searchStore.searchTo.selectedAccommodationCodes = 'LTN';
            stores.searchStore.searchTo.selectedDestinationCodes = undefined as any;

            expect(stores.searchStore.isToParamsValid).toBe(stores.searchStore.searchTo.selectedAccommodationCodes);
        });

        it('should be selectedAccommodationCodes when selectedDestinationCodes are empty array', () => {
            stores.searchStore.searchTo.selectedAccommodationCodes = 'LTN';
            stores.searchStore.searchTo.selectedDestinationCodes = [];

            expect(stores.searchStore.isToParamsValid).toBe(stores.searchStore.searchTo.selectedAccommodationCodes);
        });

        it('should be true when selectedDestinationCodes are provided', () => {
            stores.searchStore.searchTo.selectedAccommodationCodes = 'LTN';

            expect(stores.searchStore.isToParamsValid).toBe(stores.searchStore.searchTo.selectedAccommodationCodes);
        });
    });

    describe('getAvailableOriginsCodes', () => {
        beforeEach(() => {
            offersService.getAvailableOrigins = jest.fn().mockResolvedValue({});
        });

        it('should return null when selectedDestinationCodes is undefined and when params are not set up', async () => {
            stores.searchStore.searchTo.selectedDestinationCodes = undefined as any;
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(false);

            const result = await stores.searchStore.getAvailableOriginsCodes();

            expect(result).toBe(null);
        });

        it('should return null when selectedDestinationCodes is empty array and when params are not set up', async () => {
            stores.searchStore.searchTo.selectedDestinationCodes = [];
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(false);

            const result = await stores.searchStore.getAvailableOriginsCodes();

            expect(result).toBe(null);
        });

        it('should call getAvailableOrigins with correct data', async () => {
            stores.searchStore.searchTo.selectedDestinationCodes = ['SP'];
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWhen, 'whenParamsForRequest', 'get').mockReturnValue({
                fromParam: '2025-01-01',
                toParam: '2025-01-10',
                duration: 7,
                flexDays: 0,
            });

            await stores.searchStore.getAvailableOriginsCodes();

            expect(offersService.getAvailableOrigins).toHaveBeenCalledWith(
                'SP',
                '2025-01-01',
                '2025-01-10',
                0,
                undefined,
                7,
            );
        });

        it('should call getAvailableOrigins with promoPageId if isPromoPage = true', async () => {
            stores.searchStore.searchTo.selectedDestinationCodes = ['SP'];
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(false);
            jest.spyOn(stores.rootStore.layoutStore, 'layoutId', 'get').mockReturnValue('pageId');
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWhen, 'whenParamsForRequest', 'get').mockReturnValue({
                fromParam: '2025-01-01',
                toParam: '2025-01-10',
                duration: 7,
                flexDays: 0,
            });

            await stores.searchStore.getAvailableOriginsCodes();

            expect(offersService.getAvailableOrigins).toHaveBeenCalledWith(
                'SP',
                '2025-01-01',
                '2025-01-10',
                0,
                stores.rootStore.layoutStore.layoutId,
                7,
            );
        });
    });

    describe('collectOriginsTitles', () => {
        const origins = [
            {
                airports: [
                    { code: '1', name: 'name1', itemName: 'itemName1' },
                    { code: '2', name: 'name2', itemName: 'itemName2' },
                    { code: '3', name: 'name3', itemName: 'itemName3' },
                    { code: '4', name: 'name4', itemName: 'itemName4', airports: [] },
                ],
                code: 'C1',
                name: 'country1',
            },
        ] as IAirportCountry[];

        beforeEach(() => {
            stores.searchStore.originsWithNames = [{ code: 'IT', name: 'Italy' }];
            stores.searchStore.searchFrom.updateOriginsDisplayValue = jest.fn();
        });

        it('should call updateOriginsDisplayValue when newOriginsWithTitles exists', () => {
            stores.searchStore.collectOriginsTitles(origins);

            expect(stores.searchStore.searchFrom.updateOriginsDisplayValue).toHaveBeenCalled();
        });

        it('should NOT call updateOriginsDisplayValue when origins are empty', () => {
            stores.searchStore.collectOriginsTitles([]);

            expect(stores.searchStore.searchFrom.updateOriginsDisplayValue).not.toHaveBeenCalled();
        });
    });

    describe('clearSearchValues', () => {
        beforeEach(() => {
            stores.searchStore.clearSortDropdown = jest.fn();
            stores.searchStore.searchFrom.onClearOrigins = jest.fn();
            stores.searchStore.searchFrom.updateOriginsDisplayValue = jest.fn();
            stores.searchStore.searchTo.clearDestinations = jest.fn();
            stores.searchStore.searchTo.updateDestinationCodes = jest.fn();
            stores.searchStore.searchTo.updateAvailableDstCodes = jest.fn();
            stores.searchStore.searchTo.typeAheadDestinations = {} as ITypeAheadResponse;
            stores.searchStore.searchWhen.clearDates = jest.fn();
            stores.searchStore.searchWhen.setIsMonthSearch = jest.fn();
            stores.searchStore.searchWhen.flexDays = 3;
            stores.searchStore.searchWhen.resetDateAvailabilityInterval = jest.fn();
            stores.searchStore.searchWhen.monthsAvailability = mockMonthsAvailability;
            stores.searchStore.searchWho.isAutoAllocation = true;
            stores.searchStore.searchWho.onClearRoom = jest.fn();
            stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue = jest.fn();
            stores.searchStore.setPageNumber = jest.fn();
            stores.searchStore.setPrevPageNumber = jest.fn();
        });

        it('should call correct functions', () => {
            stores.searchStore.clearSearchValues(true);

            expect(stores.searchStore.searchWhen.clearDates).toHaveBeenCalledWith(true);
            expect(stores.searchStore.searchFrom.onClearOrigins).toHaveBeenCalledWith(true);
            expect(stores.searchStore.searchFrom.updateOriginsDisplayValue).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.clearDestinations).toHaveBeenCalledWith({ noUpdate: true });
            expect(stores.searchStore.searchWho.onClearRoom).toHaveBeenCalled();
            expect(stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue).toHaveBeenCalled();
            expect(stores.searchStore.setPrevPageNumber).toHaveBeenCalledWith(null);
            expect(stores.searchStore.setPageNumber).toHaveBeenCalledWith(1);
            expect(stores.searchStore.searchWhen.setIsMonthSearch).toHaveBeenCalledWith(false);
            expect(stores.searchStore.clearSortDropdown).toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.flexDays).toBe(0);
            expect(stores.searchStore.searchWhen.monthsAvailability).toStrictEqual([]);
        });

        it('should call additional functions when noUpdate is false', () => {
            stores.searchStore.clearSearchValues(false);

            expect(stores.searchStore.searchWhen.resetDateAvailabilityInterval).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.typeAheadDestinations).toBe(null);
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateDestinationCodes).toHaveBeenCalled();
        });
    });

    describe('clearAvailableCodesAndDates', () => {
        it('should clear correct data', () => {
            stores.searchStore.searchWhen.availableDates = [];
            stores.searchStore.searchWhen['availableDateEnd'] = new Date('11-11-2020');
            stores.searchStore.searchWhen['availableDateStart'] = new Date('10-10-2020');
            stores.searchStore.searchFrom.setAvailableOrigins = jest.fn();
            stores.searchStore.searchTo.availableDestinationsCodes = [];

            stores.searchStore.clearAvailableCodesAndDates();

            expect(stores.searchStore.searchWhen.availableDates).toBe(null);
            expect(stores.searchStore.searchWhen['availableDateEnd']).toBe(null);
            expect(stores.searchStore.searchWhen['availableDateStart']).toBe(null);
            expect(stores.searchStore.searchTo.availableDestinationsCodes).toBe(null);
            expect(stores.searchStore.searchFrom.setAvailableOrigins).toHaveBeenCalledWith(null);
        });
    });

    describe('setOldSearchParam', () => {
        it('should do nothing when isOldParamSet is true', () => {
            stores.searchStore.oldOrigins = null;
            stores.searchStore.oldFrom = null;
            stores.searchStore.oldTo = null;
            stores.searchStore.oldIsFlexible = 0;
            stores.searchStore.oldIsMonthSearch = false;
            stores.searchStore.oldMonthSearchDuration = 3;
            stores.searchStore.oldRooms = [];
            stores.searchStore.oldIsAutoAllocation = false;
            stores.searchStore.oldSelectedDestinations = null;

            stores.searchStore.isOldParamSet = true;

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldOrigins).toBeNull();
            expect(stores.searchStore.oldFrom).toBeNull();
            expect(stores.searchStore.oldTo).toBeNull();
            expect(stores.searchStore.oldIsFlexible).toBe(0);
            expect(stores.searchStore.oldIsMonthSearch).toBe(false);
            expect(stores.searchStore.oldMonthSearchDuration).toBe(3);
            expect(stores.searchStore.oldRooms).toEqual([]);
            expect(stores.searchStore.oldIsAutoAllocation).toBe(false);
            expect(stores.searchStore.oldSelectedDestinations).toBeNull();
            expect(stores.searchStore.isOldParamSet).toBe(true);
        });

        it('should change isOldParamSet to true when it is initially equals to false', () => {
            stores.searchStore.isOldParamSet = false;

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.isOldParamSet).toBe(true);
        });

        it('should set origins from searchFrom to oldOrigins field when origins is not an empty array', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldOrigins = null;
            stores.searchStore.searchFrom.origins = ['LGW', 'BFS', 'LTN'];

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldOrigins).toEqual(stores.searchStore.searchFrom.origins);
        });

        it('should set originFromUrl from queryParamsStore to oldOrigins field when origins is an empty array', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldOrigins = null;
            stores.searchStore.searchFrom.origins = [];
            jest.spyOn(stores.rootStore.queryParamsStore, 'originFromUrl', 'get').mockReturnValue([
                'LGW',
                'BFS',
                'LTN',
            ]);

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldOrigins).toEqual(stores.rootStore.queryParamsStore.originFromUrl);
        });

        it('should set selectedDestinations from searchTo to oldSelectedDestinations field when oldSelectedDestinations is not defined and availableDestinationsCodes is an empty array', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldSelectedDestinations = null;
            jest.spyOn(stores.rootStore.queryParamsStore, 'destinationFromUrl', 'get').mockReturnValue('LGW, BFS');
            stores.searchStore.searchTo.availableDestinationsCodes = [];
            stores.searchStore.searchTo.selectedDestinations = [
                { code: 'ES', name: 'Spain' },
                { code: 'IT', name: 'Italy' },
            ];

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldSelectedDestinations).toEqual(
                stores.searchStore.searchTo.selectedDestinations,
            );
        });

        it('should set isAutoAllocation value to oldIsAutoAllocation field on holidays site', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldIsAutoAllocation = false;
            stores.searchStore.searchWho.isAutoAllocation = true;
            jest.spyOn(stores.rootStore.layoutStore, 'isTradePortal', 'get').mockReturnValue(false);

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldIsAutoAllocation).toEqual(stores.searchStore.searchWho.isAutoAllocation);
        });

        it('should set oldFrom, oldTo, oldIsFlexible with values from searchWhen store if they are defined', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldFrom = null;
            stores.searchStore.oldTo = null;
            stores.searchStore.oldIsFlexible = 0;

            stores.searchStore.searchWhen.from = new Date('2020-01-15');
            stores.searchStore.searchWhen.to = new Date('2020-01-20');
            stores.searchStore.searchWhen.flexDays = 10;

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldFrom).toEqual(stores.searchStore.searchWhen.from);
            expect(stores.searchStore.oldTo).toEqual(stores.searchStore.searchWhen.to);
            expect(stores.searchStore.oldIsFlexible).toEqual(stores.searchStore.searchWhen.flexDays);
        });

        it('should set oldFrom, oldTo, oldIsFlexible with values from queryParamsStore store when searchWhen fields are not defined', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldFrom = null;
            stores.searchStore.oldTo = null;
            stores.searchStore.oldIsFlexible = 0;

            stores.searchStore.searchWhen.from = null;
            stores.searchStore.searchWhen.to = null;
            stores.searchStore.searchWhen.flexDays = 0;

            jest.spyOn(stores.rootStore.queryParamsStore, 'fromDateFromUrl', 'get').mockReturnValue(
                new Date('2020-01-15'),
            );
            jest.spyOn(stores.rootStore.queryParamsStore, 'toDateFromUrl', 'get').mockReturnValue(
                new Date('2020-01-20'),
            );
            jest.spyOn(stores.rootStore.queryParamsStore, 'flexDaysFromUrl', 'get').mockReturnValue(10);

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldFrom).toEqual(stores.rootStore.queryParamsStore.fromDateFromUrl);
            expect(stores.searchStore.oldTo).toEqual(stores.rootStore.queryParamsStore.toDateFromUrl);
            expect(stores.searchStore.oldIsFlexible).toEqual(stores.rootStore.queryParamsStore.flexDaysFromUrl);
        });

        it('should set isMonthSearch from searchWhen to oldIsMonthSearch field when isMonthSearch is true', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldIsMonthSearch = false;
            stores.searchStore.searchWhen.isMonthSearch = true;

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldIsMonthSearch).toBe(true);
        });

        it('should set isMonthSearch from queryParamsStore to oldIsMonthSearch field when origins is an empty array', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldOrigins = null;
            stores.searchStore.searchFrom.origins = [];
            jest.spyOn(stores.rootStore.queryParamsStore, 'originFromUrl', 'get').mockReturnValue([
                'LGW',
                'BFS',
                'LTN',
            ]);

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldOrigins).toEqual(stores.rootStore.queryParamsStore.originFromUrl);
        });

        it('should set origins from searchFrom to oldOrigins field when origins is not an empty array', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldOrigins = null;
            stores.searchStore.searchFrom.origins = ['LGW', 'BFS', 'LTN'];

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldOrigins).toEqual(stores.searchStore.searchFrom.origins);
        });

        it('should set originFromUrl from queryParamsStore to oldOrigins field when origins is an empty array', () => {
            stores.searchStore.isOldParamSet = false;
            stores.searchStore.oldOrigins = null;
            stores.searchStore.searchFrom.origins = [];
            jest.spyOn(stores.rootStore.queryParamsStore, 'originFromUrl', 'get').mockReturnValue([
                'LGW',
                'BFS',
                'LTN',
            ]);

            stores.searchStore.setOldSearchParam();

            expect(stores.searchStore.oldOrigins).toEqual(stores.rootStore.queryParamsStore.originFromUrl);
        });
    });

    describe('setOldSearchParamToSearchParam ', () => {
        const oldSelectedDestinations = [
            { code: 'ES', name: 'Spain' },
            { code: 'IT', name: 'Italy' },
        ];
        const oldOrigins = ['LGW', 'LTN'];

        beforeEach(() => {
            stores.searchStore.oldSelectedDestinations = oldSelectedDestinations;
            stores.searchStore.oldOrigins = oldOrigins;
            stores.searchStore.searchFrom.setOrigins = jest.fn();
            stores.searchStore.searchTo.changeDestinations = jest.fn();
            stores.searchStore.searchWho.setRoomsAllocation = jest.fn();
            stores.searchStore.searchFrom.setOrigins = jest.fn();
            stores.searchStore.searchWhen.onChangeDates = jest.fn();
            stores.searchStore.searchWhen.onChangeFlexible = jest.fn();
            stores.searchStore.searchWhen.updateAvailableDates = jest.fn();
            stores.searchStore.searchFrom.updateAvailableOrigins = jest.fn();
            stores.searchStore.searchTo.updateAvailableDstCodes = jest.fn();
        });

        it('Should call setRoomsAllocation with right params for SearchStore', () => {
            const mockOldRooms = [{}] as RoomAllocation[];
            stores.searchStore.oldRooms = mockOldRooms;

            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchWho.setRoomsAllocation).toHaveBeenCalledWith(mockOldRooms);
        });

        it('should calls setRoomsAllocation with right params for query', () => {
            const mockOldRooms = [{}] as RoomAllocation[];
            stores.searchStore.oldRooms = mockOldRooms;

            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchWho.setRoomsAllocation).toHaveBeenCalledWith(mockOldRooms);
        });

        it('should call setOrigins when oldOrigins are exist and new origin different', () => {
            stores.searchStore.searchFrom.origins = ['HUI', 'LGW', 'LTN'];
            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchFrom.setOrigins).toHaveBeenCalledWith(oldOrigins, false);
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
            expect(stores.searchStore.searchFrom.updateAvailableOrigins).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).toHaveBeenCalled();
        });

        it('should NOT call setOrigins when oldOrigins the same as origins', () => {
            stores.searchStore.searchFrom.origins = oldOrigins;
            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchFrom.setOrigins).not.toHaveBeenCalled();
        });

        it('should call changeDestinations when oldSelectedDestinations are exist and different', () => {
            stores.searchStore.searchTo.selectedDestinations = [
                { code: 'ES', name: 'Spain' },
                { code: 'IT', name: 'Italy' },
                { code: 'PO', name: 'Porty' },
            ];
            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchTo.changeDestinations).toHaveBeenCalledWith(
                oldSelectedDestinations,
                false,
                false,
            );
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
            expect(stores.searchStore.searchFrom.updateAvailableOrigins).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).toHaveBeenCalled();
        });

        it('should NOT call changeDestinations when oldSelectedDestinations the same as selectedDestinations', () => {
            stores.searchStore.searchTo.selectedDestinations = oldSelectedDestinations;
            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchTo.changeDestinations).not.toHaveBeenCalled();
        });

        it('should call onChangeDates when oldTo and oldFrom are exist and from was changed', () => {
            stores.searchStore.searchWhen.to = new Date('2025-01-30');
            stores.searchStore.searchWhen.from = new Date('2025-01-20');
            stores.searchStore.oldTo = new Date('2025-01-30');
            stores.searchStore.oldFrom = new Date('2024-03-20');
            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith(
                [new Date('2024-03-20'), new Date('2025-01-30')],
                false,
            );
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
            expect(stores.searchStore.searchFrom.updateAvailableOrigins).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).toHaveBeenCalled();
        });

        it('should call onChangeDates when oldTo and oldFrom are exist and to was changed', () => {
            stores.searchStore.searchWhen.to = new Date('2025-01-30');
            stores.searchStore.searchWhen.from = new Date('2024-03-20');
            stores.searchStore.oldTo = new Date('2024-03-23');
            stores.searchStore.oldFrom = new Date('2024-03-20');
            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith(
                [new Date('2024-03-20'), new Date('2024-03-23')],
                false,
            );
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
            expect(stores.searchStore.searchFrom.updateAvailableOrigins).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).toHaveBeenCalled();
        });

        it('should NOT call onChangeDates when oldTo and oldFrom the same as to and from', () => {
            stores.searchStore.searchWhen.to = new Date('2025-03-23');
            stores.searchStore.searchWhen.from = new Date('2025-03-20');
            stores.searchStore.oldTo = new Date('2025-03-23');
            stores.searchStore.oldFrom = new Date('2025-03-20');
            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchWhen.onChangeDates).not.toHaveBeenCalled();
        });

        it('should NOT call setOrigins and changeDestinations when oldOrigin and oldSelectedDestinations are NOT provided', () => {
            stores.searchStore.oldSelectedDestinations = undefined;
            stores.searchStore.oldOrigins = undefined;

            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchFrom.setOrigins).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.changeDestinations).not.toHaveBeenCalled();
        });

        it('should update flexDays', () => {
            stores.searchStore.oldIsFlexible = 2;
            stores.searchStore.searchWhen.flexDays = 5;

            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledWith(2);
        });

        it('should not call update flexDays when flexDays was not changed', () => {
            stores.searchStore.oldIsFlexible = 2;
            stores.searchStore.searchWhen.flexDays = 2;

            stores.searchStore.setOldSearchParamToSearchParam();

            expect(stores.searchStore.searchWhen.onChangeFlexible).not.toHaveBeenCalled();
        });

        it('should NOT call API when params were no changed', () => {
            stores.searchStore.searchWhen.to = new Date();
            stores.searchStore.searchWhen.from = new Date();
            stores.searchStore.oldTo = new Date();
            stores.searchStore.oldFrom = new Date();
            stores.searchStore.oldSelectedDestinations = [{ code: 'ES', name: 'Spain' }];
            stores.searchStore.searchTo.selectedDestinations = [{ code: 'ES', name: 'Spain' }];
            stores.searchStore.oldOrigins = ['LGW'];
            stores.searchStore.searchFrom.origins = ['LGW'];

            expect(stores.searchStore.searchWhen.updateAvailableDates).not.toHaveBeenCalled();
            expect(stores.searchStore.searchFrom.updateAvailableOrigins).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).not.toHaveBeenCalled();
        });
    });

    describe('setSpecialFilters', () => {
        it('should set the appropriate value to the passed field', () => {
            stores.searchStore.setSpecialFilters(OffersAndPromotionsSettings.KidsGoFree, true);

            expect(stores.searchStore[OffersAndPromotionsSettings.KidsGoFree]).toEqual(true);
        });
    });

    describe('isSearchSubmitDisabled', () => {
        it('should return false on HotelDetailsBrowse page on holidays site', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(false);
            jest.spyOn(stores.rootStore.layoutStore, 'isHotelDetailsBrowsePage', 'get').mockReturnValue(true);
            jest.spyOn(stores.rootStore.layoutStore, 'isHotelDetailsBookPage', 'get').mockReturnValue(false);
            jest.spyOn(stores.rootStore.layoutStore, 'isTradePortal', 'get').mockReturnValue(false);

            expect(stores.searchStore.isSearchSubmitDisabled).toEqual(false);
        });

        it('should return false on HotelDetailsBook page on holidays site', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(false);
            jest.spyOn(stores.rootStore.layoutStore, 'isHotelDetailsBrowsePage', 'get').mockReturnValue(false);
            jest.spyOn(stores.rootStore.layoutStore, 'isHotelDetailsBookPage', 'get').mockReturnValue(true);
            jest.spyOn(stores.rootStore.layoutStore, 'isTradePortal', 'get').mockReturnValue(false);

            expect(stores.searchStore.isSearchSubmitDisabled).toEqual(false);
        });

        it('should return true when isSearchValid is false on trade portal', () => {
            jest.spyOn(stores.searchStore, 'isSearchValid', 'get').mockReturnValue(false);
            jest.spyOn(stores.rootStore.layoutStore, 'isTradePortal', 'get').mockReturnValue(true);

            expect(stores.searchStore.isSearchSubmitDisabled).toEqual(true);
        });

        it('should return true when isGuestsParametersValid is false on Promo page on trade portal', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWho, 'isGuestsParametersValid', 'get').mockReturnValue(false);
            jest.spyOn(stores.rootStore.layoutStore, 'isTradePortal', 'get').mockReturnValue(true);

            expect(stores.searchStore.isSearchSubmitDisabled).toEqual(true);
        });

        it('should return true when isWhenParamsValid is false on Promo page on trade portal', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(false);
            jest.spyOn(stores.searchStore.searchWho, 'isGuestsParametersValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.rootStore.layoutStore, 'isTradePortal', 'get').mockReturnValue(true);

            expect(stores.searchStore.isSearchSubmitDisabled).toEqual(true);
        });

        it('should return false when both isGuestsParametersValid & isWhenParamsValid are true on Promo page on trade portal', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWhen, 'isWhenParamsValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWho, 'isGuestsParametersValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.rootStore.layoutStore, 'isTradePortal', 'get').mockReturnValue(true);

            expect(stores.searchStore.isSearchSubmitDisabled).toEqual(false);
        });
    });

    describe('clearSortDropdown', () => {
        it('should set default values when the first element of sortConfig arr is not defined', () => {
            stores.searchStore.sortConfig = [];
            stores.searchStore.orderBy = undefined as any;
            stores.searchStore.orderDirection = undefined as any;

            stores.searchStore.clearSortDropdown();

            expect(stores.searchStore.orderBy).toBe(OrderBy.Recommended);
            expect(stores.searchStore.orderDirection).toBe(OrderDirection.Default);
        });

        it('should set values from the first element of sortConfig arr when it is defined', () => {
            stores.searchStore.sortConfig = [
                { orderBy: OrderBy.DiscAmount, orderDirection: OrderDirection.Asc, title: '', code: '' },
            ];
            stores.searchStore.orderBy = undefined as any;
            stores.searchStore.orderDirection = undefined as any;

            stores.searchStore.clearSortDropdown();

            expect(stores.searchStore.orderBy).toBe(stores.searchStore.sortConfig[0].orderBy);
            expect(stores.searchStore.orderDirection).toBe(stores.searchStore.sortConfig[0].orderDirection);
        });
    });

    describe('selectHotelBookAsDestination', () => {
        it('should not call selectSingleDestination when selectedOffer is null', () => {
            stores.rootStore.bookingStore.selectedOffer = null;
            stores.searchStore.searchTo.selectSingleDestination = jest.fn();

            stores.searchStore.selectHotelBookAsDestination();

            expect(stores.searchStore.searchTo.selectSingleDestination).not.toHaveBeenCalled();
        });

        it('should call selectSingleDestination with expected params when selectedOffer with hotel is defined in bookingStore', () => {
            stores.rootStore.bookingStore.selectedOffer = { ...mockedOffer };
            stores.searchStore.searchTo.selectSingleDestination = jest.fn();

            stores.searchStore.selectHotelBookAsDestination();

            expect(stores.searchStore.searchTo.selectSingleDestination).toHaveBeenCalledWith({
                code: mockedOffer.accom.id,
                name: mockedOffer.hotel!.name,
                type: DestinationType.Hotel,
            });
        });

        it('should call selectSingleDestination with empty string in name param field when selectedOffer without hotel is defined in bookingStore', () => {
            stores.rootStore.bookingStore.selectedOffer = { ...mockedOffer, hotel: null };
            stores.searchStore.searchTo.selectSingleDestination = jest.fn();

            stores.searchStore.selectHotelBookAsDestination();

            expect(stores.searchStore.searchTo.selectSingleDestination).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: '',
                }),
            );
        });
    });

    describe('validateWhoParameters', () => {
        beforeEach(() => {
            stores.searchStore.searchWho.validateGuestQuantity = jest.fn().mockReturnValue(false);
            stores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(true);
            jest.mocked(isBackend).mockReturnValue(true);
        });

        it('should call focusInputError private method and set focus on element with appropriate id exists & isBackend returns false', () => {
            stores.searchStore.searchWho.validateGuestQuantity = jest.fn().mockReturnValue(true);
            jest.useFakeTimers();
            jest.mocked(isBackend).mockReturnValue(false);

            stores.searchStore.validateWhoParameters();
            jest.runAllTimers();

            expect(document.getElementById('search-who')).toHaveFocus();
            jest.useRealTimers();
        });

        it('should call focusInputError private method and NOT proceed method execution when isBackend returns true', () => {
            stores.searchStore.searchWho.validateGuestQuantity = jest.fn().mockReturnValue(true);
            document.getElementById = jest.fn();

            stores.searchStore.validateWhoParameters();

            expect(document.getElementById).not.toHaveBeenCalled();
        });

        it('should return true when validateGuestQuantity returns true', () => {
            stores.searchStore.searchWho.validateGuestQuantity = jest.fn().mockReturnValue(true);

            const res = stores.searchStore.validateWhoParameters();

            expect(res).toBe(true);
        });

        it('should return true when validateChildrenAge returns false', () => {
            stores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(false);

            const res = stores.searchStore.validateWhoParameters();

            expect(res).toBe(true);
        });

        it('should return false when validateGuestQuantity returns false and validateChildrenAge returns true', () => {
            const res = stores.searchStore.validateWhoParameters();

            expect(res).toBe(false);
        });
    });

    describe('deserialize ', () => {
        let stores;

        beforeEach(() => {
            stores = createHolidaysAppStores();
            stores.searchStore.take = 2;
            stores.searchStore.page = 2;
            stores.searchStore.orderBy = OrderBy.DiscAmount;
            stores.searchStore.orderDirection = OrderDirection.Asc;
            stores.searchStore.sortConfig = [{}];
            stores.searchStore.searchFrom = { deserialize: jest.fn() };
            stores.searchStore.searchTo = { deserialize: jest.fn() };
            stores.searchStore.searchWhen = { deserialize: jest.fn() };
            stores.searchStore.searchWho = { deserialize: jest.fn() };
        });

        it('should do nothing when initialState is NOT provided', () => {
            stores.searchStore.deserialize();

            expect(stores.searchStore.take).toBe(2);
            expect(stores.searchStore.page).toBe(2);
            expect(stores.searchStore.orderBy).toBe(OrderBy.DiscAmount);
            expect(stores.searchStore.orderDirection).toBe(OrderDirection.Asc);
            expect(stores.searchStore.sortConfig).toStrictEqual([{}]);
            expect(stores.searchStore.searchFrom.deserialize).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.deserialize).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.deserialize).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWho.deserialize).not.toHaveBeenCalled();
        });

        it('should set values from initialState', () => {
            stores.searchStore.searchFrom = { deserialize: jest.fn() };
            stores.searchStore.searchTo = { deserialize: jest.fn() };
            stores.searchStore.searchWhen = { deserialize: jest.fn() };
            stores.searchStore.searchWho = { deserialize: jest.fn() };

            const initialState = {
                take: 7,
                page: 7,
                orderBy: OrderBy.Price,
                orderDirection: OrderDirection.Desc,
                sortConfig: [{}],
                searchTo: {},
                searchFrom: {},
                searchWhen: {},
                searchWho: {},
            };

            stores.searchStore.deserialize(initialState);

            expect(stores.searchStore.take).toBe(initialState.take);
            expect(stores.searchStore.page).toBe(initialState.page);
            expect(stores.searchStore.orderBy).toBe(initialState.orderBy);
            expect(stores.searchStore.sortConfig).toStrictEqual(initialState.sortConfig);
            expect(stores.searchStore.searchFrom.deserialize).toHaveBeenCalledWith(initialState.searchFrom);
            expect(stores.searchStore.searchTo.deserialize).toHaveBeenCalledWith(initialState.searchTo);
            expect(stores.searchStore.searchWho.deserialize).toHaveBeenCalledWith(initialState.searchWho);
            expect(stores.searchStore.searchWhen.deserialize).toHaveBeenCalledWith(initialState.searchWhen);
        });

        it('should set default values when initial state is empty', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'numberOfResultsPerPage', 'get').mockReturnValue(100);

            stores.searchStore.deserialize({});

            expect(stores.searchStore.take).toBe(100);
            expect(stores.searchStore.page).toBe(1);
            expect(stores.searchStore.orderBy).toBe(OrderBy.Recommended);
            expect(stores.searchStore.orderDirection).toBe(OrderDirection.Default);
            expect(stores.searchStore.sortConfig).toStrictEqual([]);
            expect(stores.searchStore.searchFrom.deserialize).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.deserialize).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.deserialize).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWho.deserialize).not.toHaveBeenCalled();
        });
    });

    describe('setIsSelectedPackageFromMap', () => {
        it('should set isSelectedPackageFromMap', () => {
            const stores = createHolidaysAppStores();

            expect(stores.searchStore.isSelectedPackageFromMap).toBe(false);

            stores.searchStore.setIsSelectedPackageFromMap(true);

            expect(stores.searchStore.isSelectedPackageFromMap).toBe(true);
        });
    });

    describe('trackUserSearch', () => {
        beforeEach(() => {
            jest.spyOn(stores.rootStore.layoutStore, 'getSettingAsBoolean').mockReturnValue(true);
            stores.rootStore.bookingStore.origins = ['LGW'];
            stores.rootStore.bookingStore.selectedDestinationCodes = ['ES'];
            stores.rootStore.bookingStore.from = new Date('2020-01-15');
            stores.rootStore.bookingStore.to = new Date('2020-01-20');
            AxiosRequest.post = jest.fn().mockResolvedValue({ data: {} });
        });

        it('should send data to notification service', () => {
            const mockTrackEvent = jest.spyOn(trackingApi, 'trackEvent').mockResolvedValueOnce();
            stores.searchStore.trackUserSearch();

            expect(AxiosRequest.post).toHaveBeenCalledWith('http://test/cms-api/tracking/user-search', {
                from: ['LGW'],
                to: ['ES'],
                startDate: '15/01/2020',
                endDate: '20/01/2020',
            });
            expect(mockTrackEvent).toHaveBeenCalledWith([{ goalId: '{333AE041-C826-4431-AA6E-BBB762A51C85}' }], {
                fetcher: expect.any(Function),
                host: undefined,
            });
        });
    });

    describe('isCheapestMonthAllowed', () => {
        let mockDestination: IDestination;
        let mockTotalGuestsQuantity, mockSelectedAvailableOrigins, mockGetVirtualRegionDestinationDataResult;
        let mockedSelectedDestinations: IDestination[];

        beforeEach(() => {
            mockDestination = { code: 'MA', name: 'Marocco', type: DestinationType.Region } as IDestination;
            mockGetVirtualRegionDestinationDataResult = {
                areOnlyRelatedRegionsSelected: true,
            };

            mockedSelectedDestinations = [mockDestination];
            stores.searchStore.searchWho.isAutoAllocation = true;
            stores.searchStore.searchTo.availableDestinationsCodes = ['MA'];

            jest.spyOn(stores.searchStore.searchWho, 'adultsQuantity', 'get').mockReturnValue(2);
            mockSelectedAvailableOrigins = jest
                .spyOn(stores.searchStore.searchFrom, 'selectedAvailableOrigins', 'get')
                .mockReturnValue(['LGW']);
            mockTotalGuestsQuantity = jest
                .spyOn(stores.searchStore.searchWho, 'totalGuestsQuantity', 'get')
                .mockReturnValue(2);
            jest.spyOn(searchUtils, 'getVirtualRegionDestinationData').mockReturnValue(
                mockGetVirtualRegionDestinationDataResult,
            );
            jest.spyOn(searchUtils, 'getParentVirtualCountry').mockReturnValue(undefined);
            jest.spyOn(stores.searchStore.searchWhen, 'monthSearchDuration', 'get').mockReturnValue(7);
        });

        it('should return isAllowed = true, when 1 selectedAvailableOrigins, 1 selectedFullyAvailableDestinations, 2 adult passengers and isAutoAllocation is true', () => {
            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(true);
        });

        it('should return isAllowed = false, when adults are 2, mockTotalGuestsQuantity is 3 and isAutoAllocation is true', () => {
            mockTotalGuestsQuantity.mockReturnValue(3);

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(false);
        });

        it('should return isAllowed = false, when mockSelectedAvailableOrigins returns []', () => {
            mockSelectedAvailableOrigins.mockReturnValue([]);

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(false);
        });

        it('should return isAllowed = false, when destination is a Hotel', () => {
            mockDestination.type = DestinationType.Hotel;

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(false);
        });

        it('should return isAllowed = true, when parent of destination is a VirtualCountry', () => {
            jest.spyOn(searchUtils, 'getParentVirtualCountry').mockReturnValue(mockDestination);

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(true);
        });

        it('should return isAllowed = false, when parent of destination is a VirtualCountry, but has a type NOT Resort', () => {
            mockDestination.type = DestinationType.Hotel;
            mockDestination.parents = [{ type: DestinationType.VirtualCountry }] as IDestination['parents'];

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(false);
        });

        it('should return isAllowed = false, when selectedAvailableOrigins is [DEPARTURE_ALL_CODE]', () => {
            mockSelectedAvailableOrigins.mockReturnValue([DEPARTURE_ALL_CODE]);

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(false);
        });

        it('should return isAllowed = false, when selectedFullyAvailableDestinations returns []', () => {
            mockedSelectedDestinations = [];

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(false);
        });

        it('should return isAllowed = false, when isAutoAllocation is false', () => {
            stores.searchStore.searchWho.isAutoAllocation = false;

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(false);
        });

        it('should return isAllowed = true, when getVirtualRegionDestinationData.areOnlyRelatedRegionsSelected is false, but selectedDestination more then 1', () => {
            mockGetVirtualRegionDestinationDataResult.areOnlyRelatedRegionsSelected = false;
            mockedSelectedDestinations = [mockDestination, mockDestination];

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(true);
        });

        it('should return isAllowed = false, when searchWhen.monthSearchDuration is NOT 7', () => {
            jest.spyOn(searchUtils, 'getParentVirtualCountry').mockReturnValue(mockDestination);
            jest.spyOn(stores.searchStore.searchWhen, 'monthSearchDuration', 'get').mockReturnValue(3);

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(false);
        });

        it('should return isAllowed = true, when chosen country', () => {
            mockDestination.type = DestinationType.Country;
            mockDestination.children = [
                { type: DestinationType.Region, code: 'CYLN' },
                { type: DestinationType.Region, code: 'CYPF' },
            ] as IDestination['children'];

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(true);
        });

        it('should return isAllowed = true, when chosen destination is a virtual country with one region', () => {
            mockDestination.type = DestinationType.VirtualCountry;
            mockDestination.children = [{ type: DestinationType.Resort, code: 'MA' }] as IDestination['children'];

            const result = stores.searchStore.isCheapestMonthAllowed(mockedSelectedDestinations);

            expect(result).toBe(true);
        });
    });
});
