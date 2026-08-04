import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ISelectedFilterPillProps } from './SelectedFilterPill';
import { ISelectedFiltersProps, SelectedFilters } from './SelectedFilters';

jest.mock('./SelectedFilterPill', () => ({
    SelectedFilterPill: (props: ISelectedFilterPillProps) => (
        <div data-tid='selected-filter-pill'>
            <div className='filter-apply__group--item' data-tid='filter-apply-group-item' onClick={props.onClick}>
                <span className='text'>{props.label}</span>
            </div>
            <button data-tid='remove-icon' onClick={props.onRemoveClick}>
                Remove
            </button>
        </div>
    ),
}));

describe('SelectedFilters', () => {
    const resetMocks = () =>
        ({
            selectedFilters: [
                {
                    code: FilterGroupCodes.Destination,
                    groupCode: FilterGroupCodes.Destination,
                    name: FilterGroupCodes.Destination,
                },
            ],
            availableFilters: [
                {
                    code: FilterGroupCodes.Destination,
                    options: [],
                    name: FilterGroupCodes.Destination,
                },
            ],
            onRemoveFilter: jest.fn(),
            onClearAll: jest.fn(),
            onClick: jest.fn(),
            getPhrase: jest.fn(),
            isScreenExtraSmall: false,
        } as ISelectedFiltersProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        render(<SelectedFilters {...mocks} />);

        const pills = screen.getAllByTestId('selected-filter-pill');
        expect(pills).toHaveLength(1);

        const clearButton = screen.getByTestId('clear-all');
        expect(clearButton).toBeInTheDocument();
        expect(mocks.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.SearchPodFiltersButtonsClearAppliedFilters);
    });

    it('should render price pill', () => {
        mocks.selectedFilters = [];
        mocks.priceFilterLabel = '100£';

        render(<SelectedFilters {...mocks} />);

        const pill = screen.getByTestId('selected-filter-pill');
        expect(pill).toBeInTheDocument();
        expect(pill).toHaveTextContent('100£');

        const clearButton = screen.getByTestId('clear-all');
        expect(clearButton).toBeInTheDocument();
        expect(mocks.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.SearchPodFiltersButtonsClearAppliedFilters);
    });

    it('should render empty if no filters and no price label', () => {
        mocks.selectedFilters = [];
        mocks.priceFilterLabel = null;

        const { container } = render(<SelectedFilters {...mocks} />);

        expect(container.firstChild).toBeNull();
    });

    it('should call onRemoveFilter when clicking the remove icon', async () => {
        render(<SelectedFilters {...mocks} />);

        const removeIcon = screen.getByTestId('remove-icon');
        await userEvent.click(removeIcon);

        expect(mocks.onRemoveFilter).toHaveBeenCalledWith('destination', 'destination');
    });

    it('should call onClearAll when the clear button is clicked', async () => {
        render(<SelectedFilters {...mocks} />);

        const clearButton = screen.getByTestId('clear-all');
        await userEvent.click(clearButton);

        expect(mocks.onClearAll).toHaveBeenCalled();
    });

    it('should call onClick when clicking on a filter pill', async () => {
        render(<SelectedFilters {...mocks} />);

        const filterItem = screen.getByTestId('filter-apply-group-item');
        await userEvent.click(filterItem);

        expect(mocks.onClick).toHaveBeenCalled();
    });
});
