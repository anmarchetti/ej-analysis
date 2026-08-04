import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import * as webStorageUtils from 'frontend/utils/webStorage.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

import BackToSearch, { IBackToSearchProps } from './BackToSearch';

const createProps = (): IBackToSearchProps => ({
    isEditMode: false,
    isBackButtonAvailable: true,
    onClickEdit: jest.fn(),
});

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    getWebStorageItem: jest.fn(() => mockWebStorage.toString()),
    parseValueFromLocalStorage: jest.fn(() => mockWebStorage),
}));

jest.mock('frontend/utils/date.utils', () => ({
    __esModule: true,
    parseDateL10n: jest.fn(date => date),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/ChevronLeft', () => () => <div data-tid='chevron-left-icon' />);
jest.mock('frontend/components/icons-new/Cross', () => () => <div data-tid='cross-icon' />);
jest.mock('frontend/components/icons-new/EditLine', () => () => <div data-tid='edit-line-icon' />);

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, dataTid = 'edit-search-button', ...props }) => {
        mockButtonProps(props);

        return (
            <button onClick={onClick} data-tid={dataTid}>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

const mockWebStorage = {
    searchStore: {
        searchWhen: { from: new Date('01.12.2024'), to: new Date('07.12.2024') },
        origins: [new Date('01.12.2024'), new Date('07.12.2024')],
    },
};

let mockProps;
let mockStores;
let mockLocalStore;

describe('<BackToSearch />', () => {
    beforeEach(() => {
        mockUseMobileViewport = false;
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isHotelDetailsBookPage: true,
                isMobileAppHideFeatures: false,
            },
            searchStore: {
                searchWhen: { isFlexible: true },
                searchTo: { setSelectedAccommodationCodes: jest.fn() },
                retreiveSearchParameters: jest.fn(),
                setPageNumber: jest.fn(),
                setIsSearchPodExpanded: jest.fn(),
                setOldSearchParamToSearchParam: jest.fn(),
                setOldSearchParam: jest.fn(),
                isOldParamSet: false,
            },
            bookingStore: {
                updateSearchDates: jest.fn(),
                updateSearchOrigins: jest.fn(),
            },
            routerStore: {
                isBackToPrevUrl: false,
                hasPromo: false,
                onClickBackButton: jest.fn(),
            },
            queryParamStore: {
                returnPathFromHotelDetailsFromUrl: '',
            },
            trackingStore: {
                trackBackToFlightsClick: jest.fn(),
            },
        });
        mockLocalStore = createMockLocalStore();
    });

    it('Should rendering for Desktop (search pod is collapsed)', () => {
        render(<BackToSearch {...mockProps} />);

        expect(screen.getByTestId('go-back-link')).toBeInTheDocument();
        expect(screen.getByTestId('edit-line-icon')).toBeInTheDocument();
        expect(screen.getByText(mockLocalStore.fields.BackToSearchButtonText.value)).toBeInTheDocument();

        expect(screen.getByTestId('edit-search-button')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
        expect(screen.getByText(mockLocalStore.fields.EditSearch.value)).toBeInTheDocument();
    });

    it('Should rendering for Mobile (search pod is collapsed)', () => {
        mockUseMobileViewport = true;

        render(<BackToSearch {...mockProps} />);

        expect(screen.getByTestId('go-back-link')).toBeInTheDocument();
        expect(screen.getByTestId('edit-line-icon')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsBack)).toBeInTheDocument();

        expect(screen.getByTestId('edit-search-button')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
        expect(screen.getByText(mockLocalStore.fields.EditSearchMobile.value)).toBeInTheDocument();
    });

    it('Should change edit button label and icon for Desktop when search pod is expanded', () => {
        mockProps.isEditMode = true;

        render(<BackToSearch {...mockProps} />);

        expect(screen.getByText(mockLocalStore.fields.CloseSearchCriteria.value)).toBeInTheDocument();
        expect(screen.getByTestId('cross-icon')).toBeInTheDocument();
    });

    it('Should change edit button label and icon for Mobile when search pod is expanded', () => {
        mockProps.isEditMode = true;
        mockUseMobileViewport = true;

        render(<BackToSearch {...mockProps} />);

        expect(screen.getByText(mockLocalStore.fields.CloseSearchCriteriaMobile.value)).toBeInTheDocument();
        expect(screen.getByTestId('cross-icon')).toBeInTheDocument();
    });

    it('Should return the correct back button label when isBackToPrevUrl is true', () => {
        mockStores.routerStore.isBackToPrevUrl = true;

        render(<BackToSearch {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsBack)).toBeInTheDocument();
    });

    it('Should not display edit your search button when returnPath is set and user does not come from search page', () => {
        mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = '/en/buy/flights';
        mockStores.layoutStore.isSearchResultsPagePrev = false;
        mockStores.layoutStore.referrer = 'http://easyjet.com/en/buy/flights';

        render(<BackToSearch {...mockProps} />);

        const button = screen.queryByTestId('edit-search');

        expect(button).not.toBeInTheDocument();
    });

    it('Should display edit your search button when returnPath is not set', () => {
        mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = '';
        mockStores.layoutStore.isSearchResultsPagePrev = false;
        mockStores.layoutStore.referrer = 'http://easyjet.com/en/buy/flights';

        render(<BackToSearch {...mockProps} />);

        const button = screen.queryByTestId('edit-search');

        expect(button).toBeInTheDocument();
    });

    it('Should display edit your search button when user comes from search results', () => {
        mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = '/en/buy/flights';
        mockStores.layoutStore.isSearchResultsPagePrev = true;
        mockStores.layoutStore.referrer = 'http://easyjet.com/en/buy/flights';

        render(<BackToSearch {...mockProps} />);

        const button = screen.queryByTestId('edit-search');

        expect(button).toBeInTheDocument();
    });

    it('Should display empty search-nav__item when back button is not rendered', () => {
        render(<BackToSearch {...mockProps} isBackButtonAvailable={false} />);

        const backToSearch = screen.queryByTestId('back-to-search');
        expect(backToSearch).not.toBeInTheDocument();

        const backToFlights = screen.queryByTestId('go-back-to-flights');
        expect(backToFlights).not.toBeInTheDocument();

        const navItemPlaceholder = screen.queryByTestId('nav-item-placeholder');
        expect(navItemPlaceholder).toBeInTheDocument();
    });

    describe('Back to flights button', () => {
        it('Should display back to flights button when returnPath is present and user did not come from search page', () => {
            const returnPath = '/en/buy/flights';
            mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = returnPath;
            mockStores.layoutStore.isSearchResultsPagePrev = false;
            mockStores.layoutStore.referrer = 'https://easyjet.com/en/buy/flights';

            const expectedUrl = 'https://easyjet.com' + returnPath;

            render(<BackToSearch {...mockProps} />);

            const button = screen.getByTestId('go-back-to-flights');

            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('href', expectedUrl);
        });

        it('Should display back to flights button when returnPath is present and referrer only contains host', () => {
            const returnPath = '/en/buy/flights';
            mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = returnPath;
            mockStores.layoutStore.isSearchResultsPagePrev = false;
            mockStores.layoutStore.referrer = 'https://easyjet.com';

            const expectedUrl = 'https://easyjet.com' + returnPath;

            render(<BackToSearch {...mockProps} />);

            const button = screen.getByTestId('go-back-to-flights');

            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('href', expectedUrl);
        });

        it('Should display back to flights button when returnPath is present and referrer is localhost', () => {
            const returnPath = '/en/buy/flights';
            mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = returnPath;
            mockStores.layoutStore.isSearchResultsPagePrev = false;
            mockStores.layoutStore.referrer = 'http://localhost:8080';

            const expectedUrl = 'http://localhost:8080' + returnPath;

            render(<BackToSearch {...mockProps} />);

            const button = screen.getByTestId('go-back-to-flights');

            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('href', expectedUrl);
        });

        it('Should not display back to flights button when returnPath is empty', () => {
            mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = '';
            mockStores.layoutStore.isSearchResultsPagePrev = true;
            mockStores.layoutStore.referrer = 'http://easyjet.com/en/buy/flights';

            render(<BackToSearch {...mockProps} />);

            const button = screen.queryByTestId('go-back-to-flights');

            expect(button).not.toBeInTheDocument();
        });

        it('Should not display back to flights button when user comes from search results', () => {
            mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = '/en/buy/flights';
            mockStores.layoutStore.isSearchResultsPagePrev = true;
            mockStores.layoutStore.referrer = 'http://easyjet.com/en/buy/flights';

            render(<BackToSearch {...mockProps} />);

            const button = screen.queryByTestId('go-back-to-flights');

            expect(button).not.toBeInTheDocument();
        });

        it('Should not display back to flights button when referrer is undefined', () => {
            const returnPath = '/en/buy/flights';
            mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = returnPath;
            mockStores.layoutStore.isSearchResultsPagePrev = false;
            mockStores.layoutStore.referrer = undefined;

            render(<BackToSearch {...mockProps} />);

            const button = screen.queryByTestId('go-back-to-flights');

            expect(button).not.toBeInTheDocument();
        });

        it('Should not display back to flights button when referrer is not wellformed', () => {
            const returnPath = '/en/buy/flights';
            mockStores.queryParamStore.returnPathFromHotelDetailsFromUrl = returnPath;
            mockStores.layoutStore.isSearchResultsPagePrev = false;
            mockStores.layoutStore.referrer = 'this_is_not_correct';

            render(<BackToSearch {...mockProps} />);

            const button = screen.queryByTestId('go-back-to-flights');

            expect(button).not.toBeInTheDocument();
        });
    });

    describe('Handle edit button click', () => {
        it('Should invoke onClickEdit and setOldSearchParam', async () => {
            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('edit-search-button'));

            expect(mockProps.onClickEdit).toHaveBeenCalled();
            expect(mockStores.searchStore.setOldSearchParam).toHaveBeenCalled();
        });

        it('Should invoke setIsSearchPodExpanded on hotel details page', async () => {
            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('edit-search-button'));

            expect(mockStores.searchStore.setIsSearchPodExpanded).toHaveBeenCalledWith(true);
        });

        it('Should invoke setOldSearchParamToSearchParam if isOldParamSet is true', async () => {
            mockStores.searchStore.isOldParamSet = true;

            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('edit-search-button'));

            expect(mockStores.searchStore.setOldSearchParamToSearchParam).toHaveBeenCalled();
        });
    });

    describe('Handle back button click', () => {
        it('Should restore search pod prefilled param from web session if back button redirects back to Promo page', async () => {
            mockStores.routerStore.hasPromo = true;

            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.bookingStore.updateSearchDates).toHaveBeenCalledWith(
                mockWebStorage.searchStore.searchWhen.from,
                mockWebStorage.searchStore.searchWhen.to,
            );
            expect(mockStores.bookingStore.updateSearchOrigins).toHaveBeenCalledWith(
                mockWebStorage.searchStore.origins,
            );
        });

        it('Should restore search pod default param if there is no prefilled param and back button redirects back to Search page', async () => {
            const mockGetWebStorageItem = jest.fn();
            jest.spyOn(webStorageUtils, 'getWebStorageItem').mockImplementation(mockGetWebStorageItem);
            mockGetWebStorageItem.mockReturnValue(undefined);

            mockStores.routerStore.hasPromo = true;

            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.bookingStore.updateSearchDates).toHaveBeenCalledWith('', '');
            expect(mockStores.bookingStore.updateSearchOrigins).toHaveBeenCalledWith([]);
        });

        it('Should retrieve search parameters if back button redirects back to Search page', async () => {
            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.searchStore.retreiveSearchParameters).toHaveBeenCalledWith(true);
        });

        it('should invoke setPageNumber with default page number', async () => {
            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(1);
            expect(mockStores.routerStore.onClickBackButton).toHaveBeenCalledWith(
                mockStores.routerStore.backToSearchUrl,
                {
                    BackToPromoFromHotelDetails: mockStores.routerStore.hasPromo,
                },
            );
        });

        it('should invoke setPageNumber with save previous page number', async () => {
            mockStores.searchStore.prevPage = 5;

            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.searchStore.setPageNumber).toHaveBeenCalledWith(mockStores.searchStore.prevPage);
            expect(mockStores.routerStore.onClickBackButton).toHaveBeenCalledWith(
                mockStores.routerStore.backToSearchUrl,
                {
                    BackToPromoFromHotelDetails: mockStores.routerStore.hasPromo,
                },
            );
        });

        it('should invoke updateSearchDates when both isHotelDetailsBookPage and isFlexible are true', async () => {
            mockStores.searchStore.searchWhen.from = 'from';
            mockStores.searchStore.searchWhen.to = 'to';

            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.bookingStore.updateSearchDates).toHaveBeenCalledWith(
                mockStores.searchStore.searchWhen.from,
                mockStores.searchStore.searchWhen.to,
            );
        });

        it('should NOT invoke updateSearchDates when either isHotelDetailsBookPage or isFlexible is false', async () => {
            mockStores.layoutStore.isHotelDetailsBookPage = false;

            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.bookingStore.updateSearchDates).not.toHaveBeenCalled();
        });

        it('should invoke setSelectedAccommodationCodes when isBackToPrevUrl is false', async () => {
            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.searchStore.searchTo.setSelectedAccommodationCodes).toBeCalledWith('');
        });

        it('should NOT invoke setSelectedAccommodationCodes when isBackToPrevUrl is true', async () => {
            mockStores.routerStore.isBackToPrevUrl = true;

            render(<BackToSearch {...mockProps} />);
            await userEvent.click(screen.getByTestId('go-back-link'));

            expect(mockStores.searchStore.searchTo.setSelectedAccommodationCodes).not.toBeCalled();
        });
    });
});
