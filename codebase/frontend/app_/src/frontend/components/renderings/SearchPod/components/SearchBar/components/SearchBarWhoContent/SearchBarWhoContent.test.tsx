import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import { RoomAllocation } from 'models/RoomAllocation';
import SearchBarWhoContent, {
    ISearchBarWhoContentProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhoContent/SearchBarWhoContent';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/components/icons/Bed', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-bed' />,
}));

const mockedSearchBarDropdownWhoComponent = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownWho/SearchBarDropdownWho', () => ({
    __esModule: true,
    default: ({ onClose, onApply, onClearRoom, ...props }) => {
        mockedSearchBarDropdownWhoComponent(props);

        return (
            <div data-tid='searchbar-dropdown-who'>
                <button data-tid='close-dropdown-who' onClick={onClose} />
                <button data-tid='apply-dropdown-who' onClick={onApply} />
                <button data-tid='clear-room-dropdown-who' onClick={onClearRoom} />
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

const mockedSearchbarInputComponent = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput', () => ({
    __esModule: true,
    default: props => {
        mockedSearchbarInputComponent(props);
        const { onFocus, id, value } = props;

        return (
            <div data-tid={id}>
                <input onFocus={onFocus} value={value} />
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

let mockProps: ISearchBarWhoContentProps;
let mockStores: TStores;
let mockLocalStore;

const createProps = (): ISearchBarWhoContentProps => ({
    selectedDropdown: SearchBarDropdown.Who,
    changeSelectedDropdown: jest.fn(),
});

describe('<SearchBarWhoContent />', () => {
    beforeEach(() => {
        mockUseMobileViewport = false;
        mockProps = createProps();
        mockStores = createMockStores({
            searchStore: {
                searchWho: {
                    roomsAllocation: [] as RoomAllocation[],
                    isChildrenAgeValid: true,
                    whoValue: '2 adults',
                    resetRoomAllocation: jest.fn(),
                    onClearRoom: jest.fn(),
                    isDefaultNumberGuestsInRooms: false,
                    validateChildrenAge: jest.fn(),
                    isGuestsParametersValid: true,
                },
            },
            trackingStore: {
                searchPod: {
                    trackWhoInputClick: jest.fn(),
                },
            },
        });
        mockLocalStore = createMockLocalStore();
    });

    it('should render opened dropdown with default value', () => {
        render(<SearchBarWhoContent {...mockProps} />);

        const heightAnimatedContainer = screen.getByTestId('search-bar-animated-dropdown');

        expect(screen.getByTestId('search-who')).toBeInTheDocument();
        expect(heightAnimatedContainer).toBeInTheDocument();
        expect(within(heightAnimatedContainer).getByTestId('searchbar-dropdown-who')).toBeInTheDocument();
        expect(screen.getByTestId('search-who').querySelector('input')).toHaveValue(
            mockStores.searchStore.searchWho.whoValue,
        );
        expect(mockedSearchbarInputComponent).toHaveBeenCalledWith({
            id: 'search-who',
            label: mockLocalStore.fields.WhoFieldLabel.value,
            value: mockStores.searchStore.searchWho.whoValue,
            isEditable: false,
            isError: !mockStores.searchStore.searchWho.isGuestsParametersValid,
            showClearButton: false,
            isInputHighlighted: true,
            onFocus: expect.any(Function),
        });
    });

    it('should pass false to SearchBarInput isInputHighlighted when selectedDropdown is not WHO', () => {
        mockProps.selectedDropdown = SearchBarDropdown.To;

        render(<SearchBarWhoContent {...mockProps} />);

        expect(mockedSearchbarInputComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isInputHighlighted: false,
            }),
        );
    });

    it('should call SearchBarDropdownWho with expected props', () => {
        render(<SearchBarWhoContent {...mockProps} />);

        const searchWhenInput = screen.getByTestId('search-who').querySelector('input');
        fireEvent.click(searchWhenInput!);

        expect(mockedSearchBarDropdownWhoComponent).toHaveBeenLastCalledWith({
            rooms: mockStores.searchStore.searchWho.roomsAllocation,
            isDialogRole: true,
            ignoreValidationOnClose: true,
        });
    });

    it('should call validateChildrenAge when who dropdown is opened', () => {
        mockProps.selectedDropdown = null;
        const { rerender } = render(<SearchBarWhoContent {...mockProps} />);

        mockProps.selectedDropdown = SearchBarDropdown.Who;

        rerender(<SearchBarWhoContent {...mockProps} />);

        expect(mockStores.searchStore.searchWho.validateChildrenAge).toHaveBeenCalledTimes(1);
    });

    describe('Dropdown', () => {
        it('should changeSelectedDropdown on open dropdown', async () => {
            mockProps.selectedDropdown = null;
            render(<SearchBarWhoContent {...mockProps} />);

            const searchWhoInput = screen.getByTestId('search-who').querySelector('input');

            await userEvent.click(searchWhoInput!);

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(SearchBarDropdown.Who);
        });

        it('should call changeSelectedDropdown on close dropdown', async () => {
            render(<SearchBarWhoContent {...mockProps} />);

            fireEvent.click(screen.getByTestId('close-dropdown-who'));

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        });

        it('should call changeSelectedDropdown on apply click', async () => {
            render(<SearchBarWhoContent {...mockProps} />);

            fireEvent.click(screen.getByTestId('apply-dropdown-who'));

            expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
        });

        it('should call onClearRoom when clear room in dropdown who', () => {
            render(<SearchBarWhoContent {...mockProps} />);

            const searchWhoInput = screen.getByTestId('search-who').querySelector('input');
            fireEvent.click(searchWhoInput!);
            fireEvent.click(screen.getByTestId('clear-room-dropdown-who'));

            expect(mockStores.searchStore.searchWho.onClearRoom).toHaveBeenCalled();
        });
    });

    describe('mobile view', () => {
        it('should render SearchBarDropdownWhen inside Drawer on mobile', () => {
            mockUseMobileViewport = true;

            render(<SearchBarWhoContent {...mockProps} />);

            const drawer = screen.getByTestId('drawer');

            expect(screen.getByTestId('who-field-box')).toBeInTheDocument();
            expect(screen.getByTestId('search-who')).toBeInTheDocument();
            expect(drawer).toBeInTheDocument();
            expect(within(drawer).getByTestId('searchbar-dropdown-who')).toBeInTheDocument();
        });

        it('should render wrapper for Who dropdown with nothing-selected classname when isDefaultNumberGuestsInRooms is true', () => {
            mockUseMobileViewport = true;
            mockStores.searchStore.searchWho.isDefaultNumberGuestsInRooms = true;

            const { container } = render(<SearchBarWhoContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr--who')).toHaveClass(
                'search-bar__dd-wr--nothing-selected',
            );
        });

        it('should render wrapper for Who dropdown without nothing-selected classname when isDefaultNumberGuestsInRooms is false', () => {
            mockUseMobileViewport = true;

            const { container } = render(<SearchBarWhoContent {...mockProps} />);

            expect(container.querySelector('.search-bar__dd-wr--who')).not.toHaveClass(
                'search-bar__dd-wr--nothing-selected',
            );
        });
    });

    it('should close dropdown on click outside', () => {
        render(<SearchBarWhoContent {...mockProps} />);

        mockReset();

        expect(mockProps.changeSelectedDropdown).toHaveBeenCalledWith(null);
    });
});
