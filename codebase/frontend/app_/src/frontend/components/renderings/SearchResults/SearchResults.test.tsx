import React from 'react';
import { waitFor } from '@testing-library/dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { luggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOffer } from 'models/data/IOffer';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { DataStatus } from 'models/enum/DataStatus';

import SearchResults, { TSearchResultsProps } from './SearchResults';
import * as searchResultsUtils from './SearchResults.utils';

const mockSearchResultsContent = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/SearchResultsContent/SearchResultsContent', () => ({
    __esModule: true,
    default: props => {
        mockSearchResultsContent(props);

        return (
            <div data-tid='search-results-content'>
                <button data-tid='load-more-offers' onClick={props.onLoadMore} />
                <button data-tid='load-previous-offers' onClick={props.onLoadPrevious} />
                <button data-tid='select-offer-index' onClick={() => props.onSetSelectedOfferIndex(1, 2)} />
            </div>
        );
    },
}));

const mockNoResultsErrorBlock = jest.fn();
jest.mock('./components/NoResultsErrorBlock/NoResultsErrorBlock', () => ({
    __esModule: true,
    default: props => {
        mockNoResultsErrorBlock(props);

        return <div data-tid='no-results-error-block' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockIsExtraSmallMobile = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockIsExtraSmallMobile,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: ({ name }) => <div data-tid={name} />,
}));

jest.mock('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore'),
    useCompareStore: () => mockLocalStore,
}));

let mockStores;
let mocks;
let mockLocalStore;

describe('<SearchResults />', () => {
    const resetMocks = (): TSearchResultsProps => ({
        fields: {
            AlternativeFlightsDefaultSort: {
                fields: {
                    Code: mockSitecoreField(AlternativeFlightsSortBy.NearestAirport),
                    Title: mockSitecoreField('default sort'),
                },
                id: 'default id',
            },
            AlternativeFlightsSortOrders: [
                {
                    fields: {
                        Code: mockSitecoreField(AlternativeFlightsSortBy.OutboundEarliestDeparture),
                        Title: mockSitecoreField('default sort'),
                    },
                    id: 'default id',
                },
                {
                    fields: {
                        Code: mockSitecoreField(AlternativeFlightsSortBy.PriceLowToHigh),
                        Title: mockSitecoreField('sort value 1'),
                    },
                    id: 'sort id 1',
                },
            ],
            DefaultText: mockSitecoreField('default text'),
            HoldBagText: mockSitecoreField('hold bag text'),
            SortOrders: [],
        },
        params: null,
        rendering: {},
    });

    const createMockLocalStore = () => ({
        isCompareModeEnabled: false,
        isCompareOverlayOpened: false,
    });

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            hotelsStore: {
                status: DataStatus.Loaded,
                offers: [
                    { id: '0' },
                    {
                        id: '1',
                        promotion: {
                            icon: 'promo-icon.jpg',
                            bannerTitle: 'Summer Sale Now On',
                            minimumSpend1: '£100 off holidays over £800',
                            minimumSpend2: '£150 off holidays over £1000',
                            minimumSpend3: '£200 off holidays over £1500',
                            promoCode: 'SUMMERSALE',
                            date: 'Travel between 01/07/22 - 31/08/22',
                            tandCs: 'T&C Apply',
                            cardDescription: '<div data-tid="test-id">test</div>',
                        },
                    },
                    {
                        id: '2',
                        promotion: {
                            icon: 'promo-icon.jpg',
                            bannerTitle: 'Summer Sale Now On 2',
                            minimumSpend1: '£100 off holidays over £800',
                            minimumSpend2: '£150 off holidays over £1000',
                            minimumSpend3: '£200 off holidays over £1500',
                            promoCode: 'SUMMERSALE',
                            date: 'Travel between 01/07/22 - 31/08/22',
                            tandCs: 'T&C Apply',
                            cardDescription: '<div data-tid="test-id">test</div>',
                        },
                    },
                ],
                hasOffers: true,
                numberOfHotels: 3,
                fetchOffers: jest.fn(),
                setIsLoadMoreOffers: jest.fn(),
                setIsLoadPreviousOffers: jest.fn(),
                resetOffersDataStatus: jest.fn(),
            },
            searchStore: {
                selectedOfferIndex: -1,
                page: 1,
                take: 10,
                searchTo: {
                    selectedAccommodationCodes: '',
                },
                setSelectedOfferIndex: jest.fn(),
                setPageNumber: jest.fn(),
                retreiveSearchParameters: jest.fn(),
                isSeachPerformWithNewParams: false,
                setSeachPerformWithNewParams: jest.fn(),
            },
            routerStore: {
                redirectToSearchResultsPage: jest.fn(),
                redirectToHotelDetailsPage: jest.fn(),
                isClickBackToSearch: false,
                clearIsClickBackToSearch: jest.fn(),
            },
            trackingStore: {
                searchPaginationChangeTrigger: jest.fn(),
                forceOptimizeSRPEvent: jest.fn(),
            },
            layoutStore: {
                isPromoPage: false,
                layoutId: '',
                isSearchResultsPage: false,
                isMaintenance: false,
                isSearchResultsPagePrev: false,
                isPromoPagePrev: false,
            },
            bookingStore: {
                resetBookingStore: jest.fn(),
                clearPackageValidation: jest.fn(),
                grabSearchValuesFromSearchStore: jest.fn(),
            },
            promoPageStore: {
                saveSearchParamsAndFilterToLocalStorage: jest.fn(),
                pageFromStorage: jest.fn(),
                wasPromoPageClearedInStorage: false,
                setPromoPageClearedInStorage: jest.fn(),
            },
            appStore: {
                isScreenLessMedium: false,
            },
            queryParamStore: {
                utmParams: {},
            },
            searchFiltersStore: {
                filtersChanged: false,
                pageNumberChanged: false,
                isModalDisplayed: false,
                isFilterActive: false,
                onChangeSearchFilterStore: jest.fn(),
            },
        });
        mockLocalStore = createMockLocalStore();
    });

    it('should render SearchResultsContent', () => {
        mockStores.layoutStore.isMaintenance = false;
        mockStores.searchStore.page = 2;

        render(<SearchResults {...mocks} />);

        expect(mockSearchResultsContent).toHaveBeenCalledWith(
            expect.objectContaining({
                fallbackImage: 'HotelFallbackImage',
                fields: mocks.fields,
                isLoadingMoreShown: false,
                isLoadingPreviousShown: false,
                isOffersListShown: true,
                maxLoadedPageNumber: 2,
                minLoadedPageNumber: 2,
                offerCardBySelectedIndex: { current: null },
                boxRef: { current: null },
            }),
        );

        expect(screen.getByTestId('search-results-content')).toBeInTheDocument();
        expect(screen.queryByTestId('no-results-error-block')).not.toBeInTheDocument();
    });

    it('should render NoResultsErrorBlock', () => {
        mockStores.layoutStore.isMaintenance = true;

        render(<SearchResults {...mocks} />);

        expect(mockNoResultsErrorBlock).toHaveBeenCalledWith({
            description: 'NoResultsErrorBlockDescription',
            icon: 'NoResultsErrorBlockIcon',
            title: 'NoResultsErrorBlockTitle',
        });
        expect(screen.getByTestId('no-results-error-block')).toBeInTheDocument();
        expect(screen.queryByTestId('search-results-content')).not.toBeInTheDocument();
    });

    it('should have search result number = 1 and redirect to hotel details page', () => {
        mockStores.hotelsStore.hasOffers = true;
        mockStores.searchStore.searchTo.selectedAccommodationCodes = 'test';
        mockStores.hotelsStore.offers = [
            {
                id: '3',
                date: '2020-09-07T00:00:00',
                stay: 7,
                price: 378.0,
                pricePP: 189.0,
                accom: {} as any,
                transport: {} as any,
                transfers: {} as any,
                hotel: {} as any,
                ecoFacility: {} as any,
                altBoards: [],
                hasDistressedFlights: false,
                extraLuggageInfo: luggageInfoMock,
                touristTax: 0,
                touristTaxPP: 0,
                hasDiscountedBoardUpgrade: true,
                priceExcludingTouristTax: 378.0,
                pricePPExcludingTouristTax: 189.0,
            } as IOffer,
        ];
        mockStores.hotelsStore.numberOfHotels = 1;
        mockStores.hotelsStore.status = DataStatus.Loaded;

        render(<SearchResults {...mocks} />);

        expect(mockStores.routerStore.redirectToHotelDetailsPage).toHaveBeenCalled();
        expect(mockStores.searchStore.setSelectedOfferIndex).toHaveBeenCalled();
    });

    it('should NOT call redirect to hotel details and set select offer index when selectedAccommodationCodes is undefined', () => {
        mockStores.hotelsStore.hasOffers = false;
        mockStores.hotelsStore.offers = [];
        mockStores.hotelsStore.numberOfHotels = 0;

        mockStores.hotelsStore.status = DataStatus.Loading;

        const { rerender } = render(<SearchResults {...mocks} />);

        mockStores.hotelsStore.status = DataStatus.Loaded;

        rerender(<SearchResults {...mocks} />);

        expect(mockStores.routerStore.redirectToHotelDetailsPage).not.toBeCalled();
        expect(mockStores.searchStore.setSelectedOfferIndex).not.toBeCalled();
    });

    it('should fetch offers for next page', async () => {
        mockStores.searchStore.page = 2;

        const { rerender } = render(<SearchResults {...mocks} />);

        expect(mockSearchResultsContent).toHaveBeenCalledWith(
            expect.objectContaining({
                maxLoadedPageNumber: 2,
            }),
        );

        fireEvent.click(screen.getByTestId('load-more-offers'));

        await waitFor(() => {
            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(3);
            expect(mockStores.hotelsStore.setIsLoadMoreOffers).toHaveBeenNthCalledWith(1, true);
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
            expect(mockStores.routerStore.redirectToSearchResultsPage).toHaveBeenCalled();
            expect(mockStores.trackingStore.searchPaginationChangeTrigger).toHaveBeenCalled();
            expect(mockStores.hotelsStore.setIsLoadMoreOffers).toHaveBeenNthCalledWith(2, false);
        });

        rerender(<SearchResults {...mocks} />);

        expect(mockSearchResultsContent).toHaveBeenCalledWith(
            expect.objectContaining({
                maxLoadedPageNumber: 3,
            }),
        );
    });

    it('should fetch offers for previous page and update props', async () => {
        mockStores.searchStore.page = 2;
        const mockScrollToPrevLoadPage = jest.spyOn(searchResultsUtils, 'scrollToPrevLoadPage');

        const { rerender } = render(<SearchResults {...mocks} />);

        expect(mockSearchResultsContent).toHaveBeenCalledWith(
            expect.objectContaining({
                minLoadedPageNumber: 2,
            }),
        );

        fireEvent.click(screen.getByTestId('load-previous-offers'));

        await waitFor(() => {
            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(1);
            expect(mockStores.hotelsStore.setIsLoadPreviousOffers).toHaveBeenNthCalledWith(1, true);
            expect(mockStores.hotelsStore.setIsLoadPreviousOffers).toHaveBeenNthCalledWith(2, false);
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
            expect(mockStores.routerStore.redirectToSearchResultsPage).toHaveBeenCalled();
            expect(mockStores.trackingStore.searchPaginationChangeTrigger).toHaveBeenCalled();
            expect(mockScrollToPrevLoadPage).toHaveBeenCalledWith(mockStores.searchStore.take);
        });

        rerender(<SearchResults {...mocks} />);

        expect(mockSearchResultsContent).toHaveBeenCalledWith(
            expect.objectContaining({
                minLoadedPageNumber: 1,
            }),
        );
    });

    describe('onSetSelectedOfferIndex', () => {
        beforeEach(() => {
            mockStores.hotelsStore.offers = [{ id: '1' }, { id: '2' }, { id: '3' }] as IOffer[];
            mockStores.searchStore.take = 2;
        });

        it('should set only index on desktop (isExtraSmallMobile = false)', () => {
            mockIsExtraSmallMobile = false;
            render(<SearchResults {...mocks} />);

            fireEvent.click(screen.getByTestId('select-offer-index'));

            expect(mockStores.searchStore.setSelectedOfferIndex).toHaveBeenCalledWith(1);
            expect(mockStores.searchStore.setPageNumber).not.toHaveBeenCalled();
        });

        it('should set index and page on mobile when offers > itemsOnEachPage (isExtraSmallMobile = true)', () => {
            mockIsExtraSmallMobile = true;

            render(<SearchResults {...mocks} />);

            fireEvent.click(screen.getByTestId('select-offer-index'));

            expect(mockStores.searchStore.setSelectedOfferIndex).toHaveBeenCalledWith(1);
            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(2);
        });

        it('should call saveSearchParamsAndFilterToLocalStorage on promo page', () => {
            mockStores.layoutStore.isPromoPage = true;

            render(<SearchResults {...mocks} />);

            fireEvent.click(screen.getByTestId('select-offer-index'));

            expect(mockStores.promoPageStore.saveSearchParamsAndFilterToLocalStorage).toHaveBeenCalled();
        });
    });

    describe('componentDidMount', () => {
        it('should call onChangeSearchFilterStore when landing to promo-page from search-results', () => {
            const ctx = {} as SearchFilterStore;
            mockStores.searchFiltersStore.onChangeSearchFilterStore = jest.fn(({ cb }) => cb(ctx));

            mockStores.layoutStore.isPromoPage = true;
            mockStores.layoutStore.isSearchResultsPagePrev = true;

            render(<SearchResults {...mocks} />);

            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                cb: expect.any(Function),
            });
            expect(ctx).toStrictEqual({
                filters: [],
                isFiltersLoaded: false,
                isModalDisplayed: false,
                isPresetDestinationFilter: false,
            });
        });

        it('should call onChangeSearchFilterStore when landing to search-results from promo-page', () => {
            const ctx = {} as SearchFilterStore;
            mockStores.searchFiltersStore.onChangeSearchFilterStore = jest.fn(({ cb }) => cb(ctx));

            mockStores.layoutStore.isSearchResultsPage = true;
            mockStores.layoutStore.isPromoPagePrev = true;

            render(<SearchResults {...mocks} />);

            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                cb: expect.any(Function),
            });
            expect(ctx).toStrictEqual({
                filters: [],
                isFiltersLoaded: false,
                isModalDisplayed: false,
                isPresetDestinationFilter: false,
            });
        });

        it('should call onChangeSearchFilterStore when user lands to search-results from promo-page', () => {
            const ctx = {} as SearchFilterStore;

            mockStores.searchFiltersStore.onChangeSearchFilterStore = jest.fn(({ cb }) => cb(ctx));

            mockStores.layoutStore.isSearchResultsPage = true;
            mockStores.layoutStore.isPromoPagePrev = true;

            render(<SearchResults {...mocks} />);

            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                cb: expect.any(Function),
            });
            expect(ctx).toStrictEqual({
                filters: [],
                isFiltersLoaded: false,
                isModalDisplayed: false,
                isPresetDestinationFilter: false,
            });
        });

        it('should NOT call onChangeSearchFilterStore by default', () => {
            const ctx = {} as SearchFilterStore;
            mockStores.searchFiltersStore.onChangeSearchFilterStore = jest.fn(({ cb }) => cb(ctx));

            render(<SearchResults {...mocks} />);

            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).not.toHaveBeenCalled();
            expect(ctx).toStrictEqual({});
        });
    });

    describe('screen size change', () => {
        it('should reset page numbers when switching from desktop to mobile', () => {
            mockIsExtraSmallMobile = false;
            mockStores.searchStore.page = 3;

            const { rerender } = render(<SearchResults {...mocks} />);

            mockIsExtraSmallMobile = true;
            rerender(<SearchResults {...mocks} />);

            expect(mockStores.searchStore.setPageNumber).not.toHaveBeenCalled();
        });
    });

    describe('search with new params', () => {
        it('should reset page numbers and redirect when search is performed with new params', () => {
            mockStores.searchStore.isSeachPerformWithNewParams = true;
            mockStores.layoutStore.isPromoPage = false;
            mockStores.layoutStore.isSearchResultsPage = false;

            render(<SearchResults {...mocks} />);

            expect(mockStores.routerStore.redirectToSearchResultsPage).toHaveBeenCalled();
            expect(mockStores.searchStore.setSeachPerformWithNewParams).toHaveBeenCalledWith(false);
        });

        it('should not redirect when already on search results page', () => {
            mockStores.searchStore.isSeachPerformWithNewParams = true;
            mockStores.layoutStore.isSearchResultsPage = true;

            render(<SearchResults {...mocks} />);

            expect(mockStores.routerStore.redirectToSearchResultsPage).not.toHaveBeenCalled();
        });
    });

    describe('promo page storage cleared', () => {
        it('should reset page numbers when promo page storage is cleared', () => {
            mockStores.promoPageStore.wasPromoPageClearedInStorage = true;

            const { rerender } = render(<SearchResults {...mocks} />);

            mockStores.promoPageStore.wasPromoPageClearedInStorage = false;
            rerender(<SearchResults {...mocks} />);

            expect(mockStores.promoPageStore.setPromoPageClearedInStorage).toHaveBeenCalledWith(false);
            expect(mockStores.searchStore.setSelectedOfferIndex).toHaveBeenCalledWith(-1);
        });
    });

    describe('componentDidUpdate', () => {
        const mockScrollHandler = jest.spyOn(searchResultsUtils, 'scrollHandler');

        it('should call scrollHandler on status change to Loaded', () => {
            const { rerender } = render(<SearchResults {...mocks} />);

            mockStores.hotelsStore.status = DataStatus.Loaded;

            rerender(<SearchResults {...mocks} />);

            expect(mockScrollHandler).toHaveBeenCalledTimes(1);
        });
    });

    describe('componentWillUnmount', () => {
        it('should call resetOffersDataStatus on unmount', () => {
            const { unmount } = render(<SearchResults {...mocks} />);

            unmount();

            expect(mockStores.hotelsStore.resetOffersDataStatus).toHaveBeenCalled();
        });
    });

    describe('compare placeholder', () => {
        it('should not have compareWrapperActive', () => {
            render(<SearchResults {...mocks} />);

            expect(screen.getByTestId('compare-deals-wrapper')).not.toHaveClass('compareWrapperActive');
        });

        it('should add compareWrapperActive when compare mode is active', () => {
            mockLocalStore.isCompareModeEnabled = true;
            render(<SearchResults {...mocks} />);

            expect(screen.getByTestId('compare-deals-wrapper')).toHaveClass('compareWrapperActive');
        });

        it('should add isCompareOverlayOpened when compare overlay is opened is active', () => {
            mockLocalStore.isCompareOverlayOpened = true;
            render(<SearchResults {...mocks} />);

            expect(screen.getByTestId('compare-deals-wrapper')).toHaveClass('compareOverlayOpened');
        });
    });
});
