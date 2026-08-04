import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { availableFilters } from 'frontend/__mocks__/filters';
import * as mediaQueryUtils from 'frontend/hooks/useMediaQuery';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import FiltersHeader from 'frontend/components/common/LeftHandFilter/FilterContent/FilterHeader';

import FilterContentElement from './FilterContentElement/FilterContentElement';
import FilterContentWrapper from './FilterContentWrapper';

jest.mock('frontend/components/common/LeftHandFilter/FilterContent/FilterHeader', () => ({
    __esModule: true,
    default: () => <button data-tid='filter-header' />,
}));

jest.mock('frontend/components/common/LeftHandFilter/FilterContent/GroupTitle', () => ({
    __esModule: true,
    default: ({ onRemoveAllFilterGroup, onClick }) => (
        <div onClick={onRemoveAllFilterGroup} onKeyDown={jest.fn()} data-tid='group-title'>
            <button onClick={onClick} onKeyDown={jest.fn()} data-tid='group-title-on-click' />
        </div>
    ),
}));

jest.mock('./FilterContentElement/FilterContentElement', () =>
    jest.fn(() => <div data-tid='filter-content-element' />),
);

jest.mock('frontend/components/common/LeftHandFilter/FilterContent/FilterHeader', () =>
    jest.fn(() => <div data-tid='filter-header' />),
);

const mockUseMobileViewport = jest.spyOn(mediaQueryUtils, 'useMobileViewport');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('<FilterContentWrapper />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                filterGroups: availableFilters.filter(el => el.code !== FilterGroupCodes.TripAdvisorRating),
                filters: availableFilters,
                isFilterGroupDisabled: jest.fn(),
                isFilterGroupActive: jest.fn(() => true),
                hideAllFilter: jest.fn(),
                onTitleClick: jest.fn(),
                onClear: jest.fn(),
            },
            hotelsStore: {
                numberOfHotels: 10,
            },
            routerStore: {
                updateSearchResultsPage: jest.fn(),
            },
        });

        mockUseMobileViewport.mockReturnValue(false);
    });

    it('should be rendered when filterGroups is NOT empty', () => {
        render(<FilterContentWrapper />);

        expect(screen.getAllByTestId('filter-header')).toHaveLength(1);
        expect(screen.getAllByTestId('filter-content-element')).toHaveLength(
            mockStores.searchFiltersStore.filterGroups.length,
        );

        expect(FilterContentElement).toHaveBeenCalledWith(
            expect.objectContaining({ storeInstance: mockStores.searchFiltersStore, group: expect.anything() }),
            {},
        );
    });

    it('should not be rendered when filterGroups is empty', () => {
        mockStores.searchFiltersStore.filterGroups = [];

        render(<FilterContentWrapper />);

        expect(screen.queryByTestId('group-title')).not.toBeInTheDocument();
        expect(screen.queryByTestId('group-content')).not.toBeInTheDocument();
    });

    it('should call hideAllFilter with true when isCollapsed is true', () => {
        render(<FilterContentWrapper isCollapsed />);

        expect(mockStores.searchFiltersStore.hideAllFilter).toHaveBeenCalledWith(true, availableFilters);
    });

    it('should call hideAllFilter with false when isCollapsed is false', () => {
        render(<FilterContentWrapper isCollapsed={false} />);

        expect(mockStores.searchFiltersStore.hideAllFilter).toHaveBeenCalledWith(false, availableFilters);
    });

    it('should NOT call hideAllFilter when isCollapsed is undefined', () => {
        render(<FilterContentWrapper />);

        expect(mockStores.searchFiltersStore.hideAllFilter).not.toHaveBeenCalled();
    });

    it('should NOT render FilterTitle when available filters are NOT provided', () => {
        mockStores.searchFiltersStore.filters = undefined;
        render(<FilterContentWrapper />);

        expect(screen.queryByTestId('FilterTitle')).not.toBeInTheDocument();
    });

    describe('FilterHeader', () => {
        it('should render filter-header on desktop', () => {
            render(<FilterContentWrapper />);

            expect(screen.getByTestId('filter-header')).toBeInTheDocument();
            expect(FiltersHeader).toHaveBeenCalledWith(
                expect.objectContaining({
                    storeInstance: mockStores.searchFiltersStore,
                }),
                {},
            );
        });

        it('should NOT render filter-header on mobile', () => {
            mockUseMobileViewport.mockReturnValue(true);

            render(<FilterContentWrapper />);

            expect(screen.queryByTestId('filter-header')).not.toBeInTheDocument();
        });
    });
});
