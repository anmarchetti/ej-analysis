import { NextRouter } from 'next/router';

import { mockBooking } from 'frontend/__mocks__';
import { LayoutStore } from 'frontend/store/holidays';
import isBackend from 'frontend/utils/isBackend';
import { parseQuery, parseUrl } from 'frontend/utils/url.utils';
import { IHotel } from 'models/data/IHotel';
import { IOfferWithHotelData } from 'models/data/IOffer';
import { SitePath } from 'models/enum/SitePath';

import { BaseRouterStore } from './BaseRouterStore';

jest.mock('frontend/utils/url.utils');
const mockedParseUrl = parseUrl as jest.MockedFn<typeof parseUrl>;

jest.mock('frontend/utils/isBackend', () => jest.fn());
const mockedIsBacked = isBackend as jest.MockedFn<typeof isBackend>;
let store;

describe('BaseRouterStore', () => {
    const createRootStore = () =>
        ({
            layoutStore: {
                basePath: '/en/holidays',
                shouldTrackUrl: false,
                isShortlistPagePrev: false,
                isPromoPage: false,
                isDestinationPage: false,
                isAllHolidayTypesPage: false,
                isHolidayTypePage: false,
                isDealsHubPage: false,
                isHotelDetailsBookPage: false,
                isHotelDetailsBrowsePage: false,
                isShortlistPage: false,
                isHotelDetailsBookPagePrev: false,
                isHomePage: false,
                getPageUrlInLang: jest.fn(lang => `/page-${lang}`),
                getSitePathInLang: jest.fn(lang => `https://easyjet.com/${lang}/holidays`),
                setFullUrl: jest.fn(),
                sitePath: '/en/holidays',
            },
            searchStore: {
                searchTo: {
                    selectedDestinationCodes: ['hotel-code', 'hotel-code2'],
                },
                page: 1,
                setPrevPageNumber: jest.fn(),
                clearSearchValues: jest.fn(),
                updateSearchValuesFromQuery: jest.fn(),
                setPageNumber: jest.fn(),
                isSelectedPackageFromMap: true,
            },
            queryParamsStore: {
                parseBrowserQuery: jest.fn(),
                promoPage: jest.fn(),
                buildMediaCenterFiltersQuery: jest.fn(topic => `?topic=${topic}`),
                parseAndSyncQuery: jest.fn(),
                stringifyQuery: jest.fn(() => '?to=07-07-2024'),
            },
            hotelsStore: { getSearchParamsFromLocalStorage: jest.fn(() => null), fetchOffers: jest.fn() },
            paymentStore: { startTransactionOnPageLoad: jest.fn() },
            bookingStore: {
                fetchOfferOnPageLoad: jest.fn(),
                clearPromoCode: jest.fn(),
                extraLuggage: {
                    clearExtraLuggage: jest.fn(),
                },
                grabSearchValuesFromSearchStore: jest.fn(),
                clearBookingFlow: jest.fn(),
            },
            seatMapStore: {
                clearValidatedSeats: jest.fn(),
            },
            viewBookingStore: {
                booking: {},
            },
            amendTransfersStore: {
                selectedTransfer: {},
                resetAmendTransferStore: jest.fn(),
            },
            amendFlightsStore: {
                selectedFlight: {},
                resetSelectedFlight: jest.fn(),
            },
            notificationsStore: {
                trackUrl: jest.fn(),
            },
            promoPageStore: {
                setForcePrefillPage: jest.fn(),
            },
        } as any);
    let rootStore;

    beforeEach(() => {
        rootStore = createRootStore();
        sessionStorage.clear();
        store = new BaseRouterStore(rootStore);
    });

    describe('getMicroAppPage', () => {
        it('should return micro app path', () => {
            const result = store.getMicroAppPage(SitePath.ManageHub);

            expect(result).toBe('/en/holidays/manage/');
        });
    });

    describe('initialize', () => {
        beforeEach(() => {
            sessionStorage.clear();
        });

        it('should parse route search', () => {
            const search = 'query1=1&query2=2';
            mockedParseUrl.mockReturnValueOnce({ pathname: 'pathName', search: search, hash: '' });
            store.router = {} as NextRouter;

            store.initialize();

            expect(rootStore.queryParamsStore.parseBrowserQuery).toBeCalledWith(search);
        });

        it('should fetch offer on initialize', () => {
            store.router = {} as NextRouter;

            store.initialize();

            expect(rootStore.bookingStore.fetchOfferOnPageLoad).toBeCalledWith(true);
        });

        it('should NOT call anything if router is undefined', () => {
            store.initialize();

            expect(rootStore.queryParamsStore.parseBrowserQuery).not.toBeCalled();
        });

        it('should NOT call anything on backend', () => {
            store.router = {} as NextRouter;
            mockedIsBacked.mockReturnValueOnce(true);

            store.initialize();

            expect(rootStore.queryParamsStore.parseBrowserQuery).not.toBeCalled();
        });

        it('Is before unload called with correct params', () => {
            store.isBookingConfirmationPage = jest.fn(() => true);
            store.replace = jest.fn();
            store.router = {} as NextRouter;

            store.initialize();
            window.dispatchEvent(new Event('beforeunload'));
            expect(store.replace).toBeCalledWith('/', true);
        });
    });

    it('should return pathname from router', () => {
        mockedParseUrl.mockReturnValueOnce({ pathname: 'pathName', search: '', hash: '' });

        store.router = {} as NextRouter;

        expect(store.pathname).toEqual('pathName');
    });

    describe('isDirectHotelSearch', () => {
        it('should return false when there is no destination', () => {
            rootStore.queryParamsStore.selectedAccommodationCodesFromUrl = 'hotel-code';
            rootStore.searchStore.searchTo.selectedDestinationCodes = [];

            store = new BaseRouterStore(rootStore);

            expect(store.isDirectHotelSearch).toBe(false);
        });

        it('should return true when selectedAccommodationCodesFromUrl is equal to selectedDestinationCodes', () => {
            rootStore.queryParamsStore.selectedAccommodationCodesFromUrl = 'hotel-code,hotel-code2';

            store = new BaseRouterStore(rootStore);

            expect(store.isDirectHotelSearch).toBe(true);
        });

        it('should return false when destinations are different than selectedAccommodationCodesFromUrl', () => {
            rootStore.queryParamsStore.selectedAccommodationCodesFromUrl = 'hotel-code';
            rootStore.searchStore.searchTo.selectedDestinationCodes = ['hotel-code2'];

            store = new BaseRouterStore(rootStore);

            expect(store.isDirectHotelSearch).toBe(false);
        });

        it('should return false when hasPromo is true', () => {
            (rootStore.queryParamsStore.promoPage as jest.Mock).mockReturnValueOnce('promo');
            rootStore.queryParamsStore.selectedAccommodationCodesFromUrl = 'hotel-code,hotel-code2';

            store = new BaseRouterStore(rootStore);

            expect(store.isDirectHotelSearch).toBe(false);
        });
    });

    describe('isBackToPrevUrl', () => {
        it('should return true when isDirectHotelSearch is true', () => {
            rootStore.queryParamsStore.selectedAccommodationCodesFromUrl = 'hotel-code,hotel-code2';

            store = new BaseRouterStore(rootStore);

            expect(store.isBackToPrevUrl).toBe(true);
        });

        it('should return true when isShortlistPagePrev is true', () => {
            rootStore.layoutStore.isShortlistPagePrev = true;
            rootStore.queryParamsStore.selectedAccommodationCodesFromUrl = 'hotel-code';

            store = new BaseRouterStore(rootStore);

            expect(store.isBackToPrevUrl).toBe(true);
        });

        it('should return false when isShortlistPagePrev is false and isDirectHotelSearch is false', () => {
            rootStore.queryParamsStore.selectedAccommodationCodesFromUrl = 'hotel-code';

            store = new BaseRouterStore(rootStore);

            expect(store.isBackToPrevUrl).toBe(false);
        });
    });

    describe('backToSearchUrl', () => {
        it('should return previous url when dynamic promo page was previous page', () => {
            rootStore.layoutStore.isDynamicPromoPagePrev = true;
            Object.defineProperty(store, 'prevUrl', { value: SitePath.Search });

            expect(store.backToSearchUrl).toEqual(SitePath.Search);
        });

        it('should return homepage when dynamic promo page was previous page and prevUrl is empty', () => {
            rootStore.layoutStore.isDynamicPromoPagePrev = true;

            expect(store.backToSearchUrl).toEqual(SitePath.Home);
        });

        it('should return url to promo page', () => {
            const url = '/promo-page-url';
            (rootStore.queryParamsStore.promoPage as any).mockReturnValueOnce(url);

            expect(store.backToSearchUrl).toEqual(url);
        });

        it('should return url to search results', () => {
            rootStore.queryParamsStore.buildSearchQuery = jest.fn(() => '?search-query');

            expect(store.backToSearchUrl).toEqual(`${SitePath.Search}?search-query`);
            expect(rootStore.queryParamsStore.buildSearchQuery).toHaveBeenCalledWith(
                true,
                false,
                false,
                rootStore.searchStore.isSelectedPackageFromMap,
                undefined,
            );
        });

        it('should return homepage', () => {
            Object.defineProperty(store, 'isDirectHotelSearch', { value: true });

            expect(store.backToSearchUrl).toEqual(`${SitePath.Home}`);
        });

        it('should return to previous url', () => {
            Object.defineProperty(store, 'isDirectHotelSearch', { value: true });
            Object.defineProperty(store, 'prevUrl', { value: SitePath.Search });

            expect(store.backToSearchUrl).toEqual(`${SitePath.Search}`);
        });

        it('should call buildSearchQuery with mapQueryParams', () => {
            rootStore.queryParamsStore.buildSearchQuery = jest.fn(() => '?search-query');
            rootStore.queryParamsStore.mapZoomLevel = 12;
            rootStore.bookingStore.accommodationIdFromUrl = '123';
            rootStore.searchStore.isSelectedPackageFromMap = true;

            expect(store.backToSearchUrl).toEqual(`${SitePath.Search}?search-query`);
            expect(rootStore.queryParamsStore.buildSearchQuery).toHaveBeenCalledWith(
                true,
                false,
                false,
                rootStore.searchStore.isSelectedPackageFromMap,
                {
                    zoomLevel: 12,
                    accomId: '123',
                },
            );
        });

        it('should call buildSearchQuery with mapQueryParams with fallback zoom level when mapZoomLevel is undefined', () => {
            rootStore.queryParamsStore.buildSearchQuery = jest.fn(() => '?search-query');
            rootStore.queryParamsStore.mapZoomLevel = undefined;
            rootStore.bookingStore.accommodationIdFromUrl = '123';
            rootStore.searchStore.isSelectedPackageFromMap = true;

            expect(store.backToSearchUrl).toEqual(`${SitePath.Search}?search-query`);
            expect(rootStore.queryParamsStore.buildSearchQuery).toHaveBeenCalledWith(
                true,
                false,
                false,
                rootStore.searchStore.isSelectedPackageFromMap,
                {
                    zoomLevel: 10, // fallback zoom level
                    accomId: '123',
                },
            );
        });
    });

    describe('updateSearchResultsPage', () => {
        it('should call buildUrl and buildSearchQuery with correct params when params are NOT provided in props', () => {
            store['buildUrl'] = jest.fn();
            store.rootStore.queryParamsStore.buildSearchQuery = jest.fn().mockReturnValue('test');

            store.updateSearchResultsPage();

            expect(store['buildUrl']).toHaveBeenCalledWith(SitePath.Search, 'test', undefined);
            expect(store.rootStore.queryParamsStore.buildSearchQuery).toHaveBeenCalledWith();
        });

        it('should call buildUrl and buildSearchQuery with correct params when params are provided in props', () => {
            store['buildUrl'] = jest.fn();
            store.rootStore.queryParamsStore.buildSearchQuery = jest.fn().mockReturnValue('test');

            store.updateSearchResultsPage('test2');

            expect(store['buildUrl']).toHaveBeenCalledWith(SitePath.Search, 'test', 'test2');
            expect(store.rootStore.queryParamsStore.buildSearchQuery).toHaveBeenCalled();
        });
    });

    describe('hasPromo', () => {
        it('should return false if no promo page', () => {
            expect(store.hasPromo).toBeFalsy();
        });

        it('should return true if promo page exists', () => {
            (rootStore.queryParamsStore.promoPage as any).mockReturnValueOnce('promo');
            expect(store.hasPromo).toBeTruthy();
        });
    });

    describe('clearPromoQuery', () => {
        it('should NOT remove sc_camp parameter', () => {
            store.replace = jest.fn();
            rootStore.queryParamsStore.utmParams = null;
            jest.mocked(parseQuery).mockReturnValue({
                sc_camp: '12345',
            });
            store.clearPromoQuery();
            expect(store.replace).toBeCalledWith('?sc_camp=12345', true);
        });

        it('should NOT remove sc_camp parameter with UTM params', () => {
            store.replace = jest.fn();
            rootStore.queryParamsStore.utmParams = {
                utm_source: 'utmSource',
                utm_campaign: 'utmCampaign',
                utm_medium: 'utmMedium',
                utm_content: 'utmContent',
                utm_term: 'utmTerm',
            };
            jest.mocked(parseQuery).mockReturnValue({
                sc_camp: '12345',
            });
            store.clearPromoQuery();
            expect(store.replace).toBeCalledWith(
                '?utm_source=utmSource&utm_campaign=utmCampaign&utm_medium=utmMedium&utm_content=utmContent&utm_term=utmTerm&sc_camp=12345',
                true,
            );
        });

        it('should remove query parameters', () => {
            store.replace = jest.fn();
            rootStore.queryParamsStore.utmParams = null;
            jest.mocked(parseQuery).mockReturnValue({
                test_param: 'test',
            });
            store.clearPromoQuery();
            expect(store.replace).toBeCalledWith('', true);
        });
    });

    describe('handleRouteChange', () => {
        it('should NOT save prevUrl', () => {
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('');
        });

        it('should save prevUrl when isPromoPage is true', () => {
            rootStore.layoutStore.isPromoPage = true;
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('test-url');
        });

        it('should save prevUrl when isDestinationPage is true', () => {
            rootStore.layoutStore.isDestinationPage = true;
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('test-url');
        });

        it('should save prevUrl when isAllHolidayTypesPage is true', () => {
            rootStore.layoutStore.isAllHolidayTypesPage = true;
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('test-url');
        });

        it('should save prevUrl when isHolidayTypePage is true', () => {
            rootStore.layoutStore.isHolidayTypePage = true;
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('test-url');
        });

        it('should save prevUrl when isDealsHubPage is true', () => {
            rootStore.layoutStore.isDealsHubPage = true;
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('test-url');
        });

        it('should save prevUrl when isShortlistPage is true', () => {
            rootStore.layoutStore.isShortlistPage = true;
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('test-url');
        });

        it('should save prevUrl when isSearchResultsPage is true and isDirectHotelSearch is false', () => {
            rootStore.searchStore.selectedDestinationCodes = [];
            store.isSearchResultsPage = jest.fn(() => true);
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('test-url');
        });

        it('should clear prevUrl when isHotelDetailsBookPagePrev is true', () => {
            rootStore.layoutStore.isHotelDetailsBookPagePrev = true;
            store.prevUrl = 'test';
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('');
        });

        it('should clear prevUrl when prevUrl is NOT tracked and isSearchResultsPage is false', () => {
            rootStore.layoutStore.isHomePage = true;
            store.isSearchResultsPage = jest.fn(() => false);
            store.prevUrl = 'test';
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('');
        });

        it('should clear prevUrl when prevUrl is NOT tracked and isDirectHotelSearch is false', () => {
            rootStore.searchStore.selectedDestinationCodes = [];
            rootStore.layoutStore.isHomePage = true;
            store.prevUrl = 'test';
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBe('');
        });

        it('should NOT save prevUrl when isHotelDetailsBookPage is true', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBeUndefined();
        });

        it('should NOT save prevUrl when isHotelDetailsBrowsePage is true', () => {
            rootStore.layoutStore.isHotelDetailsBrowsePage = true;
            store.handleRouteChange('test-url');

            expect(store.prevUrl).toBeUndefined();
        });

        it('should save referralUrl', () => {
            store.handleRouteChange('test-url');

            expect(store.referralUrl).toBe('test-url');
        });
    });

    describe('listenToPopStateUpdated', () => {
        const createRouter = () => ({
            query: {},
            pathname: '/',
            asPath: '/',
            events: {
                emit: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
            },
            push: jest.fn(() => Promise.resolve(true)),
            prefetch: jest.fn(() => Promise.resolve(true)),
            replace: jest.fn(() => Promise.resolve(true)),
        });

        let router;

        beforeEach(() => {
            router = createRouter();
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '', search: '' });
        });

        it('should NOT invoke toggleIsClickBackToSearch when isHotelDetailsBookPage is false', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: false,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);
            const mockToggleIsClickBackToSearch = jest
                .spyOn(store, 'toggleIsClickBackToSearch')
                .mockImplementation(jest.fn());

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(mockToggleIsClickBackToSearch).not.toHaveBeenCalled();
        });

        it('should NOT invoke toggleIsClickBackToSearch when path is not SitePath.Search', () => {
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: SitePath.ViewBooking, search: '' });

            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: true,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);
            const mockToggleIsClickBackToSearch = jest
                .spyOn(store, 'toggleIsClickBackToSearch')
                .mockImplementation(jest.fn());

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(mockToggleIsClickBackToSearch).not.toHaveBeenCalled();
        });

        it('should invoke toggleIsClickBackToSearch', () => {
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' });

            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: true,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);
            const mockToggleIsClickBackToSearch = jest
                .spyOn(store, 'toggleIsClickBackToSearch')
                .mockImplementation(jest.fn());

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(mockToggleIsClickBackToSearch).toHaveBeenCalledWith(true);
        });

        it('should NOT invoke replace', () => {
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' });

            const store = new BaseRouterStore(rootStore);
            const mockReplace = jest.spyOn(store, 'replace').mockImplementation(jest.fn());

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(mockReplace).not.toHaveBeenCalled();
        });

        it('should invoke replace', () => {
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: SitePath.BookingConfirmation, search: '' });

            const store = new BaseRouterStore(rootStore);
            const mockReplace = jest.spyOn(store, 'replace').mockImplementation(jest.fn());

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(mockReplace).toHaveBeenCalledWith('/');
        });

        it('should NOT update options and router when previous path equals current path', () => {
            const options = { shallow: undefined };

            const store = new BaseRouterStore(rootStore);
            store.router = router;

            store['listenToPopStateUpdated']({ as: '', options, url: '' }, '', '');

            expect(options.shallow).toBeUndefined();
            expect(router['_shallow']).toBeUndefined();
        });

        it('should update options and router previous path does not equal current path', () => {
            const options = { shallow: undefined };

            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' });

            const store = new BaseRouterStore(rootStore);
            store.router = router;

            store['listenToPopStateUpdated']({ as: '', options, url: '' }, '', '');

            expect(options.shallow).toBe(false);
            expect(router['_shallow']).toBe(false);
        });

        it('should NOT invoke clearBookingFlow when isHotelDetailsBookPage is false', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: false,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(rootStore.bookingStore.clearBookingFlow).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearBookingFlow when isHotelDetailsBookPagePrev is false', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: true,
                isHotelDetailsBookPagePrev: false,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(rootStore.bookingStore.clearBookingFlow).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearBookingFlow when previous path equals current path', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: true,
                isHotelDetailsBookPagePrev: true,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(rootStore.bookingStore.clearBookingFlow).not.toHaveBeenCalled();
        });

        it('should invoke clearBookingFlow', () => {
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' });

            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: true,
                isHotelDetailsBookPagePrev: true,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(rootStore.bookingStore.clearBookingFlow).toHaveBeenCalled();
        });

        it('should NOT invoke updateSearchValuesFromQuery, parseAndSyncQuery, grabSearchValuesFromSearchStore, fetchOffers, update options.shallow when previous path does not equal current path', () => {
            const options = { shallow: undefined };
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: SitePath.BookingConfirmation, search: '' });

            const store = new BaseRouterStore(rootStore);
            store.router = router;

            store['listenToPopStateUpdated']({ as: '', options, url: '' }, '', '');

            expect(rootStore.searchStore.updateSearchValuesFromQuery).not.toHaveBeenCalled();
            expect(rootStore.queryParamsStore.parseAndSyncQuery).not.toHaveBeenCalled();
            expect(rootStore.bookingStore.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
            expect(rootStore.hotelsStore.fetchOffers).not.toHaveBeenCalled();
            expect(options.shallow).toBeUndefined();
            expect(router['_shallow']).toBeUndefined();
        });

        it('should NOT invoke updateSearchValuesFromQuery, parseAndSyncQuery, grabSearchValuesFromSearchStore, fetchOffers, update options.shallow, update router when previous search equals current search', () => {
            const options = { shallow: undefined };

            const store = new BaseRouterStore(rootStore);
            store.router = router;

            store['listenToPopStateUpdated']({ as: '', options, url: '' }, '', '');

            expect(rootStore.searchStore.updateSearchValuesFromQuery).not.toHaveBeenCalled();
            expect(rootStore.queryParamsStore.parseAndSyncQuery).not.toHaveBeenCalled();
            expect(rootStore.bookingStore.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
            expect(rootStore.hotelsStore.fetchOffers).not.toHaveBeenCalled();
            expect(options.shallow).toBeUndefined();
            expect(router['_shallow']).toBeUndefined();
        });

        it('should NOT invoke updateSearchValuesFromQuery, parseAndSyncQuery, grabSearchValuesFromSearchStore, fetchOffers, update options.shallow, update router when isSearchResultsPage is false', () => {
            const options = { shallow: undefined };
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: '', search: 'search' });

            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isSearchResultsPage: false,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);
            store.router = router;

            store['listenToPopStateUpdated']({ as: '', options, url: '' }, '', '');

            expect(rootStore.searchStore.updateSearchValuesFromQuery).not.toHaveBeenCalled();
            expect(rootStore.queryParamsStore.parseAndSyncQuery).not.toHaveBeenCalled();
            expect(rootStore.bookingStore.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
            expect(rootStore.hotelsStore.fetchOffers).not.toHaveBeenCalled();
            expect(options.shallow).toBeUndefined();
            expect(router['_shallow']).toBeUndefined();
        });

        it('should invoke updateSearchValuesFromQuery, parseAndSyncQuery, grabSearchValuesFromSearchStore, fetchOffers, update options.shallow, update router when isSearchResultsPage is false', () => {
            const options = { shallow: undefined };
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: '', search: 'search' });

            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isSearchResultsPage: true,
            } as LayoutStore;

            const store = new BaseRouterStore(rootStore);
            store.router = router;

            store['listenToPopStateUpdated']({ as: '', options, url: '' }, '', '');

            expect(rootStore.searchStore.updateSearchValuesFromQuery).toHaveBeenCalledWith('search', '');
            expect(rootStore.queryParamsStore.parseAndSyncQuery).toHaveBeenCalledWith('search', true);
            expect(rootStore.bookingStore.grabSearchValuesFromSearchStore).toHaveBeenCalled();
            expect(rootStore.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
            expect(options.shallow).toBe(true);
            expect(router['_shallow']).toEqual(true);
        });

        it('should invoke clearSearchValues, parseAndSyncQuery, grabSearchValuesFromSearchStore when search equals SitePath.Search', () => {
            mockedParseUrl.mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' });

            const store = new BaseRouterStore(rootStore);

            store['listenToPopStateUpdated']({ as: '', options: {}, url: '' }, '', '');

            expect(rootStore.searchStore.clearSearchValues).toHaveBeenCalledWith(true);
            expect(rootStore.queryParamsStore.parseAndSyncQuery).toHaveBeenCalledWith('', true);
            expect(rootStore.bookingStore.grabSearchValuesFromSearchStore).toHaveBeenCalled();
        });
    });

    it('Should redirect to destination page', () => {
        store.router = {
            push: jest.fn(() => Promise.resolve(true)),
        };

        store.initialize();
        store.redirectToDestinationPageWithParams('/destination-url', { to: '07-07-2024', from: '12-07-2024' });

        expect(store.router.push).toHaveBeenCalledWith(
            '/en/holidays/destination-url?to=07-07-2024',
            '/en/holidays/destination-url?to=07-07-2024',
            { shallow: false },
        );
    });

    describe('redirectTo', () => {
        Object.defineProperty(window, 'scroll', {
            configurable: true,
            value: jest.fn(),
        });

        it('should NOT call window.scroll if preventScrollRestoration is undefined', async () => {
            await store.redirectTo(SitePath.AmendTransfer);

            expect(window.scroll).not.toHaveBeenCalled();
        });

        it('should call window.scroll if preventScrollRestoration is true', async () => {
            await store.redirectTo(SitePath.AmendTransfer, undefined, undefined, undefined, true);

            expect(window.scroll).toHaveBeenCalledWith(0, 0);
        });
    });

    describe('redirectToManageHubPage', () => {
        it('should redirect when booking is present', () => {
            store.redirectTo = jest.fn();
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: {
                    protocol: 'https:',
                    hostname: 'hostname',
                    port: '3000',
                    pathname: '/en/holidays/any-more',
                    origin: 'https://domain.com',
                    href: '',
                },
            });
            store.rootStore.viewBookingStore.booking = mockBooking;

            store.redirectToManageHubPage();

            expect(window.location.href).toBe('/en/holidays/manage/bookingReference');
        });

        it('should redirect when booking is present for trade-portal', () => {
            store.redirectTo = jest.fn();
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: {
                    protocol: 'https:',
                    hostname: 'hostname',
                    port: '3000',
                    pathname: '/en/holidays/any-more',
                    origin: 'https://domain.com',
                    href: '',
                },
            });
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.layoutStore.basePath = '/en/holidays/trade-portal';

            store.redirectToManageHubPage();

            expect(window.location.href).toBe('/en/holidays/manage/bookingReference');
        });

        it('should NOT call redirect when no booking', () => {
            store.redirectTo = jest.fn();
            store.rootStore.viewBookingStore.booking = null;

            store.redirectToManageHubPage();

            expect(store.redirectTo).not.toHaveBeenCalled();
        });

        it('should redirect Flight + Hotel bookings to the Flight + Hotel manage hub', () => {
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.viewBookingStore.isFlightAndHotelPackage = true;

            store.redirectToManageHubPage();

            expect(window.location.href).toBe('/en/flight-plus-hotel/manage/bookingReference');
        });

        it('should preserve the existing manage hub redirect for non Flight + Hotel bookings', () => {
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.viewBookingStore.isFlightAndHotelPackage = false;

            store.redirectToManageHubPage();

            expect(window.location.href).toBe('/en/holidays/manage/bookingReference');
        });

        it('should remove trade-portal from the manage hub URL', () => {
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.layoutStore.sitePath = '/en/holidays/trade-portal';
            store.rootStore.viewBookingStore.isFlightAndHotelPackage = false;

            store.redirectToManageHubPage();

            expect(window.location.href).toBe('/en/holidays/manage/bookingReference');
        });

        it('should remove trade-portal from the Flight + Hotel manage hub URL', () => {
            store.rootStore.viewBookingStore.booking = mockBooking;
            store.rootStore.viewBookingStore.isFlightAndHotelPackage = true;
            store.rootStore.layoutStore.sitePath = '/en/holidays/trade-portal';

            store.redirectToManageHubPage();

            expect(window.location.href).toBe('/en/flight-plus-hotel/manage/bookingReference');
        });
    });

    describe('Micro app redirections', () => {
        const store = new BaseRouterStore(rootStore);

        store.redirectToMicroApp = jest.fn();

        it('should call redirectToMicroApp with MicroAppChangeTransfer', () => {
            store.redirectToMicroAppChangeTransferPage();

            expect(store.redirectToMicroApp).toHaveBeenCalledWith(SitePath.MicroAppChangeTransfer);
        });

        it('should call redirectToMicroApp with MicroAppChangeFlight', () => {
            store.redirectToMicroAppChangeFlightPage();

            expect(store.redirectToMicroApp).toHaveBeenCalledWith(SitePath.MicroAppChangeFlight);
        });

        it('should call redirectToMicroApp with MicroAppChangeHotel', () => {
            store.redirectToMicroAppChangeHotelPage();

            expect(store.redirectToMicroApp).toHaveBeenCalledWith(SitePath.MicroAppChangeHotel);
        });

        it('should call redirectToMicroApp with MicroAppChangeRoomAndBoard', () => {
            store.redirectToMicroAppChangeRoomAndBoardPage();

            expect(store.redirectToMicroApp).toHaveBeenCalledWith(SitePath.MicroAppChangeRoomAndBoard);
        });

        it('should call redirectToMicroApp with MicroAppChangeSeats', () => {
            store.redirectToMicroAppChangeSeatsPage();

            expect(store.redirectToMicroApp).toHaveBeenCalledWith(SitePath.MicroAppChangeSeats);
        });

        it('should call redirectToMicroApp with MicroAppChangeName', () => {
            store.redirectToMicroAppChangeNamePage();

            expect(store.redirectToMicroApp).toHaveBeenCalledWith(SitePath.MicroAppChangeName);
        });

        it('should call redirectToMicroApp with MicroAppChangeDate', () => {
            store.redirectToMicroAppChangeDatePage();

            expect(store.redirectToMicroApp).toHaveBeenCalledWith(SitePath.MicroAppChangeDate);
        });
    });

    describe('getMapCardLink', () => {
        it('should return an empty string when offer is null', () => {
            const result = store.getMapCardLink({ offer: null, url: '/hotel-url', isSelected: false });
            expect(result).toBe('');
        });

        it('should return basePath with url when isDestinationPage is true', () => {
            rootStore.layoutStore.isDestinationPage = true;
            const result = store.getMapCardLink({
                offer: { transfers: [], hotel: {} } as unknown as IOfferWithHotelData,
                url: '/hotel-url',
                isSelected: false,
            });
            expect(result).toBe(`${rootStore.layoutStore.basePath}/hotel-url`);
        });

        it('should return basePath with url when isHotelDetailsBrowsePage is true and isSelected is false', () => {
            rootStore.layoutStore.isHotelDetailsBrowsePage = true;
            const result = store.getMapCardLink({
                offer: { transfers: [], hotel: {} } as unknown as IOfferWithHotelData,
                url: '/hotel-url',
                isSelected: false,
            });
            expect(result).toBe(`${rootStore.layoutStore.basePath}/hotel-url`);
        });

        it('should return extras page URL when isSelected is true and isHotelDetailsBrowsePage is false', () => {
            rootStore.layoutStore.isHotelDetailsBrowsePage = false;
            const mockBuildHotelDetailsQuery = jest.fn().mockReturnValue('?query');
            rootStore.queryParamsStore.buildHotelDetailsQuery = mockBuildHotelDetailsQuery;

            const result = store.getMapCardLink({
                offer: { transfers: [{ code: 'transfer-code' }], hotel: {} } as IOfferWithHotelData,
                url: '/hotel-url',
                isSelected: true,
            });

            expect(result).toBe(`${rootStore.layoutStore.basePath}${store.extrasPageUrl('?query')}`);
            expect(mockBuildHotelDetailsQuery).toHaveBeenCalledWith(
                {
                    hotel: {},
                    transfers: [
                        {
                            code: 'transfer-code',
                        },
                    ],
                },
                { dtransfer: 'transfer-code', transfer: 'transfer-code' },
            );
        });

        it('should return hotel details URL when isSelected is false and isHotelDetailsBrowsePage is false', () => {
            rootStore.layoutStore.isHotelDetailsBrowsePage = false;
            const mockBuildHotelDetailsQuery = jest.fn().mockReturnValue('?query');
            rootStore.queryParamsStore.buildHotelDetailsQuery = mockBuildHotelDetailsQuery;

            const result = store.getMapCardLink({
                offer: { transfers: [{ code: 'transfer-code' }], hotel: {} } as IOfferWithHotelData,
                url: '/hotel-url',
                isSelected: false,
            });

            expect(result).toBe(`${rootStore.layoutStore.basePath}${store.hotelDetailsUrl({}, '?query')}`);
            expect(mockBuildHotelDetailsQuery).toHaveBeenCalledWith(
                {
                    hotel: {},
                    transfers: [
                        {
                            code: 'transfer-code',
                        },
                    ],
                },
                {
                    dtransfer: 'transfer-code',
                    equip: '',
                    lcbIn: '',
                    lcbOut: '',
                    lug: '',
                    ss: '',
                    transfer: 'transfer-code',
                },
            );
        });
    });

    describe('hotelDetailsUrl', () => {
        it('should remove ecp query param from HD url when isFlightPlusHotelFunnel is true', () => {
            rootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn(
                () =>
                    '?ecp=fph&rooms=2&dstAirportCode=LGW&searchPodDepartureDate=2026-06-01&searchPodReturnDate=2026-06-15&apax=2&dPrice=10&sig=10100&rm1=2-0-0&rm2=1-0-0&selectedRef=REF123&selectedBoardType=BB&selectedPackId=12345',
            );
            Object.defineProperty(rootStore.queryParamsStore, 'isFlightPlusHotelFunnel', {
                get: () => true,
            });

            const result = store.hotelDetailsUrl({} as IHotel);

            expect(result).not.toContain('ecp');
            expect(result).not.toContain('dstAirportCode');
            expect(result).not.toContain('searchPodDepartureDate');
            expect(result).not.toContain('searchPodReturnDate');
            expect(result).not.toContain('apax');
            expect(result).not.toContain('dPrice');
            expect(result).not.toContain('price');
            expect(result).not.toContain('sig');
            expect(result).not.toContain('rm1');
            expect(result).not.toContain('rm2');
            expect(result).not.toContain('selectedRef');
            expect(result).not.toContain('selectedBoardType');
            expect(result).not.toContain('selectedPackId');
            expect(result).toContain('rooms=2');
        });

        it('should return url with all params when isFlightPlusHotelFunnel is false', () => {
            rootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn(() => '?ecp=fph&rooms=2');
            Object.defineProperty(rootStore.queryParamsStore, 'isFlightPlusHotelFunnel', {
                get: () => false,
            });

            const result = store.hotelDetailsUrl({} as IHotel);

            expect(result).toContain('ecp=fph');
            expect(result).toContain('rooms=2');
        });

        it('should return url without query string when ecp is the only param and isFlightPlusHotelFunnel is true', () => {
            rootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn(
                () =>
                    '?ecp=fph&dstAirportCode=LGW&searchPodDepartureDate=2026-06-01&searchPodReturnDate=2026-06-15&apax=2&dPrice=10&sig=10100&rm1=2-0-0&rm2=1-0-0&selectedRef=REF123&selectedBoardType=BB',
            );
            Object.defineProperty(rootStore.queryParamsStore, 'isFlightPlusHotelFunnel', {
                get: () => true,
            });

            const result = store.hotelDetailsUrl({} as IHotel);

            expect(result).not.toContain('?');
            expect(result).not.toContain('ecp');
        });
    });

    describe('paginatePromoPage', () => {
        let pushStateSpy: jest.SpyInstance;

        beforeEach(() => {
            pushStateSpy = jest.spyOn(globalThis.history, 'pushState');
        });

        afterEach(() => {
            pushStateSpy.mockRestore();
        });

        it('should call history.pushState with correct state object including page number', () => {
            rootStore.layoutStore.basePath = '/base';
            store['router'] = { asPath: '/base/search' } as Partial<NextRouter>;
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '/search', search: '' });

            store.paginatePromoPage(2);

            expect(pushStateSpy).toHaveBeenCalledWith(
                {
                    __N: true,
                    as: '/base/search',
                    url: '/base/search',
                    options: { shallow: true, promoPage: 2, previousPage: '/base/search' },
                },
                '',
                '/base/search',
            );
        });

        it('should call history.pushState with page 0 when page is 0', () => {
            rootStore.layoutStore.basePath = '';
            store['router'] = { asPath: '/promo' } as Partial<NextRouter>;
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '/promo', search: '' });

            store.paginatePromoPage(0);

            expect(pushStateSpy).toHaveBeenCalledWith(
                {
                    __N: true,
                    as: '/promo',
                    url: '/promo',
                    options: { shallow: true, promoPage: 0, previousPage: '/promo' },
                },
                '',
                '/promo',
            );
        });

        it('should use correct URL with basePath', () => {
            rootStore.layoutStore.basePath = '/holidays';
            store['router'] = { asPath: '/holidays/search' } as Partial<NextRouter>;
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '/search', search: '' });

            store.paginatePromoPage(3);

            expect(pushStateSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    as: '/holidays/search',
                    url: '/holidays/search',
                }),
                '',
                '/holidays/search',
            );
        });

        it('should always include __N and shallow options in state', () => {
            rootStore.layoutStore.basePath = '';
            store['router'] = { asPath: '/test' } as Partial<NextRouter>;
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '/test', search: '' });

            store.paginatePromoPage(1);

            expect(pushStateSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    __N: true,
                    options: expect.objectContaining({
                        shallow: true,
                    }),
                }),
                '',
                expect.any(String),
            );
        });
    });
});
