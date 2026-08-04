import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { MarketCode } from 'models/data/MarketSettings';
import {
    SearchPodEventActions,
    SearchPodEventLabels,
    SearchPodGenericValues,
} from 'models/data/tracking/SearchPodEvent';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories } from 'models/enum/tracking/GenericEventParams';
import { SearchBarSuggestionsPopupType } from 'frontend/components/common/SearchBarSuggestionsPopup/SearchBarSuggestionsPopup';
import SearchBarFromContent, {
    ISearchBarFromContentProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarFromContent/SearchBarFromContent';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFilteredPlaces = [{ name: 'filtered', code: 'filter1' }];
let hasBlockedPlaces = true;
const mockFilteredAirports = [mockFilteredPlaces, hasBlockedPlaces];
const mockSearchBarSuggestionsPopupSelectedPlace = { code: 'BRI', name: 'Bristol', showOnSearchPod: true };
jest.mock('frontend/utils/search/searchPod.utils', () => ({
    ...jest.requireActual('frontend/utils/search/searchPod.utils'),
    __esModule: true,
    getFilteredAirports: jest.fn(() => mockFilteredAirports),
}));

const mockPopupItemHighlightedIdx = 0;
const mockResetHighlightedIdx = jest.fn();
const mockSbInputKeyboardEvent = jest.fn();
jest.mock('frontend/hooks/useSuggestionsPopupNavigation', () => ({
    __esModule: true,
    useSuggestionsPopupNavigation: () => ({
        popupItemHighlightedIdx: mockPopupItemHighlightedIdx,
        resetHighlightedIdx: mockResetHighlightedIdx,
        sbInputKeyboardEvent: mockSbInputKeyboardEvent,
    }),
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

let mockReset;
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/hooks/useInputAreaFocus', () => ({
    __esModule: true,
    default: ({ reset }) => {
        mockReset = reset;
    },
}));

const mockedSearchBarDropdownAirportsComponent = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownAirports/SearchBarDropdownAirports', () => ({
    __esModule: true,
    default: ({ onClose, onClear, setOrigins, onAddAirport, onRemoveAirport, ...props }) => {
        mockedSearchBarDropdownAirportsComponent(props);

        return (
            <div data-tid='searchbar-dropdown-airports'>
                <button onClick={onClose}>onClose</button>
                <button onClick={onClear}>onClear</button>
                <button onClick={setOrigins}>setOrigins</button>
                <button onClick={onAddAirport}>onAddAirport</button>
                <button onClick={onRemoveAirport}>onRemoveAirport</button>
            </div>
        );
    },
}));

const mockedSearchBarErrorMessageComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarErrorMessage/SearchBarErrorMessage',
    () => ({
        __esModule: true,
        default: props => {
            mockedSearchBarErrorMessageComponent(props);

            return <div data-tid='search-bar-error-message' />;
        },
    }),
);

jest.mock('frontend/components/icons/PlainDeparture', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-plain-departure' />,
}));

const mockedSearchbarInputComponent = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput', () => ({
    __esModule: true,
    default: props => {
        mockedSearchbarInputComponent(props);
        const {
            clickOnListButton,
            onFocus,
            id,
            onType,
            value,
            icon,
            onClearButtonClick,
            onKeyDown,
            inputRef,
            onInputBlur,
            onClick,
        } = props;

        return (
            <div data-tid={id}>
                <input
                    onFocus={onFocus}
                    onChange={e => onType(e.target.value)}
                    onInput={onType}
                    value={value}
                    onKeyDown={onKeyDown}
                    ref={inputRef}
                    onBlur={onInputBlur}
                    onClick={onClick}
                />
                {icon}
                <button data-tid={`${id}-clear-button`} onClick={onClearButtonClick} />
                <button data-tid={`${id}-list-button`} onClick={clickOnListButton} />
            </div>
        );
    },
}));

const mockedSearchBarAnimatedDropdownComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarAnimatedDropdown/SearchBarAnimatedDropdown',
    () => ({
        __esModule: true,
        default: ({ children, ...props }) => {
            mockedSearchBarAnimatedDropdownComponent(props);

            return <div data-tid='search-bar-animated-dropdown'>{children}</div>;
        },
    }),
);

const mockDrawerComponentComponent = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDrawerComponentComponent(props);

        return <div data-tid='drawer'>{children}</div>;
    },
}));

const mockedSearchBarSuggestionsPopupComponent = jest.fn();
const mockSearchBarSuggestionsPopupSelectedCodes = ['code1', 'code2'];
jest.mock('frontend/components/common/SearchBarSuggestionsPopup/SearchBarSuggestionsPopup', () => ({
    ...jest.requireActual('frontend/components/common/SearchBarSuggestionsPopup/SearchBarSuggestionsPopup'),
    __esModule: true,
    default: ({ onSelect, resetHighlightedIdx, ...props }) => {
        mockedSearchBarSuggestionsPopupComponent(props);

        return (
            <div data-tid='searchbar-suggestions-popup'>
                <button
                    onClick={() =>
                        onSelect(mockSearchBarSuggestionsPopupSelectedCodes, mockSearchBarSuggestionsPopupSelectedPlace)
                    }
                >
                    onSelect
                </button>
                <button onClick={resetHighlightedIdx}>resetHighlightedIdx</button>
            </div>
        );
    },
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

let mockProps: ISearchBarFromContentProps;
let mockStores: TStores;
let mockLocalStore;

const mocktrackSearchPodFromSuggestionClick = jest.fn();

const createProps = (): ISearchBarFromContentProps => ({
    changeSelectedDropdown: jest.fn(),
    countries: [],
    searchBarRef: React.createRef(),
    selectedDropdown: SearchBarDropdown.From,
    setIsBodyScrollLockedViaBlur: jest.fn(),
});

describe('<SearchBarFromContent />', () => {
    beforeEach(() => {
        mockUseMobileViewport = false;
        mockProps = createProps();
        mockStores = createMockStores({
            marketStore: { marketCode: MarketCode.UK },
            layoutStore: {
                isPromoPage: false,
            },
            searchStore: {
                hasErrorInField: jest.fn(() => false),
                searchFrom: {
                    displayValue: { main: 'London', add: '' },
                    availableOriginsCodes: null,
                    origins: ['code'],
                    onClearOrigins: jest.fn(),
                    clearOriginFromGeo: jest.fn(),
                    onAddOrigin: jest.fn(),
                    setOrigins: jest.fn(),
                    onRemoveOrigin: jest.fn(),
                },
            },
            trackingStore: {
                searchPod: {
                    trackSearchPodFromSuggestionClick: mocktrackSearchPodFromSuggestionClick,
                },
            },
        });
        hasBlockedPlaces = true;
        mockLocalStore = createMockLocalStore();
    });

    it('should render with opened dropdown with value in input from store', () => {
        render(<SearchBarFromContent {...mockProps} />);

        const heightAnimatedContainer = screen.getByTestId('search-bar-animated-dropdown');

        expect(screen.getByTestId('search-from')).toBeInTheDocument();
        expect(heightAnimatedContainer).toBeInTheDocument();
        expect(within(heightAnimatedContainer).getByTestId('searchbar-dropdown-airports')).toBeInTheDocument();
        expect(screen.getByTestId('icon-plain-departure')).toBeInTheDocument();
        expect(screen.getByTestId('search-from').querySelector('input')).toHaveValue('London');
        expect(mockedSearchbarInputComponent).toHaveBeenCalledWith({
            hidePlaceholder: true,
            isError: false,
            showClearButton: true,
            label: SitecoreDictionary.GlobalsLabelsFrom,
            placeholder: mockLocalStore.fields.FromFieldPlaceholder.value,
            ariaDescription: mockLocalStore.fields.FromFieldAriaDescription.value,
            dropdownToggleLabel: mockLocalStore.fields.FromFieldDropdownToggle.value,
            isEditable: true,
            id: 'search-from',
            value: 'London',
            icon: expect.anything(),
            clickOnListButton: expect.any(Function),
            onClearButtonClick: expect.any(Function),
            onType: expect.any(Function),
            onKeyDown: expect.any(Function),
            onFocus: expect.any(Function),
            onClick: expect.any(Function),
            inputRef: expect.any(Object),
            isInputHighlighted: false,
        });
        expect(mockedSearchBarErrorMessageComponent).toHaveBeenCalledWith({
            field: SearchBarDropdown.From,
            withDescription: true,
            isActive: false,
        });
        expect(mockedSearchBarDropdownAirportsComponent).toHaveBeenLastCalledWith({
            id: 'search-from-dd',
            countries: mockProps.countries,
            airports: mockStores.searchStore.searchFrom.origins,
            isDialogRole: true,
        });
        expect(mockedSearchBarSuggestionsPopupComponent).not.toHaveBeenCalled();
    });

    it('should hide placeholder when value from store is loaded but user started interacting with input', async () => {
        mockProps.selectedDropdown = null;
        mockStores.searchStore.searchFrom.displayValue = { main: '', add: '' };

        const { rerender } = render(<SearchBarFromContent {...mockProps} />);

        const searchFromInput = screen.getByTestId('search-from').querySelector('input');
        await userEvent.type(searchFromInput!, 'Bristol');

        mockStores.searchStore.searchFrom.displayValue.main = 'London';
        rerender(<SearchBarFromContent {...mockProps} />);

        expect(mockedSearchbarInputComponent).toHaveBeenLastCalledWith(
            expect.objectContaining({
                hidePlaceholder: true,
            }),
        );
    });

    it('should set focus on input and close suggestion popup when trigger SearchBarInput onClearButtonClick prop', async () => {
        render(<SearchBarFromContent {...mockProps} />);

        const searchFromInput = screen.getByTestId('search-from').querySelector('input');
        await userEvent.type(searchFromInput!, 'Bristol');

        expect(screen.getByTestId('searchbar-suggestions-popup')).toBeInTheDocument();

        await userEvent.click(screen.getByTestId('search-from-clear-button'));

        expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
        expect(searchFromInput).toHaveFocus();
    });

    it('should show correct value', async () => {
        mockProps.selectedDropdown = null;

        render(<SearchBarFromContent {...mockProps} />);

        const input = screen.getByTestId('search-from').querySelector('input');

        expect(input).toHaveValue('London');

        await userEvent.click(screen.getByTestId('search-from-clear-button'));

        await waitFor(() => {
            expect(input).toHaveValue('');
        });

        mockReset();

        await waitFor(() => {
            expect(input).toHaveValue('London');
        });
    });

    describe('Suggestion popup', () => {
        it('should render SearchBarSuggestionsPopup when user type in input', async () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            await userEvent.type(searchFromInput!, 'Bristol');

            expect(mockedSearchBarSuggestionsPopupComponent).toHaveBeenCalledWith({
                places: mockFilteredPlaces,
                type: SearchBarSuggestionsPopupType.Row,
                filterValue: 'Bristol',
                availableCodes: mockStores.searchStore.searchFrom.availableOriginsCodes,
                parentHtmlElement: mockProps.searchBarRef,
                highlightedIdx: mockPopupItemHighlightedIdx,
                hasBlockedPlaces: true,
            });
            expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    hidePlaceholder: true,
                    value: 'Bristol',
                }),
            );
        });

        it('should NOT show SearchBarSuggestionsPopup when typed not enough symbols', async () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            await userEvent.type(searchFromInput!, 'Br');

            expect(mockedSearchBarSuggestionsPopupComponent).not.toHaveBeenCalled();
        });

        it('should close SearchBarSuggestionsPopup when user start type and click clear button', async () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            await userEvent.type(searchFromInput!, 'Bristol');
            await userEvent.click(screen.getByTestId('search-from-clear-button'));

            expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
        });

        it('should clear selected origins when user click on clear', async () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');

            expect(searchFromInput).toHaveValue('London');

            await userEvent.click(screen.getByTestId('search-from-clear-button'));

            expect(mockStores.searchStore.searchFrom.onClearOrigins).toHaveBeenCalled();
            expect(mockStores.searchStore.searchFrom.clearOriginFromGeo).toHaveBeenCalled();
            expect(searchFromInput).toHaveValue('');
        });

        it('should call resetHighlightedIdx from useSuggestionsPopupNavigation when trigger SearchBarSuggestionsPopup resetHighlightedIdx prop', async () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            await userEvent.type(searchFromInput!, 'Bristol');

            const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
            expect(suggestionPopup).toBeInTheDocument();

            fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'resetHighlightedIdx' }));

            expect(mockResetHighlightedIdx).toHaveBeenCalled();
        });

        it('should call setOrigins & drawerApplyCancelClick and remove focus from input when trigger SearchBarSuggestionsPopup onSelect prop', async () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            await userEvent.type(searchFromInput!, 'Bristol');

            const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
            expect(suggestionPopup).toBeInTheDocument();
            expect(searchFromInput).toHaveFocus();

            fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'onSelect' }));

            expect(mockStores.searchStore.searchFrom.setOrigins).toHaveBeenCalledWith(
                mockSearchBarSuggestionsPopupSelectedCodes,
            );
            expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
            expect(searchFromInput).not.toHaveFocus();
            expect(mocktrackSearchPodFromSuggestionClick).toHaveBeenCalledWith(
                mockSearchBarSuggestionsPopupSelectedPlace,
                'Bristol',
            );
        });

        it('should call reset when clicking outside interactableFieldRef and conditions are met', async () => {
            mockProps.selectedDropdown = null;
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            await userEvent.type(searchFromInput!, 'Bristol');

            await screen.findByTestId('searchbar-suggestions-popup');

            mockReset();

            await waitFor(() => {
                expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
            });
        });

        it('should close suggestion popup by click on list button', async () => {
            mockProps.selectedDropdown = null;
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            await userEvent.type(searchFromInput!, 'Bristol');

            expect(screen.getByTestId('searchbar-suggestions-popup')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('search-from-list-button'));

            expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
        });
    });

    describe('Dropdown', () => {
        it('should call changeSelectedDropdown to close dropdown', () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchBarDropdownTo = screen.getByTestId('searchbar-dropdown-airports');
            fireEvent.click(within(searchBarDropdownTo).getByRole('button', { name: 'onClose' }));

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        });

        it('should trigger SearchBarDropdownAirports setOrigins prop', () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchBarDropdownTo = screen.getByTestId('searchbar-dropdown-airports');
            fireEvent.click(within(searchBarDropdownTo).getByRole('button', { name: 'setOrigins' }));

            expect(mockStores.searchStore.searchFrom.setOrigins).toHaveBeenCalled();
        });

        it('should trigger SearchBarDropdownAirports onAddAirport prop', () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchBarDropdownTo = screen.getByTestId('searchbar-dropdown-airports');
            fireEvent.click(within(searchBarDropdownTo).getByRole('button', { name: 'onAddAirport' }));

            expect(mockStores.searchStore.searchFrom.onAddOrigin).toHaveBeenCalled();
        });

        it('should call onClearOrigins and clearOriginFromGeo when click on clear dropdown', () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchBarDropdownTo = screen.getByTestId('searchbar-dropdown-airports');
            fireEvent.click(within(searchBarDropdownTo).getByRole('button', { name: 'onClear' }));

            expect(mockStores.searchStore.searchFrom.onClearOrigins).toHaveBeenCalled();
            expect(mockStores.searchStore.searchFrom.clearOriginFromGeo).toHaveBeenCalled();
        });

        it('should trigger SearchBarDropdownAirports onRemoveAirport prop', () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchBarDropdownTo = screen.getByTestId('searchbar-dropdown-airports');
            fireEvent.click(within(searchBarDropdownTo).getByRole('button', { name: 'onRemoveAirport' }));

            expect(mockStores.searchStore.searchFrom.onRemoveOrigin).toHaveBeenCalled();
        });

        it('should close dropdown when user click on input', () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            fireEvent.focus(searchFromInput!);

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        });

        it('should open dropdown by click on list button', () => {
            mockProps.selectedDropdown = null;
            render(<SearchBarFromContent {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-from-list-button'));

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(SearchBarDropdown.From);
        });

        it('should close dropdown by click on list button', () => {
            mockProps.selectedDropdown = SearchBarDropdown.From;
            render(<SearchBarFromContent {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-from-list-button'));

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        });

        describe('should control displaying placeholder by clicking on list button only when origins is empty', () => {
            it('should hide placeholder when open dropdown', () => {
                mockStores.searchStore.searchFrom.origins = [];
                mockProps.selectedDropdown = null;
                render(<SearchBarFromContent {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-from-list-button'));

                expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        hidePlaceholder: true,
                    }),
                );
            });

            it('should show placeholder when close dropdown', () => {
                mockStores.searchStore.searchFrom.origins = [];
                mockProps.selectedDropdown = SearchBarDropdown.From;
                render(<SearchBarFromContent {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-from-list-button'));

                expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        hidePlaceholder: false,
                    }),
                );
            });

            it('should NOT show placeholder when close dropdown if origins are selected', () => {
                mockProps.selectedDropdown = SearchBarDropdown.From;
                render(<SearchBarFromContent {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-from-list-button'));

                expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        hidePlaceholder: true,
                    }),
                );
            });
        });

        it('should NOT call changeSelectedDropdown on reset when dropdown is closed on outside click (it can provide async problems with opening next dropdown by using keyboard)', async () => {
            mockProps.selectedDropdown = null;
            render(<SearchBarFromContent {...mockProps} />);

            mockReset();

            expect(mockProps.changeSelectedDropdown).not.toHaveBeenCalled();
        });

        it('should call changeSelectedDropdown on reset when dropdown is opened on outside click', async () => {
            render(<SearchBarFromContent {...mockProps} />);

            mockReset();

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalled();
        });
    });

    describe('mobile view', () => {
        beforeEach(() => {
            mockUseMobileViewport = true;
        });

        it('should render SearchBarDropdownWhen inside Drawer on mobile', () => {
            render(<SearchBarFromContent {...mockProps} />);

            const drawer = screen.getByTestId('drawer');

            expect(screen.getByTestId('from-field-box')).toBeInTheDocument();
            expect(screen.getByTestId('search-from')).toBeInTheDocument();
            expect(drawer).toBeInTheDocument();
            expect(within(drawer).getByTestId('searchbar-dropdown-airports')).toBeInTheDocument();
        });

        it('should render wrapper for Airports dropdown with nothing-selected classname when origins is an empty array', () => {
            mockStores.searchStore.searchFrom.origins = [];

            const { container } = render(<SearchBarFromContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr')).toHaveClass('search-bar__dd-wr--nothing-selected');
        });

        it('should render wrapper for Airports dropdown with nothing-selected classname when origins is undefined', () => {
            mockStores.searchStore.searchFrom.origins = undefined;

            const { container } = render(<SearchBarFromContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr')).toHaveClass('search-bar__dd-wr--nothing-selected');
        });

        it('should render wrapper for Airports dropdown without nothing-selected classname when origins is non empty array', () => {
            mockStores.searchStore.searchFrom.origins = ['code'];

            const { container } = render(<SearchBarFromContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr')).not.toHaveClass(
                'search-bar__dd-wr--nothing-selected',
            );
        });

        it('should call changeSelectedDropdown to close dropdown when trigger SearchBarDropdownAirports onClose prop', async () => {
            render(<SearchBarFromContent {...mockProps} />);

            const searchBarDropdownTo = screen.getByTestId('searchbar-dropdown-airports');
            fireEvent.click(within(searchBarDropdownTo).getByRole('button', { name: 'onClose' }));

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        });

        it('should open dropdown on input click', () => {
            mockProps.selectedDropdown = null;

            render(<SearchBarFromContent {...mockProps} />);
            const searchFromInput = screen.getByTestId('search-from').querySelector('input');
            fireEvent.focus(searchFromInput!);

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(SearchBarDropdown.From);
            const mobileInput = screen.getByTestId('search-from--drawer').querySelector('input');
            expect(mobileInput).toHaveFocus();
        });

        it('should close dropdown when airport is selected from suggestion popup', async () => {
            mockProps.selectedDropdown = SearchBarDropdown.From;

            render(<SearchBarFromContent {...mockProps} />);
            const mobileInput = screen.getByTestId('search-from--drawer').querySelector('input');
            await userEvent.type(mobileInput!, 'Bristol');

            const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
            expect(suggestionPopup).toBeInTheDocument();
            fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'onSelect' }));

            expect(mockStores.searchStore.searchFrom.setOrigins).toHaveBeenCalledWith(
                mockSearchBarSuggestionsPopupSelectedCodes,
            );
            expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
            expect(mocktrackSearchPodFromSuggestionClick).toHaveBeenCalledWith(
                mockSearchBarSuggestionsPopupSelectedPlace,
                'Bristol',
            );
        });

        it('should show correct value', async () => {
            mockProps.selectedDropdown = SearchBarDropdown.From;

            render(<SearchBarFromContent {...mockProps} />);
            const mobileInput = screen.getByTestId('search-from--drawer').querySelector('input');

            expect(mobileInput).toHaveValue('London');

            await userEvent.type(mobileInput!, 'Bristol');

            expect(mobileInput).toHaveValue('Bristol');

            fireEvent.blur(mobileInput!);

            expect(mobileInput).toHaveValue('London');
        });
    });

    describe('Tracking', () => {
        let trackEventWithParamsMock: jest.Mock;

        const baseEventParams = {
            eventAction: SearchPodEventActions.FromFieldClick,
            eventCategory: EventCategories.SearchPod,
            eventType: EventTypes.Interaction,
            eventValue: null,
        };

        const baseGenericValues = {
            genericValue1: SearchPodGenericValues.MainFromField,
            genericValue2: null,
            genericValue3: null,
            genericValue4: null,
            destinationUrl: null,
        };

        const mainInputFocusTrackingParams = {
            eventType: EventTypes.GenericEvent,
            eventParams: { ...baseEventParams, eventLabel: null },
            genericValues: baseGenericValues,
        };

        const burgerMenuTrackingParams = {
            eventType: EventTypes.GenericEvent,
            eventParams: { ...baseEventParams, eventLabel: SearchPodEventLabels.BurgerMenu },
            genericValues: baseGenericValues,
        };

        const createClearTrackingParams = (displayValue: string) => ({
            eventType: EventTypes.GenericEvent,
            eventParams: { ...baseEventParams, eventLabel: null },
            genericValues: {
                ...baseGenericValues,
                genericValue2: SearchPodGenericValues.Clear,
                genericValue3: displayValue,
            },
        });

        beforeEach(() => {
            trackEventWithParamsMock = jest.fn();
            mockStores.trackingStore.trackEventWithParams = trackEventWithParamsMock;
        });

        describe('Input interaction tracking', () => {
            it('should NOT call trackEventWithParams when main input is focused on desktop', () => {
                mockUseMobileViewport = false;
                mockProps.selectedDropdown = null;

                render(<SearchBarFromContent {...mockProps} />);

                const searchFromInput = screen.getByTestId('search-from').querySelector('input');
                fireEvent.focus(searchFromInput!);

                expect(trackEventWithParamsMock).not.toHaveBeenCalled();
            });

            it('should NOT call trackEventWithParams when main input is focused on mobile', () => {
                mockUseMobileViewport = true;
                mockProps.selectedDropdown = null;

                render(<SearchBarFromContent {...mockProps} />);

                const searchFromInput = screen.getByTestId('search-from').querySelector('input');
                fireEvent.focus(searchFromInput!);

                expect(trackEventWithParamsMock).not.toHaveBeenCalled();
            });

            it('should call trackEventWithParams when main input is clicked on desktop', () => {
                mockUseMobileViewport = false;
                mockProps.selectedDropdown = null;

                render(<SearchBarFromContent {...mockProps} />);

                const searchFromInput = screen.getByTestId('search-from').querySelector('input');
                fireEvent.click(searchFromInput!);

                expect(trackEventWithParamsMock).toHaveBeenCalledWith(
                    mainInputFocusTrackingParams.eventType,
                    mainInputFocusTrackingParams.eventParams,
                    mainInputFocusTrackingParams.genericValues,
                );
            });

            it('should call trackEventWithParams when mobile input is clicked', () => {
                mockUseMobileViewport = true;
                mockProps.selectedDropdown = SearchBarDropdown.From;

                render(<SearchBarFromContent {...mockProps} />);

                const mobileInput = screen.getByTestId('search-from--drawer').querySelector('input');
                fireEvent.click(mobileInput!);

                expect(trackEventWithParamsMock).toHaveBeenCalledWith(
                    mainInputFocusTrackingParams.eventType,
                    mainInputFocusTrackingParams.eventParams,
                    mainInputFocusTrackingParams.genericValues,
                );
            });
        });

        describe('Burger menu click tracking', () => {
            it('should call trackEventWithParams when burger menu is clicked', () => {
                mockUseMobileViewport = false;
                mockProps.selectedDropdown = null;

                render(<SearchBarFromContent {...mockProps} />);

                const listButton = screen.getByTestId('search-from-list-button');
                fireEvent.click(listButton);

                expect(trackEventWithParamsMock).toHaveBeenCalledWith(
                    burgerMenuTrackingParams.eventType,
                    burgerMenuTrackingParams.eventParams,
                    burgerMenuTrackingParams.genericValues,
                );
            });

            it('should track burger menu click even when dropdown is already open', () => {
                mockUseMobileViewport = false;
                mockProps.selectedDropdown = SearchBarDropdown.From;

                render(<SearchBarFromContent {...mockProps} />);

                const listButton = screen.getByTestId('search-from-list-button');
                fireEvent.click(listButton);

                expect(trackEventWithParamsMock).toHaveBeenCalledWith(
                    burgerMenuTrackingParams.eventType,
                    burgerMenuTrackingParams.eventParams,
                    burgerMenuTrackingParams.genericValues,
                );
            });
        });

        describe('Clear button tracking', () => {
            it('should call trackEventWithParams when clear button is clicked on desktop', async () => {
                mockUseMobileViewport = false;

                render(<SearchBarFromContent {...mockProps} />);

                const clearButton = screen.getByTestId('search-from-clear-button');
                fireEvent.click(clearButton);

                const clearTrackingParams = createClearTrackingParams('London');
                expect(trackEventWithParamsMock).toHaveBeenCalledWith(
                    clearTrackingParams.eventType,
                    clearTrackingParams.eventParams,
                    clearTrackingParams.genericValues,
                );
            });

            it('should call trackEventWithParams when clear button is clicked on mobile', async () => {
                mockUseMobileViewport = true;
                mockProps.selectedDropdown = SearchBarDropdown.From;

                render(<SearchBarFromContent {...mockProps} />);

                // In mobile view, clear is done through the dropdown's onClear
                const searchBarDropdownAirports = screen.getByTestId('searchbar-dropdown-airports');
                fireEvent.click(within(searchBarDropdownAirports).getByRole('button', { name: 'onClear' }));

                expect(mockStores.searchStore.searchFrom.onClearOrigins).toHaveBeenCalled();
                expect(mockStores.searchStore.searchFrom.clearOriginFromGeo).toHaveBeenCalled();
            });

            it('should track clear with empty string when no value exists', () => {
                mockUseMobileViewport = false;
                mockStores.searchStore.searchFrom.displayValue = { main: '', add: '' };

                render(<SearchBarFromContent {...mockProps} />);

                const clearButton = screen.getByTestId('search-from-clear-button');
                fireEvent.click(clearButton);

                const clearTrackingParams = createClearTrackingParams('');
                expect(trackEventWithParamsMock).toHaveBeenCalledWith(
                    clearTrackingParams.eventType,
                    clearTrackingParams.eventParams,
                    clearTrackingParams.genericValues,
                );
            });
        });

        describe('Multiple tracking calls', () => {
            it('should track multiple interactions in sequence', async () => {
                mockUseMobileViewport = false;
                mockProps.selectedDropdown = null;

                render(<SearchBarFromContent {...mockProps} />);

                // First interaction: focus input (should NOT track)
                const searchFromInput = screen.getByTestId('search-from').querySelector('input');
                fireEvent.focus(searchFromInput!);

                expect(trackEventWithParamsMock).toHaveBeenCalledTimes(0);

                // Second interaction: click input (should track)
                fireEvent.click(searchFromInput!);

                expect(trackEventWithParamsMock).toHaveBeenCalledTimes(1);

                // Third interaction: click burger menu
                const listButton = screen.getByTestId('search-from-list-button');
                fireEvent.click(listButton);

                expect(trackEventWithParamsMock).toHaveBeenCalledTimes(2);

                // Reset to clear previous tracking calls
                trackEventWithParamsMock.mockClear();

                // Fourth interaction: click clear (triggers only 1 call: clear)
                const clearButton = screen.getByTestId('search-from-clear-button');
                fireEvent.click(clearButton);

                // Clear button triggers only clear tracking (no longer triggers focus tracking)
                expect(trackEventWithParamsMock).toHaveBeenCalledTimes(1);

                // Verify the clear tracking call
                expect(trackEventWithParamsMock).toHaveBeenCalledWith(
                    EventTypes.GenericEvent,
                    expect.objectContaining({
                        eventAction: SearchPodEventActions.FromFieldClick,
                    }),
                    expect.objectContaining({
                        genericValue2: SearchPodGenericValues.Clear,
                    }),
                );
            });
        });
    });
});
