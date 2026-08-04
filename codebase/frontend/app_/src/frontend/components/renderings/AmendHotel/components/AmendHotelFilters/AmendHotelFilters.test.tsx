import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import ClearAllPanel from 'frontend/components/common/LeftHandFilter/ClearAllPanel';
import FilterContentElement from 'frontend/components/common/LeftHandFilter/FilterContent/FilterContentWrapper/FilterContentElement/FilterContentElement';
import FiltersHeader from 'frontend/components/common/LeftHandFilter/FilterContent/FilterHeader';

import AmendHotelFilters from './AmendHotelFilters';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock('frontend/hooks/useMediaQuery');

jest.mock('frontend/components/common/LeftHandFilter/FilterContent/FilterHeader', () => ({
    __esModule: true,
    default: () => <div data-tid='filter-header' />,
}));

jest.mock(
    'frontend/components/common/LeftHandFilter/FilterContent/FilterContentWrapper/FilterContentElement/FilterContentElement',
    () => jest.fn(({ group }) => <div data-tid='filter-content-element'>{group.code}</div>),
);
jest.mock('frontend/components/common/LeftHandFilter/ClearAllPanel', () => jest.fn(() => <div data-tid='clear-all' />));
jest.mock('frontend/components/common/LeftHandFilter/FilterContent/FilterHeader', () =>
    jest.fn(() => <div data-tid='filter-header' />),
);

let mockStores;

const mockStore = () =>
    createMockStores({
        amendHotelStore: {
            isLoadingAlternativeHotels: false,
            filters: {
                onSelectFilters: jest.fn(),
                filters: [{ code: FilterGroupCodes.BoardType, name: 'Board Type' }],
                selectedFilterGroups: [],
                isFiltersLoaded: true,
                onClearAllFilters: jest.fn(),
                countableFilters: [],
                isFilterGroupDisabled: jest.fn().mockReturnValue(false),
                onRemoveFilterGroup: jest.fn(),
                selectedFilters: [],
                hideAllFilter: jest.fn(),
                onClearAllSelectedFilters: jest.fn(),
                isFilterGroupActive: jest.fn().mockReturnValue(true),
                onTitleClick: jest.fn(),
                onClear: jest.fn(),
            },
        },
        layoutStore: {
            getPhrase: jest.fn(),
        },
    });

describe('AmendHotelFilters', () => {
    beforeEach(() => {
        mockStores = mockStore();
        jest.mocked(useMobileViewport).mockReturnValue(false);
    });

    it('should render AmendHotelFilters component', () => {
        render(<AmendHotelFilters />);
        expect(screen.getByTestId('filters-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('filter-header')).toBeInTheDocument();

        expect(FilterContentElement).toHaveBeenCalledWith(
            expect.objectContaining({
                storeInstance: mockStores.amendHotelStore.filters,
                group: mockStores.amendHotelStore.filters.filters[0],
            }),
            {},
        );
        expect(ClearAllPanel).toHaveBeenCalledWith(
            expect.objectContaining({
                storeInstance: mockStores.amendHotelStore.filters,
            }),
            {},
        );
        expect(FiltersHeader).toHaveBeenCalledWith(
            expect.objectContaining({
                storeInstance: mockStores.amendHotelStore.filters,
            }),
            {},
        );
    });

    it('should not render FiltersHeader when on mobile', () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        render(<AmendHotelFilters />);
        expect(screen.queryByTestId('filter-header')).not.toBeInTheDocument();
    });

    it('should call hideAllFilter when isFiltersLoaded changes', () => {
        render(<AmendHotelFilters />);
        expect(mockStores.amendHotelStore.filters.hideAllFilter).toHaveBeenCalledWith(
            false,
            mockStores.amendHotelStore.filters.filters,
        );
    });

    it('should call useEffect when isMobileDrawerOpen changes', async () => {
        const { rerender } = render(<AmendHotelFilters />);
        mockStores.amendHotelStore.filters.isMobileDrawerOpen = true;
        rerender(<AmendHotelFilters />);
        waitFor(() => expect(mockStores.amendHotelStore.filters.hideAllFilter).toHaveBeenCalledTimes(2));
    });

    it('should filter out specific filter groups', () => {
        const excludedFilters = [
            { code: FilterGroupCodes.TripAdvisorRating, name: 'TripAdvisor Rating' },
            { code: FilterGroupCodes.Destination, name: 'Destination' },
            { code: FilterGroupCodes.Offers, name: 'Offers' },
            { code: FilterGroupCodes.Flights, name: 'Flights' },
            { code: FilterGroupCodes.FlightTimes, name: 'Flight Times' },
            { code: FilterGroupCodes.Duration, name: 'Duration' },
            { code: FilterGroupCodes.HotelTypes, name: 'Hotel Types' },
            { code: FilterGroupCodes.PackageTheme, name: 'Package Theme' },
            { code: 'new filter', name: 'new filter' },
        ];
        const includedFilters = [
            { code: FilterGroupCodes.BoardType, name: 'Board Type' },
            { code: FilterGroupCodes.StarRating, name: 'Star Rating' },
            { code: FilterGroupCodes.Facilities, name: 'Facilities' },
            { code: FilterGroupCodes.PriceRange, name: 'Price Range' },
        ];

        mockStores.amendHotelStore.filters.filters = [...includedFilters, ...excludedFilters];

        render(<AmendHotelFilters />);

        excludedFilters.forEach(filter => {
            expect(screen.queryByText(filter.code)).not.toBeInTheDocument();
        });
        includedFilters.forEach(filter => {
            expect(screen.queryByText(filter.code)).toBeInTheDocument();
        });
    });
});
