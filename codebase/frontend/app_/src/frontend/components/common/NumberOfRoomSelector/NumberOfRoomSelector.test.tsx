import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { AUTO_ALLOCATION_SITECORE_VALUE } from 'frontend/store/base/search/SearchWhoStore';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import NumberOfRoomSelector, { INumberOfRoomsSelectorProps } from './NumberOfRoomSelector';

const mockUseSearchPodStore = jest.fn();

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockUseSearchPodStore(),
}));

const mockSelectComponent = jest.fn();
jest.mock('react-select', () => ({ onChange, onMenuOpen, onMenuClose, ...props }) => {
    mockSelectComponent(props);

    return (
        <div data-tid='select'>
            <div data-tid='react-select-3-option' onClick={() => onChange({ value: 3, label: 3 })} />
            <div data-tid='react-select-open' onClick={onMenuOpen} />
            <div data-tid='react-select-close' onClick={onMenuClose} />
        </div>
    );
});
jest.mock('frontend/components/common/Select/DropdownIndicator/DropdownIndicator', () => () => (
    <div data-tid='dropdown-indicator' />
));
jest.mock('frontend/components/common/Select/ValueContainer', () => () => <div data-tid='value-container' />);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): INumberOfRoomsSelectorProps => ({
    numberOfRooms: 4,
    onChange: jest.fn(),
    isAutoAllocation: false,
    isGroup: false,
});

let mockProps;
let mockStores;

describe('<NumberOfRoomSelector />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                getSettingAsNumber: jest.fn().mockReturnValue(9),
            },
            trackingStore: {
                searchPod: {
                    trackWhoDropdownRoomSelectorInteraction: jest.fn(),
                    trackWhoDropdownRoomSelection: jest.fn(),
                },
            },
            searchStore: {
                errorMessages: null,
            },
        });
        mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: false });
    });

    it('should render select', () => {
        render(<NumberOfRoomSelector {...mockProps} />);

        expect(screen.getByTestId('room-selector')).toBeInTheDocument();
        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'custom-select select',
                classNamePrefix: 'custom-select',
                options: [
                    { label: SitecoreDictionary.RoomAllocationLabelsIDontMindOption, value: -1 },
                    { label: 1, value: 1 },
                    { label: 2, value: 2 },
                    { label: 3, value: 3 },
                    { label: 4, value: 4 },
                    { label: 5, value: 5 },
                    { label: 6, value: 6 },
                    { label: 7, value: 7 },
                    { label: 8, value: 8 },
                    { label: 9, value: 9 },
                ],
                defaultValue: { value: mockProps.numberOfRooms, label: mockProps.numberOfRooms },
                value: { value: mockProps.numberOfRooms, label: mockProps.numberOfRooms },
                isSearchable: false,
                blurInputOnSelect: true,
                maxMenuHeight: 176,
                selectProps: { hasCustomPlaceholder: false },
                placeholder: SitecoreDictionary.RoomAllocationLabelsRooms,
                menuPosition: 'fixed',
            }),
        );
    });

    it('should render options on group booking', () => {
        mockProps.isGroup = true;
        mockStores.layoutStore.getSettingAsNumber.mockReturnValue(20);

        render(<NumberOfRoomSelector {...mockProps} />);

        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                options: [
                    { label: SitecoreDictionary.RoomAllocationLabelsIDontMindOption, value: -1 },
                    { label: 1, value: 1 },
                    { label: 2, value: 2 },
                    { label: 3, value: 3 },
                    { label: 4, value: 4 },
                    { label: 5, value: 5 },
                    { label: 6, value: 6 },
                    { label: 7, value: 7 },
                    { label: 8, value: 8 },
                    { label: 9, value: 9 },
                    { label: 10, value: 10 },
                    { label: 11, value: 11 },
                    { label: 12, value: 12 },
                    { label: 13, value: 13 },
                    { label: 14, value: 14 },
                    { label: 15, value: 15 },
                    { label: 16, value: 16 },
                    { label: 17, value: 17 },
                    { label: 18, value: 18 },
                    { label: 19, value: 19 },
                    { label: 20, value: 20 },
                ],
            }),
        );
    });

    it('should render value from sitecore when isAutoAllocation is true ', () => {
        mockProps.isAutoAllocation = true;
        render(<NumberOfRoomSelector {...mockProps} />);

        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                value: {
                    value: AUTO_ALLOCATION_SITECORE_VALUE,
                    label: SitecoreDictionary.RoomAllocationLabelsIDontMindOption,
                },
            }),
        );
    });

    it('should render placeholder from props when it exist', () => {
        mockProps.placeholder = 'test';
        render(<NumberOfRoomSelector {...mockProps} />);

        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                placeholder: 'test',
            }),
        );
    });

    describe('dropdown interaction', () => {
        it('should call tracking function on open and close when isSearchPodInitialized', () => {
            mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: true });
            render(<NumberOfRoomSelector {...mockProps} />);

            fireEvent.click(screen.getByTestId('react-select-open'));

            expect(mockStores.trackingStore.searchPod.trackWhoDropdownRoomSelectorInteraction).toHaveBeenNthCalledWith(
                1,
                true,
            );

            fireEvent.click(screen.getByTestId('react-select-close'));

            expect(mockStores.trackingStore.searchPod.trackWhoDropdownRoomSelectorInteraction).toHaveBeenNthCalledWith(
                2,
                false,
            );
        });

        it('should NOT call tracking function on open and close', () => {
            render(<NumberOfRoomSelector {...mockProps} />);

            fireEvent.click(screen.getByTestId('react-select-open'));

            expect(mockStores.trackingStore.searchPod.trackWhoDropdownRoomSelectorInteraction).not.toHaveBeenCalledWith(
                true,
            );

            fireEvent.click(screen.getByTestId('react-select-close'));

            expect(mockStores.trackingStore.searchPod.trackWhoDropdownRoomSelectorInteraction).not.toHaveBeenCalledWith(
                false,
            );
        });
    });

    describe('option selection', () => {
        it('should call tracking function and onChange on option selection when isSearchPodInitialized', () => {
            mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: true });
            render(<NumberOfRoomSelector {...mockProps} />);

            fireEvent.click(screen.getByTestId('react-select-3-option'));

            expect(mockStores.trackingStore.searchPod.trackWhoDropdownRoomSelection).toHaveBeenCalledWith(3);
            expect(mockProps.onChange).toHaveBeenCalledWith({ value: 3, label: 3 });
        });

        it('should NOT call tracking function but call onChange on option selection', () => {
            render(<NumberOfRoomSelector {...mockProps} />);

            fireEvent.click(screen.getByTestId('react-select-3-option'));

            expect(mockStores.trackingStore.searchPod.trackWhoDropdownRoomSelection).not.toHaveBeenCalled();
            expect(mockProps.onChange).toHaveBeenCalledWith({ value: 3, label: 3 });
        });
    });

    describe('error state', () => {
        it('should apply error class when errorMessages matches Who key and MaxNumberOfGuestsPerRoom message', () => {
            mockStores.searchStore.errorMessages = {
                key: SearchBarDropdown.Who,
                message: SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
            };
            render(<NumberOfRoomSelector {...mockProps} />);

            expect(mockSelectComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'custom-select select custom-select--error',
                }),
            );
        });

        it('should NOT apply error class when errorMessages is null', () => {
            mockStores.searchStore.errorMessages = null;
            render(<NumberOfRoomSelector {...mockProps} />);

            expect(mockSelectComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'custom-select select',
                }),
            );
        });

        it('should NOT apply error class when errorMessages key is not Who', () => {
            mockStores.searchStore.errorMessages = {
                key: SearchBarDropdown.When,
                message: SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
            };
            render(<NumberOfRoomSelector {...mockProps} />);

            expect(mockSelectComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'custom-select select',
                }),
            );
        });

        it('should NOT apply error class when errorMessages message is not RoomAllocationErrorsMaxNumberOfGuestsPerRoom', () => {
            mockStores.searchStore.errorMessages = {
                key: SearchBarDropdown.Who,
                message: SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
            };
            render(<NumberOfRoomSelector {...mockProps} />);

            expect(mockSelectComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'custom-select select',
                }),
            );
        });
    });
});
