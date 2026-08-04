import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

import AirportCheckboxRow, { IAirportCheckboxRowProps } from './AirportCheckboxRow';

import styles from './AirportCheckboxRow.module.scss';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

jest.mock('frontend/components/icons/ChevronDown', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-chevron-down' />,
}));

const mockCheckboxItemProps = jest.fn();
jest.mock('frontend/components/common/CheckboxItem/CheckboxItem', () => ({
    __esModule: true,
    default: ({ onChange, ...props }) => {
        mockCheckboxItemProps(props);

        return (
            <div data-tid='checkbox-item'>
                {props.name}
                <button onClick={() => onChange({ target: { checked: true } })}>check</button>
                <button onClick={() => onChange({ target: { checked: false } })}>uncheck</button>
            </div>
        );
    },
}));

const createMockProps = (): IAirportCheckboxRowProps => ({
    group: {
        name: 'London',
        code: 'LDN',
        airports: [
            { name: 'LTN', code: 'LTN', itemName: 'Luton' },
            { name: 'LGW', code: 'LGW', itemName: 'Gatwick' },
        ],
    },
    origins: ['LTN'],
    onAddOrigin: jest.fn(),
    setOrigins: jest.fn(),
    onRemoveOrigin: jest.fn(),
    isDisabled: jest.fn(() => false),
    isChecked: jest.fn(() => false),
});

let mockStores;
let mockProps: IAirportCheckboxRowProps;
let mockLocalStore;

describe('AirportCheckboxRow', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchStore: {
                searchFrom: {
                    originFromGeo: null,
                },
            },
            trackingStore: {
                searchPod: {
                    trackFromRegionSelectAll: jest.fn(),
                    trackFromRegionSelectSingle: jest.fn(),
                },
            },
        });
        mockProps = createMockProps();
        mockLocalStore = createMockLocalStore();
        mockLocalStore.isSearchPodInitialized = true;
    });

    it('should render group checkbox with 2 children airports', () => {
        const { container } = render(<AirportCheckboxRow {...mockProps} />);

        expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
        expect(mockCheckboxItemProps).toHaveBeenCalledTimes(3);
        expect(container.getElementsByClassName(styles.subRow).length).toBe(1);
        expect(mockCheckboxItemProps).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                code: mockProps.group.code,
                name: `${mockProps.group.name} ${SitecoreDictionary.SearchPodLabelsAll}`,
                icon: true,
                disabledShowUnchecked: true,
                disabled: false,
                checked: false,
            }),
        );
        expect(mockCheckboxItemProps).toHaveBeenNthCalledWith(2, {
            code: mockProps.group.airports![0].code,
            name: mockProps.group.airports![0].name,
            disabledShowUnchecked: true,
            disabled: false,
            checked: false,
        });
        expect(mockCheckboxItemProps).toHaveBeenNthCalledWith(3, {
            code: mockProps.group.airports![1].code,
            name: mockProps.group.airports![1].name,
            disabledShowUnchecked: true,
            disabled: false,
            checked: false,
        });
    });

    it('should render standalone airport checkbox', () => {
        mockProps.group = { name: 'LTN', code: 'LTN' };

        const { container } = render(<AirportCheckboxRow {...mockProps} />);

        expect(screen.queryByTestId('icon-chevron-down')).not.toBeInTheDocument();
        expect(mockCheckboxItemProps).toHaveBeenCalledTimes(1);
        expect(mockCheckboxItemProps).toHaveBeenCalledWith({
            code: mockProps.group.code,
            name: mockProps.group.name,
            icon: true,
            disabledShowUnchecked: true,
            disabled: false,
            checked: false,
        });
        expect(container.getElementsByClassName(styles.subRow).length).toBe(0);
    });

    describe('expand group', () => {
        it('should expand market group by default', () => {
            const { container } = render(<AirportCheckboxRow {...mockProps} />);

            expect(container.firstChild).toHaveClass(styles.row);
            expect(container.firstChild).toHaveClass(styles.openedRow);
        });

        it('should collapse market group by click on ChevronDown icon', () => {
            const { container } = render(<AirportCheckboxRow {...mockProps} />);

            expect(container.firstChild).toHaveClass(styles.openedRow);

            fireEvent.click(screen.getByTestId('icon-chevron-down'));

            expect(container.firstChild).not.toHaveClass(styles.openedRow);
        });
    });

    describe('changeItemSelection', () => {
        it('should call onAddOrigin when selecting a standalone airport checkbox', () => {
            mockProps.group = { name: 'LTN', code: 'LTN' };
            render(<AirportCheckboxRow {...mockProps} />);

            const standaloneAirportItem = screen.getAllByTestId('checkbox-item')[0];
            const standaloneAirportItemCode = mockProps.group.code;
            fireEvent.click(within(standaloneAirportItem).getByRole('button', { name: 'check' }));

            expect(mockProps.onAddOrigin).toHaveBeenCalledTimes(1);
            expect(mockProps.onAddOrigin).toHaveBeenCalledWith(standaloneAirportItemCode);
        });

        it('should call onRemoveOrigin when deselecting a standalone airport checkbox', () => {
            mockProps.group = { name: 'LTN', code: 'LTN' };
            render(<AirportCheckboxRow {...mockProps} />);

            const standaloneAirportItem = screen.getAllByTestId('checkbox-item')[0];
            const standaloneAirportItemCode = mockProps.group.code;
            fireEvent.click(within(standaloneAirportItem).getByRole('button', { name: 'uncheck' }));

            expect(mockProps.onRemoveOrigin).toHaveBeenCalledTimes(1);
            expect(mockProps.onRemoveOrigin).toHaveBeenCalledWith(standaloneAirportItemCode);
        });

        it('should call onAddOrigin when selecting an airport checkbox inside a group', () => {
            render(<AirportCheckboxRow {...mockProps} />);

            const airportItemItem = screen.getAllByTestId('checkbox-item')[1];
            const airportItemItemCode = mockProps.group.airports![0].code;
            fireEvent.click(within(airportItemItem).getByRole('button', { name: 'check' }));

            expect(mockProps.onAddOrigin).toHaveBeenCalledTimes(1);
            expect(mockProps.onAddOrigin).toHaveBeenCalledWith(airportItemItemCode);
        });

        it('should call onRemoveOrigin when deselecting an airport checkbox inside a group', () => {
            render(<AirportCheckboxRow {...mockProps} />);

            const airportItemItem = screen.getAllByTestId('checkbox-item')[1];
            const airportItemItemCode = mockProps.group.airports![0].code;
            fireEvent.click(within(airportItemItem).getByRole('button', { name: 'uncheck' }));

            expect(mockProps.onRemoveOrigin).toHaveBeenCalledTimes(1);
            expect(mockProps.onRemoveOrigin).toHaveBeenCalledWith(airportItemItemCode);
        });
    });

    describe('changeGroupSelection', () => {
        it('should select all airports in the market group by clicking on unchecked group checkbox', () => {
            render(<AirportCheckboxRow {...mockProps} />);

            const groupCheckboxItem = screen.getAllByTestId('checkbox-item')[0];
            fireEvent.click(within(groupCheckboxItem).getByRole('button', { name: 'check' }));

            expect(mockProps.setOrigins).toHaveBeenCalledTimes(1);
            expect(mockProps.setOrigins).toHaveBeenCalledWith([
                mockProps.group.airports![0].code,
                mockProps.group.airports![1].code,
            ]);
        });

        it('should deselect all airports in the market group by clicking on checked group checkbox', () => {
            render(<AirportCheckboxRow {...mockProps} />);

            const groupCheckboxItem = screen.getAllByTestId('checkbox-item')[0];
            fireEvent.click(within(groupCheckboxItem).getByRole('button', { name: 'uncheck' }));

            expect(mockProps.setOrigins).toHaveBeenCalledTimes(1);
            expect(mockProps.setOrigins).toHaveBeenCalledWith([]);
        });
    });

    describe('Tracking', () => {
        describe('trackFromRegionSelectAll', () => {
            it('should call trackFromRegionSelectAll when selecting all airports in a group', () => {
                render(<AirportCheckboxRow {...mockProps} />);

                const groupCheckboxItem = screen.getAllByTestId('checkbox-item')[0];
                fireEvent.click(within(groupCheckboxItem).getByRole('button', { name: 'check' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectAll).toHaveBeenCalledTimes(1);
                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectAll).toHaveBeenCalledWith(
                    mockProps.group,
                    [mockProps.group.airports![1].itemName],
                    mockProps.origins,
                    true,
                );
            });

            it('should call trackFromRegionSelectAll when deselecting all airports in a group', () => {
                mockProps.origins = ['LTN', 'LGW'];
                render(<AirportCheckboxRow {...mockProps} />);

                const groupCheckboxItem = screen.getAllByTestId('checkbox-item')[0];
                fireEvent.click(within(groupCheckboxItem).getByRole('button', { name: 'uncheck' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectAll).toHaveBeenCalledTimes(1);
                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectAll).toHaveBeenCalledWith(
                    mockProps.group,
                    [],
                    mockProps.origins,
                    false,
                );
            });

            it('should NOT call trackFromRegionSelectAll when isSearchPodInitialized is false', () => {
                mockLocalStore.isSearchPodInitialized = false;
                render(<AirportCheckboxRow {...mockProps} />);

                const groupCheckboxItem = screen.getAllByTestId('checkbox-item')[0];
                fireEvent.click(within(groupCheckboxItem).getByRole('button', { name: 'check' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectAll).not.toHaveBeenCalled();
            });

            it('should NOT call trackFromRegionSelectAll when useSearchPodStore returns null', () => {
                mockLocalStore = null;
                render(<AirportCheckboxRow {...mockProps} />);

                const groupCheckboxItem = screen.getAllByTestId('checkbox-item')[0];
                fireEvent.click(within(groupCheckboxItem).getByRole('button', { name: 'check' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectAll).not.toHaveBeenCalled();
            });
        });

        describe('trackFromRegionSelectSingle', () => {
            it('should call trackFromRegionSelectSingle when selecting a single airport in a group', () => {
                render(<AirportCheckboxRow {...mockProps} />);

                const airportItem = screen.getAllByTestId('checkbox-item')[1];
                fireEvent.click(within(airportItem).getByRole('button', { name: 'check' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).toHaveBeenCalledTimes(1);
                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).toHaveBeenCalledWith(
                    mockProps.group,
                    mockProps.group.airports![0].code,
                    true,
                );
            });

            it('should call trackFromRegionSelectSingle when deselecting a single airport in a group', () => {
                render(<AirportCheckboxRow {...mockProps} />);

                const airportItem = screen.getAllByTestId('checkbox-item')[1];
                fireEvent.click(within(airportItem).getByRole('button', { name: 'uncheck' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).toHaveBeenCalledTimes(1);
                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).toHaveBeenCalledWith(
                    mockProps.group,
                    mockProps.group.airports![0].code,
                    false,
                );
            });

            it('should call trackFromRegionSelectSingle when selecting a standalone airport', () => {
                mockProps.group = { name: 'LTN', code: 'LTN' };
                render(<AirportCheckboxRow {...mockProps} />);

                const standaloneAirportItem = screen.getAllByTestId('checkbox-item')[0];
                fireEvent.click(within(standaloneAirportItem).getByRole('button', { name: 'check' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).toHaveBeenCalledTimes(1);
                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).toHaveBeenCalledWith(
                    mockProps.group,
                    mockProps.group.code,
                    true,
                );
            });

            it('should call trackFromRegionSelectSingle when deselecting a standalone airport', () => {
                mockProps.group = { name: 'LTN', code: 'LTN' };
                render(<AirportCheckboxRow {...mockProps} />);

                const standaloneAirportItem = screen.getAllByTestId('checkbox-item')[0];
                fireEvent.click(within(standaloneAirportItem).getByRole('button', { name: 'uncheck' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).toHaveBeenCalledTimes(1);
                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).toHaveBeenCalledWith(
                    mockProps.group,
                    mockProps.group.code,
                    false,
                );
            });

            it('should NOT call trackFromRegionSelectSingle when isSearchPodInitialized is false', () => {
                mockLocalStore.isSearchPodInitialized = false;
                render(<AirportCheckboxRow {...mockProps} />);

                const airportItem = screen.getAllByTestId('checkbox-item')[1];
                fireEvent.click(within(airportItem).getByRole('button', { name: 'check' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).not.toHaveBeenCalled();
            });

            it('should NOT call trackFromRegionSelectSingle when useSearchPodStore returns null', () => {
                mockLocalStore = null;
                render(<AirportCheckboxRow {...mockProps} />);

                const airportItem = screen.getAllByTestId('checkbox-item')[1];
                fireEvent.click(within(airportItem).getByRole('button', { name: 'check' }));

                expect(mockStores.trackingStore.searchPod.trackFromRegionSelectSingle).not.toHaveBeenCalled();
            });
        });
    });
});
