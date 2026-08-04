import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { holidayThemeMock } from 'frontend/__mocks__/holidayTheme';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISearchBarErrorMessage } from 'models/data/ISearchBarErrorMessage';
import { MediaSize } from 'models/data/MediaSizeParams';
import { CalloutOrientation } from 'models/enum/Callout';
import { DataStatus } from 'models/enum/DataStatus';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PromopageSearchPod from './PromopageSearchPod';

const createProps = () => ({
    params: {
        EnableSeoReadMoreText: '1',
        IsSlantTranslucent: undefined,
    },
    rendering: {
        fields: {
            airportsGroups: [
                {
                    airports: [],
                    code: 'code1',
                    hasDepartureAirports: true,
                    name: 'name',
                },
            ],
        },
    },
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        getSetting: jest.fn(),
        getFlexDays: jest.fn(),
        isTradePortal: true,
        pageFields: {
            Name: mockSitecoreField('{holidayTheme} country holidays'),
            Image: { value: { alt: 'img', src: 'img' } },
            Icon: { value: { src: 'icon' } },
            PromoDescription: { value: '<p>Description</p>' },
            IsFlexibleDatesRange: { value: true },
            IsImageDisplayedOnMobile: { value: false },
            OverridePaxMix: { value: true },
            OverrideDestinations: { value: true },
            OverrideDefaultDuration: { value: true },
            NumberOfAdults: { value: '2' },
            NumberOfChildren: { value: '1' },
            NumberOfInfants: { value: '0' },
            Destinations: { value: ['Destination1'] },
            DefaultDuration: { value: '7' },
            InitialSearchDays: { value: '30' },
            HolidayThemes: [holidayThemeMock],
        },
        layoutId: '27109ac7-bd05-405e-9a02-675760beb901',
        pageName: 'Name',
        isSearchResultsPage: false,
        isApplySpecialFilter: jest.fn(),
        prevTemplateId: 'c0cb2f05-afd2-41ce-b53f-6f15a1033740',
        isEditMode: false,
    },
    searchFiltersStore: {
        changeIsPresetDestinationFilter: jest.fn(),
        onCloseFilters: jest.fn(),
        clearFilterStoreValues: jest.fn(),
        onChangeSearchFilterStore: jest.fn(),
    },
    searchStore: {
        isNeedOpenWhenField: false,
        setNeedOpenWhenField: jest.fn(),
        isNeedOpenWhoField: false,
        setNeedOpenWhoField: jest.fn(),
        errorMessages: null as ISearchBarErrorMessage | null,
        validatePromoPageSearchParameters: jest.fn(),
        setPageNumber: jest.fn(),
        setSelectedOfferIndex: jest.fn(),
        clearOldSearchParam: jest.fn(),
        setSeachPerformWithNewParams: jest.fn(),
        clearSearchValues: jest.fn(),
        clearErrorMessage: jest.fn(),
        hasErrorInField: jest.fn(),
        trackUserSearch: jest.fn(),
        activeField: null as SearchBarDropdown | null,
        collectOriginsTitles: jest.fn(),
        validateWhenParameters: jest.fn(),
        searchWhen: {
            clearDates: jest.fn(),
            setDates: jest.fn(),
            updateAvailableDates: jest.fn(),
            from: null,
            availableDates: undefined,
            to: null,
            isFlexible: false,
            flexDays: 0,
            prevFlexDays: undefined,
            isWhenParamsValid: false,
            onChangeFlexible: jest.fn(),
            onChangePrevFlexDays: jest.fn(),
        },
        searchFrom: {
            updateAvailableOrigins: jest.fn(),
        },
        searchTo: {
            updateAvailableDstCodes: jest.fn(),
            updateDestinationCodes: jest.fn(),
            loadAllDestinations: jest.fn(),
        },
        searchWho: {
            whoValue: '2 adults',
            setIsAutoAllocation: jest.fn(),
            roomsAllocation: [],
            setRoomsAllocation: jest.fn(),
            isAutoAllocation: true,
            isWhoParamsValid: true,
            isChildrenAgeValid: true,
            onClearRoom: jest.fn(),
            validateChildrenAge: jest.fn(),
        },
    },
    appStore: { isScreenMedium: true },
    promoPageStore: {
        prefillPromoPage: jest.fn(),
        prefillPromoPageFilters: jest.fn(),
        setBackgroundFilters: jest.fn(),
        clearPageDestination: jest.fn(),
        updateSearchParamsAndExecuteSearch: jest.fn(),
        getSeasonName: jest.fn(),
        clearPromopageStore: jest.fn(),
        restoreFromLocalStorage: jest.fn(),
        setOverrideWhoValue: jest.fn(),
        isInitialPaxIsDefault: jest.fn(),
    },
    bookingStore: {
        grabSearchValuesFromSearchStore: jest.fn(),
        clearBookingFlow: jest.fn(),
        clearSearchParams: jest.fn(),
    },
    paymentStore: { clearPaymentStore: jest.fn() },
    routerStore: { clearIsClickBackToSearch: jest.fn() },
    trackingStore: { searchEditTrigger: jest.fn() },
    hotelsStore: { fetchOffers: jest.fn(), updateOffersDataStatus: jest.fn() },
});

jest.mock('frontend/hooks/useMediaQuery');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./components/PopupSearchPod', () => () => <div data-tid='popup' />);

jest.mock('frontend/components/common/Drawer', () => props => <div className='drawer'>{props.children}</div>);

const mockDateViewDropdownComponent = jest.fn();
jest.mock(
    'frontend/components/common/SearchBarDropdownWhen/components/DateViewDropdown/DateViewDropdown',
    () =>
        ({ onClose, onApply, ...props }) => {
            mockDateViewDropdownComponent(props);

            return (
                <div data-tid='search-bar-dropdown-when'>
                    <button onClick={onClose} onKeyDown={jest.fn()} data-tid='search-bar-when-on-close' />
                    <button onClick={onApply} onKeyDown={jest.fn()} data-tid='search-bar-when-on-apply' />
                </div>
            );
        },
);

const mockSearchBarDropdownWhoProps = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownWho/SearchBarDropdownWho', () => props => {
    mockSearchBarDropdownWhoProps(props);

    return (
        <div data-tid='search-bar-dropdown-who'>
            <button onClick={props.onApply} data-tid='search-bar-who-on-apply' />
        </div>
    );
});

const mockCallout = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => props => {
    mockCallout(props);

    return <div data-tid='callout' />;
});

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

let mockProps;
let mockStores;

const numberOfFlexibleDays = 5;

describe('<PromopageSearchPod />', () => {
    beforeAll(() => {
        jest.mocked(useMobileViewport).mockReturnValue(false);
    });

    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT update hotelsStore.status to "Loading" when isDynamicPromoPageLayout is true', () => {
        mockStores.layoutStore.isDynamicPromoPageLayout = true;

        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.hotelsStore.updateOffersDataStatus).not.toHaveBeenCalled();
    });

    it('should replace both {holidayTheme} and {season} tokens in the page title', () => {
        mockStores.layoutStore.pageFields.Name = mockSitecoreField('{holidayTheme} {season} vacation');
        mockStores.layoutStore.pageFields.HolidayThemes = [holidayThemeMock];
        mockStores.promoPageStore.getSeasonName = jest.fn(() => 'Winter');

        render(<PromopageSearchPod {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent('Beach Winter vacation');
    });

    it('should call setOverrideWhoValue when isDynamicPromoPageLayout changes', () => {
        mockStores.layoutStore.isDynamicPromoPageLayout = false;
        const { rerender } = render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.promoPageStore.setOverrideWhoValue).toHaveBeenCalled();

        mockStores.layoutStore.isDynamicPromoPageLayout = true;
        rerender(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.promoPageStore.setOverrideWhoValue).toHaveBeenCalled();
    });

    it('should fallback to empty string if getSeasonName returns null', () => {
        mockStores.layoutStore.pageFields.Name = mockSitecoreField('{holidayTheme} {season} time');
        mockStores.promoPageStore.getSeasonName = jest.fn(() => null);

        render(<PromopageSearchPod {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent('Beach time');
    });

    it('should call restoreFromLocalStorage and updateSearchParamsAndExecuteSearch on page change', () => {
        mockStores.layoutStore.isDynamicPromoPageLayout = true;

        const { unmount } = render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.promoPageStore.restoreFromLocalStorage).toHaveBeenCalledTimes(1);
        expect(mockStores.promoPageStore.updateSearchParamsAndExecuteSearch).toHaveBeenCalledTimes(1);

        unmount();

        mockStores.searchStore.page = 2;
        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.promoPageStore.restoreFromLocalStorage).toHaveBeenCalledTimes(2);
        expect(mockStores.promoPageStore.updateSearchParamsAndExecuteSearch).toHaveBeenCalledTimes(2);
    });

    it('should call clearDates on mount', () => {
        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.searchStore.searchWhen.clearDates).toHaveBeenCalled();
        expect(mockStores.promoPageStore.updateSearchParamsAndExecuteSearch).not.toHaveBeenCalled();
        expect(mockStores.promoPageStore.restoreFromLocalStorage).not.toHaveBeenCalled();
    });

    it('should call restoreFromLocalStorage and updateSearchParamsAndExecuteSearch on mount on DynamicPromoPageLayout', () => {
        mockStores.layoutStore.isDynamicPromoPageLayout = true;
        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.promoPageStore.updateSearchParamsAndExecuteSearch).toHaveBeenCalled();
        expect(mockStores.promoPageStore.restoreFromLocalStorage).toHaveBeenCalled();
    });

    it('should call restoreFromLocalStorage on mount on DynamicPromoPageLayout', () => {
        mockStores.layoutStore.isDynamicPromoPageLayout = true;
        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.promoPageStore.updateSearchParamsAndExecuteSearch).toHaveBeenCalled();
        expect(mockStores.promoPageStore.restoreFromLocalStorage).toHaveBeenCalled();
    });

    it('should update hotelsStore.status to "Loading" on initial state when not on search result page and not dynamic promo page', () => {
        mockStores.layoutStore.isDynamicPromoPageLayout = false;
        mockStores.layoutStore.isSearchResultsPage = false;

        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.hotelsStore.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loading);
    });

    it('should call clearPromopageStore on component unmount', () => {
        const { unmount } = render(<PromopageSearchPod {...mockProps} />);

        unmount();

        expect(mockStores.promoPageStore.clearPromopageStore).toHaveBeenCalled();
    });

    it('Should update hotelsStore.status to "Loading" on initial state not on search result page', () => {
        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.hotelsStore.updateOffersDataStatus).toHaveBeenCalledWith(DataStatus.Loading);
    });

    it('should render solid white slant', () => {
        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.getElementsByClassName('promopage-search-pod--translucent-slant').length).toBe(0);
    });

    it('should render translucent slant', () => {
        mockProps.params.IsSlantTranslucent = '1';
        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.getElementsByClassName('promopage-search-pod--translucent-slant').length).toBe(1);
    });

    it('should NOT render drawers container od desktop', () => {
        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.getElementsByClassName('promopage-search-pod__drawer-container').length).toBe(0);
    });

    it('should render drawers od mobile', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        const numberOfDrawers = 2;

        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.getElementsByClassName('promopage-search-pod__drawer-container').length).toBe(1);
        expect(container.getElementsByClassName('drawer').length).toBe(numberOfDrawers);
    });

    it('should NOT render Name and Icon', () => {
        mockStores.layoutStore.pageFields = undefined;

        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(screen.queryByRole('heading')).toBeNull();
        expect(container.getElementsByClassName('promopage-search-pod__icon').length).toBe(0);
    });

    it('should render Icon and replace theme in the title', () => {
        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.getElementsByClassName('promopage-search-pod__icon').length).toBe(1);
        expect(screen.getByRole('heading')).toHaveTextContent('Beach country holidays');
    });

    it('should NOT render popup container on mobile', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);

        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.getElementsByClassName('drawer').length).toBe(2);
        expect(screen.queryByTestId('popup')).toBeNull();
    });

    it('should render popup container on desktop', () => {
        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.getElementsByClassName('drawer').length).toBe(0);
        expect(screen.queryByTestId('popup')).toBeInTheDocument();
    });

    it('should NOT render image on mobile and title with margin', () => {
        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.getElementsByClassName('promopage-search-pod--no-mobile-img').length).toBe(1);
    });

    it('should not render tooltip', () => {
        mockStores.layoutStore.getSetting.mockReturnValue('0');

        render(<PromopageSearchPod {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
    });

    it('should render tooltip with right orientation when screen is medium', () => {
        mockStores.layoutStore.getSetting.mockReturnValue('1');

        render(<PromopageSearchPod {...mockProps} />);

        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(mockCallout).toHaveBeenCalledWith(
            expect.objectContaining({
                orientation: CalloutOrientation.Right,
            }),
        );
    });

    it('should render tooltip with right orientation when screen is NOT medium', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        mockStores.layoutStore.getSetting.mockReturnValue('1');

        render(<PromopageSearchPod {...mockProps} />);

        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(mockCallout).toHaveBeenCalledWith(
            expect.objectContaining({
                orientation: CalloutOrientation.Bottom,
            }),
        );
    });

    it('should pass errorMessage to DateViewDropdown component', () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        const errorText = 'error';
        mockStores.searchStore.errorMessages = {
            key: SearchBarDropdown.When,
            message: errorText,
        };
        mockStores.searchStore.activeField = SearchBarDropdown.When;
        mockStores.searchStore.isNeedOpenWhenField = true;

        render(<PromopageSearchPod {...mockProps} />);

        expect(mockDateViewDropdownComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                errorMessage: errorText,
            }),
        );
        expect(screen.getByTestId('search-bar-dropdown-when')).toBeInTheDocument();
    });

    describe('Flex dates', () => {
        it('should call onChangeFlexible and onChangePrevFlexDays with NumberOfFlexibleDays when is flexible', () => {
            mockStores.layoutStore.getFlexDays.mockReturnValue(numberOfFlexibleDays);

            render(<PromopageSearchPod {...mockProps} />);

            expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledWith(numberOfFlexibleDays);
            expect(mockStores.searchStore.searchWhen.onChangePrevFlexDays).toHaveBeenCalledWith(numberOfFlexibleDays);
        });

        it('should call onChangeFlexible and onChangePrevFlexDays with 0 when is NOT flexible', () => {
            mockStores.layoutStore.getFlexDays.mockReturnValue(0);
            mockStores.layoutStore.pageFields.IsFlexibleDatesRange.value = false;
            mockStores.searchStore.searchWhen.flexDays = 1;

            render(<PromopageSearchPod {...mockProps} />);

            expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledWith(0);
            expect(mockStores.searchStore.searchWhen.onChangePrevFlexDays).toHaveBeenCalledWith(0);
        });

        it('should call onChangeFlexible and onChangePrevFlexDays on IsFlexibleDatesRange change', () => {
            render(<PromopageSearchPod {...mockProps} />);

            mockStores.layoutStore.pageFields.IsFlexibleDatesRange.value = false;

            expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalled();
            expect(mockStores.searchStore.searchWhen.onChangePrevFlexDays).toHaveBeenCalled();
        });
    });

    it('should render search pod', () => {
        const { container } = render(<PromopageSearchPod {...mockProps} />);

        expect(container.querySelector('.promopage-search-pod')).toBeInTheDocument();
    });

    it('should call collectOriginsTitles with airportsGroups from props', () => {
        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.searchStore.collectOriginsTitles).toHaveBeenCalledWith(
            mockProps.rendering.fields.airportsGroups,
        );
    });

    it('should call collectOriginsTitles with empty array when airportsGroups are NOT provided', () => {
        mockProps.rendering.fields = undefined;

        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.searchStore.collectOriginsTitles).toHaveBeenCalledWith([]);
    });

    it('should NOT call setNeedOpenWhoField when isNeedOpenWhoField is false', () => {
        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.searchStore.setNeedOpenWhoField).not.toHaveBeenCalled();
    });

    it('should call setNeedOpenWhoField when isNeedOpenWhoField is true', () => {
        mockStores.searchStore.isNeedOpenWhoField = true;

        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.searchStore.setNeedOpenWhoField).toHaveBeenCalled();
    });

    it('should render SearchBarDropdownWho', () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        mockStores.searchStore.isNeedOpenWhoField = true;
        mockStores.searchStore.activeField = SearchBarDropdown.Who;

        render(<PromopageSearchPod {...mockProps} />);

        expect(screen.getByTestId('search-bar-dropdown-who')).toBeInTheDocument();
        expect(mockSearchBarDropdownWhoProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rooms: mockStores.searchStore.searchWho.roomsAllocation,
                isPromoViewForWhoField: true,
                isMobilePromoViewForWhoField: true,
                applyBtnText: SitecoreDictionary.GlobalsButtonsNext,
                ignoreValidationOnClose: true,
            }),
        );
    });

    it('should call setNeedOpenWhenField onApplyWhoField click', async () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        mockStores.searchStore.isNeedOpenWhoField = true;
        mockStores.searchStore.activeField = SearchBarDropdown.Who;

        render(<PromopageSearchPod {...mockProps} />);

        await userEvent.click(screen.getByTestId('search-bar-who-on-apply'));

        expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalled();
    });

    it('should call changePrevFlexible and changeFlexible when wasRerendered is true, flexDays is NOT equal to NumberOfFlexibleDays', () => {
        mockProps.wasRerendered = true;

        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.searchStore.searchWhen.onChangePrevFlexDays).toHaveBeenCalled();
        expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalled();
    });

    it('should NOT call changePrevFlexible when wasRerendered is true, flexDays is equal to NumberOfFlexibleDays', () => {
        mockProps.wasRerendered = true;
        mockStores.layoutStore.getFlexDays.mockReturnValue(numberOfFlexibleDays);
        mockStores.searchStore.searchWhen.flexDays = numberOfFlexibleDays;

        render(<PromopageSearchPod {...mockProps} />);

        expect(mockStores.searchStore.searchWhen.onChangePrevFlexDays).not.toHaveBeenCalled();
    });

    describe('DateViewDropdown clicks', () => {
        beforeEach(() => {
            jest.mocked(useMobileViewport).mockReturnValue(true);
            mockStores.searchStore.isNeedOpenWhenField = true;
        });

        it('should call onChangeFlexible on onClosePopup', async () => {
            render(<PromopageSearchPod {...mockProps} />);

            expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledTimes(1);

            await userEvent.click(screen.getByTestId('search-bar-when-on-close'));

            expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledTimes(2);
        });

        it('should NOT call onChangeFlexible on onClosePopup when flexDays is equal to prevFlexDays', async () => {
            mockStores.searchStore.searchWhen.prevFlexDays = 0;

            render(<PromopageSearchPod {...mockProps} />);

            expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledTimes(1);

            await userEvent.click(screen.getByTestId('search-bar-when-on-close'));

            expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledTimes(1);
        });

        it('should call changePrevFlexible and onChangeSearchFilterStore onApplySearchWithWhenField', async () => {
            render(<PromopageSearchPod {...mockProps} />);

            await userEvent.click(screen.getByTestId('search-bar-when-on-apply'));

            expect(mockStores.searchStore.searchWhen.onChangePrevFlexDays).toHaveBeenCalled();
            expect(mockStores.searchStore.setSeachPerformWithNewParams).toHaveBeenCalled();
            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                key: 'isFiltersLoaded',
                value: false,
            });
        });
    });

    it('Should render JSSImageNext as main image when no isEdit mode', () => {
        render(<PromopageSearchPod {...mockProps} />);

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockStores.layoutStore.pageFields.Image,
                mediaSize: {
                    desktop: MediaSize.Big,
                },
                fill: true,
                priority: true,
            }),
        );
    });

    describe('showPopup', () => {
        beforeEach(() => {
            jest.mocked(useMobileViewport).mockReturnValue(false);
            mockStores.searchStore.isNeedOpenWhenField = true;
        });

        it('should show "when" popup when isInitialPaxIsDefault returns true', async () => {
            mockStores.promoPageStore.isInitialPaxIsDefault.mockReturnValue(true);

            render(<PromopageSearchPod {...mockProps} />);

            await userEvent.click(screen.getByRole('button', { name: /EditMobile/ }));

            expect(screen.getByTestId('popup')).toBeInTheDocument();
        });

        it('should show "who" popup when isInitialPaxIsDefault returns false', async () => {
            mockStores.promoPageStore.isInitialPaxIsDefault.mockReturnValue(false);

            render(<PromopageSearchPod {...mockProps} />);

            await userEvent.click(screen.getByRole('button', { name: /EditMobile/ }));

            expect(screen.getByTestId('popup')).toBeInTheDocument();
        });
    });
});
