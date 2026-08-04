import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IFilters } from 'models/data/IFilters';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IActiveExperiment } from 'frontend/components/cro/ExperimentOptimizely/utils/experiment.utils';

import { FiltersContainer, IFiltersContainerProps } from './FiltersContainer';

const createStores = () => createMockStores();

const availableFiltersMock = [
    {
        code: FilterGroupCodes.Facilities,
        options: [
            { code: 'C', name: 'City', count: 1, groupCode: FilterGroupCodes.PackageTheme },
            {
                code: 'B',
                name: 'Beach',
                count: 2,
                children: [
                    { code: 'BF', name: 'Family', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                    { code: 'BL', name: 'Luxury', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                ],
            },
        ],
    },
    {
        code: FilterGroupCodes.Destination,
        options: [
            { code: 'C', name: 'City', count: 1, groupCode: FilterGroupCodes.PackageTheme },
            {
                code: 'B',
                name: 'Beach',
                count: 2,
                children: [
                    { code: 'BF', name: 'Family', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                    { code: 'BL', name: 'Luxury', count: 1, groupCode: FilterGroupCodes.PackageTheme },
                ],
            },
        ],
    },
] as IFilters[];

const mockExperiment: IActiveExperiment = {
    activeVariantId: '25812630033',
    config: {
        experimentId: '25803030761',
        pagesId: '25808730036',
        variantA: '25812630033',
        originalVariant: '25750360760',
    },
};

const createProps = (): IFiltersContainerProps => ({
    activeFilterCode: FilterGroupCodes.Facilities,
    availableFilters: availableFiltersMock,
    selectedFilters: [],
    checkIsFilterSelected: jest.fn(),
    getSetting: jest.fn(),
    isFiltersLoaded: true,
    isPromoPage: false,
    isSearchResultsPage: true,
    isScreenLessMedium: false,
    isFilterGroupDisabled: jest.fn(),
    onClearSelectedFilters: jest.fn(),
    onRemoveSpecificFilter: jest.fn(),
    setPageNumber: jest.fn(),
    setPrevPageNumber: jest.fn(),
    onCloseFilters: jest.fn(),
    onSelectFilterGroup: jest.fn(),
    onSelectFilters: jest.fn(),
    clearIsClickBackToSearch: jest.fn(),
    changeIsPresetDestinationFilter: jest.fn(),
    setSeachPerformWithNewParams: jest.fn(),
    selectedDestinationCodesQuery: '',
    status: DataStatus.Loaded,
    onApply: jest.fn(),
    onCancel: jest.fn(),
    getPhrase: jest.fn(v => v),
    updateSearchResultsPage: jest.fn(),
    onChangeSearchFilterStore: jest.fn(),
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSelectedFiltersComponent = jest.fn();
jest.mock('frontend/components/common/SearchFilters/SelectedFilters', () => ({
    __esModule: true,
    default: ({ onClearAll, onRemoveFilter, ...props }) => {
        mockSelectedFiltersComponent(props);

        return (
            <div data-tid='selected-filters'>
                <span>Filer Example</span>
                <button data-tid='remove-filter-button' onClick={onRemoveFilter}>
                    Remove Selected Filter
                </button>
                <button data-tid='filters-clear-btn' onClick={onClearAll}>
                    Clear Filters
                </button>
            </div>
        );
    },
}));

const mockFilterTileComponent = jest.fn();
jest.mock('frontend/components/common/SearchFilters/FilterTile', () => ({
    __esModule: true,
    default: ({ onClick, code, ...props }) => {
        mockFilterTileComponent(props);

        return (
            <div data-tid='filter-tile' onClick={() => onClick(code)}>
                Filter Tile
            </div>
        );
    },
}));

const mockFilterContentComponent = jest.fn();
jest.mock('frontend/components/common/SearchFilters/FilterContent', () => ({
    __esModule: true,
    default: ({ onApply, onCancel, onSelectFilters, ...props }) => {
        mockFilterContentComponent(props);

        return (
            <div data-tid='filter-content'>
                <input type='checkbox' data-tid='filter-checkbox' name='Filter Content' onChange={onSelectFilters} />
                <span>Filter Content</span>
                <button data-tid='filter-apply-btn' onClick={onApply}>
                    Apply
                </button>
                <button data-tid='filter-close-btn' onClick={onCancel}>
                    Close
                </button>
            </div>
        );
    },
}));

const mockNoResultsErrorBlockComponent = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/NoResultsErrorBlock/NoResultsErrorBlock', () => ({
    __esModule: true,
    default: props => {
        mockNoResultsErrorBlockComponent(props);

        return <div data-tid='no-results-error-block'>NoResultsErrorBlock</div>;
    },
}));

describe('FiltersContainer', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render loading state', () => {
        mockProps.isFiltersLoaded = false;
        mockProps.status = DataStatus.Loading;
        render(<FiltersContainer {...mockProps} />);
        expect(screen.getByTestId('placeholder-filter-loading-desktop')).toBeInTheDocument();
    });

    it('should NOT render component when no available filters', () => {
        mockProps.availableFilters = [];

        render(<FiltersContainer {...mockProps} />);

        expect(screen.queryByTestId('filter-tile')).not.toBeInTheDocument();
        expect(screen.queryByTestId('filter-content')).not.toBeInTheDocument();
    });

    it('should render filters when available', () => {
        mockProps.activeFilterCode = FilterGroupCodes.NoFilter;
        render(<FiltersContainer {...mockProps} />);

        expect(screen.getByTestId('search-filter')).toBeInTheDocument();
        expect(mockProps.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.SearchPodFiltersLabelsFilterToRefineYourResults,
        );
        expect(screen.getAllByTestId('filter-tile').length).toBe(availableFiltersMock.length);
        expect(mockProps.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.FilterTypesLabelsHotelFacilities);
        expect(screen.queryByTestId('filter-content')).not.toBeInTheDocument();
    });

    it('should render NoResultsErrorBlock when showParentOffers is true and status is not an error', () => {
        mockProps.showParentOffers = true;

        render(<FiltersContainer {...mockProps} />);
        expect(screen.getByTestId('no-results-error-block')).toBeInTheDocument();
    });

    it('should render with FilterContent when we have activeFilter', () => {
        render(<FiltersContainer {...mockProps} />);

        expect(screen.getByTestId('filter-content')).toBeInTheDocument();
    });

    it('should handle filter tile click', () => {
        mockProps.activeFilterCode = FilterGroupCodes.Destination;
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getAllByTestId('filter-tile')[0]);

        expect(mockProps.onSelectFilterGroup).toHaveBeenCalled();
    });

    it('should handle selected filter tile click', () => {
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getAllByTestId('filter-tile')[0]);

        expect(mockProps.onCloseFilters).toHaveBeenCalled();
    });

    it('should handle apply button click', () => {
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('filter-apply-btn'));
        expect(mockProps.onApply).toHaveBeenCalled();
        expect(mockProps.onCloseFilters).toHaveBeenCalled();
    });

    it('should handle cancel button click', () => {
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('filter-close-btn'));
        expect(mockProps.onCancel).toHaveBeenCalled();
        expect(mockProps.onCloseFilters).toHaveBeenCalled();
    });

    it('should handle clear all button click in selected filters', () => {
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('filters-clear-btn'));
        expect(mockProps.onCloseFilters).toHaveBeenCalled();
        expect(mockProps.onClearSelectedFilters).toHaveBeenCalled();
        expect(mockProps.clearIsClickBackToSearch).toHaveBeenCalled();
        expect(mockProps.changeIsPresetDestinationFilter).toHaveBeenCalled();
        expect(mockProps.setPageNumber).toHaveBeenCalledWith(1);
    });

    it('should call updateSearchResultsPage on clear button click when isSearchResultsPage', () => {
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('filters-clear-btn'));
        expect(mockProps.updateSearchResultsPage).toHaveBeenCalled();
    });

    it('should NOT call updateSearchResultsPage on clear button click when isSearchResultsPage is false', () => {
        mockProps.isSearchResultsPage = false;
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('filters-clear-btn'));
        expect(mockProps.updateSearchResultsPage).not.toHaveBeenCalled();
    });

    it('should call onChangeSearchFilterStore on clear button click when is promo page', () => {
        mockProps.isPromoPage = true;
        mockProps.isSearchResultsPage = false;
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('filters-clear-btn'));

        expect(mockProps.onChangeSearchFilterStore).toHaveBeenCalledWith({
            key: 'isFiltersLoadingScreenEnabled',
            value: false,
        });
    });

    it('should NOT call onChangeSearchFilterStore on clear button click when is NOT promo page', () => {
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('filters-clear-btn'));
        expect(mockProps.onChangeSearchFilterStore).not.toHaveBeenCalled();
    });

    it('should handle remove filter button click in selected filters', () => {
        mockProps.selectedFilters = [
            {
                code: 'code',
                groupCode: FilterGroupCodes.Facilities,
                name: 'name',
            },
        ];
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('remove-filter-button'));
        expect(mockProps.onRemoveSpecificFilter).toHaveBeenCalled();
        expect(mockProps.setPageNumber).toHaveBeenCalledWith(1);
    });

    it('should handle new filter value selection', () => {
        render(<FiltersContainer {...mockProps} />);

        fireEvent.click(screen.getByTestId('filter-checkbox'));
        expect(mockProps.onSelectFilters).toHaveBeenCalled();
    });

    describe('EHD-140 - EJH-17022 - AB Test Destination Carousel', () => {
        it('Should NOT render selected filters when AB test is in progress', () => {
            mockProps.experiment = mockExperiment;
            render(<FiltersContainer {...mockProps} />);

            expect(screen.queryByTestId('selected-filters')).not.toBeInTheDocument();
        });

        it('Should render selected filters when AB test is NOT in progress', () => {
            render(<FiltersContainer {...mockProps} />);

            expect(screen.getByTestId('selected-filters')).toBeInTheDocument();
        });
    });
});
