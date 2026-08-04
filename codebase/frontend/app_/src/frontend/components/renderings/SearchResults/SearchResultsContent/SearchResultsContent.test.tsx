import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import * as mediaUtils from 'frontend/hooks/useMediaQuery';
import { DataStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';
import SearchResultsLoadingSkeleton from 'frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton';

import SearchResultsContent from './SearchResultsContent';

const mockSearchResultsHeaderComponent = jest.fn();

jest.mock('frontend/components/renderings/SearchResults/components/SearchResultsHeader', () => ({
    __esModule: true,
    default: props => {
        mockSearchResultsHeaderComponent(props);

        return <div data-tid='search-results-header' />;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: () => <div data-tid='holiday-with-confidence' />,
}));

const mockLeftHandFilters = jest.fn();
jest.mock('frontend/components/common/LeftHandFilter', () => ({
    __esModule: true,
    default: props => {
        mockLeftHandFilters(props);

        return <div data-tid='left-hand-filters' />;
    },
}));

jest.mock('frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton', () =>
    jest.fn(() => <div data-tid='search-results-skeleton' />),
);

const mockPaginationComponent = jest.fn();

jest.mock('frontend/components/common/Pagination', () => ({
    __esModule: true,
    default: ({ fetchResults, ...props }) => {
        mockPaginationComponent(props);

        return <button onClick={() => fetchResults(true)} onKeyDown={jest.fn()} data-tid='pagination' />;
    },
}));

const mockOffersComponent = jest.fn();

jest.mock('frontend/components/renderings/SearchResults/components/Offers/Offers', () => ({
    __esModule: true,
    default: props => {
        mockOffersComponent(props);

        return <div data-tid='offers' />;
    },
}));

const mockRecommendedCarouselComponent = jest.fn();

jest.mock('frontend/components/renderings/SearchResults/components/RecomendedCarouselFor5ResultsPage', () => ({
    __esModule: true,
    default: props => {
        mockRecommendedCarouselComponent(props);

        return <div data-tid='recommended-carousel' />;
    },
}));

const mockRecommendedHotels = jest.fn();
jest.mock('frontend/components/renderings/GenericRecommendedHotels/GenericRecommendedHotels', () => ({
    __esModule: true,
    default: props => {
        mockRecommendedHotels(props);

        return <div data-tid='recommended-hotels' />;
    },
}));

jest.mock('frontend/components/renderings/SearchResults/components/NoResults', () => ({
    __esModule: true,
    default: () => <div data-tid='no-results' />,
}));

jest.mock('frontend/components/renderings/SearchResults/components/ShortlistManaging', () => ({
    __esModule: true,
    default: () => <div data-tid='shortlist-managing' />,
}));

jest.mock('frontend/components/cro/Experiment/hooks/useExperiment');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let props;
const mockUseMobileViewport = jest.spyOn(mediaUtils, 'useMobileViewport');

describe('<SearchResultsContent />', () => {
    beforeEach(() => {
        mockUseMobileViewport.mockReturnValue(false);
        mockStores = createMockStores({
            hotelsStore: {
                status: DataStatus.Loading,
                offers: [mockedOffer, mockedOffer],
                hasOffers: true,
                numberOfHotels: 2,
                fetchOffers: jest.fn(),
            },
            searchStore: {
                page: 1,
                take: 10,
                setPageNumber: jest.fn(),
            },
            routerStore: {
                redirectToSearchResultsPage: jest.fn(),
            },
            trackingStore: {
                searchPaginationChangeTrigger: jest.fn(),
            },
            searchFiltersStore: {
                areFiltersCollapsed: true,
                onChangeSearchFilterStore: jest.fn(),
                isFiltersLoaded: true,
                filters: [{}],
                hydrateRecentlyUsedFilters: jest.fn(),
                setRecommendedFilterExperimentTestVariant: jest.fn(),
                setRecentlyUsedFilterExperimentTestVariant: jest.fn(),
            },
            bookingStore: {
                recommendedHotels: undefined,
            },
            promoPageStore: {
                setForcePrefillPage: jest.fn(),
            },
            layoutStore: {
                isPromoPage: false,
                isStaticPromoPage: false,
                isSearchResultsPage: false,
            },
        });

        props = {
            fallbackImage: {},
            isLoadingMoreShown: false,
            isLoadingPreviousShown: false,
            isOffersListShown: true,
            maxLoadedPageNumber: 10,
            minLoadedPageNumber: 1,
            offerCardBySelectedIndex: 1,
            onLoadMore: jest.fn(),
            onLoadPrevious: jest.fn(),
            onSetSelectedOfferIndex: jest.fn(),
            boxRef: { current: null },
        };

        jest.mocked(useExperiment).mockReturnValue(undefined);
    });

    it('should render desktop view when hasOffers is true and status is Loaded', () => {
        mockStores.hotelsStore.status = DataStatus.Loaded;

        const { container } = render(<SearchResultsContent {...props} />);

        expect(screen.queryByText(SitecoreDictionary.SearchResultsErrorsLoadingOffersError)).not.toBeInTheDocument();

        expect(screen.getByTestId('search-results-header')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-with-confidence')).toBeInTheDocument();
        expect(screen.getByTestId('left-hand-filters')).toBeInTheDocument();
        expect(screen.getByTestId('offers')).toBeInTheDocument();
        expect(screen.getByTestId('search-results-right-column')).toHaveClass('rightColumn noMargin');

        expect(screen.queryByTestId('no-results')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
        expect(container.querySelectorAll('.spinner-container')).toHaveLength(0);
    });

    it('should render search-results-right-column without noMargin class when recommendedHotels are provided', () => {
        mockStores.hotelsStore.status = DataStatus.Loaded;
        mockStores.bookingStore.recommendedHotels = [{}, {}];

        render(<SearchResultsContent {...props} />);

        expect(screen.getByTestId('search-results-right-column')).toHaveClass('rightColumn');
    });

    it('should render search-results-right-column without noMargin class when isLoadingMoreShown is true', () => {
        mockStores.hotelsStore.status = DataStatus.Loaded;
        props.isLoadingMoreShown = true;

        render(<SearchResultsContent {...props} />);

        expect(screen.getByTestId('search-results-right-column')).toHaveClass('rightColumn');
    });

    it('should render LeftHandFilters with isCollapsed = false when areFiltersCollapsed is false', () => {
        mockStores.searchFiltersStore.areFiltersCollapsed = false;
        mockStores.hotelsStore.status = DataStatus.Loaded;

        render(<SearchResultsContent {...props} />);

        expect(mockLeftHandFilters).toHaveBeenCalledWith({
            isCollapsed: false,
            rendering: undefined,
            isPaginationShown: false,
            isShown: true,
        });
    });

    it('should render LeftHandFilters with isCollapsed = true when areFiltersCollapsed is true', () => {
        mockStores.hotelsStore.status = DataStatus.Loaded;
        props.isOffersListShown = false;
        props.isLoadingMoreShown = true;

        render(<SearchResultsContent {...props} />);

        expect(mockLeftHandFilters).toHaveBeenCalledWith({
            isCollapsed: true,
            rendering: undefined,
            isPaginationShown: false,
            isShown: true,
        });
    });

    it('should render LeftHandFilters with isPaginationShown = true when isOffersListShown and isLoadingMoreShown are true', () => {
        props.isLoadingMoreShown = true;

        render(<SearchResultsContent {...props} />);

        expect(mockLeftHandFilters).toHaveBeenCalledWith({
            isCollapsed: true,
            rendering: undefined,
            isPaginationShown: true,
            isShown: true,
        });
    });

    it('should render mobile view when hasOffers is true and status is Loaded', () => {
        mockUseMobileViewport.mockReturnValue(true);
        mockStores.hotelsStore.status = DataStatus.Loaded;
        props.isLoadingMoreShown = true;
        props.isLoadingPreviousShown = true;

        const { container } = render(<SearchResultsContent {...props} />);

        expect(screen.queryByText(SitecoreDictionary.SearchResultsErrorsLoadingOffersError)).not.toBeInTheDocument();

        expect(screen.getByTestId('search-results-header')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-with-confidence')).toBeInTheDocument();
        expect(screen.getByTestId('offers')).toBeInTheDocument();
        expect(screen.getAllByTestId('pagination')).toHaveLength(2);

        expect(screen.queryByTestId('no-results')).not.toBeInTheDocument();
        expect(screen.queryByTestId('left-hand-filters')).not.toBeInTheDocument();
        expect(container.querySelectorAll('.spinner-container')).toHaveLength(0);
    });

    it('should render Error block when status is LoadingError', () => {
        mockStores.hotelsStore.status = DataStatus.Error;
        mockStores.layoutStore.isPromoPage = false;

        render(<SearchResultsContent {...props} />);

        expect(screen.getByText(SitecoreDictionary.SearchResultsErrorsLoadingOffersError)).toBeInTheDocument();
        expect(screen.queryByTestId('recommended-hotels')).not.toBeInTheDocument();
        expect(mockRecommendedHotels).not.toHaveBeenCalled();
    });

    it('should render Error block when status is LoadingError on PromoPage', () => {
        mockStores.hotelsStore.status = DataStatus.Error;
        mockStores.layoutStore.isPromoPage = true;

        render(<SearchResultsContent {...props} />);

        expect(screen.getByText(SitecoreDictionary.SearchResultsErrorsLoadingOffersError)).toBeInTheDocument();
        expect(screen.getByTestId('recommended-hotels')).toBeInTheDocument();
        expect(mockRecommendedHotels).toHaveBeenCalledWith({
            title: SitecoreDictionary.SearchResultsLabelsBd4CarouselTitleErrorStatus,
            withoutPadding: true,
        });
    });

    describe('SearchResultsHeader', () => {
        it('should got props', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;

            render(<SearchResultsContent {...props} />);

            expect(mockSearchResultsHeaderComponent).toHaveBeenCalledWith({
                hasOffers: true,
                totalOffers: 2,
                status: DataStatus.Loaded,
            });
        });
    });

    describe('HolidayWithConfidence', () => {
        it('should be rendered when hasOffers is true', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;

            render(<SearchResultsContent {...props} />);

            expect(screen.getByTestId('holiday-with-confidence')).toBeInTheDocument();
        });

        it('should be rendered when isLoading is true', () => {
            mockStores.hotelsStore.status = DataStatus.Loading;

            render(<SearchResultsContent {...props} />);

            expect(screen.getByTestId('holiday-with-confidence')).toBeInTheDocument();
        });

        it('should NOT be rendered when hasOffers is true and status is not_loaded', () => {
            mockStores.hotelsStore.status = DataStatus.NotLoaded;
            mockStores.hotelsStore.hasOffers = true;

            render(<SearchResultsContent {...props} />);

            expect(screen.queryByTestId('holiday-with-confidence')).not.toBeInTheDocument();
        });

        it('should NOT be rendered when hasOffers is false', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;
            mockStores.hotelsStore.hasOffers = false;

            render(<SearchResultsContent {...props} />);

            expect(screen.queryByTestId('holiday-with-confidence')).not.toBeInTheDocument();
        });
    });

    describe('SearchResultsLoadingSkeleton', () => {
        it('should be rendered when status is Loading', () => {
            mockStores.hotelsStore.status = DataStatus.Loading;

            render(<SearchResultsContent {...props} />);

            expect(SearchResultsLoadingSkeleton).toHaveBeenCalledWith(
                {
                    hideHeader: true,
                },
                {},
            );
            expect(screen.getByTestId('search-results-skeleton')).toBeInTheDocument();
        });

        it('should NOT be rendered when status is NOT Loading', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;

            render(<SearchResultsContent {...props} />);

            expect(screen.queryByTestId('search-results-skeleton')).not.toBeInTheDocument();
        });
    });

    describe('Offers', () => {
        it('should got props', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;

            render(<SearchResultsContent {...props} />);

            expect(mockOffersComponent).toHaveBeenCalledWith({
                alternativeFlightsDefaultSort: 'PRICEASC',
                alternativeFlightsSortOrders: [],
                currentPage: 1,
                fields: undefined,
                itemsOnEachPage: 10,
                minLoadedPageNumber: 1,
                offerCardBySelectedIndex: 1,
                onSetSelectedOfferIndex: expect.any(Function),
                params: {},
                rendering: undefined,
                offers: mockStores.hotelsStore.offers,
            });
        });
    });

    describe('RecommendedCarouselFor5ResultsPage', () => {
        it('should be rendered when totalOffers is greater 1 and less/equal 5', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;

            render(<SearchResultsContent {...props} />);

            expect(screen.getByTestId('recommended-carousel')).toBeInTheDocument();

            expect(mockRecommendedCarouselComponent).toHaveBeenCalledWith({
                fallbackImage: {},
                fields: props.fields,
            });
        });

        it('should NOT be rendered when totalOffers is greater 5', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;
            mockStores.hotelsStore.numberOfHotels = 6;

            render(<SearchResultsContent {...props} />);

            expect(screen.queryByTestId('recommended-carousel')).not.toBeInTheDocument();
        });
    });

    describe('NoResults', () => {
        it('should be rendered when status is Loaded and hasOffers is false', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;
            mockStores.hotelsStore.hasOffers = false;

            render(<SearchResultsContent {...props} />);

            expect(screen.getByTestId('no-results')).toBeInTheDocument();

            expect(mockRecommendedCarouselComponent).toHaveBeenCalledWith({
                fallbackImage: {},
                fields: props.fields,
            });
        });

        it('should NOT be rendered when status is Loaded and hasOffers is true', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;
            mockStores.hotelsStore.hasOffers = true;

            render(<SearchResultsContent {...props} />);

            expect(screen.queryByTestId('no-results')).not.toBeInTheDocument();
        });
    });

    describe('Pagination', () => {
        beforeEach(() => {
            mockUseMobileViewport.mockReturnValue(true);
        });

        afterEach(() => {
            cleanup();
        });

        it('should render spinner (mobile) when LoadingMore is true', () => {
            mockStores.hotelsStore.status = DataStatus.LoadingMore;

            const { container } = render(<SearchResultsContent {...props} />);

            expect(container.querySelectorAll('.spinner-container')).toHaveLength(1);
            expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
        });

        it('should render spinner (mobile) when LoadingPrevious is true', () => {
            mockStores.hotelsStore.status = DataStatus.LoadingPrevious;

            const { container } = render(<SearchResultsContent {...props} />);

            expect(container.querySelectorAll('.spinner-container')).toHaveLength(1);
            expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
        });

        it('should be rendered (mobile) when isLoadingPreviousShown is true', () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;
            props.isLoadingPreviousShown = true;

            const { container } = render(<SearchResultsContent {...props} />);

            expect(container.querySelectorAll('.spinner-container')).toHaveLength(0);
            expect(screen.getByTestId('pagination')).toBeInTheDocument();

            expect(mockPaginationComponent).toHaveBeenCalledWith({
                currentPage: 1,
                isLoadPreviousBtn: true,
                itemsOnEachPage: 10,
                numberOfResults: 2,
                onLoadPrevious: expect.any(Function),
                redirectToSearchResultsPage: expect.any(Function),
                setCurrentPage: expect.any(Function),
                updateDataLayer: expect.any(Function),
            });
        });

        it('should be rendered (mobile) when isLoadingMoreShown is true', async () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;
            mockStores.layoutStore.isPromoPage = true;
            mockUseMobileViewport.mockReturnValue(true);
            props.isLoadingMoreShown = true;

            const { container } = render(<SearchResultsContent {...props} />);

            const pagination = screen.getByTestId('pagination');
            expect(container.querySelectorAll('.spinner-container')).toHaveLength(0);
            expect(pagination).toBeInTheDocument();

            expect(mockPaginationComponent).toHaveBeenCalledWith({
                currentPage: 1,
                itemsOnEachPage: 10,
                maxLoadedPageNumber: 10,
                numberOfResults: 2,
                onLoadMore: expect.any(Function),
                redirectToSearchResultsPage: expect.any(Function),
                setCurrentPage: expect.any(Function),
                updateDataLayer: expect.any(Function),
            });

            await userEvent.click(pagination);

            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).not.toHaveBeenCalled();
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
        });

        it('should call onChangeSearchFilterStore on desktop on pagination fetch offer on promo page', async () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;
            mockStores.layoutStore.isPromoPage = true;
            mockUseMobileViewport.mockReturnValue(false);
            props.isLoadingMoreShown = true;

            render(<SearchResultsContent {...props} />);

            const pagination = screen.getByTestId('pagination');

            await userEvent.click(pagination);

            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                key: 'pageNumberChanged',
                value: true,
            });
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
        });

        it('should NOT call onChangeSearchFilterStore on pagination fetch offer when isPromoPage is false', async () => {
            mockStores.hotelsStore.status = DataStatus.Loaded;
            mockStores.layoutStore.isPromoPage = false;
            mockUseMobileViewport.mockReturnValue(false);
            props.isLoadingMoreShown = true;

            render(<SearchResultsContent {...props} />);

            const pagination = screen.getByTestId('pagination');

            await userEvent.click(pagination);

            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).not.toHaveBeenCalled();
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
        });
    });

    describe('Popstate handling for promo pages', () => {
        const mockLocation = (pathname: string) => {
            delete (globalThis as any).location;
            (globalThis as any).location = { pathname };
        };

        const setHistoryState = (state: any) => {
            Object.defineProperty(globalThis, 'history', {
                value: { state },
                writable: true,
                configurable: true,
            });
        };

        let popstateHandler: ((event: PopStateEvent) => void) | undefined;
        let addEventListenerSpy: jest.SpyInstance;
        let removeEventListenerSpy: jest.SpyInstance;

        beforeEach(() => {
            mockStores.layoutStore = {
                ...mockStores.layoutStore,
                isPromoPage: true,
                isStaticPromoPage: true,
            };
            mockStores.promoPageStore = {
                ...mockStores.promoPageStore,
                setForcePrefillPage: jest.fn(),
            };
            mockStores.searchStore = {
                ...mockStores.searchStore,
                setPageNumber: jest.fn(),
            };
            mockStores.hotelsStore = {
                ...mockStores.hotelsStore,
                fetchOffers: jest.fn(),
            };
            mockUseMobileViewport.mockReturnValue(false);

            setHistoryState(null);

            mockLocation('/en/holidays/deals/summer-holidays');

            popstateHandler = undefined;

            addEventListenerSpy = jest
                .spyOn(globalThis, 'addEventListener')
                .mockImplementation((type: any, listener: any) => {
                    if (type === 'popstate') {
                        popstateHandler = listener;
                    }
                });

            removeEventListenerSpy = jest.spyOn(globalThis, 'removeEventListener').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should add popstate event listener on mount for desktop promo pages (non-dynamic)', () => {
            render(<SearchResultsContent {...props} />);

            expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
            expect(popstateHandler).toBeDefined();
        });

        it('should remove popstate event listener on unmount', () => {
            const { unmount } = render(<SearchResultsContent {...props} />);

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
        });

        it('should NOT add popstate event listener for dynamic promo pages', () => {
            mockStores.layoutStore.isStaticPromoPage = false;

            render(<SearchResultsContent {...props} />);

            expect(addEventListenerSpy).not.toHaveBeenCalledWith('popstate', expect.any(Function));
            expect(popstateHandler).toBeUndefined();
        });

        it('should NOT add popstate event listener for non-promo pages', () => {
            mockStores.layoutStore.isPromoPage = false;
            mockStores.layoutStore.isStaticPromoPage = false;

            render(<SearchResultsContent {...props} />);

            expect(addEventListenerSpy).not.toHaveBeenCalledWith('popstate', expect.any(Function));
            expect(popstateHandler).toBeUndefined();
        });

        it('should NOT handle popstate when navigating to different URL', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            mockLocation('/en/holidays/deals/winter-holidays');

            const event = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/winter-holidays',
                    url: '/en/holidays/deals/winter-holidays',
                    options: {
                        promoPage: 5,
                        previousPage: '/en/holidays/deals/summer-holidays',
                    },
                },
            });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).not.toHaveBeenCalled();
            expect(mockStores.hotelsStore.fetchOffers).not.toHaveBeenCalled();
            expect(mockStores.promoPageStore.setForcePrefillPage).toHaveBeenCalledWith(5);
        });

        it('should NOT handle popstate when previousPage does not match currentUrl', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            mockLocation('/en/holidays/deals/winter-holidays');
            const firstEvent = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/winter-holidays',
                    url: '/en/holidays/deals/winter-holidays',
                },
            });
            popstateHandler!(firstEvent);

            mockLocation('/en/holidays/deals/summer-holidays');
            const event = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/summer-holidays',
                    url: '/en/holidays/deals/summer-holidays',
                    options: {
                        promoPage: 3,
                        previousPage: '/en/holidays/deals/winter-holidays',
                    },
                },
            });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).not.toHaveBeenCalled();
            expect(mockStores.hotelsStore.fetchOffers).not.toHaveBeenCalled();
            expect(mockStores.promoPageStore.setForcePrefillPage).toHaveBeenCalledWith(3);
        });

        it('should reset to page 1 when state is null', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            const event = new PopStateEvent('popstate', { state: null });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(1);
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
            expect(mockStores.promoPageStore.setForcePrefillPage).not.toHaveBeenCalled();
        });

        it('should restore page when state.as is undefined and state.url is undefined but staying on same page', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            const event = new PopStateEvent('popstate', {
                state: {
                    options: {
                        promoPage: 3,
                        previousPage: '/en/holidays/deals/summer-holidays',
                    },
                },
            });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(3);
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
            expect(mockStores.promoPageStore.setForcePrefillPage).toHaveBeenCalledWith(3);
        });

        it('should NOT handle popstate when both shouldNavigateToPageOne and shouldRestorePage are false', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            mockLocation('/en/holidays/deals/different-page');
            const firstEvent = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/different-page',
                    url: '/en/holidays/deals/different-page',
                },
            });
            popstateHandler!(firstEvent);

            mockLocation('/en/holidays/deals/summer-holidays');
            const event = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/summer-holidays',
                    url: '/en/holidays/deals/summer-holidays',
                    options: {
                        promoPage: 3,
                        previousPage: '/en/holidays/deals/different-page',
                    },
                },
            });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).not.toHaveBeenCalled();
            expect(mockStores.hotelsStore.fetchOffers).not.toHaveBeenCalled();
            expect(mockStores.promoPageStore.setForcePrefillPage).toHaveBeenCalledWith(3);
        });

        it('should restore page from history state on mount', () => {
            const historyState = {
                as: '/en/holidays/deals/summer-holidays',
                url: '/en/holidays/deals/summer-holidays',
                options: {
                    promoPage: 5,
                    previousPage: '/en/holidays/deals/summer-holidays',
                },
            };

            setHistoryState(historyState);

            render(<SearchResultsContent {...props} />);

            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(5);
            expect(mockStores.promoPageStore.setForcePrefillPage).toHaveBeenCalledWith(5);
        });

        it('should NOT handle popstate when previousUrl differs and no promo data is provided', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            mockLocation('/en/holidays/deals/summer-holidays/page-2');

            const event = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/summer-holidays/page-2',
                    url: '/en/holidays/deals/summer-holidays/page-2',
                    options: {},
                },
            });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).not.toHaveBeenCalled();
            expect(mockStores.hotelsStore.fetchOffers).not.toHaveBeenCalled();
            expect(mockStores.promoPageStore.setForcePrefillPage).not.toHaveBeenCalled();
        });

        it('should navigate to page 1 and fetch offers when no previousPage and no promoPage in state', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            const event = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/summer-holidays',
                    url: '/en/holidays/deals/summer-holidays',
                    options: {},
                },
            });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(1);
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
            expect(mockStores.promoPageStore.setForcePrefillPage).not.toHaveBeenCalled();
        });

        it('should restore promo page and fetch offers when previousPage matches currentUrl and promoPage is provided', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            const event = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/summer-holidays',
                    url: '/en/holidays/deals/summer-holidays',
                    options: {
                        promoPage: 3,
                        previousPage: '/en/holidays/deals/summer-holidays',
                    },
                },
            });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(3);
            expect(mockStores.promoPageStore.setForcePrefillPage).toHaveBeenCalledWith(3);
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
        });

        it('should navigate to page and fetch offers when no previousPage but promoPage is provided (shouldNavigateToPageOne)', () => {
            render(<SearchResultsContent {...props} />);

            expect(popstateHandler).toBeDefined();

            const event = new PopStateEvent('popstate', {
                state: {
                    as: '/en/holidays/deals/summer-holidays',
                    url: '/en/holidays/deals/summer-holidays',
                    options: {
                        promoPage: 2,
                    },
                },
            });

            popstateHandler!(event);

            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(2);
            expect(mockStores.promoPageStore.setForcePrefillPage).toHaveBeenCalledWith(2);
            expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
        });
    });

    describe('hydrateRecentlyUsedFilters', () => {
        beforeEach(() => {
            mockStores.hotelsStore.status = DataStatus.Loading;
            mockStores.searchFiltersStore.isFiltersLoaded = true;
            mockStores.layoutStore.isSearchResultsPage = true;
        });

        it('should call hydrateRecentlyUsedFilters on search results page when status is loading and isFiltersLoaded is false', () => {
            mockStores.searchFiltersStore.isFiltersLoaded = false;

            render(<SearchResultsContent {...props} />);

            expect(mockStores.searchFiltersStore.hydrateRecentlyUsedFilters).toHaveBeenCalled();
        });

        it('should call hydrateRecentlyUsedFilters on search results page when status is loading and isFiltersLoaded is true, no filters are provided and map is NOT in placeholders', () => {
            mockStores.searchFiltersStore.filters = [];

            render(<SearchResultsContent {...props} />);

            expect(mockStores.searchFiltersStore.hydrateRecentlyUsedFilters).toHaveBeenCalled();
        });

        it('should NOT call hydrateRecentlyUsedFilters when isSearchResultsPage is false', () => {
            mockStores.layoutStore.isSearchResultsPage = false;

            render(<SearchResultsContent {...props} />);

            expect(mockStores.searchFiltersStore.hydrateRecentlyUsedFilters).not.toHaveBeenCalled();
        });
    });

    it('should call setRecommendedFilterExperimentTestVariant when useExperiment returns a variant', () => {
        const mockVariant = { testVariant: 'testVariant', testId: 'testId' };
        jest.mocked(useExperiment).mockReturnValue(mockVariant);
        render(<SearchResultsContent {...props} />);

        expect(useExperiment).toHaveBeenCalledWith('EJHEXP-2467');
        expect(mockStores.searchFiltersStore.setRecommendedFilterExperimentTestVariant).toHaveBeenCalledWith(
            'testVariant',
        );
    });

    it('should call setRecentlyUsedFilterExperimentTestVariant when useExperiment returns a variant', () => {
        const mockVariant = { testVariant: 'testVariant', testId: 'testId' };
        jest.mocked(useExperiment).mockReturnValue(mockVariant);
        render(<SearchResultsContent {...props} />);

        expect(useExperiment).toHaveBeenCalledWith('EJHEXP-362');
        expect(mockStores.searchFiltersStore.setRecentlyUsedFilterExperimentTestVariant).toHaveBeenCalledWith(
            'testVariant',
        );
    });
});
