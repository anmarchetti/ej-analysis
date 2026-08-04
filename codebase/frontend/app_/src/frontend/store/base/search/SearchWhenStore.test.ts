import { destinationRegionMock } from 'frontend/__mocks__';
import { mockMonthsAvailability } from 'frontend/__mocks__/monthsAvailability';
import offersService from 'frontend/services/offers.service';
import { createHolidaysAppStores, IHolidaysStores } from 'frontend/store/holidays/create-stores';
import { formatDateL10n, getDate, parseDateL10n } from 'frontend/utils/date.utils';

import { ISearchWhenInitialState } from './SearchWhenStore';

const mockMonthSearchDuration = 7;
let stores: IHolidaysStores;

jest.mock('frontend/services/offers.service', () => ({
    ...jest.requireActual('frontend/services/offers.service'),
    getLastAvailableDate: jest.fn(),
    getAvailableMonths: jest.fn().mockResolvedValue({
        monthsAvailability: mockMonthsAvailability,
        lastAvailableDate: '2026-10-31T00:00:00',
    }),
}));

const mockGetCheapestMonthQuery = jest.fn();
jest.mock('frontend/utils/search/search.utils', () => ({
    ...jest.requireActual('frontend/utils/search/search.utils'),
    getCheapestMonthQuery: (...params) => mockGetCheapestMonthQuery(...params),
}));

describe('SearchWhenStore', () => {
    beforeEach(() => {
        stores = createHolidaysAppStores();
    });

    describe('serialize', () => {
        it('should return initial state object', () => {
            const mockMonthSearchDuration = 10;
            stores.searchStore.searchWhen.from = new Date('2024-10-12');
            stores.searchStore.searchWhen.to = new Date('2024-10-13');
            stores.searchStore.searchWhen.flexDays = 3;
            stores.searchStore.searchWhen.isMonthSearch = true;
            stores.searchStore.searchWhen.setMonthSearchDuration(mockMonthSearchDuration);
            stores.searchStore.searchWho.isAutoAllocation = true;

            expect(stores.searchStore.searchWhen.serialize()).toEqual({
                from: formatDateL10n(stores.searchStore.searchWhen.from),
                to: formatDateL10n(stores.searchStore.searchWhen.to),
                flexDays: stores.searchStore.searchWhen.flexDays,
                isMonthSearch: stores.searchStore.searchWhen.isMonthSearch,
                monthSearchDuration: mockMonthSearchDuration,
            });
        });
    });

    describe('deserialize', () => {
        it('should do nothing when no initialState', () => {
            stores.searchStore.searchWhen.deserialize();

            expect(stores.searchStore.searchWhen.from).toBeUndefined();
            expect(stores.searchStore.searchWhen.to).toBeUndefined();
            expect(stores.searchStore.searchWhen.flexDays).toBeUndefined();
            expect(stores.searchStore.searchWhen.isMonthSearch).toBe(false);
            expect(stores.searchStore.searchWhen.monthSearchDuration).toBe(0); // default value when _monthSearchDuration is undefined
        });

        it('should initialize store using initial state', () => {
            const initialState: ISearchWhenInitialState = {
                from: '19-05-2025',
                to: '29-05-2025',
                flexDays: 5,
                isMonthSearch: true,
                monthSearchDuration: 10,
            };

            stores.searchStore.searchWhen.deserialize(initialState);

            expect(stores.searchStore.searchWhen.from).toEqual(parseDateL10n(initialState.from));
            expect(stores.searchStore.searchWhen.to).toEqual(parseDateL10n(initialState.to));
            expect(stores.searchStore.searchWhen.flexDays).toBe(initialState.flexDays);
            expect(stores.searchStore.searchWhen.isMonthSearch).toBe(initialState.isMonthSearch);
            expect(stores.searchStore.searchWhen.monthSearchDuration).toBe(initialState.monthSearchDuration);
        });
    });

    describe('firstAvailableDepartureDate', () => {
        const mockDateString = '2025-05-02T10:45:30';

        it('should return data when there is some dates with "out" true', () => {
            stores.searchStore.searchWhen.availableDates = [{ date: mockDateString, in: false, out: true }];

            expect(stores.searchStore.searchWhen.firstAvailableDepartureDate).toEqual(getDate(mockDateString));
        });

        it('should return undefined when there is no dates with "out" false', () => {
            stores.searchStore.searchWhen.availableDates = [{ date: mockDateString, in: false, out: false }];

            expect(stores.searchStore.searchWhen.firstAvailableDepartureDate).toBeUndefined();
        });

        it('should return undefined when availableDates field is null', () => {
            stores.searchStore.searchWhen.availableDates = null;

            expect(stores.searchStore.searchWhen.firstAvailableDepartureDate).toBeUndefined();
        });

        it('should return undefined when availableDates field is empty array', () => {
            stores.searchStore.searchWhen.availableDates = [];

            expect(stores.searchStore.searchWhen.firstAvailableDepartureDate).toBeUndefined();
        });
    });

    describe('setLastAvailableDate', () => {
        it('should set null to lastAvailableDate field when null passed as param', () => {
            stores.searchStore.searchWhen.lastAvailableDate = new Date();

            stores.searchStore.searchWhen.setLastAvailableDate(null);

            expect(stores.searchStore.searchWhen.lastAvailableDate).toBeNull();
        });

        it('should set a future date', () => {
            jest.useFakeTimers();
            stores.searchStore.searchWhen.lastAvailableDate = null;

            stores.searchStore.searchWhen.setLastAvailableDate(new Date('2029-12-12'));

            expect(stores.searchStore.searchWhen.lastAvailableDate).toEqual(new Date('2029-12-12'));
            jest.useRealTimers();
        });

        it('should NOT set a past date', () => {
            stores.searchStore.searchWhen.lastAvailableDate = null;

            stores.searchStore.searchWhen.setLastAvailableDate(new Date('2020-12-12'));

            expect(stores.searchStore.searchWhen.lastAvailableDate).toBeNull();
        });
    });

    describe('onChangePrevFlexDays', () => {
        it('should set a new value to the prevFlexDays field', () => {
            const mockValue = 10;
            stores.searchStore.searchWhen.prevFlexDays = 1;

            stores.searchStore.searchWhen.onChangePrevFlexDays(mockValue);

            expect(stores.searchStore.searchWhen.prevFlexDays).toBe(mockValue);
        });
    });

    describe('selectedNumberOfNights', () => {
        it('should return monthSearchDuration when isMonthSearch is true and both outbound date and inbound date are defined', () => {
            const mockMonthSearchDuration = 15;
            stores.searchStore.searchWhen.setMonthSearchDuration(mockMonthSearchDuration);
            stores.searchStore.searchWhen.isMonthSearch = true;
            stores.searchStore.searchWhen.from = new Date(2019, 1, 1);
            stores.searchStore.searchWhen.to = new Date(2019, 1, 3);

            expect(stores.searchStore.searchWhen.selectedNumberOfNights).toBe(mockMonthSearchDuration);
        });

        it(' should return number of nights between outbound date and inbound date', () => {
            stores.searchStore.searchWhen.from = new Date(2019, 1, 1);
            stores.searchStore.searchWhen.to = new Date(2019, 1, 3);

            expect(stores.searchStore.searchWhen.selectedNumberOfNights).toBe(2);
        });

        it('should return 0 when outbound date is not selected', () => {
            stores.searchStore.searchWhen.from = new Date(2019, 1, 1);

            expect(stores.searchStore.searchWhen.selectedNumberOfNights).toBe(0);
        });

        it('should return 0 when inbound date is not selected', () => {
            stores.searchStore.searchWhen.to = new Date(2019, 1, 1);

            expect(stores.searchStore.searchWhen.selectedNumberOfNights).toBe(0);
        });
    });

    describe('onChangeDates', () => {
        const mockFromDate = new Date('2020-01-15T11:30:14.268Z');
        const mockToDate = new Date('2020-01-19T11:30:14.268Z');

        beforeEach(() => {
            stores.searchStore.clearErrorMessage = jest.fn();
            stores.searchStore.searchWhen.dateUpdated = jest.fn();
        });

        it('should change from date and not call clearErrorMessage when there is only one element in passed dates array', () => {
            stores.searchStore.searchWhen.onChangeDates([mockFromDate]);

            expect(stores.searchStore.searchWhen.from).toEqual(mockFromDate);
            expect(stores.searchStore.searchWhen.to).toEqual(null);
            expect(stores.searchStore.searchWhen.dateUpdated).toHaveBeenCalled();
            expect(stores.searchStore.clearErrorMessage).not.toHaveBeenCalled();
        });

        it('should change from date and not call update when updateDates param is falsy', () => {
            stores.searchStore.searchWhen.onChangeDates([mockFromDate], false);

            expect(stores.searchStore.searchWhen.from).toEqual(mockFromDate);
            expect(stores.searchStore.searchWhen.to).toEqual(null);
            expect(stores.searchStore.searchWhen.dateUpdated).not.toHaveBeenCalled();
        });

        it('should change from & to date and not call clearErrorMessage when hasErrorInField returns false', () => {
            stores.searchStore.hasErrorInField = jest.fn().mockReturnValue(false);

            stores.searchStore.searchWhen.onChangeDates([mockFromDate, mockToDate]);

            expect(stores.searchStore.searchWhen.from).toEqual(mockFromDate);
            expect(stores.searchStore.searchWhen.to).toEqual(mockToDate);
            expect(stores.searchStore.searchWhen.dateUpdated).toHaveBeenCalled();
            expect(stores.searchStore.clearErrorMessage).not.toHaveBeenCalled();
        });

        it('should call clearErrorMessage when there are two elements in passed dates array and hasErrorInField returns true', () => {
            stores.searchStore.hasErrorInField = jest.fn().mockReturnValue(true);

            stores.searchStore.searchWhen.onChangeDates([mockFromDate, mockToDate], false);

            expect(stores.searchStore.clearErrorMessage).toHaveBeenCalled();
        });
    });

    describe('onChangeFlexible', () => {
        it('should change flexDays', () => {
            stores.searchStore.searchWhen.flexDays = 3;

            stores.searchStore.searchWhen.onChangeFlexible(2);

            expect(stores.searchStore.searchWhen.flexDays).toEqual(2);
        });
    });

    describe('isFlexible', () => {
        it('should isFlexible be true', () => {
            stores.searchStore.searchWhen.flexDays = 3;
            expect(stores.searchStore.searchWhen.isFlexible).toBe(true);
        });

        it('should isFlexible be false', () => {
            stores.searchStore.searchWhen.flexDays = 0;
            expect(stores.searchStore.searchWhen.isFlexible).toBe(false);
        });
    });

    describe('dateUpdated', () => {
        beforeEach(() => {
            stores.searchStore.searchWhen.from = new Date('2020-01-15T11:30:14.268Z');
            stores.searchStore.searchWhen.to = new Date('2020-01-19T11:30:14.268Z');
            stores.searchStore.searchFrom.updateAvailableOrigins = jest.fn();
            stores.searchStore.searchTo.updateAvailableDstCodes = jest.fn();
        });

        it('should trigger when dates were updated and EMPTY', () => {
            stores.searchStore.searchWhen.from = null;
            stores.searchStore.searchWhen.to = null;

            stores.searchStore.searchWhen.dateUpdated();

            expect(stores.searchStore.searchFrom.updateAvailableOrigins).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).toHaveBeenCalled();
        });

        it('should trigger when dates were updated and BOTH NOT EMPTY', () => {
            stores.searchStore.searchWhen.dateUpdated();

            expect(stores.searchStore.searchFrom.updateAvailableOrigins).toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).toHaveBeenCalled();
        });

        it('should NOT trigger when dates were updated when at least one date is empty', () => {
            stores.searchStore.searchWhen.from = null;

            stores.searchStore.searchWhen.dateUpdated();

            expect(stores.searchStore.searchFrom.updateAvailableOrigins).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).not.toHaveBeenCalled();
        });

        it('should NOT trigger when dates were updated when at least one date is empty', () => {
            stores.searchStore.searchWhen.to = null;

            stores.searchStore.searchWhen.dateUpdated();

            expect(stores.searchStore.searchFrom.updateAvailableOrigins).not.toHaveBeenCalled();
            expect(stores.searchStore.searchTo.updateAvailableDstCodes).not.toHaveBeenCalled();
        });
    });

    describe('clearDates', () => {
        beforeEach(() => {
            const testDate = new Date();
            stores.searchStore.searchWhen.from = testDate;
            stores.searchStore.searchWhen.to = testDate;
            stores.searchStore.searchWhen.dateUpdated = jest.fn();
            stores.searchStore.searchWhen.updateAvailableDates = jest.fn();
        });

        it('should clear dates', () => {
            stores.searchStore.searchWhen.clearDates();

            expect(stores.searchStore.searchWhen.from).toEqual(null);
            expect(stores.searchStore.searchWhen.to).toEqual(null);
            expect(stores.searchStore.searchWhen.dateUpdated).toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalledWith(false);
        });

        it('should clear dates but NOT call dateUpdated method when true passed', () => {
            stores.searchStore.searchWhen.clearDates(true);

            expect(stores.searchStore.searchWhen.from).toEqual(null);
            expect(stores.searchStore.searchWhen.to).toEqual(null);
            expect(stores.searchStore.searchWhen.dateUpdated).not.toHaveBeenCalled();
        });
    });

    describe('updateAvailableDates', () => {
        it('should call loadLastAvailableDate when no lastAvailableDate and it is not loading', () => {
            stores.searchStore.searchWhen.availableDates = [];
            stores.searchStore.searchWhen.isLastAvailableDateLoading = false;
            stores.searchStore.searchWhen.loadLastAvailableDate = jest.fn();

            stores.searchStore.searchWhen.updateAvailableDates(false);

            expect(stores.searchStore.searchWhen.loadLastAvailableDate).toHaveBeenCalled();
        });

        it('should set availableDates as null when no selected from and to on isDifferentSearchPopupShown', () => {
            stores.searchStore.searchWhen.availableDates = [];
            stores.searchStore.searchFrom.origins = [];
            stores.searchStore.searchTo.selectedDestinationCodes = [];

            stores.searchStore.searchWhen.updateAvailableDates(false);

            expect(stores.searchStore.searchWhen.availableDates).toBe(null);
        });

        it('should set availableDates as null when no selected from and to on not promo page ', () => {
            stores.searchStore.searchWhen.availableDates = [];
            stores.searchStore.searchFrom.origins = [];
            stores.searchStore.searchTo.selectedDestinationCodes = [];
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(false);

            stores.searchStore.searchWhen.updateAvailableDates(false);

            expect(stores.searchStore.searchWhen.availableDates).toBe(null);
        });

        it('should not call getAvailableDates on promo page when dates have not set', () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);
            stores.rootStore.promoPageStore.availableDateStart = null;
            const spyGetAvailableDates = jest.spyOn(stores.searchStore.searchWhen as any, 'getAvailableDates');

            stores.searchStore.searchWhen.updateAvailableDates(false);

            expect(spyGetAvailableDates).not.toHaveBeenCalled();
        });

        it('should call getAvailableDates', async () => {
            stores.searchStore.searchFrom.origins = ['LTD'];
            stores.searchStore.searchTo.selectedDestinationCodes = ['DFG'];
            const spyGetAvailableDates = jest
                .spyOn(stores.searchStore.searchWhen as any, 'getAvailableDates')
                .mockResolvedValueOnce([]);

            await stores.searchStore.searchWhen.updateAvailableDates(false);

            expect(spyGetAvailableDates).toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.availableDates).toStrictEqual([]);
        });

        it('should catch error and set null to availableDates', async () => {
            stores.searchStore.searchFrom.origins = ['LTD'];
            stores.searchStore.searchTo.selectedDestinationCodes = ['DFG'];
            const spyGetAvailableDates = jest
                .spyOn(stores.searchStore.searchWhen as any, 'getAvailableDates')
                .mockRejectedValueOnce([{}]);

            await stores.searchStore.searchWhen.updateAvailableDates(false);

            expect(spyGetAvailableDates).toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.availableDates).toBe(null);
        });

        describe('requestAvailableMonths', () => {
            beforeEach(() => {
                stores.searchStore.searchWhen.setMonthSearchDuration(mockMonthSearchDuration);
                stores.searchStore.searchWhen.setLastAvailableDate = jest.fn();
                jest.spyOn(stores.rootStore.layoutStore, 'isMonthSearchEnabled', 'get').mockReturnValue(true);
            });

            it('should call getAvailableMonths with params from stores and set monthsAvailability & lastAvailableDate', async () => {
                stores.searchStore.searchFrom.origins = ['LLL'];
                stores.searchStore.searchTo.selectedDestinationCodes = ['DDD'];

                await stores.searchStore.searchWhen.requestAvailableMonths();

                expect(offersService.getAvailableMonths).toHaveBeenCalledWith(mockMonthSearchDuration, 'LLL', 'DDD');
                expect(stores.searchStore.searchWhen.monthsAvailability).toEqual(mockMonthsAvailability);
                expect(stores.searchStore.searchWhen.setLastAvailableDate).toHaveBeenCalledWith(
                    new Date('2026-10-31T00:00:00.000Z'),
                );
            });

            it('should call requestAvailableMonths ', () => {
                jest.spyOn(stores.layoutStore, 'isPromoPage', 'get').mockReturnValue(false);
                const spyRequestAvailableMonths = jest.spyOn(stores.searchStore.searchWhen, 'requestAvailableMonths');
                stores.searchStore.searchWhen.updateAvailableDates(true);

                expect(spyRequestAvailableMonths).toHaveBeenCalled();
            });

            it('should NOT call requestAvailableMonths on promo pages', () => {
                jest.spyOn(stores.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);
                const spyRequestAvailableMonths = jest.spyOn(stores.searchStore.searchWhen, 'requestAvailableMonths');
                stores.searchStore.searchWhen.updateAvailableDates(true);

                expect(spyRequestAvailableMonths).not.toHaveBeenCalled();
            });

            it('should NOT call requestAvailableMonths if isMonthSearchEnabled is false', () => {
                jest.spyOn(stores.layoutStore, 'isMonthSearchEnabled', 'get').mockReturnValue(false);
                const spyRequestAvailableMonths = jest.spyOn(stores.searchStore.searchWhen, 'requestAvailableMonths');
                stores.searchStore.searchWhen.updateAvailableDates(true);

                expect(spyRequestAvailableMonths).not.toHaveBeenCalled();
            });

            it('should NOT call getAvailableMonths when origins are missed', async () => {
                stores.searchStore.searchFrom.origins = [];
                stores.searchStore.searchTo.selectedDestinationCodes = ['DDD'];

                await stores.searchStore.searchWhen.requestAvailableMonths();

                expect(offersService.getAvailableMonths).not.toHaveBeenCalled();
            });

            it('should NOT call getAvailableMonths when destinations are missed', async () => {
                stores.searchStore.searchFrom.origins = ['LLL'];
                stores.searchStore.searchTo.selectedDestinationCodes = [];

                await stores.searchStore.searchWhen.requestAvailableMonths();

                expect(offersService.getAvailableMonths).not.toHaveBeenCalled();
            });
        });

        describe('getAvailableDates', () => {
            const mockCurrentDate = new Date('2025-07-04');

            beforeEach(() => {
                jest.useFakeTimers().setSystemTime(mockCurrentDate);
                jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(false);
                jest.spyOn(stores.rootStore.appStore, 'isScreenMedium', 'get').mockReturnValue(true);
                stores.rootStore.promoPageStore.availableDateStart = null;
                stores.rootStore.promoPageStore.availableDateEnd = null;

                stores.searchStore.searchWhen.requestAvailableDates = jest.fn().mockResolvedValue([]);
                stores.searchStore.searchWhen['datesCache'] = [];
                stores.searchStore.searchWhen.isMonthSearch = false;
                stores.searchStore.searchFrom.origins = ['LGW'];
                stores.searchStore.searchTo.selectedDestinationCodes = ['ES'];
            });

            afterAll(() => {
                jest.useRealTimers();
            });

            it('should use promo dates on a promo page for desktop when available', async () => {
                const promoStart = new Date('2025-01-01');
                const promoEnd = new Date('2025-12-31');
                jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);
                stores.rootStore.promoPageStore.availableDateStart = promoStart;
                stores.rootStore.promoPageStore.availableDateEnd = promoEnd;

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).toHaveBeenCalledWith(
                    'LGW',
                    'ES',
                    promoStart,
                    promoEnd,
                    undefined,
                );
            });

            it('should use promo dates on a promo page for mobile when available', async () => {
                const promoStart = new Date('2025-01-01');
                const promoEnd = new Date('2025-12-31');
                jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);
                jest.spyOn(stores.rootStore.appStore, 'isScreenMedium', 'get').mockReturnValue(false);
                stores.searchStore.rootStore.promoPageStore.availableDateStart = promoStart;
                stores.searchStore.rootStore.promoPageStore.availableDateEnd = promoEnd;

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).toHaveBeenCalledWith(
                    'LGW',
                    'ES',
                    promoStart,
                    promoEnd,
                    undefined,
                );
            });

            it('should ignore this.from and this.to for desktop calculations when minDate, availableDateStart, availableEnd are not defined, isMonthSearch is true and not a promo page', async () => {
                stores.searchStore.searchWhen.isMonthSearch = true;
                jest.spyOn(stores.rootStore.appStore, 'isScreenMedium', 'get').mockReturnValue(true);
                const expectedStart = mockCurrentDate;
                const expectedEnd = new Date('2025-10-03');
                stores.searchStore.searchWhen.from = new Date('2025-03-01');
                stores.searchStore.searchWhen.to = new Date('2025-06-01');

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).toHaveBeenCalledWith(
                    'LGW',
                    'ES',
                    expectedStart,
                    expectedEnd,
                    undefined,
                );
            });

            it('should ignore this.from and this.to for desktop calculations when minDate is defined, isMonthSearch is true and not a promo page', async () => {
                stores.searchStore.searchWhen.isMonthSearch = true;
                jest.spyOn(stores.rootStore.appStore, 'isScreenMedium', 'get').mockReturnValue(true);
                const expectedStart = new Date('2025-01-01');
                const expectedEnd = new Date('2025-04-03');
                stores.searchStore.searchWhen.from = new Date('2025-03-01');
                stores.searchStore.searchWhen.to = new Date('2025-06-01');

                stores.searchStore.searchWhen.minDate = expectedStart;

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).toHaveBeenCalledWith(
                    'LGW',
                    'ES',
                    expectedStart,
                    expectedEnd,
                    undefined,
                );
            });

            it('should ignore this.from and this.to for desktop calculations and use current date instead of minDate when minDate is not defined, isMonthSearch is true and not a promo page', async () => {
                stores.searchStore.searchWhen.isMonthSearch = true;
                jest.spyOn(stores.rootStore.appStore, 'isScreenMedium', 'get').mockReturnValue(true);
                const expectedStart = mockCurrentDate;
                const availableStart = new Date('2025-01-01');
                const availableEnd = new Date('2025-12-31');
                stores.searchStore.searchWhen.from = new Date('2025-03-01');
                stores.searchStore.searchWhen.to = new Date('2025-06-01');

                (stores.searchStore.searchWhen as any).availableDateStart = availableStart;
                stores.searchStore.searchWhen.minDate = undefined;
                (stores.searchStore.searchWhen as any).availableDateEnd = availableEnd;

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).toHaveBeenCalledWith(
                    'LGW',
                    'ES',
                    expectedStart,
                    availableEnd,
                    undefined,
                );
            });

            it('should use this.from and this.to in calculations when selected dates are greater than current date, isMonthSearch is false and not a promo page', async () => {
                const from = new Date('2025-10-10');
                const to = new Date('2025-10-20');
                stores.searchStore.searchWhen.from = from;
                stores.searchStore.searchWhen.to = to;
                const expectedStart = new Date('2025-08-27');
                const expectedEnd = new Date('2025-12-03');

                (stores.searchStore.searchWhen as any).availableDateStart = null;
                (stores.searchStore.searchWhen as any).availableDateEnd = null;

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).toHaveBeenCalledWith(
                    'LGW',
                    'ES',
                    expectedStart,
                    expectedEnd,
                    undefined,
                );
            });

            it('should call requestAvailableDates when this.from has changed even if cache covers date range', async () => {
                const oldFrom = new Date('2025-06-01');
                const newFrom = new Date('2025-07-10');
                stores.searchStore.searchWhen.from = newFrom;
                stores.searchStore.searchWhen['datesCache'] = [
                    { date: '2025-07-01', out: true, in: true },
                    { date: '2025-10-10', out: true, in: true },
                ];
                stores.searchStore.searchWhen['fromCacheKey'] = oldFrom.toISOString();

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).toHaveBeenCalled();
            });

            it('should NOT call requestAvailableDates when this.from has not changed and cache covers date range', async () => {
                const from = new Date('2025-07-10');
                stores.searchStore.searchWhen.from = from;
                stores.searchStore.searchWhen['datesCache'] = [
                    { date: '2025-07-01', out: true, in: true },
                    { date: '2025-10-10', out: true, in: true },
                ];
                stores.searchStore.searchWhen['datesCacheKey'] = 'LGW-ES';
                stores.searchStore.searchWhen['fromCacheKey'] = from.toISOString();

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).not.toHaveBeenCalled();
            });

            it('should call requestAvailableDates when this.to changed from empty to a date (toChangedFromEmpty)', async () => {
                const from = new Date('2025-07-10');
                const to = new Date('2025-10-10');
                stores.searchStore.searchWhen.from = from;
                stores.searchStore.searchWhen.to = to;
                stores.searchStore.searchWhen['datesCache'] = [
                    { date: '2025-07-01', out: true, in: true },
                    { date: '2025-10-10', out: true, in: true },
                ];
                stores.searchStore.searchWhen['datesCacheKey'] = 'LGW-ES';
                stores.searchStore.searchWhen['fromCacheKey'] = from.toISOString();
                // toCacheKey is undefined — simulates "to was previously empty"
                stores.searchStore.searchWhen['toCacheKey'] = undefined;

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).toHaveBeenCalled();
            });

            it('should NOT call requestAvailableDates due to toChangedFromEmpty when this.to was already set', async () => {
                const from = new Date('2025-07-10');
                const to = new Date('2025-10-10');
                stores.searchStore.searchWhen.from = from;
                stores.searchStore.searchWhen.to = to;
                stores.searchStore.searchWhen['datesCache'] = [
                    { date: '2025-07-01', out: true, in: true },
                    { date: '2025-10-10', out: true, in: true },
                ];
                stores.searchStore.searchWhen['datesCacheKey'] = 'LGW-ES';
                stores.searchStore.searchWhen['fromCacheKey'] = from.toISOString();
                // toCacheKey already set — simulates "to was previously a date"
                stores.searchStore.searchWhen['toCacheKey'] = to.toISOString();

                await stores.searchStore.searchWhen.updateAvailableDates(false);

                expect(stores.searchStore.searchWhen.requestAvailableDates).not.toHaveBeenCalled();
            });
        });
    });

    describe('requestAvailableDates', () => {
        offersService.getAvailableDates = jest.fn().mockResolvedValue({
            dates: [
                { date: '2020-07-01', out: true, in: true },
                { date: '2020-08-01', out: true, in: true },
                { date: '2020-09-01', out: true, in: true },
            ],
            nextAvailableDate: '2020-07-01T00:00:00',
        });

        beforeEach(() => {
            stores.searchStore.searchWhen.changeDateAvailabilityInterval = jest.fn();
        });

        it("should do extra call if response date range doesn't contain nextAvailableDate", async () => {
            await stores.searchStore.searchWhen.requestAvailableDates(
                '',
                '',
                new Date('2020-05-01'),
                new Date('2020-06-01'),
            );

            expect(stores.searchStore.searchWhen.changeDateAvailabilityInterval).toHaveBeenCalled();
        });

        it('should NOT do extra call on Promo Page', async () => {
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);

            await stores.searchStore.searchWhen.requestAvailableDates(
                '',
                '',
                new Date('2020-05-01'),
                new Date('2020-06-01'),
            );

            expect(stores.searchStore.searchWhen.changeDateAvailabilityInterval).not.toHaveBeenCalled();
        });

        it('should NOT do extra call if response date range contains nextAvailableDate', async () => {
            await stores.searchStore.searchWhen.requestAvailableDates(
                '',
                '',
                new Date('2020-07-01'),
                new Date('2020-08-01'),
            );

            expect(stores.searchStore.searchWhen.changeDateAvailabilityInterval).not.toHaveBeenCalled();
        });

        it('should call changeDateAvailabilityInterval if on mobile', async () => {
            jest.spyOn(stores.rootStore.appStore, 'isScreenMedium', 'get').mockReturnValue(false);
            offersService.getAvailableDates = jest.fn().mockResolvedValue({
                dates: [
                    { date: '2020-05-01', out: true, in: true },
                    { date: '2020-06-01', out: true, in: true },
                ],
                nextAvailableDate: '2020-07-01T00:00:00',
                lastAvailableDate: '2020-11-01T00:00:00',
            });

            await stores.searchStore.searchWhen.requestAvailableDates(
                '',
                '',
                new Date('2020-07-01'),
                new Date('2020-08-01'),
            );

            expect(stores.searchStore.searchWhen.changeDateAvailabilityInterval).toHaveBeenCalled();
        });

        describe('cache upsert behaviour', () => {
            beforeEach(() => {
                stores.searchStore.searchWhen['datesCache'] = [];
            });

            it('should add new dates to an empty cache', async () => {
                offersService.getAvailableDates = jest.fn().mockResolvedValue({
                    dates: [
                        { date: '2020-07-01', out: true, in: false },
                        { date: '2020-08-01', out: true, in: false },
                    ],
                    nextAvailableDate: null,
                    lastAvailableDate: '2020-11-01T00:00:00',
                });

                await stores.searchStore.searchWhen.requestAvailableDates(
                    '',
                    '',
                    new Date('2020-07-01'),
                    new Date('2020-08-01'),
                );

                expect(stores.searchStore.searchWhen['datesCache']).toHaveLength(2);
                expect(stores.searchStore.searchWhen['datesCache'][0].date).toBe('2020-07-01');
                expect(stores.searchStore.searchWhen['datesCache'][1].date).toBe('2020-08-01');
            });

            it('should replace existing cache entries with updated in/out values for the same dates', async () => {
                stores.searchStore.searchWhen['datesCache'] = [
                    { date: '2020-07-01', out: true, in: false },
                    { date: '2020-08-01', out: true, in: false },
                ];

                offersService.getAvailableDates = jest.fn().mockResolvedValue({
                    dates: [
                        { date: '2020-07-01', out: true, in: true },
                        { date: '2020-08-01', out: false, in: true },
                    ],
                    nextAvailableDate: null,
                    lastAvailableDate: '2020-11-01T00:00:00',
                });

                await stores.searchStore.searchWhen.requestAvailableDates(
                    '',
                    '',
                    new Date('2020-07-01'),
                    new Date('2020-08-01'),
                );

                expect(stores.searchStore.searchWhen['datesCache']).toHaveLength(2);
                expect(stores.searchStore.searchWhen['datesCache'].find(d => d.date === '2020-07-01')?.in).toBe(true);
                expect(stores.searchStore.searchWhen['datesCache'].find(d => d.date === '2020-08-01')?.out).toBe(false);
            });

            it('should keep existing cache entries that are not present in the new response', async () => {
                stores.searchStore.searchWhen['datesCache'] = [
                    { date: '2020-06-01', out: true, in: false },
                    { date: '2020-07-01', out: true, in: false },
                ];

                offersService.getAvailableDates = jest.fn().mockResolvedValue({
                    dates: [{ date: '2020-08-01', out: true, in: true }],
                    nextAvailableDate: null,
                    lastAvailableDate: '2020-11-01T00:00:00',
                });

                await stores.searchStore.searchWhen.requestAvailableDates(
                    '',
                    '',
                    new Date('2020-08-01'),
                    new Date('2020-09-01'),
                );

                expect(stores.searchStore.searchWhen['datesCache']).toHaveLength(3);
                expect(stores.searchStore.searchWhen['datesCache'].map(d => d.date)).toEqual(
                    expect.arrayContaining(['2020-06-01', '2020-07-01', '2020-08-01']),
                );
            });
        });
    });

    describe('changeDateAvailabilityInterval', () => {
        beforeEach(() => {
            stores.rootStore.promoPageStore.availableDateStart = null;
            stores.rootStore.promoPageStore.availableDateEnd = null;
            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(false);
            stores.searchStore.searchWhen.updateAvailableDates = jest.fn();
        });

        it('should set start and end directly when not on promo page', () => {
            const start = new Date('2025-01-01');
            const end = new Date('2025-01-10');

            stores.searchStore.searchWhen.changeDateAvailabilityInterval(start, end);

            expect(stores.searchStore.searchWhen['availableDateEnd']).toBe(end);
            expect(stores.searchStore.searchWhen['availableDateStart']).toBe(start);
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
        });

        it('should set start and end to promoStart and promoEnd when out of promo range', () => {
            const promoStart = new Date('2025-01-05');
            const promoEnd = new Date('2025-01-15');
            stores.rootStore.promoPageStore.availableDateStart = promoStart;
            stores.rootStore.promoPageStore.availableDateEnd = promoEnd;

            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);

            const start = new Date('2025-02-01');
            const end = new Date('2025-02-20');

            stores.searchStore.searchWhen.changeDateAvailabilityInterval(start, end);

            expect(stores.searchStore.searchWhen['availableDateStart']).toBe(promoStart);
            expect(stores.searchStore.searchWhen['availableDateEnd']).toBe(promoEnd);
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
        });

        it('should set start and end to provided values within promo range', () => {
            const promoStart = new Date('2025-01-05');
            const promoEnd = new Date('2025-01-15');

            stores.rootStore.promoPageStore.availableDateStart = promoStart;
            stores.rootStore.promoPageStore.availableDateEnd = promoEnd;

            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);

            const start = new Date('2025-01-08');
            const end = new Date('2025-01-10');

            stores.searchStore.searchWhen.changeDateAvailabilityInterval(start, end);

            expect(stores.searchStore.searchWhen['availableDateStart']).toBe(start);
            expect(stores.searchStore.searchWhen['availableDateEnd']).toBe(end);
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
        });

        it('should handle null start and end', () => {
            stores.searchStore.searchWhen.changeDateAvailabilityInterval(null, null);

            expect(stores.searchStore.searchWhen['availableDateStart']).toBeNull();
            expect(stores.searchStore.searchWhen['availableDateEnd']).toBeNull();
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
        });

        it('should set start and end directly when promoEnd is null on promo page', () => {
            const promoStart = new Date('2025-01-05');
            stores.rootStore.promoPageStore.availableDateStart = promoStart;

            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);

            const start = new Date('2025-01-01');
            const end = new Date('2025-01-14');

            stores.searchStore.searchWhen.changeDateAvailabilityInterval(start, end);

            expect(stores.searchStore.searchWhen['availableDateStart']).toBe(start);
            expect(stores.searchStore.searchWhen['availableDateEnd']).toBe(end);
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
        });

        it('should set start and end directly when promoStart is null on promo page', () => {
            const promoEnd = new Date('2025-01-15');
            stores.rootStore.promoPageStore.availableDateEnd = promoEnd;

            jest.spyOn(stores.rootStore.layoutStore, 'isPromoPage', 'get').mockReturnValue(true);

            const start = new Date('2025-01-01');
            const end = new Date('2025-01-14');

            stores.searchStore.searchWhen.changeDateAvailabilityInterval(start, end);

            expect(stores.searchStore.searchWhen['availableDateStart']).toBe(start);
            expect(stores.searchStore.searchWhen['availableDateEnd']).toBe(end);
            expect(stores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalled();
        });
    });

    describe('loadLastAvailableDate', () => {
        beforeEach(() => {
            stores.searchStore.searchWhen.setLastAvailableDateLoading = jest.fn();
            stores.searchStore.searchWhen.setLastAvailableDate = jest.fn();
        });

        it('should load last available date', async () => {
            const mockDate = '2025-12-31';
            (offersService.getLastAvailableDate as jest.Mock).mockResolvedValue(mockDate);

            await stores.searchStore.searchWhen.loadLastAvailableDate();

            expect(stores.searchStore.searchWhen.setLastAvailableDateLoading).toHaveBeenCalledWith(true);
            expect(offersService.getLastAvailableDate).toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.setLastAvailableDate).toHaveBeenCalledWith(mockDate);
            expect(stores.searchStore.searchWhen.setLastAvailableDateLoading).toHaveBeenCalledWith(false);
        });

        it('should handle the error and set the date to null when api rejected', async () => {
            (offersService.getLastAvailableDate as jest.Mock).mockRejectedValue(new Error());

            await stores.searchStore.searchWhen.loadLastAvailableDate();

            expect(stores.searchStore.searchWhen.setLastAvailableDateLoading).toHaveBeenCalledWith(true);
            expect(offersService.getLastAvailableDate).toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.setLastAvailableDate).toHaveBeenCalledWith(null);
            expect(stores.searchStore.searchWhen.setLastAvailableDateLoading).toHaveBeenCalledWith(false);
        });
    });

    describe('setIsMonthSearch', () => {
        it('should set isMonthSearch value', () => {
            expect(stores.searchStore.searchWhen.isMonthSearch).toBe(false);
            stores.searchStore.searchWhen.setIsMonthSearch(true);

            expect(stores.searchStore.searchWhen.isMonthSearch).toBe(true);
        });
    });

    describe('isWhenParamsValid', () => {
        it('should return true if both from and to are set', () => {
            stores.searchStore.searchWhen.from = new Date();
            stores.searchStore.searchWhen.to = new Date();

            expect(stores.searchStore.searchWhen.isWhenParamsValid).toBe(true);
        });

        it('should return false if only from is set', () => {
            stores.searchStore.searchWhen.from = new Date();
            stores.searchStore.searchWhen.to = null;

            expect(stores.searchStore.searchWhen.isWhenParamsValid).toBe(false);
        });

        it('should return false if only to is set', () => {
            stores.searchStore.searchWhen.from = null;
            stores.searchStore.searchWhen.to = new Date();

            expect(stores.searchStore.searchWhen.isWhenParamsValid).toBe(false);
        });
    });

    describe('whenParamsForRequest', () => {
        const mockFromDateString = '2025-05-10';
        const mockToDateString = '2025-05-20';

        beforeEach(() => {
            stores.searchStore.searchWhen.setMonthSearchDuration(mockMonthSearchDuration);
            stores.searchStore.searchWhen.from = new Date(mockFromDateString);
            stores.searchStore.searchWhen.to = new Date(mockToDateString);
            stores.searchStore.searchWhen.flexDays = 10;
        });

        it('should return fromParam and toParam as strings matching selected dates without duration when not month search', () => {
            const params = stores.searchStore.searchWhen.whenParamsForRequest;

            expect(params).toEqual({
                fromParam: mockFromDateString,
                toParam: mockToDateString,
                duration: undefined,
                flexDays: stores.searchStore.searchWhen.flexDays,
            });
        });

        it('should return fromParam, toParam and duration value on month search', () => {
            stores.searchStore.searchWhen.isMonthSearch = true;
            const params = stores.searchStore.searchWhen.whenParamsForRequest;

            expect(params).toEqual({
                fromParam: mockFromDateString,
                toParam: mockToDateString,
                duration: mockMonthSearchDuration,
                flexDays: stores.searchStore.searchWhen.flexDays,
            });
        });

        it('should return empty strings for toParam and fromParam when to & from fields are null', () => {
            stores.searchStore.searchWhen.to = null;
            stores.searchStore.searchWhen.from = null;

            const params = stores.searchStore.searchWhen.whenParamsForRequest;

            expect(params).toEqual(
                expect.objectContaining({
                    toParam: '',
                    fromParam: '',
                }),
            );
        });
    });

    describe('monthSearchDuration', () => {
        it('should return the value of _monthSearchDuration if set', () => {
            stores.searchStore.searchWhen.setMonthSearchDuration(mockMonthSearchDuration);

            expect(stores.searchStore.searchWhen.monthSearchDuration).toBe(mockMonthSearchDuration);
        });

        it('should return 0 if _monthSearchDuration is undefined', () => {
            stores.searchStore.searchWhen.setMonthSearchDuration(undefined);

            expect(stores.searchStore.searchWhen.monthSearchDuration).toBe(0);
        });
    });

    describe('updateCheapestMonthPrices', () => {
        const mockCheapestMonth = {
            month: 2,
            price: 13,
            searchStartDate: '03-12-2025',
            year: 2025,
        };

        let mockIsCheapestMonthPriceEnabled, isCheapestMonthPriceEnabled;
        const mockFetchCheapestMonthList = jest.fn();
        const mockIsCheapestMonthAllowed = jest.fn();

        offersService.fetchCheapestMonthList = mockFetchCheapestMonthList;

        beforeEach(() => {
            stores.searchStore.isCheapestMonthAllowed = mockIsCheapestMonthAllowed;
            stores.searchStore.searchTo.selectedDestinations = [destinationRegionMock];
            stores.searchStore.searchFrom.availableOriginsCodes = ['LGW'];
            stores.searchStore.searchFrom.origins = ['LGW'];

            mockIsCheapestMonthPriceEnabled = jest.spyOn(stores.layoutStore, 'isCheapestMonthPriceEnabled', 'get');
            isCheapestMonthPriceEnabled = jest.spyOn(stores.layoutStore, 'isCheapestMonthPriceEnabled', 'get');

            mockIsCheapestMonthPriceEnabled.mockReturnValue(true);
            isCheapestMonthPriceEnabled.mockReturnValue(true);

            mockIsCheapestMonthAllowed.mockReturnValue(true);
            mockFetchCheapestMonthList.mockResolvedValue([mockCheapestMonth]);
            mockGetCheapestMonthQuery.mockReturnValue('cheapestMonthQuery');
        });

        it('should do early return, when isCheapestMonthPriceEnabled is false', async () => {
            isCheapestMonthPriceEnabled.mockReturnValue(false);

            expect(stores.searchStore.searchWhen.hasCheapestMonthLoaded).toBe(false);

            await stores.searchStore.searchWhen.updateCheapestMonthPrices();

            expect(stores.searchStore.isCheapestMonthAllowed).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.hasCheapestMonthLoaded).toBe(true);
        });

        it('should call fetchCheapestMonthList when isCheapestMonthAllowed returns true', async () => {
            stores.searchStore.searchWhen.cheapestMonthList = [];

            await stores.searchStore.searchWhen.updateCheapestMonthPrices();

            expect(mockGetCheapestMonthQuery).toHaveBeenCalledWith(
                stores.searchStore.searchTo.selectedFullyAvailableDestinations,
            );
            expect(mockFetchCheapestMonthList).toHaveBeenCalledWith('LGW', 'cheapestMonthQuery');
            expect(mockIsCheapestMonthAllowed).toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.cheapestMonthList).toStrictEqual([
                { month: 1, price: 13, searchStartDate: '03-12-2025', year: 2025 },
            ]);
            expect(stores.searchStore.searchWhen.hasCheapestMonthLoaded).toBe(true);
        });

        it('should call fetchCheapestMonthList when isCheapestMonthAllowed returns true, while origins contain several elements, and few of them are available', async () => {
            stores.searchStore.searchWhen.cheapestMonthList = [];
            stores.searchStore.searchFrom.availableOriginsCodes = ['CLA', 'LGW'];
            stores.searchStore.searchFrom.origins = ['BGN', 'CLA', 'LGW'];

            await stores.searchStore.searchWhen.updateCheapestMonthPrices();

            expect(mockFetchCheapestMonthList).toHaveBeenCalledWith('CLA,LGW', 'cheapestMonthQuery');
            expect(mockIsCheapestMonthAllowed).toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.cheapestMonthList).toStrictEqual([
                { month: 1, price: 13, searchStartDate: '03-12-2025', year: 2025 },
            ]);
        });

        it('should NOT call fetchCheapestMonthList when isCheapestMonthAllowed returns false', async () => {
            mockIsCheapestMonthAllowed.mockReturnValue(false);
            stores.searchStore.searchWhen.cheapestMonthList = [];

            await stores.searchStore.searchWhen.updateCheapestMonthPrices();

            expect(mockFetchCheapestMonthList).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWhen.cheapestMonthList).toBe(undefined);
        });

        it('should assign undefined to cheapestMonthList when fetchCheapestMonthList throw an error', async () => {
            mockFetchCheapestMonthList.mockRejectedValue('Error');
            stores.searchStore.searchWhen.cheapestMonthList = [];

            await stores.searchStore.searchWhen.updateCheapestMonthPrices();

            expect(stores.searchStore.searchWhen.cheapestMonthList).toBe(undefined);
            expect(stores.searchStore.searchWhen.hasCheapestMonthLoaded).toBe(true);
        });
    });

    describe('isCheapestMonthSelected', () => {
        it('should return false if NO from value', () => {
            stores.searchStore.searchWhen.from = null;

            expect(stores.searchStore.searchWhen.isCheapestMonthSelected).toBe(false);
        });

        it('should return false if isCheapestMonthPriceEnabled is false', () => {
            stores.searchStore.searchWhen.from = new Date();
            stores.searchStore.searchWhen.isMonthSearch = true;
            jest.spyOn(stores.layoutStore, 'isCheapestMonthPriceEnabled', 'get').mockReturnValue(false);

            expect(stores.searchStore.searchWhen.isCheapestMonthSelected).toBe(false);
        });

        it('should return false if isMonthSearch is false', () => {
            stores.searchStore.searchWhen.from = new Date();
            stores.searchStore.searchWhen.isMonthSearch = false;
            jest.spyOn(stores.layoutStore, 'isCheapestMonthPriceEnabled', 'get').mockReturnValue(true);

            expect(stores.searchStore.searchWhen.isCheapestMonthSelected).toBe(false);
        });

        it('should return true if from in cheapest month', () => {
            stores.searchStore.searchWhen.isMonthSearch = true;
            stores.searchStore.searchWhen.from = new Date('02-01-2025');
            stores.searchStore.searchWhen.cheapestMonthList = [
                { month: 1, price: 26, pricePP: 13, searchStartDate: '01-01-2025', year: 2025 },
            ];
            jest.spyOn(stores.layoutStore, 'isCheapestMonthPriceEnabled', 'get').mockReturnValue(true);

            expect(stores.searchStore.searchWhen.isCheapestMonthSelected).toBe(true);
        });
    });
});
