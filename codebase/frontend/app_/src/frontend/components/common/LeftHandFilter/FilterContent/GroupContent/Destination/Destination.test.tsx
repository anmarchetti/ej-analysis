import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { availableFilters } from 'frontend/__mocks__/filters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import DestinationContent from './Destination';

const mockFilterCheckControl = jest.fn();
jest.mock(
    'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl/FilterCheckControl',
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
let mockFilterStore;
const destinationData = availableFilters[0];
const packageThemeData = availableFilters[6];

describe('<DestinationContent />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                onChange: jest.fn(),
                isLastSelectDestination: jest.fn(() => false),
                isOptionDisabled: jest.fn(() => false),
                isFilterGroupSelected: jest.fn(() => true),
                getPreparedGroupContent: jest.fn(() => [destinationData, packageThemeData]),
                isCountHidden: false,
            },
        });
        mockFilterStore = mockStores.searchFiltersStore;
    });

    it('should render content data', () => {
        render(<DestinationContent code={FilterGroupCodes.PackageTheme} storeInstance={mockFilterStore} />);

        expect(screen.getAllByTestId('filter-check-control')).toHaveLength(2);
        expect(mockFilterCheckControl).toHaveBeenNthCalledWith(1, {
            checked: true,
            disabled: false,
            hiddenZeroCount: true,
            option: destinationData,
            hideLabelCount: false,
        });

        expect(mockFilterCheckControl).toHaveBeenNthCalledWith(2, {
            checked: true,
            disabled: false,
            hiddenZeroCount: true,
            option: packageThemeData,
            hideLabelCount: false,
        });
    });

    it('should hide lable count if needed', () => {
        mockFilterStore.isCountHidden = true;
        render(<DestinationContent code={FilterGroupCodes.PackageTheme} storeInstance={mockFilterStore} />);

        expect(screen.getAllByTestId('filter-check-control')).toHaveLength(2);
        expect(mockFilterCheckControl).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                hideLabelCount: true,
            }),
        );

        expect(mockFilterCheckControl).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                hideLabelCount: true,
            }),
        );
    });

    it('should call onChange when filter-check-control clicked', async () => {
        render(<DestinationContent storeInstance={mockFilterStore} code={FilterGroupCodes.Destination} />);

        const button = screen.getAllByTestId('filter-check-control')[0];
        await userEvent.click(button);

        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalledWith(destinationData);
    });
});
