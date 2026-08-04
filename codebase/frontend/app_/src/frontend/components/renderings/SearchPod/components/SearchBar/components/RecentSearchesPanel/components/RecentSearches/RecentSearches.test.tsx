import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import * as searchUtils from 'frontend/utils/search/search.utils';
import * as utils from 'frontend/utils/webStorage.utils';
import { ISavedSearchParams } from 'models/data/ISavedSearchParams';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import {
    IRecentSearchesProps,
    RecentSearches,
    RecentSearchesActions,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearches/RecentSearches';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

const mockRecentSearch = {
    createdAt: '2020-11-10',
    startDate: '2020-11-10',
    durations: ['13', '21'],
    departure: '2020-12-10',
    geog: 'geog',
    dest: 'LGW',
    rooms: [],
    autoAllocation: false,
    flexDays: 1,
    isMonthSearch: false,
    isVirtualResort: false,
};

const createProps = (): IRecentSearchesProps => ({
    isOpen: false,
    isHidden: false,
    changeSelectedDropdown: jest.fn(),
});

const createStores = () => ({
    layoutStore: {
        isHomePage: false,
        getPhrase: jest.fn(p => p),
        getSettingAsNumber: jest.fn(),
        isMonthSearchEnabled: false,
    },
    searchStore: {
        prefillSearchParams: jest.fn(),
    },
    marketStore: {
        marketCode: 'UK',
        marketSettings: {
            AirportDepartureCodes: ['LGW', 'LTN', 'STN'],
        },
    },
    trackingStore: {
        searchPod: {
            trackRecentSearches: jest.fn(),
        },
    },
});

const recentSearches: ISavedSearchParams[] = [
    {
        startDate: '21-08-2023',
        durations: ['1'],
        departure: 'LGW,LTN,STN',
        dest: 'ALL',
        geog: 'ALL',
        rooms: [
            {
                adults: 2,
                children: 0,
                infants: 0,
                roomCode: '',
                childrenAges: [],
            },
        ],
        autoAllocation: true,
        flexDays: 0,
        createdAt: '26-07-2023',
        isMonthSearch: undefined,
        isVirtualResort: false,
    },
    {
        startDate: '22-08-2023',
        durations: ['1'],
        departure: 'LGW,LTN,STN',
        dest: 'ALL',
        geog: 'ALL',
        rooms: [
            {
                adults: 2,
                children: 0,
                infants: 0,
                roomCode: '',
                childrenAges: [],
            },
        ],
        autoAllocation: true,
        flexDays: 0,
        createdAt: '28-07-2023',
        isMonthSearch: undefined,
        isVirtualResort: false,
    },
];
const expirationMonths = 3;

let mockProps;
let mockStores;
let mockLocalStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

jest.mock('frontend/components/icons-new/ChevronDown', () => () => <div data-tid='icon' />);

jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearchesContent/RecentSearchesContent',
    () =>
        ({ onClearAll, onClearOne, onApply }) =>
            (
                <div>
                    <div data-tid='clear-one-btn' onClick={onClearOne} />
                    <div data-tid='clear-all-btn' onClick={onClearAll} />
                    <div data-tid='apply-btn' onClick={onApply} />
                    <div data-tid='content' />
                </div>
            ),
);

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/components/common/Drawer', () => ({ children }) => <div data-tid='drawer'>{children}</div>);

describe('<RecentSearches />', () => {
    let mockGetWebStorageItem;
    let mockSetWebStorageItem;
    let mockSetValidSearches;
    let mockRemoveWebStorageItem;

    beforeEach(() => {
        // @ts-ignore
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date(2023, 7, 27));

        mockProps = createProps();
        mockStores = createStores();
        mockLocalStore = createMockLocalStore();
        mockGetWebStorageItem = jest.spyOn(utils, 'getWebStorageItem').mockReturnValue(recentSearches);
        mockSetWebStorageItem = jest.spyOn(utils, 'setWebStorageItem');
        mockRemoveWebStorageItem = jest.spyOn(utils, 'removeWebStorageItem');
        jest.spyOn(searchUtils, 'isRecentSearchItemExpired').mockReturnValue(true);
        mockSetValidSearches = jest.spyOn(searchUtils, 'getValidSearches').mockReturnValue([mockRecentSearch]);
        mockUseMobileViewport = false;
        mockStores.layoutStore.getSettingAsNumber.mockReturnValue(expirationMonths);
    });

    it('should call getWebStorageItem, getValidSearches and setWebStorageItem on load', () => {
        render(<RecentSearches {...mockProps} />);

        expect(mockGetWebStorageItem).toHaveBeenCalledWith('recentSearchesUK', true);
        expect(mockSetWebStorageItem).toHaveBeenCalledWith('recentSearchesUK', [mockRecentSearch]);
        expect(mockSetValidSearches).toHaveBeenCalledWith(
            recentSearches,
            mockStores.marketStore.marketSettings.AirportDepartureCodes,
            expirationMonths,
            mockStores.layoutStore.isMonthSearchEnabled,
        );
    });

    it('should call getValidSearches on isMonthSearchEnabled changed', async () => {
        mockSetValidSearches = jest.spyOn(searchUtils, 'getValidSearches').mockReturnValue(recentSearches);
        jest.spyOn(utils, 'getWebStorageItem').mockReturnValue(mockRecentSearch);

        const { rerender } = render(<RecentSearches {...mockProps} />);

        expect(mockSetValidSearches).toHaveBeenCalledWith(mockRecentSearch, ['LGW', 'LTN', 'STN'], 3, false);

        mockStores.layoutStore.isMonthSearchEnabled = true;

        rerender(<RecentSearches {...mockProps} />);

        expect(mockSetValidSearches).toHaveBeenLastCalledWith(mockRecentSearch, ['LGW', 'LTN', 'STN'], 3, true);
    });

    it('should NOT call setWebStorageItem on load when receivedRecentSearches are the same as recentSearches', () => {
        mockSetValidSearches = jest.spyOn(searchUtils, 'getValidSearches').mockReturnValue(recentSearches);
        render(<RecentSearches {...mockProps} />);

        expect(mockSetWebStorageItem).not.toHaveBeenCalled();
    });

    it('should NOT call setWebStorageItem with updated SearchParams on load when MonthSearch is enabled in Sitecore', () => {
        mockStores.layoutStore.isMonthSearchEnabled = true;
        mockSetValidSearches = jest.spyOn(searchUtils, 'getValidSearches').mockReturnValue(recentSearches);
        render(<RecentSearches {...mockProps} />);

        expect(mockSetWebStorageItem).not.toHaveBeenCalled();
    });

    it('should call setWebStorageItem with last valid recent search on load when MonthSearch is disabled and received SearchParams is NOT valid', () => {
        mockRecentSearch.isMonthSearch = true;
        jest.spyOn(utils, 'getWebStorageItem').mockReturnValue(mockRecentSearch);
        mockSetValidSearches = jest.spyOn(searchUtils, 'getValidSearches').mockReturnValue(recentSearches);
        render(<RecentSearches {...mockProps} />);

        expect(mockSetWebStorageItem).toHaveBeenCalledWith('searchParamsUK', recentSearches[0]);
    });

    it('should call setWebStorageItem with undefined on load when MonthSearch is disabled, received SearchParams is NOT valid and there are NO valid recent searches', () => {
        mockRecentSearch.isMonthSearch = true;
        jest.spyOn(utils, 'getWebStorageItem').mockReturnValue(mockRecentSearch);
        mockSetValidSearches = jest.spyOn(searchUtils, 'getValidSearches').mockReturnValue([]);
        render(<RecentSearches {...mockProps} />);

        expect(mockSetWebStorageItem).toHaveBeenCalledWith('searchParamsUK', undefined);
    });

    it('should NOT render when no recent searches', () => {
        jest.spyOn(utils, 'getWebStorageItem').mockReturnValueOnce([]);
        jest.spyOn(searchUtils, 'getValidSearches').mockReturnValueOnce([]);
        const { container } = render(<RecentSearches {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should open recent searches', () => {
        render(<RecentSearches {...mockProps} />);

        fireEvent.click(screen.getByTestId('recent-search-btn'));

        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(SearchBarDropdown.Recent);
        expect(mockStores.trackingStore.searchPod.trackRecentSearches).toHaveBeenCalledWith(
            RecentSearchesActions.Open,
            [mockRecentSearch],
        );
    });

    it('should clear all recent searches', () => {
        mockProps.isOpen = true;
        render(<RecentSearches {...mockProps} />);

        fireEvent.click(screen.getByTestId('clear-all-btn'));

        expect(mockRemoveWebStorageItem).toHaveBeenCalled();
        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        expect(mockStores.trackingStore.searchPod.trackRecentSearches).toHaveBeenCalledWith(
            RecentSearchesActions.Clear,
            [mockRecentSearch],
        );
    });

    it('should clear a single recent search', () => {
        mockProps.isOpen = true;
        render(<RecentSearches {...mockProps} />);

        fireEvent.click(screen.getByTestId('clear-one-btn'));
        expect(mockSetWebStorageItem).toHaveBeenCalledWith('recentSearchesUK', []);
        expect(mockStores.trackingStore.searchPod.trackRecentSearches).toHaveBeenCalledWith(
            RecentSearchesActions.Delete,
            [],
        );
    });

    it('should prefill search params when click on apply button', () => {
        mockProps.isOpen = true;
        render(<RecentSearches {...mockProps} />);

        fireEvent.click(screen.getByTestId('apply-btn'));
        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        expect(mockStores.searchStore.prefillSearchParams).toHaveBeenCalled();
        expect(mockStores.trackingStore.searchPod.trackRecentSearches).toHaveBeenCalledWith(
            RecentSearchesActions.Select,
            [],
        );
    });

    describe('is NOT opened', () => {
        it('should render 2 buttons if screen isMobile', () => {
            mockUseMobileViewport = true;
            render(<RecentSearches {...mockProps} />);

            expect(screen.getAllByRole('button').length).toBe(2);
        });

        it('should render icon if screen isDesktop', () => {
            render(<RecentSearches {...mockProps} />);

            expect(screen.getByTestId('icon')).toBeInTheDocument();
        });

        it('should NOT render icon if screen isMobile', () => {
            mockUseMobileViewport = true;
            render(<RecentSearches {...mockProps} />);

            expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
        });

        it('should render ViewRecentSearchesPlural when plural recent searches', () => {
            jest.spyOn(searchUtils, 'getValidSearches').mockReturnValue([mockRecentSearch, mockRecentSearch]);
            render(<RecentSearches {...mockProps} />);
            expect(screen.getByText(mockLocalStore.fields.ViewRecentSearchesPlural.value)).toBeInTheDocument();
        });

        it('should render ViewRecentSearchesSingular when one recent search', () => {
            jest.spyOn(searchUtils, 'getValidSearches').mockReturnValue([
                {
                    startDate: '22-08-2023',
                    durations: ['1'],
                    departure: 'LGW,LTN,STN',
                    dest: 'ALL',
                    geog: 'ALL',
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                            infants: 0,
                            roomCode: '',
                            childrenAges: [],
                        },
                    ],
                    autoAllocation: true,
                    flexDays: 0,
                    createdAt: '28-07-2023',
                    isMonthSearch: undefined,
                    isVirtualResort: false,
                },
            ]);

            render(<RecentSearches {...mockProps} />);

            expect(screen.getByText(mockLocalStore.fields.ViewRecentSearchesSingular.value)).toBeInTheDocument();
        });

        it('should render Drawer when screen isMobile', () => {
            mockUseMobileViewport = true;
            render(<RecentSearches {...mockProps} />);

            expect(screen.getByTestId('drawer')).toBeInTheDocument();
        });

        it('should NOT render Drawer when screen is Desktop', () => {
            render(<RecentSearches {...mockProps} />);

            expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
        });

        it('should render close button in drawer', () => {
            mockUseMobileViewport = true;
            render(<RecentSearches {...mockProps} />);

            expect(screen.getByTestId('drawer')).toContainElement(screen.getAllByRole('button')[1]);
            expect(screen.getAllByRole('button')[1]).toHaveTextContent(SitecoreDictionary.GlobalsButtonsClose);
        });
    });

    describe('is opened', () => {
        beforeEach(() => {
            mockProps.isOpen = true;
        });

        it('should render CloseRecentSearches', () => {
            render(<RecentSearches {...mockProps} />);

            expect(screen.getByText(mockLocalStore.fields.CloseRecentSearches.value)).toBeInTheDocument();
        });

        it('should render Content in Drawer when screen isMobile', () => {
            mockUseMobileViewport = true;
            render(<RecentSearches {...mockProps} />);

            expect(screen.getByTestId('drawer')).toContainElement(screen.getByTestId('content'));
        });

        it('should render Content when screen is Desktop', () => {
            render(<RecentSearches {...mockProps} />);

            expect(screen.getByTestId('content')).toBeInTheDocument();
        });
    });
});
