import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { SearchPodFilters, SP_FILTERS_WRAPPER_DATA_TID, TSearchPodFiltersProps } from './SearchPodFilters';

const createProps = (): TSearchPodFiltersProps => ({
    rendering: {},
    fields: null,
    params: {} as any,
});

let mockProps;
let mockStores;

const mockSetState = jest.fn();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useState: () => [true, mockSetState],
}));

jest.mock('frontend/components/common/FiltersLoadingScreen/FiltersLoadingScreen', () => () => (
    <div data-tid='filters-loading-screen' />
));

jest.mock('frontend/components/icons/Calendar', () => () => <div data-tid='calendar-icon' />);

const mockOfferSortProps = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OffersSort/OffersSort', () => props => {
    mockOfferSortProps(props);

    return <div data-tid='offers-sort' />;
});

const mockPromoPageEditSearchProps = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/PromoPageEditSearch', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockPromoPageEditSearchProps(props);

        return <button data-tid='edit-search' onClick={onClick} onKeyDown={jest.fn()} />;
    },
}));

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: ({ ...props }) => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockUseRenderMobileFilters = {
    renderFiltersButton: jest.fn(),
    renderFiltersPopup: jest.fn(),
};

jest.mock('frontend/components/renderings/SearchPodFilters/hooks/useRenderMobileFilters', () => ({
    __esModule: true,
    useRenderMobileFilters: () => mockUseRenderMobileFilters,
}));

describe('<SearchPodFilters />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isMaintenance: false,
                isPromoPage: false,
                isSearchResultsPage: true,
            },
            searchFiltersStore: {
                activeFilterCode: FilterGroupCodes.Destination,
                availableFilters: [],
                isFiltersLoaded: true,
                priceFilterLabel: 'price',
                selectedFilters: [],
                isFiltersLoadingScreenEnabled: false,
                isFilterGroupDisabled: jest.fn(),
                changeIsPresetDestinationFilter: jest.fn(),
                onClearSelectedFilters: jest.fn(),
                onCloseFilters: jest.fn(),
                onRemoveSpecificFilter: jest.fn(),
                onSelectFilterGroup: jest.fn(i => i),
                onSelectFilters: jest.fn(),
            },
            searchStore: {
                selectedDestinationCodesQuery: 'codes',
                setNeedOpenWhenField: jest.fn(),
                setNeedOpenWhoField: jest.fn(),
                setPageNumber: jest.fn(),
            },
            hotelsStore: {
                showParentOffers: false,
                status: DataStatus.Loaded,
                fetchResults: jest.fn(),
            },
            promoPageStore: {
                isInitialPaxIsDefault: jest.fn(() => false),
            },
            routerStore: {
                clearIsClickBackToSearch: jest.fn(),
            },
        });
    });

    it('should NOT render when isMaintenance is true', () => {
        mockStores.layoutStore.isMaintenance = true;
        const { container } = render(<SearchPodFilters {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isPromoPage and status is error', () => {
        mockStores.layoutStore.isPromoPage = true;
        mockStores.hotelsStore.status = DataStatus.Error;
        const { container } = render(<SearchPodFilters {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('FiltersLoadingScreen', () => {
        it('should render only FiltersLoadingScreen and call renderFiltersPopup when isFiltersLoadingScreenDisplayed is true', () => {
            mockStores.searchFiltersStore.isFiltersLoadingScreenDisplayed = true;

            render(<SearchPodFilters {...mockProps} />);

            expect(screen.getByTestId(SP_FILTERS_WRAPPER_DATA_TID)).toBeInTheDocument();
            expect(screen.getByTestId('filters-loading-screen')).toBeInTheDocument();
            expect(mockUseRenderMobileFilters.renderFiltersButton).not.toHaveBeenCalled();
            expect(mockUseRenderMobileFilters.renderFiltersPopup).toHaveBeenCalled();
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('offers-sort')).not.toBeInTheDocument();
            expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
        });

        it('should NOT render FiltersLoadingScreen and call renderFiltersPopup when isFiltersLoadingScreenDisplayed is false', () => {
            render(<SearchPodFilters {...mockProps} />);

            expect(screen.queryByTestId('filters-loading-screen')).not.toBeInTheDocument();
            expect(mockUseRenderMobileFilters.renderFiltersPopup).toHaveBeenCalled();
        });
    });

    describe('Button', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPromoPage = true;
            mockUseMobileViewport = true;
            mockStores.appStore.isScreenLessMedium = true;
        });

        it('should render button with calendar icon and SearchPodFiltersButtonsChooseDates when isPromoPage, filtering is disabled, screen is mobile, and isChooseDatesVisible is true', () => {
            render(<SearchPodFilters {...mockProps} />);

            expect(screen.getAllByRole('button')).toHaveLength(2);
            expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.SearchPodFiltersButtonsChooseDates)).toBeInTheDocument();
        });

        it('should NOT render button on desktop', () => {
            mockUseMobileViewport = false;

            render(<SearchPodFilters {...mockProps} />);

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.SearchPodFiltersButtonsChooseDates)).not.toBeInTheDocument();
        });

        it('should NOT render button when isFiltersLoadingScreenDisplayed is true', () => {
            mockStores.searchFiltersStore.isFiltersLoadingScreenDisplayed = true;

            render(<SearchPodFilters {...mockProps} />);

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.SearchPodFiltersButtonsChooseDates)).not.toBeInTheDocument();
        });

        it('should NOT render button when isPromoPage is false', () => {
            mockStores.layoutStore.isPromoPage = false;

            render(<SearchPodFilters {...mockProps} />);

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.SearchPodFiltersButtonsChooseDates)).not.toBeInTheDocument();
        });

        it('should setNeedOpenWhenField on button click', async () => {
            render(<SearchPodFilters {...mockProps} />);

            await userEvent.click(screen.getAllByRole('button')[0]);

            expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalledWith(true);
        });
    });

    describe('OffersSort and placeholder', () => {
        it('should render offers sort and placeholder on mobile', () => {
            render(<SearchPodFilters {...mockProps} />);

            expect(screen.getByTestId('offers-sort')).toBeInTheDocument();
            expect(mockOfferSortProps).toHaveBeenCalledWith({ className: 'childBtn' });
            expect(screen.getByTestId('placeholder')).toBeInTheDocument();
            expect(mockPlaceholderComponent).toHaveBeenCalledWith({
                name: PlaceholderNames.SearchResultsMap,
                rendering: {},
            });
        });

        it('should NOT render offers sort and placeholder on desktop', () => {
            mockUseMobileViewport = false;

            render(<SearchPodFilters {...mockProps} />);

            expect(screen.queryByTestId('offers-sort')).not.toBeInTheDocument();
            expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
            expect(mockPlaceholderComponent).not.toHaveBeenCalled();
        });
    });

    describe('PromoPageEditSearch', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPromoPage = true;
            mockUseMobileViewport = true;
        });

        it('should render PromoPageEditSearch on mobile on promo page when filtering is NOT disabled', () => {
            render(<SearchPodFilters {...mockProps} />);

            expect(screen.getByTestId('edit-search')).toBeInTheDocument();
            expect(mockPromoPageEditSearchProps).toHaveBeenCalledWith({ className: 'childBtn', isLoading: false });
        });

        it('should NOT render PromoPageEditSearch when on desktop', () => {
            mockUseMobileViewport = false;

            render(<SearchPodFilters {...mockProps} />);

            expect(screen.queryByTestId('edit-search')).not.toBeInTheDocument();
        });

        it('should NOT render PromoPageEditSearch when isPromoPage is false', () => {
            mockStores.layoutStore.isPromoPage = false;
            render(<SearchPodFilters {...mockProps} />);

            expect(screen.queryByTestId('edit-search')).not.toBeInTheDocument();
        });

        it('should call setNeedOpenWhoField with true on PromoPageEditSearch click when isInitialPaxIsDefault is false', async () => {
            render(<SearchPodFilters {...mockProps} />);

            await userEvent.click(screen.getByTestId('edit-search'));

            expect(mockStores.searchStore.setNeedOpenWhoField).toHaveBeenCalledWith(true);
        });

        it('should call setNeedOpenWhenField with true on PromoPageEditSearch click when isInitialPaxIsDefault is true', async () => {
            mockStores.promoPageStore.isInitialPaxIsDefault.mockReturnValue(true);

            render(<SearchPodFilters {...mockProps} />);

            await userEvent.click(screen.getByTestId('edit-search'));

            expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalledWith(true);
        });
    });

    it('Should render container with .promo-search-pod__filters class when it is PromoPage', () => {
        mockStores.layoutStore.isPromoPage = true;

        render(<SearchPodFilters {...mockProps} />);

        expect(screen.getByTestId('search-pod-filters-inner')).toHaveClass('promo-search-pod__filters');
    });

    it('Should render container with .search-pod-filters__loader class when isFiltersLoaded is false and isLoadingStatus is true', () => {
        mockStores.searchFiltersStore.isFiltersLoaded = false;
        mockStores.hotelsStore.status = DataStatus.Loading;

        render(<SearchPodFilters {...mockProps} />);

        expect(screen.getByTestId('search-pod-filters-inner')).toHaveClass('search-pod-filters__loader');
    });

    it('Should render container without .search-pod-filters__loader class when isFiltersLoaded is true', () => {
        mockStores.hotelsStore.status = DataStatus.Loading;

        render(<SearchPodFilters {...mockProps} />);

        expect(screen.getByTestId('search-pod-filters-inner')).not.toHaveClass('search-pod-filters__loader');
    });

    it('Should render container without .search-pod-filters__loader class when isLoadingStatus is false', () => {
        mockStores.searchFiltersStore.isFiltersLoaded = false;

        render(<SearchPodFilters {...mockProps} />);

        expect(screen.getByTestId('search-pod-filters-inner')).not.toHaveClass('search-pod-filters__loader');
    });

    it('Should render filter button and popup on mobile', () => {
        mockUseMobileViewport = true;
        mockStores.layoutStore.isPromoPage = true;

        render(<SearchPodFilters {...mockProps} />);
        expect(mockUseRenderMobileFilters.renderFiltersButton).toHaveBeenCalledWith({ className: 'filterWideBtn' });
        expect(mockUseRenderMobileFilters.renderFiltersPopup).toHaveBeenCalled();
    });

    describe('useEffect', () => {
        const mockAddEventListener = jest.spyOn(document, 'addEventListener');
        const mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');
        const mockEvent = new Event('scroll');

        beforeEach(() => {
            mockStores.appStore.isScreenLessMedium = true;
            mockStores.layoutStore.isPromoPage = true;
        });

        it('should call setIsChooseDatesVisible with true when getBoundingClientRect returns top lower than STICKY_WRAPPER_OFFSET_TOP', () => {
            render(<SearchPodFilters {...mockProps} />);

            expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));

            const scrollEventHandler = mockAddEventListener.mock.calls[0][1] as EventListener;
            scrollEventHandler(mockEvent);

            expect(mockSetState).toHaveBeenCalledWith(true);
        });

        it('should call removeEventListenerSpy on unmount', () => {
            const { unmount } = render(<SearchPodFilters {...mockProps} />);

            expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));

            unmount();

            expect(mockRemoveEventListener).toHaveBeenCalled();
        });
    });
});
