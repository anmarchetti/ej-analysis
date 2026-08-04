import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { disableScroll, enableScroll } from 'frontend/utils/ui.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISearchBarProps, SearchBar } from 'frontend/components/renderings/SearchPod/components/SearchBar/SearchBar';

jest.mock('frontend/utils/ui.utils');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewPort = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewPort,
}));

let mockUsePrevious: string | undefined = undefined;
jest.mock('frontend/hooks/usePrevious', () => jest.fn(() => mockUsePrevious));

const mockSearchBarWhenContentComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchBarWhenContent',
    () => ({
        __esModule: true,
        default: props => {
            mockSearchBarWhenContentComponent(props);

            return (
                <div data-tid='search-bar-when-content'>
                    <button onClick={() => props.openDropdownFlow('WHEN')}>openDropdownFlow</button>
                    <button onClick={() => props.toggleDropdown('WHEN')}>toggleDropdown</button>
                    <button onClick={() => props.toggleDropdown(undefined)}>toggleDropdownWithUndefined</button>
                </div>
            );
        },
    }),
);

const mockSearchBarWhoContentComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhoContent/SearchBarWhoContent',
    () => ({
        __esModule: true,
        default: props => {
            mockSearchBarWhoContentComponent(props);

            return <div data-tid='search-bar-who-content' />;
        },
    }),
);

const mockSearchBarToContentComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/SearchBarToContent',
    () => ({
        __esModule: true,
        default: props => {
            mockSearchBarToContentComponent(props);

            return <div data-tid='search-bar-to-content' />;
        },
    }),
);

const mockSearchBarFromContentComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarFromContent/SearchBarFromContent',
    () => ({
        __esModule: true,
        default: props => {
            mockSearchBarFromContentComponent(props);

            return <div data-tid='search-bar-from-content' />;
        },
    }),
);

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, dataTid, onKeyUp }) => (
        <button onClick={onClick} data-tid={dataTid} onKeyUp={onKeyUp}>
            {children}
        </button>
    ),
}));

const mockSearchBarTitleComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarTitle/SearchBarTitle',
    () => ({
        __esModule: true,
        default: props => {
            mockSearchBarTitleComponent(props);

            return <div data-tid='search-bar-title' />;
        },
    }),
);

jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/RecentSearchesPanel',
    () => ({
        __esModule: true,
        default: () => <div data-tid='search-bar-bottom-panel' />,
    }),
);

const mockUseCleanupOnLayoutChange = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/hooks/useCleanupOnLayoutChange', () => ({
    useCleanupOnLayoutChange: props => mockUseCleanupOnLayoutChange(props),
}));

const mockUseLoadLastDateOnClear = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/hooks/useLoadLastDateOnClear', () => ({
    useLoadLastDateOnClear: props => mockUseLoadLastDateOnClear(props),
}));

const mockUseStickyScrollEffect = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/hooks/useStickyScrollEffect', () => ({
    useStickyScrollEffect: props => mockUseStickyScrollEffect(props),
}));

const mockUseCleanupOnMount = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/hooks/useCleanupOnMount', () => ({
    useCleanupOnMount: props => mockUseCleanupOnMount(props),
}));

const mockUseSubmitSearchParameters = {
    onSubmitSearchParameters: jest.fn(),
};
jest.mock('frontend/hooks/useSubmitSearchParameters/useSubmitSearchParameters', () => ({
    __esModule: true,
    useSubmitSearchParameters: () => mockUseSubmitSearchParameters,
}));

const resetMocks = (): ISearchBarProps => ({
    countries: [] as any,
    onSubmit: jest.fn(),
    block: false,
    selectedDropdown: null,
    changeSelectedDropdown: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isAllHolidayTypesPage: false,
            isHolidayTypePage: false,
            isHotelDetailsBookPage: false,
            isSearchResultsPage: false,
            layoutId: '',
        },
        queryParamStore: { isReferer: false },
        hotelsStore: { hasOffers: false },
        bookingStore: { grabSearchValuesFromSearchStore: jest.fn() },
        searchFiltersStore: {
            changeIsPresetDestinationFilter: jest.fn(),
            onChangeSearchFilterStore: jest.fn(),
        },
        searchStore: {
            clearErrorMessage: jest.fn(),
            errorMessages: null,
            validateSearchParameters: jest.fn(),
            clearOldSearchParam: jest.fn(),
            isSearchSubmitDisabled: false,
            setSeachPerformWithNewParams: jest.fn(),
            searchFrom: {
                displayValue: '',
            },
            searchTo: {
                selectedDestinationCodes: [],
                updateDestinationCodes: jest.fn(),
            },
            searchWhen: {
                loadLastAvailableDate: jest.fn(),
                clearDates: jest.fn(),
                updateCheapestMonthPrices: jest.fn(),
            },
        },
        trackingStore: {
            searchPod: {
                trackSearchButtonClick: jest.fn(),
            },
        },
    });

let mocks: ISearchBarProps;
let mockStores;

describe('<SearchBar />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
        mockUseMobileViewPort = false;
        mockUsePrevious = undefined;
        mockUseStickyScrollEffect.mockReturnValue({ isSticky: false });
    });

    describe('Hooks', () => {
        it('should call UseCleanupOnLayoutChange hook with expected props', () => {
            render(<SearchBar {...mocks} />);

            expect(mockUseCleanupOnLayoutChange).toHaveBeenCalledWith({
                layoutId: mockStores.layoutStore.layoutId,
                selectedDropdown: mocks.selectedDropdown,
                changeSelectedDropdown: mocks.changeSelectedDropdown,
                clearErrorMessage: mockStores.searchStore.clearErrorMessage,
            });
        });

        it('should call UseLoadLastDateOnClear hook with expected props', () => {
            render(<SearchBar {...mocks} />);

            expect(mockUseLoadLastDateOnClear).toHaveBeenCalledWith({
                loadLastAvailableDate: mockStores.searchStore.searchWhen.loadLastAvailableDate,
                originsDisplayValue: mockStores.searchStore.searchFrom.displayValue,
                selectedDestinationCodes: mockStores.searchStore.searchTo.selectedDestinationCodes,
            });
        });

        it('should call UseStickyScrollEffect hook with expected props', () => {
            render(<SearchBar {...mocks} />);

            expect(mockUseStickyScrollEffect).toHaveBeenCalledWith({
                isStickyOnMobile: false,
                isBodyScrollLocked: false,
                isBodyScrollLockedViaBlur: false,
                searchStickyWrRef: expect.anything(),
                searchStickyBoxRef: expect.anything(),
                setIsExpanded: expect.any(Function),
                isCollapsedMobileVariant: false,
            });
        });

        it('should call UseCleanupOnMount hook with expected props', () => {
            render(<SearchBar {...mocks} />);

            expect(mockUseCleanupOnMount).toHaveBeenCalledWith({
                clearErrorMessage: mockStores.searchStore.clearErrorMessage,
            });
        });
    });

    describe('Render', () => {
        it('Should have d-block class', () => {
            mocks.block = true;

            const { container } = render(<SearchBar {...mocks} />);

            expect(container.querySelectorAll('.d-block')).toHaveLength(1);
        });

        it('should render SearchBarTitle with expected props when block prop is false', () => {
            render(<SearchBar {...mocks} />);

            expect(mockSearchBarTitleComponent).toHaveBeenCalledWith({
                isCollapsedMobileVariant: false,
                isStickyOnMobile: false,
                isSearchBarExpanded: true,
                isSearchBarSticky: false,
                searchExpandableBoxRef: expect.anything(),
                setSearchBarExpHeightValue: expect.anything(),
                setIsSearchBarExpanded: expect.anything(),
            });
        });

        it('should NOT render SearchBarTitle when block prop is true', () => {
            mocks.block = true;
            render(<SearchBar {...mocks} />);

            expect(mockSearchBarTitleComponent).not.toHaveBeenCalled();
        });

        it('should render SearchBarWhenContent with expected props', () => {
            render(<SearchBar {...mocks} />);

            expect(mockSearchBarWhenContentComponent).toHaveBeenCalledWith({
                selectedDropdown: mocks.selectedDropdown,
                changeSelectedDropdown: mocks.changeSelectedDropdown,
            });
        });

        it('should render SearchBarWhoContent with expected props', () => {
            render(<SearchBar {...mocks} />);

            expect(mockSearchBarWhoContentComponent).toHaveBeenCalledWith({
                selectedDropdown: mocks.selectedDropdown,
                changeSelectedDropdown: expect.any(Function),
            });
        });

        it('should render SearchBarFromContent with expected props', () => {
            render(<SearchBar {...mocks} />);

            expect(mockSearchBarFromContentComponent).toHaveBeenCalledWith({
                changeSelectedDropdown: mocks.changeSelectedDropdown,
                countries: mocks.countries,
                searchBarRef: expect.anything(),
                selectedDropdown: mocks.selectedDropdown,
                setIsBodyScrollLockedViaBlur: expect.any(Function),
            });
        });

        it('should render SearchBarToContent with expected props', () => {
            render(<SearchBar {...mocks} />);

            expect(mockSearchBarToContentComponent).toHaveBeenCalledWith({
                changeSelectedDropdown: mocks.changeSelectedDropdown,
                searchBarRef: expect.anything(),
                selectedDropdown: mocks.selectedDropdown,
                setIsBodyScrollLockedViaBlur: expect.any(Function),
            });
        });
    });

    describe('lock scroll', () => {
        it('should lock body scroll when dropdown is selected', () => {
            mocks.selectedDropdown = SearchBarDropdown.When;
            render(<SearchBar {...mocks} />);

            expect(disableScroll).toHaveBeenCalled();
        });

        it('should unlock body scroll when no selected dropdown', () => {
            mocks.selectedDropdown = null;
            render(<SearchBar {...mocks} />);

            expect(enableScroll).toHaveBeenCalled();
        });

        it('should call unLockBodyScroll on unmount', () => {
            mocks.selectedDropdown = SearchBarDropdown.When;
            const { unmount } = render(<SearchBar {...mocks} />);

            expect(disableScroll).toHaveBeenCalled();

            unmount();
            expect(enableScroll).toHaveBeenCalled();
        });
    });

    it('should get fieldsWrapperClassName', () => {
        const { container } = render(<SearchBar {...mocks} />);

        expect(container.querySelector('.search-fields')).toBeInTheDocument();
    });

    describe('onSubmitSearchClick', () => {
        beforeEach(() => {
            mockStores.searchStore.validateSearchParameters.mockReturnValue(false);
        });

        it('should call all submit function when validateSearchParameters returns false', async () => {
            render(<SearchBar {...mocks} />);

            await userEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsSearch));

            expect(mockStores.trackingStore.searchPod.trackSearchButtonClick).toHaveBeenCalled();
            expect(mockStores.searchStore.validateSearchParameters).toHaveBeenCalled();
            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                key: 'isFiltersLoaded',
                value: false,
            });
            expect(mockStores.searchFiltersStore.changeIsPresetDestinationFilter).toHaveBeenCalledWith(false);
            expect(mocks.onSubmit).toHaveBeenCalled();
            expect(mockStores.bookingStore.grabSearchValuesFromSearchStore).toHaveBeenCalled();
            expect(mockStores.searchStore.clearOldSearchParam).toHaveBeenCalled();
            expect(mockStores.searchStore.setSeachPerformWithNewParams).toHaveBeenCalledWith(true);
            expect(mockUseSubmitSearchParameters.onSubmitSearchParameters).toHaveBeenCalled();
        });

        it('should call only validateSearchParameters when validateSearchParameters returns true', async () => {
            mockStores.searchStore.validateSearchParameters.mockReturnValue(true);

            render(<SearchBar {...mocks} />);

            await userEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsSearch));

            expect(mockStores.trackingStore.searchPod.trackSearchButtonClick).not.toHaveBeenCalled();
            expect(mockStores.searchStore.validateSearchParameters).toHaveBeenCalled();
            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).not.toHaveBeenCalled();
            expect(mockStores.bookingStore.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
            expect(mockStores.searchFiltersStore.changeIsPresetDestinationFilter).not.toHaveBeenCalled();
            expect(mocks.onSubmit).not.toHaveBeenCalled();
            expect(mockStores.searchStore.searchTo.updateDestinationCodes).not.toHaveBeenCalled();
            expect(mockStores.searchStore.clearOldSearchParam).not.toHaveBeenCalled();
            expect(mockStores.searchStore.setSeachPerformWithNewParams).not.toHaveBeenCalled();
            expect(mockUseSubmitSearchParameters.onSubmitSearchParameters).not.toHaveBeenCalled();
        });

        it('should NOT call any function when isSearchSubmitDisabled is true', async () => {
            mockStores.searchStore.isSearchSubmitDisabled = true;

            render(<SearchBar {...mocks} />);

            await userEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsSearch));

            expect(mockStores.trackingStore.searchPod.trackSearchButtonClick).not.toHaveBeenCalled();
            expect(mockStores.searchStore.validateSearchParameters).not.toHaveBeenCalled();
            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).not.toHaveBeenCalled();
            expect(mockStores.searchFiltersStore.changeIsPresetDestinationFilter).not.toHaveBeenCalled();
            expect(mockStores.bookingStore.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
            expect(mocks.onSubmit).not.toHaveBeenCalled();
            expect(mockStores.searchStore.searchTo.updateDestinationCodes).not.toHaveBeenCalled();
            expect(mockStores.searchStore.clearOldSearchParam).not.toHaveBeenCalled();
            expect(mockStores.searchStore.setSeachPerformWithNewParams).not.toHaveBeenCalled();
            expect(mockUseSubmitSearchParameters.onSubmitSearchParameters).not.toHaveBeenCalled();
        });
    });
});
