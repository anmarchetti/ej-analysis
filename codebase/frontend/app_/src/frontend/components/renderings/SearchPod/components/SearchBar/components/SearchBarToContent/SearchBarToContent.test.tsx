import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { IDestination } from 'models/data/IDestination';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SiteSettings from 'models/enum/SiteSettings';
import { SearchBarSuggestionsPopupType } from 'frontend/components/common/SearchBarSuggestionsPopup/SearchBarSuggestionsPopup';
import SearchBarToContent, {
    ISearchBarToContentProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/SearchBarToContent';
import { ISearchPodDataFields } from 'frontend/components/renderings/SearchPod/models';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFilteredPlaces = [{ name: 'filtered', code: 'filter1' }];
jest.mock('frontend/utils/search/searchPod.utils', () => ({
    ...jest.requireActual('frontend/utils/search/searchPod.utils'),
    __esModule: true,
    getFilteredDestinations: jest.fn(() => mockFilteredPlaces),
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

const mockedSearchBarDropdownToComponent = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownTo/SearchBarDropdownTo', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        default: forwardRef(({ onClose, onClear, ...props }: any, ref: any) => {
            mockedSearchBarDropdownToComponent(props);

            return (
                <div data-tid='searchbar-dropdown-to' ref={ref}>
                    <button onClick={onClose}>onClose</button>
                </div>
            );
        }),
    };
});

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

jest.mock('frontend/components/icons/Shevron', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-shevron' />,
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
            onClick,
            onInputBlur,
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
                    onClick={onClick}
                    onBlur={onInputBlur}
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
                <button onClick={() => onSelect(mockSearchBarSuggestionsPopupSelectedCodes)}>onSelectMultiple</button>
                <button onClick={() => onSelect([mockSearchBarSuggestionsPopupSelectedCodes[0]])}>onSelectOne</button>

                <button onClick={resetHighlightedIdx}>resetHighlightedIdx</button>
            </div>
        );
    },
}));

const mockedInspirationCalloutComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/components/InspirationCallout/InspirationCallout',
    () => ({
        ...jest.requireActual('./components/InspirationCallout/InspirationCallout'),
        __esModule: true,
        default: ({ onCancel, ...props }) => {
            mockedInspirationCalloutComponent(props);

            return (
                <div data-tid='inspiration-callout'>
                    <button onClick={onCancel}>onCancel</button>
                </div>
            );
        },
    }),
);

jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/components/SearchToHotelMessage/SearchToHotelMessage',
    () => ({
        __esModule: true,
        default: ({ onApplySearchToHotel, onClose }) => (
            <div data-tid='search-to-hotel-message'>
                <button onClick={onClose}>onClose</button>
                <button onClick={onApplySearchToHotel}>onApplySearchToHotel</button>
            </div>
        ),
    }),
);

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

let mockReset;
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/hooks/useInputAreaFocus', () => ({
    __esModule: true,
    default: ({ reset }) => {
        mockReset = reset;
    },
}));

let mockProps: ISearchBarToContentProps;
let mockStores: TStores;
let mockLocalStore: { fields: ISearchPodDataFields };

const createProps = (): ISearchBarToContentProps => ({
    changeSelectedDropdown: jest.fn(),
    searchBarRef: React.createRef(),
    selectedDropdown: SearchBarDropdown.To,
    setIsBodyScrollLockedViaBlur: jest.fn(),
});

describe('<SearchBarToContent />', () => {
    beforeEach(() => {
        mockUseMobileViewport = false;
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isHotelDetailsBookPage: false,
                isTradePortal: false,
            },
            searchStore: {
                hasErrorInField: jest.fn(() => false),
                isHotelDetailsBookPage: false,
                isHotelBookSelectedDestination: false,
                searchFrom: {
                    availableOriginsCodes: null,
                },
                searchTo: {
                    isDestinationsSearchLoading: false,
                    selectedDestinationCodes: ['code'],
                    displayValue: { main: 'Italy', add: '' },
                    searchTypeAheadDestinations: jest.fn(),
                    clearDestinations: jest.fn(),
                    typeAheadDestinations: null,
                    selectSingleDestination: jest.fn(),
                    addDestination: jest.fn(),
                },
            },
            trackingStore: {
                searchPod: {
                    trackSearchPodToSuggestionClick: jest.fn(),
                    trackToClearClick: jest.fn(),
                    trackToInputClick: jest.fn(),
                    trackToBurgerMenuClick: jest.fn(),
                },
            },
        });
        mockLocalStore = createMockLocalStore();
    });

    it('should render with opened dropdown with value in input from store', () => {
        render(<SearchBarToContent {...mockProps} />);

        const heightAnimatedContainer = screen.getByTestId('search-bar-animated-dropdown');

        expect(screen.getByTestId('search-to')).toBeInTheDocument();
        expect(heightAnimatedContainer).toBeInTheDocument();
        expect(within(heightAnimatedContainer).getByTestId('searchbar-dropdown-to')).toBeInTheDocument();
        expect(screen.getByTestId('icon-shevron')).toBeInTheDocument();
        expect(screen.getByTestId('search-to').querySelector('input')).toHaveValue('Italy');
        expect(mockedSearchbarInputComponent).toHaveBeenCalledWith({
            hidePlaceholder: true,
            isError: false,
            showClearButton: true,
            label: mockLocalStore.fields.ToFieldLabel.value,
            placeholder: mockLocalStore.fields.ToFieldPlaceholder.value,
            ariaDescription: mockLocalStore.fields.ToFieldAriaDescription.value,
            dropdownToggleLabel: mockLocalStore.fields.ToFieldDropdownToggle.value,
            isEditable: true,
            id: 'search-to',
            value: 'Italy',
            icon: expect.anything(),
            clickOnListButton: expect.any(Function),
            onClearButtonClick: expect.any(Function),
            onClick: expect.any(Function),
            onType: expect.any(Function),
            onKeyDown: expect.any(Function),
            onFocus: expect.any(Function),
            inputRef: expect.any(Object),
            isInputHighlighted: false,
        });
        expect(mockedSearchBarErrorMessageComponent).toHaveBeenCalledWith({
            field: SearchBarDropdown.To,
            isActive: false,
        });
    });

    it('should show correct value', async () => {
        mockProps.selectedDropdown = null;

        render(<SearchBarToContent {...mockProps} />);

        const searchToInput = screen.getByTestId('search-to').querySelector('input');

        expect(searchToInput).toHaveValue('Italy');

        // clear remove value from store
        await userEvent.click(screen.getByTestId('search-to-clear-button'));

        await waitFor(() => {
            expect(searchToInput).toHaveValue('');
        });

        // and if user after clear select destination from dropdown, input should lost focus and show value from store
        mockReset();

        await waitFor(() => {
            expect(searchToInput).toHaveValue('Italy');
        });
    });

    describe('SearchToHotelMessage', () => {
        beforeEach(() => {
            mockProps.selectedDropdown = null;
            mockStores.layoutStore.getSetting = setting =>
                setting === SiteSettings.IsSearchToHotelMessageEnabled ? '1' : '';
            Object.defineProperty(mockStores.layoutStore, 'isHotelDetailsBookPage', {
                get: jest.fn().mockReturnValue(true),
            });
            Object.defineProperty(mockStores.searchStore, 'isHotelBookSelectedDestination', {
                get: jest.fn().mockReturnValue(false),
            });
        });

        it('should render SearchToHotelMessage on mound on desktop', () => {
            render(<SearchBarToContent {...mockProps} />);

            expect(screen.getByTestId('search-to-hotel-message')).toBeInTheDocument();
        });

        it('should close SearchToHotelMessage when click on input', async () => {
            render(<SearchBarToContent {...mockProps} />);

            expect(screen.getByTestId('search-to-hotel-message')).toBeInTheDocument();

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.click(searchToInput!);

            expect(screen.queryByTestId('search-to-hotel-message')).not.toBeInTheDocument();
        });

        it('should render SearchToHotelMessage on mobile when open drawer (not on mount)', async () => {
            mockUseMobileViewport = true;

            render(<SearchBarToContent {...mockProps} />);

            expect(screen.queryByTestId('search-to-hotel-message')).not.toBeInTheDocument();

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.click(searchToInput!);

            expect(screen.getByTestId('search-to-hotel-message')).toBeInTheDocument();
        });

        it('should NOT render SearchToHotelMessage when selectedDropdown is defined', () => {
            mockProps.selectedDropdown = SearchBarDropdown.To;

            render(<SearchBarToContent {...mockProps} />);

            expect(screen.queryByTestId('search-to-hotel-message')).not.toBeInTheDocument();
        });

        it('should NOT render SearchToHotelMessage when isHotelDetailsBookPage is false', () => {
            jest.spyOn(mockStores.layoutStore, 'isHotelDetailsBookPage', 'get').mockReturnValue(false);

            render(<SearchBarToContent {...mockProps} />);

            expect(screen.queryByTestId('search-to-hotel-message')).not.toBeInTheDocument();
        });

        it('should NOT render SearchToHotelMessage when isHotelBookSelectedDestination is true', () => {
            jest.spyOn(mockStores.searchStore, 'isHotelBookSelectedDestination', 'get').mockReturnValue(true);

            render(<SearchBarToContent {...mockProps} />);

            expect(screen.queryByTestId('search-to-hotel-message')).not.toBeInTheDocument();
        });

        it('should NOT render SearchToHotelMessage when turned off in settings', () => {
            mockStores.layoutStore.getSetting = setting =>
                setting === SiteSettings.IsSearchToHotelMessageEnabled ? '' : '1';

            render(<SearchBarToContent {...mockProps} />);

            expect(screen.queryByTestId('search-to-hotel-message')).not.toBeInTheDocument();
        });
    });

    describe('click on list button', () => {
        it('should close suggestion popup when click on list button', async () => {
            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.type(searchToInput!, 'Spain');

            expect(screen.getByTestId('searchbar-suggestions-popup')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('search-to-list-button'));

            expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
        });

        it('should close inspiration callout when click on list button', async () => {
            mockStores.layoutStore.getSetting = setting =>
                setting === SiteSettings.IsTooltipOnSearchPodDesktopEnabled ? '1' : '';

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            fireEvent.focus(searchToInput!);

            expect(screen.getByTestId('inspiration-callout')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('search-to-list-button'));

            expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();
        });

        it('should close dropdown when click on list button', async () => {
            render(<SearchBarToContent {...mockProps} />);

            await userEvent.click(screen.getByTestId('search-to-list-button'));

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
            expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isInputHighlighted: false,
                }),
            );
        });

        it('should open dropdown when click on list button', async () => {
            mockProps.selectedDropdown = null;
            render(<SearchBarToContent {...mockProps} />);

            await userEvent.click(screen.getByTestId('search-to-list-button'));

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(SearchBarDropdown.To);
            expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isInputHighlighted: true,
                }),
            );
        });

        describe('should control displaying placeholder by clicking on list button only when selectedDestinationCodes is empty', () => {
            it('should hide placeholder when open dropdown', () => {
                mockStores.searchStore.searchTo.selectedDestinationCodes = [];
                mockProps.selectedDropdown = null;
                render(<SearchBarToContent {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-to-list-button'));

                expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        hidePlaceholder: true,
                    }),
                );
            });

            it('should show placeholder when close dropdown', () => {
                mockStores.searchStore.searchTo.selectedDestinationCodes = [];
                mockStores.searchStore.searchTo.displayValue = { main: '', add: '' };
                mockProps.selectedDropdown = SearchBarDropdown.From;
                render(<SearchBarToContent {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-to-list-button'));

                expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        hidePlaceholder: false,
                    }),
                );
            });

            it('should NOT show placeholder when close dropdown if origins are selected', () => {
                mockProps.selectedDropdown = SearchBarDropdown.From;
                render(<SearchBarToContent {...mockProps} />);

                fireEvent.click(screen.getByTestId('search-to-list-button'));

                expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        hidePlaceholder: true,
                    }),
                );
            });
        });
    });

    it('should hide placeholder when value from store is loaded but user started interacting with input', async () => {
        mockProps.selectedDropdown = null;
        mockStores.searchStore.searchTo.selectedDestinationCodes = [];

        const { rerender } = render(<SearchBarToContent {...mockProps} />);

        const searchToInput = screen.getByTestId('search-to').querySelector('input');
        await userEvent.type(searchToInput!, 'Spain');

        mockStores.searchStore.searchTo.selectedDestinationCodes = ['TTT'];
        rerender(<SearchBarToContent {...mockProps} />);

        expect(mockedSearchbarInputComponent).toHaveBeenLastCalledWith(
            expect.objectContaining({
                hidePlaceholder: true,
            }),
        );
    });

    it('should NOT hide placeholder when no value from store and user do not interact with input', () => {
        mockProps.selectedDropdown = null;
        mockStores.searchStore.searchTo.selectedDestinationCodes = [];
        mockStores.searchStore.searchTo.displayValue = { main: '', add: '' };

        render(<SearchBarToContent {...mockProps} />);

        expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                hidePlaceholder: false,
            }),
        );
    });

    it('should set focus to input and close suggestion popup when trigger onClearButtonClick', async () => {
        render(<SearchBarToContent {...mockProps} />);

        const searchToInput = screen.getByTestId('search-to').querySelector('input');
        await userEvent.type(searchToInput!, 'Spain');

        expect(screen.getByTestId('searchbar-suggestions-popup')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('search-to-clear-button'));

        expect(searchToInput).toHaveFocus();
        expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
    });

    it('should clear selected destinations when user click on clear', async () => {
        render(<SearchBarToContent {...mockProps} />);

        const searchToInput = screen.getByTestId('search-to').querySelector('input');

        expect(searchToInput).toHaveValue('Italy');

        await userEvent.click(screen.getByTestId('search-to-clear-button'));

        expect(mockStores.searchStore.searchTo.clearDestinations).toHaveBeenCalled();
        expect(searchToInput).toHaveValue('');
    });

    it('should call SearchBarDropdownTo with expected props', () => {
        render(<SearchBarToContent {...mockProps} />);

        expect(mockedSearchBarDropdownToComponent).toHaveBeenLastCalledWith({
            id: 'search-to-dd',
            isDialogRole: true,
            title: mockLocalStore.fields.ToDropdownLabel.value,
        });
    });

    it('should call resetHighlightedIdx from useSuggestionsPopupNavigation when trigger SearchBarSuggestionsPopup resetHighlightedIdx prop', async () => {
        render(<SearchBarToContent {...mockProps} />);

        const searchToInput = screen.getByTestId('search-to').querySelector('input');
        await userEvent.type(searchToInput!, 'Spain');

        const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
        expect(suggestionPopup).toBeInTheDocument();

        fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'resetHighlightedIdx' }));

        expect(mockResetHighlightedIdx).toHaveBeenCalled();
    });

    it('should render SearchBarSuggestionsPopup with expected props', async () => {
        render(<SearchBarToContent {...mockProps} />);

        const searchToInput = screen.getByTestId('search-to').querySelector('input');
        await userEvent.type(searchToInput!, 'Spain');

        expect(mockedSearchBarSuggestionsPopupComponent).toHaveBeenCalledWith({
            places: mockFilteredPlaces,
            type: SearchBarSuggestionsPopupType.Multiline,
            filterValue: 'Spain',
            availableCodes: mockStores.searchStore.searchFrom.availableOriginsCodes,
            parentHtmlElement: mockProps.searchBarRef,
            highlightedIdx: mockPopupItemHighlightedIdx,
            isLoading: mockStores.searchStore.searchTo.isDestinationsSearchLoading,
        });
    });

    it('should NOT call changeSelectedDropdown on reset when dropdown is closed on outside click (it can provide async problems with opening next dropdown by using keyboard)', async () => {
        mockProps.selectedDropdown = null;
        render(<SearchBarToContent {...mockProps} />);

        mockReset();

        expect(mockProps.changeSelectedDropdown).not.toHaveBeenCalled();
    });

    it('should call changeSelectedDropdown on reset when dropdown is opened on outside click', async () => {
        render(<SearchBarToContent {...mockProps} />);

        mockReset();

        expect(mockProps.changeSelectedDropdown).toHaveBeenCalled();
    });

    describe('selectDestination', () => {
        it('should call selectSingleDestination when there are destinations in typeAheadDestinations with selected codes', async () => {
            mockStores.searchStore.searchTo.typeAheadDestinations = {
                destinations: [{ code: mockSearchBarSuggestionsPopupSelectedCodes[0] }] as IDestination[],
                page: 1,
                take: 1,
                total: 1,
            };

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.type(searchToInput!, 'Spain');

            const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
            expect(suggestionPopup).toBeInTheDocument();

            fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'onSelectMultiple' }));

            expect(mockStores.searchStore.searchTo.selectSingleDestination).toHaveBeenCalledWith(
                mockStores.searchStore.searchTo.typeAheadDestinations.destinations[0],
            );
            expect(suggestionPopup).not.toBeInTheDocument();
        });

        it('should close suggestion popup and not call selectSingleDestination when there is no destinations in typeAheadDestinations with selected codes', async () => {
            mockStores.searchStore.searchTo.typeAheadDestinations = {
                destinations: [{ code: 'random' }] as IDestination[],
                page: 1,
                take: 1,
                total: 1,
            };

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.type(searchToInput!, 'Spain');
            expect(searchToInput).toHaveFocus();

            const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
            expect(suggestionPopup).toBeInTheDocument();

            fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'onSelectMultiple' }));

            expect(mockStores.searchStore.searchTo.selectSingleDestination).not.toHaveBeenCalled();
            expect(suggestionPopup).not.toBeInTheDocument();
            expect(searchToInput).not.toHaveFocus();
        });

        it('should close suggestion popup and not call addDestination when call selectDestination with 1 code & giataCode is not defined', async () => {
            mockStores.searchStore.searchTo.typeAheadDestinations = {
                destinations: [{ code: mockSearchBarSuggestionsPopupSelectedCodes[0] }] as IDestination[],
                page: 1,
                take: 1,
                total: 1,
            };

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.type(searchToInput!, 'Spain');

            const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
            expect(suggestionPopup).toBeInTheDocument();

            fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'onSelectOne' }));

            expect(mockStores.searchStore.searchTo.addDestination).not.toHaveBeenCalled();
            expect(suggestionPopup).not.toBeInTheDocument();
        });

        it('should call addDestination and close suggestion popup when call selectDestination with 1 code & giataCode is defined', async () => {
            mockStores.searchStore.searchTo.typeAheadDestinations = {
                destinations: [
                    { code: mockSearchBarSuggestionsPopupSelectedCodes[0], giataCode: 'giata' },
                ] as IDestination[],
                page: 1,
                take: 1,
                total: 1,
            };

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.type(searchToInput!, 'Spain');

            const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
            expect(suggestionPopup).toBeInTheDocument();

            fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'onSelectOne' }));

            expect(mockStores.searchStore.searchTo.addDestination).toHaveBeenCalledWith(
                mockStores.searchStore.searchTo.typeAheadDestinations.destinations[0],
                false,
                true,
            );
            expect(suggestionPopup).not.toBeInTheDocument();
        });
    });

    it('should call changeSelectedDropdown to close dropdown when trigger onClose', () => {
        render(<SearchBarToContent {...mockProps} />);

        const searchBarDropdownTo = screen.getByTestId('searchbar-dropdown-to');
        fireEvent.click(within(searchBarDropdownTo).getByRole('button', { name: 'onClose' }));

        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
    });

    describe('mobile view', () => {
        beforeEach(() => {
            mockUseMobileViewport = true;
        });

        it('should render SearchBarDropdownWhen inside Drawer on mobile', () => {
            render(<SearchBarToContent {...mockProps} />);

            const drawer = screen.getByTestId('drawer');

            expect(screen.getByTestId('to-field-box')).toBeInTheDocument();
            expect(screen.getByTestId('search-to')).toBeInTheDocument();
            expect(drawer).toBeInTheDocument();
            expect(within(drawer).getByTestId('searchbar-dropdown-to')).toBeInTheDocument();
        });

        it('should render wrapper for To dropdown with nothing-selected classname when selectedDestinationCodes is an empty array', () => {
            mockStores.searchStore.searchTo.selectedDestinationCodes = [];

            const { container } = render(<SearchBarToContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr')).toHaveClass('search-bar__dd-wr--nothing-selected');
        });

        it('should render wrapper for To dropdown without nothing-selected classname when selectedDestinationCodes is non empty array', () => {
            mockStores.searchStore.searchTo.selectedDestinationCodes = ['code'];

            const { container } = render(<SearchBarToContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr')).not.toHaveClass(
                'search-bar__dd-wr--nothing-selected',
            );
        });

        it('should SearchBarDropdownTo with expected props', () => {
            render(<SearchBarToContent {...mockProps} />);

            expect(mockedSearchBarDropdownToComponent).toHaveBeenLastCalledWith({
                id: 'search-to-dd--drawer',
                title: mockLocalStore.fields.ToDropdownLabel.value,
            });
        });

        it('should show correct value', async () => {
            mockProps.selectedDropdown = SearchBarDropdown.To;

            render(<SearchBarToContent {...mockProps} />);

            const mobileInput = screen.getByTestId('search-to--drawer').querySelector('input');

            expect(mobileInput).toHaveValue('Italy');

            await userEvent.type(mobileInput!, 'Bristol');

            expect(mobileInput).toHaveValue('Bristol');

            fireEvent.blur(mobileInput!);

            expect(mobileInput).toHaveValue('Italy');
        });

        it('should close dropdown after selecting destination in suggestion popup', async () => {
            mockProps.selectedDropdown = SearchBarDropdown.To;
            mockStores.searchStore.searchTo.typeAheadDestinations = {
                destinations: [{ code: mockSearchBarSuggestionsPopupSelectedCodes[0] }] as IDestination[],
                page: 1,
                take: 1,
                total: 1,
            };

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to--drawer').querySelector('input');
            await userEvent.type(searchToInput!, 'Spain');

            const suggestionPopup = screen.getByTestId('searchbar-suggestions-popup');
            expect(suggestionPopup).toBeInTheDocument();

            fireEvent.click(within(suggestionPopup).getByRole('button', { name: 'onSelectMultiple' }));

            expect(mockStores.searchStore.searchTo.selectSingleDestination).toHaveBeenCalledWith(
                mockStores.searchStore.searchTo.typeAheadDestinations.destinations[0],
            );
            expect(suggestionPopup).not.toBeInTheDocument();
            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        });
    });

    describe('InspirationCallout', () => {
        describe('desktop', () => {
            it('should appear on holidays when click on search-to input on desktop when turned on in settings', () => {
                mockStores.layoutStore.getSetting = setting =>
                    setting === SiteSettings.IsTooltipOnSearchPodDesktopEnabled ? '1' : '';

                render(<SearchBarToContent {...mockProps} />);

                const searchToInput = screen.getByTestId('search-to').querySelector('input');
                fireEvent.focus(searchToInput!);

                expect(mockedInspirationCalloutComponent).toHaveBeenCalledWith({
                    isTextIncludeLink: false,
                    calloutText: mockLocalStore.fields.InspirationCalloutHolidaysText.value,
                    calloutTitle: mockLocalStore.fields.InspirationCalloutHolidaysTitle.value,
                });
                expect(screen.getByTestId('inspiration-callout')).toBeInTheDocument();
            });

            it('should appear on trade portal when click on search-to input on desktop when turned on in settings', () => {
                Object.defineProperty(mockStores.layoutStore, 'isTradePortal', {
                    get: () => true,
                });
                mockStores.layoutStore.getSetting = setting =>
                    setting === SiteSettings.IsTooltipOnSearchPodDesktopEnabled ? '1' : '';

                render(<SearchBarToContent {...mockProps} />);

                const searchToInput = screen.getByTestId('search-to').querySelector('input');
                fireEvent.focus(searchToInput!);

                expect(mockedInspirationCalloutComponent).toHaveBeenCalledWith({
                    isTextIncludeLink: false,
                    calloutText: mockLocalStore.fields.InspirationCalloutTradePortalText.value,
                    calloutTitle: mockLocalStore.fields.InspirationCalloutTradePortalTitle.value,
                });
                expect(screen.getByTestId('inspiration-callout')).toBeInTheDocument();
            });

            it('should not appear when click on search-to input on desktop when turned off in settings', () => {
                mockStores.layoutStore.getSetting = setting =>
                    setting === SiteSettings.IsTooltipOnSearchPodDesktopEnabled ? '' : '1';

                render(<SearchBarToContent {...mockProps} />);

                const searchToInput = screen.getByTestId('search-to').querySelector('input');
                fireEvent.focus(searchToInput!);

                expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();
            });
        });

        describe('mobile', () => {
            beforeEach(() => {
                mockUseMobileViewport = true;
            });

            it('should NOT appear when click on search-to input on mobile', () => {
                mockStores.layoutStore.getSetting = setting =>
                    setting === SiteSettings.IsTooltipOnSearchPodMobileEnabled ? '1' : '';

                render(<SearchBarToContent {...mockProps} />);

                const searchToInput = screen.getByTestId('search-to').querySelector('input');
                fireEvent.focus(searchToInput!);

                expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();
            });

            it('should appear when click on search-to--drawer input on mobile when turned on in settings', () => {
                mockStores.layoutStore.getSetting = setting =>
                    setting === SiteSettings.IsTooltipOnSearchPodMobileEnabled ? '1' : '';

                render(<SearchBarToContent {...mockProps} />);

                const searchToInput = screen.getByTestId('search-to--drawer').querySelector('input');
                fireEvent.click(searchToInput!);

                expect(screen.getByTestId('inspiration-callout')).toBeInTheDocument();
            });

            it('should not appear when click on search-to--drawer input on mobile when turned off in settings', () => {
                mockStores.layoutStore.getSetting = setting =>
                    setting === SiteSettings.IsTooltipOnSearchPodMobileEnabled ? '' : '1';

                render(<SearchBarToContent {...mockProps} />);

                const searchToInput = screen.getByTestId('search-to--drawer').querySelector('input');
                fireEvent.click(searchToInput!);

                expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();
            });

            it('should close callout on input blur', async () => {
                mockProps.selectedDropdown = SearchBarDropdown.To;
                mockStores.layoutStore.getSetting = setting =>
                    setting === SiteSettings.IsTooltipOnSearchPodMobileEnabled ? '1' : '';

                render(<SearchBarToContent {...mockProps} />);

                const searchToInput = screen.getByTestId('search-to--drawer').querySelector('input');
                await userEvent.click(searchToInput!);

                expect(screen.getByTestId('inspiration-callout')).toBeInTheDocument();

                fireEvent.blur(searchToInput!);

                expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();
            });

            it('should prevent default on mousedown when callout has link', () => {
                mockProps.selectedDropdown = SearchBarDropdown.To;
                mockStores.layoutStore.getSetting = setting =>
                    setting === SiteSettings.IsTooltipOnSearchPodMobileEnabled ? '1' : '';
                mockLocalStore.fields.InspirationCalloutHolidaysText = { value: 'Text with <a href="#">link</a>' };

                render(<SearchBarToContent {...mockProps} />);

                const searchToInput = screen.getByTestId('search-to--drawer').querySelector('input');
                fireEvent.click(searchToInput!);

                const calloutWrapper = screen.getByTestId('inspiration-callout').parentElement;
                const preventDefaultMock = jest.fn();
                const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
                Object.defineProperty(mouseDownEvent, 'preventDefault', { value: preventDefaultMock });

                calloutWrapper?.dispatchEvent(mouseDownEvent);

                expect(preventDefaultMock).toHaveBeenCalled();
            });
        });

        it('should close InspirationCallout when onCancel triggered', () => {
            mockUseMobileViewport = false;
            mockStores.layoutStore.getSetting = setting =>
                setting === SiteSettings.IsTooltipOnSearchPodDesktopEnabled ? '1' : '';

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            fireEvent.focus(searchToInput!);

            const inspirationCallout = screen.getByTestId('inspiration-callout');
            expect(inspirationCallout).toBeInTheDocument();

            fireEvent.click(within(inspirationCallout).getByRole('button', { name: 'onCancel' }));

            expect(inspirationCallout).not.toBeInTheDocument();
        });
    });

    describe('Tracking', () => {
        describe('trackSearchPodToSuggestionClick', () => {
            it('should be available in the component store hooks', () => {
                render(<SearchBarToContent {...mockProps} />);

                expect(mockStores.trackingStore.searchPod.trackSearchPodToSuggestionClick).toBeDefined();
            });

            it('should be called when a suggestion is selected from typeahead', () => {
                const mockDestination = {
                    code: 'TUR',
                    name: 'Turkey',
                    type: 'Country' as const,
                } as IDestination;

                mockStores.searchStore.searchTo.typeAheadDestinations = {
                    destinations: [mockDestination],
                    page: 1,
                    take: 10,
                    total: 1,
                };

                render(<SearchBarToContent {...mockProps} />);

                expect(mockStores.trackingStore.searchPod.trackSearchPodToSuggestionClick).toBeDefined();
                expect(typeof mockStores.trackingStore.searchPod.trackSearchPodToSuggestionClick).toBe('function');
            });
        });

        describe('Tracking store availability', () => {
            it('should have searchPod tracking methods available', () => {
                render(<SearchBarToContent {...mockProps} />);

                expect(mockStores.trackingStore.searchPod).toBeDefined();
                expect(mockStores.trackingStore.searchPod.trackSearchPodToSuggestionClick).toBeDefined();
                expect(mockStores.trackingStore.searchPod.trackToClearClick).toBeDefined();
                expect(mockStores.trackingStore.searchPod.trackToInputClick).toBeDefined();
                expect(mockStores.trackingStore.searchPod.trackToBurgerMenuClick).toBeDefined();
            });
        });
    });

    describe('scroll event handling', () => {
        beforeEach(() => {
            mockUseMobileViewport = true;
            mockProps.selectedDropdown = SearchBarDropdown.To;
            mockStores.layoutStore.getSetting = setting =>
                setting === SiteSettings.IsTooltipOnSearchPodMobileEnabled ? '1' : '';
            mockLocalStore.fields.InspirationCalloutHolidaysText = { value: 'Test callout text' };
        });

        it('should close inspiration callout when dropdown scrolls on mobile', () => {
            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to--drawer').querySelector('input');
            fireEvent.click(searchToInput!);

            const inspirationCallout = screen.queryByTestId('inspiration-callout');
            expect(inspirationCallout).toBeInTheDocument();

            const dropdown = screen.getByTestId('searchbar-dropdown-to');
            fireEvent.scroll(dropdown);

            expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();
        });

        it('should not add scroll listener when not on mobile', () => {
            mockUseMobileViewport = false;
            mockStores.layoutStore.getSetting = setting =>
                setting === SiteSettings.IsTooltipOnSearchPodDesktopEnabled ? '1' : '';

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            fireEvent.focus(searchToInput!);

            const inspirationCallout = screen.queryByTestId('inspiration-callout');
            expect(inspirationCallout).toBeInTheDocument();

            const dropdown = screen.getByTestId('searchbar-dropdown-to');
            fireEvent.scroll(dropdown);

            expect(screen.queryByTestId('inspiration-callout')).toBeInTheDocument();
        });

        it('should not add scroll listener when dropdown is not selected', () => {
            mockProps.selectedDropdown = null;

            render(<SearchBarToContent {...mockProps} />);

            const dropdown = screen.queryByTestId('searchbar-dropdown-to');
            expect(dropdown).not.toBeInTheDocument();
        });

        it('should not close callout on scroll if callout is not shown', () => {
            mockStores.layoutStore.getSetting = () => '';

            render(<SearchBarToContent {...mockProps} />);

            const dropdown = screen.getByTestId('searchbar-dropdown-to');

            expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();

            fireEvent.scroll(dropdown);

            expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();
        });
    });

    describe('onType', () => {
        it('should NOT show suggestions popup when user types fewer characters than required', async () => {
            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.type(searchToInput!, 'Sp');

            expect(screen.queryByTestId('searchbar-suggestions-popup')).not.toBeInTheDocument();
        });

        it('should call searchTypeAheadDestinations with typed value when user types enough characters', async () => {
            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.type(searchToInput!, 'Spain');

            expect(mockStores.searchStore.searchTo.searchTypeAheadDestinations).toHaveBeenCalledWith('Spain');
        });

        it('should NOT call searchTypeAheadDestinations when user types fewer characters than required', async () => {
            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            await userEvent.type(searchToInput!, 'Sp');

            expect(mockStores.searchStore.searchTo.searchTypeAheadDestinations).not.toHaveBeenCalled();
        });

        it('should close InspirationCallout when user starts typing', async () => {
            mockStores.layoutStore.getSetting = setting =>
                setting === SiteSettings.IsTooltipOnSearchPodDesktopEnabled ? '1' : '';

            render(<SearchBarToContent {...mockProps} />);

            const searchToInput = screen.getByTestId('search-to').querySelector('input');
            fireEvent.focus(searchToInput!);

            expect(screen.getByTestId('inspiration-callout')).toBeInTheDocument();

            await userEvent.type(searchToInput!, 'Spa');

            expect(screen.queryByTestId('inspiration-callout')).not.toBeInTheDocument();
        });
    });
});
