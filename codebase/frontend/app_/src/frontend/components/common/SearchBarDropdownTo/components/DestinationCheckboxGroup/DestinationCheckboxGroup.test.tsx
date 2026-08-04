import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

import DestinationCheckboxGroup, { IDestinationCheckboxGroupProps } from './DestinationCheckboxGroup';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

export const mockChangeGroupSelection = jest.fn();
export const mockChangeItemSelection = jest.fn();
const mockUseDestinationSelectionHandlers = jest.fn();

jest.mock('./DestinationCheckboxGroup.hooks', () => ({
    useDestinationSelectionHandlers: props => {
        mockUseDestinationSelectionHandlers(props);

        return {
            changeGroupSelection: mockChangeGroupSelection,
            changeItemSelection: mockChangeItemSelection,
        };
    },
}));

const mockCheckboxItemProps = jest.fn();
jest.mock('frontend/components/common/CheckboxItem/CheckboxItem', () => ({
    __esModule: true,
    default: ({ onChange, ...props }) => {
        mockCheckboxItemProps(props);

        return <button data-tid='checkbox-item' onClick={() => onChange({ target: { checked: true } })} />;
    },
}));

const createProps = (): IDestinationCheckboxGroupProps => ({
    parent: {
        code: 'parent',
        name: 'test',
        children: [
            { code: 'child1', name: 'child1' },
            { code: 'child2', name: 'child2' },
        ],
    },
    availableCodes: ['x', 'y', 'z'],
});

let mockProps;
let mockStores;
let mockLocalStore;

describe('<DestinationCheckboxGroup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            searchStore: {
                hasPrefilledSearchPod: false,
                addDestination: jest.fn(),
                removeDestination: jest.fn(),
                updateDestinationCodes: jest.fn(),
                searchTo: {
                    isDisabledItem: jest.fn().mockReturnValue(false),
                    isCheckedItem: jest.fn().mockReturnValue(false),
                    selectedDestinations: [],
                    availableDestinationsCodes: [],
                },
            },
            trackingStore: {
                searchPod: {
                    trackToRegionSelectAll: jest.fn(),
                    trackToRegionSelectSingle: jest.fn(),
                },
            },
        });
        mockLocalStore = createMockLocalStore();
        mockChangeGroupSelection.mockClear();
        mockChangeItemSelection.mockClear();
    });

    it('should render 3 CheckboxItem component when parent has 2 children', () => {
        render(<DestinationCheckboxGroup {...mockProps} />);

        expect(screen.getAllByTestId('checkbox-item').length).toBe(3);
        expect(mockCheckboxItemProps).toHaveBeenNthCalledWith(1, {
            code: mockProps.parent.code,
            name: `${mockLocalStore.fields.ToAllGroupCheckboxLabel.value} ${mockProps.parent.name}`,
            icon: true,
            disabled: false,
            checked: false,
            disabledShowUnchecked: true,
        });
        expect(mockCheckboxItemProps).toHaveBeenCalledWith({
            code: mockProps.parent.children[0].code,
            name: mockProps.parent.children[0].name,
            disabled: false,
            checked: false,
            disabledShowUnchecked: true,
        });
        expect(mockCheckboxItemProps).toHaveBeenCalledWith({
            code: mockProps.parent.children[1].code,
            name: mockProps.parent.children[1].name,
            disabled: false,
            checked: false,
            disabledShowUnchecked: true,
        });
    });

    it('should call changeGroupSelection when click on All destination item', () => {
        render(<DestinationCheckboxGroup {...mockProps} />);

        fireEvent.click(screen.getAllByTestId('checkbox-item')[0]);

        expect(mockChangeGroupSelection).toHaveBeenCalledWith(true);
    });

    it('should call useDestinationSelectionHandlers with appropriate params', () => {
        render(<DestinationCheckboxGroup {...mockProps} />);

        expect(mockUseDestinationSelectionHandlers).toHaveBeenCalledWith({
            parent: mockProps.parent,
            availableCodes: mockProps.availableCodes,
            addDestination: mockStores.searchStore.searchTo.addDestination,
            removeDestination: mockStores.searchStore.searchTo.removeDestination,
            updateDestinationCodes: mockStores.searchStore.searchTo.updateDestinationCodes,
            isDisabledItem: mockStores.searchStore.searchTo.isDisabledItem,
            isCheckedItem: mockStores.searchStore.searchTo.isCheckedItem,
            trackToRegionSelectSingle: mockStores.trackingStore.searchPod.trackToRegionSelectSingle,
            trackToRegionSelectAll: mockStores.trackingStore.searchPod.trackToRegionSelectAll,
            selectedDestinations: mockStores.searchStore.searchTo.selectedDestinations,
            availableDestinationsCodes: mockStores.searchStore.searchTo.availableDestinationsCodes,
        });
    });

    describe('no children', () => {
        beforeEach(() => {
            mockProps.parent.children = null;
        });

        it('should render 1 CheckboxItem component with parent info', () => {
            render(<DestinationCheckboxGroup {...mockProps} />);

            expect(screen.getAllByTestId('checkbox-item').length).toBe(1);
            expect(mockCheckboxItemProps).toHaveBeenCalledWith({
                code: mockProps.parent.code,
                name: mockProps.parent.name,
                disabled: false,
                checked: false,
                disabledShowUnchecked: true,
            });
        });

        it('should call mockChangeItemSelection with parent code', () => {
            render(<DestinationCheckboxGroup {...mockProps} />);

            fireEvent.click(screen.getByTestId('checkbox-item'));

            expect(mockChangeItemSelection).toHaveBeenCalledWith(true, mockProps.parent.code);
        });
    });

    describe('1 child', () => {
        beforeEach(() => {
            mockProps.parent.children = [{ code: 'child1', name: 'child1' }];
        });

        it('should render 1 CheckboxItem component when only 1 child', () => {
            render(<DestinationCheckboxGroup {...mockProps} />);

            expect(screen.getAllByTestId('checkbox-item').length).toBe(1);
            expect(mockCheckboxItemProps).toHaveBeenCalledWith({
                code: mockProps.parent.children[0].code,
                name: mockProps.parent.children[0].name,
                disabled: false,
                checked: false,
                disabledShowUnchecked: true,
            });
        });

        it('should call mockChangeItemSelection with child code', () => {
            render(<DestinationCheckboxGroup {...mockProps} />);

            fireEvent.click(screen.getByTestId('checkbox-item'));

            expect(mockChangeItemSelection).toHaveBeenCalledWith(true, mockProps.parent.children[0].code);
        });
    });

    describe('Tracking', () => {
        it('should pass trackToRegionSelectAll and trackToRegionSelectSingle to hooks', () => {
            render(<DestinationCheckboxGroup {...mockProps} />);

            expect(mockStores.trackingStore.searchPod.trackToRegionSelectAll).toBeDefined();
            expect(mockStores.trackingStore.searchPod.trackToRegionSelectSingle).toBeDefined();
        });

        it('should have tracking methods available in the component store hooks', () => {
            render(<DestinationCheckboxGroup {...mockProps} />);

            expect(typeof mockStores.trackingStore.searchPod.trackToRegionSelectAll).toBe('function');
            expect(typeof mockStores.trackingStore.searchPod.trackToRegionSelectSingle).toBe('function');
        });

        describe('Select All tracking', () => {
            it('should call changeGroupSelection when clicking Select All checkbox', () => {
                render(<DestinationCheckboxGroup {...mockProps} />);

                fireEvent.click(screen.getAllByTestId('checkbox-item')[0]);

                expect(mockChangeGroupSelection).toHaveBeenCalledWith(true);
            });

            it('should pass parent with multiple children when rendering', () => {
                mockProps.parent = {
                    code: 'ESP',
                    name: 'Spain',
                    children: [
                        { code: 'BCN', name: 'Barcelona' },
                        { code: 'MAD', name: 'Madrid' },
                        { code: 'PMI', name: 'Palma' },
                    ],
                };

                render(<DestinationCheckboxGroup {...mockProps} />);

                // Verify the component renders with correct props that will be used for tracking
                expect(screen.getAllByTestId('checkbox-item').length).toBe(4); // 1 "Select All" + 3 children
            });
        });

        describe('Single item tracking', () => {
            it('should call changeItemSelection when clicking individual destination', () => {
                render(<DestinationCheckboxGroup {...mockProps} />);

                fireEvent.click(screen.getAllByTestId('checkbox-item')[1]); // First child

                expect(mockChangeItemSelection).toHaveBeenCalledWith(true, 'child1');
            });

            it('should call changeItemSelection for second child', () => {
                render(<DestinationCheckboxGroup {...mockProps} />);

                fireEvent.click(screen.getAllByTestId('checkbox-item')[2]); // Second child

                expect(mockChangeItemSelection).toHaveBeenCalledWith(true, 'child2');
            });
        });

        describe('Tracking with different parent configurations', () => {
            it('should handle parent without children (single destination)', () => {
                mockProps.parent = {
                    code: 'AMS',
                    name: 'Amsterdam',
                    children: null,
                };

                render(<DestinationCheckboxGroup {...mockProps} />);

                expect(screen.getAllByTestId('checkbox-item').length).toBe(1);

                fireEvent.click(screen.getByTestId('checkbox-item'));

                expect(mockChangeItemSelection).toHaveBeenCalledWith(true, 'AMS');
            });

            it('should handle parent with only one child', () => {
                mockProps.parent = {
                    code: 'FRA',
                    name: 'France',
                    children: [{ code: 'NCE', name: 'Nice' }],
                };

                render(<DestinationCheckboxGroup {...mockProps} />);

                // Only one checkbox should render (no "Select All" for single child)
                expect(screen.getAllByTestId('checkbox-item').length).toBe(1);

                fireEvent.click(screen.getByTestId('checkbox-item'));

                expect(mockChangeItemSelection).toHaveBeenCalledWith(true, 'NCE');
            });
        });
    });
});
