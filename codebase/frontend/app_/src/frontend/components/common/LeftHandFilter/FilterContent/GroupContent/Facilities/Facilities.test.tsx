import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { availableFilters } from 'frontend/__mocks__/filters';

import Facilities from './Facilities';

const mockFilterCheckControl = jest.fn();
jest.mock(
    'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl',
    () => ({
        __esModule: true,
        default: ({ children, onChange, ...props }) => {
            mockFilterCheckControl(props);

            return (
                <button onClick={onChange} onKeyDown={jest.fn()} data-tid='filter-check-control'>
                    {children}
                </button>
            );
        },
    }),
);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
const facilitiesData = availableFilters[8].options;

describe('<Facilities />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                onChange: jest.fn(),
                isOptionDisabled: jest.fn(() => false),
                isFilterGroupSelected: jest.fn(() => true),
                getPreparedGroupContent: jest.fn(() => facilitiesData),
                isCountHidden: false,
            },
        });
    });

    it('renders facilities data', () => {
        render(<Facilities storeInstance={mockStores.searchFiltersStore} />);

        expect(screen.getAllByTestId('facilities-group-header')).toHaveLength(6);
        expect(screen.getAllByTestId('filter-check-control')).toHaveLength(13);
        expect(mockFilterCheckControl).toHaveBeenNthCalledWith(1, {
            checked: true,
            disabled: false,
            hiddenZeroCount: true,
            option: facilitiesData[0].children![0],
            hideLabelCount: false,
        });

        expect(mockFilterCheckControl).toHaveBeenNthCalledWith(13, {
            checked: true,
            disabled: false,
            hiddenZeroCount: true,
            option: facilitiesData[5].children![0],
            hideLabelCount: false,
        });
    });

    it('calls onChange when filter-check-control clicked', async () => {
        render(<Facilities storeInstance={mockStores.searchFiltersStore} />);

        const button = screen.getAllByTestId('filter-check-control')[0];

        await userEvent.click(button);

        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalledWith(facilitiesData[0].children![0]);
    });

    it('passes a hideLabelCount prop correctly', () => {
        mockStores.searchFiltersStore.isCountHidden = true;
        render(<Facilities storeInstance={mockStores.searchFiltersStore} />);

        expect(mockFilterCheckControl).toHaveBeenCalledWith(expect.objectContaining({ hideLabelCount: true }));
    });
});
