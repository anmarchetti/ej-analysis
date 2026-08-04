import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SearchBarWhenContent, {
    ISearchBarWhenContentProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchBarWhenContent';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFormatDatesRange = '12 - 13 Oct';
const mockFormatMonthDate = 'May 2025';
jest.mock('frontend/utils/date.utils', () => ({
    formatDatesRange: jest.fn(() => mockFormatDatesRange),
    formatDateL10n: jest.fn(() => mockFormatMonthDate),
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockedSearchBarDropdownWhenComponent = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownWhen/SearchBarDropdownWhen', () => ({
    __esModule: true,
    default: ({ onDropdownClose, ...props }) => {
        mockedSearchBarDropdownWhenComponent(props);

        return (
            <div data-tid='searchbar-dropdown-when'>
                <button data-tid='close-dropdown-who' onClick={onDropdownClose} />
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

const mockErrorMessageComponent = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ icon, ...props }) => {
        mockErrorMessageComponent(props);

        return <div data-tid='error-message'>{icon}</div>;
    },
}));

jest.mock('frontend/components/icons-new/InfoFilled', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-info-filled' />,
}));

jest.mock('frontend/components/icons/Calendar', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-calendar' />,
}));

const mockedSearchbarInputComponent = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput', () => ({
    __esModule: true,
    default: props => {
        mockedSearchbarInputComponent(props);
        const { onFocus, id, value, icon, onClearButtonClick } = props;

        return (
            <div data-tid={id}>
                <input onFocus={onFocus} value={value} />
                {icon}
                <button data-tid={`${id}-clear-button`} onClick={onClearButtonClick} />
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

let mockProps: ISearchBarWhenContentProps;
let mockStores;
let mockLocalStore;

const createProps = (): ISearchBarWhenContentProps => ({
    selectedDropdown: SearchBarDropdown.When,
    changeSelectedDropdown: jest.fn(),
});

describe('<SearchBarWhenContent />', () => {
    beforeEach(() => {
        mockUseMobileViewport = false;
        mockProps = createProps();
        mockStores = createMockStores({
            searchStore: {
                activeField: SearchBarDropdown.When,
                errorMessages: null,
                hasErrorInField: jest.fn(),
                setNeedOpenWhenField: jest.fn(),
                isNeedOpenWhenField: false,
                searchWhen: {
                    from: new Date('2024-10-12'),
                    to: new Date('2024-10-13'),
                    clearDates: jest.fn(),
                    searchedMonthIndex: null,
                    isMonthSearch: false,
                },
            },
            queryParamStore: {
                isReferer: false,
            },
            hotelsStore: {
                hasOffers: true,
            },
            layoutStore: {
                isHotelDetailsBookPage: false,
            },
            trackingStore: {
                searchPod: {
                    trackBasicWhenClickEvent: jest.fn(),
                    trackWhenClearFieldInput: jest.fn(),
                },
            },
        });
        mockLocalStore = createMockLocalStore();
    });

    it('should render with opened dropdown and prev selected value', () => {
        const mockHasErrorInField = false;
        mockStores.searchStore.hasErrorInField = jest.fn().mockReturnValue(mockHasErrorInField);
        render(<SearchBarWhenContent {...mockProps} />);

        const heightAnimatedContainer = screen.getByTestId('search-bar-animated-dropdown');

        expect(screen.getByTestId('search-when')).toBeInTheDocument();
        expect(heightAnimatedContainer).toBeInTheDocument();
        expect(within(heightAnimatedContainer).getByTestId('searchbar-dropdown-when')).toBeInTheDocument();
        expect(screen.getByTestId('icon-calendar')).toBeInTheDocument();
        expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'search-when',
                icon: expect.anything(),
                hidePlaceholder: true,
                isError: mockHasErrorInField,
                isEditable: false,
                label: mockLocalStore.fields.WhenFieldLabel.value,
                placeholder: mockLocalStore.fields.WhenFieldPlaceholder.value,
                ariaDescription: mockLocalStore.fields.WhenFieldAriaDescription.value,
                showClearButton: true,
                value: '12 - 13 Oct',
                onFocus: expect.any(Function),
                onClearButtonClick: expect.any(Function),
                isInputHighlighted: true,
            }),
        );
    });

    it('should show placeholder when there is no value', () => {
        mockProps.selectedDropdown = null;
        mockStores.searchStore.searchWhen.from = null;
        mockStores.searchStore.searchWhen.to = null;

        render(<SearchBarWhenContent {...mockProps} />);

        expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                hidePlaceholder: false,
            }),
        );
    });

    it('should open selector and call trackBasicWhenClickEvent by click on input', async () => {
        mockProps.selectedDropdown = null;

        render(<SearchBarWhenContent {...mockProps} />);
        const searchWhenInput = screen.getByTestId('search-when').querySelector('input');
        await userEvent.click(searchWhenInput!);

        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(SearchBarDropdown.When);
        expect(mockStores.trackingStore.searchPod.trackBasicWhenClickEvent).toHaveBeenCalled();
    });

    it('should hide placeholder when there is no value but dropdown is opened', () => {
        mockProps.selectedDropdown = SearchBarDropdown.When;
        mockStores.searchStore.searchWhen.from = null;
        mockStores.searchStore.searchWhen.to = null;

        render(<SearchBarWhenContent {...mockProps} />);

        expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                hidePlaceholder: true,
            }),
        );
    });

    it('should call changeSelectedDropdown to close dropdown when trigger onClose', () => {
        render(<SearchBarWhenContent {...mockProps} />);

        fireEvent.click(screen.getByTestId('close-dropdown-who'));

        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
    });

    it('should call clearDates, changeSelectedDropdown and trackWhenClearFieldInput when trigger onClearButtonClick', () => {
        render(<SearchBarWhenContent {...mockProps} />);

        fireEvent.click(screen.getByTestId('search-when-clear-button'));

        expect(mockStores.searchStore.searchWhen.clearDates).toHaveBeenCalled();
        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(SearchBarDropdown.When);
        expect(mockStores.trackingStore.searchPod.trackWhenClearFieldInput).toHaveBeenCalled();
    });

    it('should pass an empty string to input when from and to = null', () => {
        mockStores.searchStore.searchWhen.from = null;
        mockStores.searchStore.searchWhen.to = null;

        render(<SearchBarWhenContent {...mockProps} />);

        expect(screen.getByTestId('search-when').querySelector('input')).toHaveValue('');
    });

    it('should pass returned from formatDatesRange value to input when from is defined', () => {
        render(<SearchBarWhenContent {...mockProps} />);

        expect(screen.getByTestId('search-when').querySelector('input')).toHaveValue(mockFormatDatesRange);
    });

    it('should pass returned from formatDateL10n value to input when from is defined and isMonthSearch is true', () => {
        mockStores.searchStore.searchWhen.isMonthSearch = true;
        render(<SearchBarWhenContent {...mockProps} />);

        expect(screen.getByTestId('search-when').querySelector('input')).toHaveValue(mockFormatMonthDate);
    });

    describe('mobile view', () => {
        it('should render SearchBarDropdownWhen inside Drawer on mobile', () => {
            mockUseMobileViewport = true;

            render(<SearchBarWhenContent {...mockProps} />);

            const drawer = screen.getByTestId('drawer');

            expect(screen.getByTestId('when-field-box')).toBeInTheDocument();
            expect(screen.getByTestId('search-when')).toBeInTheDocument();
            expect(drawer).toBeInTheDocument();
            expect(within(drawer).getByTestId('searchbar-dropdown-when')).toBeInTheDocument();
        });

        it('should render wrapper for When dropdown with nothing-selected classname when from,to dates and searchedMonthIndex equal null', () => {
            mockUseMobileViewport = true;
            mockStores.searchStore.searchWhen.from = null;
            mockStores.searchStore.searchWhen.to = null;

            const { container } = render(<SearchBarWhenContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr--when')).toHaveClass(
                'search-bar__dd-wr--nothing-selected',
            );
        });

        it('should render wrapper for When dropdown without nothing-selected classname when from and to dates not equal null', () => {
            mockUseMobileViewport = true;

            const { container } = render(<SearchBarWhenContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr--when')).not.toHaveClass(
                'search-bar__dd-wr--nothing-selected',
            );
        });

        it('should NOT render SearchBarDropdownWhen when tab is not selected', () => {
            mockUseMobileViewport = true;
            mockProps.selectedDropdown = SearchBarDropdown.To;

            render(<SearchBarWhenContent {...mockProps} />);

            expect(screen.queryByTestId('searchbar-dropdown-when')).not.toBeInTheDocument();
        });
    });

    describe('iframe redirect error message', () => {
        it('should render ErrorMessage when hasBeenRedirectedFromIframeWithNoOffers and dropdown in oppened', () => {
            mockStores.searchStore.isNeedOpenWhenField = true;
            mockStores.queryParamStore.isReferer = true;
            mockStores.hotelsStore.hasOffers = false;
            mockStores.layoutStore.isHotelDetailsBookPage = false;

            render(<SearchBarWhenContent {...mockProps} />);

            expect(mockStores.searchStore.searchWhen.clearDates).toHaveBeenCalled();
            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(SearchBarDropdown.When);
            expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalledWith(false);
            expect(screen.getByTestId('error-message')).toBeInTheDocument();
        });

        it('should NOT call changeSelectedDropdown when isNeedOpenWhenField is false', () => {
            render(<SearchBarWhenContent {...mockProps} />);

            expect(mockStores.searchStore.searchWhen.clearDates).not.toHaveBeenCalled();
            expect(mockProps.changeSelectedDropdown).not.toHaveBeenCalled();
            expect(mockStores.searchStore.setNeedOpenWhenField).not.toHaveBeenCalled();
        });

        it('should NOT render ErrorMessage on hotel details page', () => {
            mockStores.searchStore.isNeedOpenWhenField = true;
            mockStores.queryParamStore.isReferer = true;
            mockStores.hotelsStore.hasOffers = false;
            mockStores.layoutStore.isHotelDetailsBookPage = true;

            render(<SearchBarWhenContent {...mockProps} />);

            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });

        it('should NOT render ErrorMessage when errorMessages value is defined', () => {
            mockStores.searchStore.isNeedOpenWhenField = true;
            mockStores.queryParamStore.isReferer = true;
            mockStores.hotelsStore.hasOffers = false;
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockStores.searchStore.errorMessages = {
                key: SearchBarDropdown.When,
                message: 'error',
            };
            render(<SearchBarWhenContent {...mockProps} />);

            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });
    });

    it('should close dropdown on click outside', () => {
        render(<SearchBarWhenContent {...mockProps} />);

        mockReset();

        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
    });
});
