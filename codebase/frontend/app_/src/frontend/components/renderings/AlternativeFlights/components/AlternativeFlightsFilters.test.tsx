import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AlternativeFlightsFilters from './AlternativeFlightsFilters';

const createStores = () => ({
    alternativeFlightsStore: {
        activeFilterCode: 'code',
        filters: ['code', 'test'],
        selectedFilters: 'code',
        isFilterSelected: false,
        isFilterGroupDisabled: false,
        sortOptions: [],
        selectedSortOption: [],

        onCloseFilters: jest.fn(),
        onSelectFilter: jest.fn(),
        removeSelectedFilter: jest.fn(),
        clearSelectedFilters: jest.fn(),
        sortBy: jest.fn(),
        setSortBy: jest.fn(),
    },
    priceGraphStore: { clearAlternativeOffers: jest.fn() },
    comparePricesCalendarStore: { resetToInitial: jest.fn() },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/SearchFilters/FiltersContainer', () => ({
    __esModule: true,
    default: ({ fetchResults }) => <button onClick={fetchResults} onKeyDown={jest.fn()} data-tid='filters-container' />,
}));

jest.mock('frontend/components/common/Amend/AmendmentSort/AmendmentSort', () => () => (
    <div data-tid='amendment-sort' />
));

describe('<AlternativeFlightsFilters />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render FiltersContainer', () => {
        render(<AlternativeFlightsFilters />);

        expect(screen.getByTestId('filters-container')).toBeInTheDocument();
    });

    it('should call clearAlternativeOffers and resetToInitial on FiltersContainer fetchResults', async () => {
        render(<AlternativeFlightsFilters />);

        await userEvent.click(screen.getByTestId('filters-container'));

        expect(mockStores.priceGraphStore.clearAlternativeOffers).toHaveBeenCalled();
        expect(mockStores.comparePricesCalendarStore.resetToInitial).toHaveBeenCalled();
    });

    it('should NOT render FiltersContainer when no filters', () => {
        mockStores.alternativeFlightsStore.filters = [];

        render(<AlternativeFlightsFilters />);

        expect(screen.queryByTestId('filters-container')).not.toBeInTheDocument();
    });

    it('should render AmendmentSort', () => {
        render(<AlternativeFlightsFilters />);

        expect(screen.getByTestId('amendment-sort')).toBeInTheDocument();
    });
});
