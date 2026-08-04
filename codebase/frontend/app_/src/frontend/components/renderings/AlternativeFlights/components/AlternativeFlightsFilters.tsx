import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { DataStatus } from 'models/enum/DataStatus';
import AmendmentSort from 'frontend/components/common/Amend/AmendmentSort/AmendmentSort';
import FiltersContainer from 'frontend/components/common/SearchFilters/FiltersContainer';

export const AlternativeFlightsFilters = () => {
    const {
        activeFilterCode,
        filters,
        selectedFilters,
        isFilterSelected,
        isFilterGroupDisabled,
        onCloseFilters,
        onSelectFilter,
        onSelectFilterGroup,
        removeSelectedFilter,
        clearSelectedFilters,
        clearPriceGraph,
        clearPriceCalendar,
        sortBy,
        setSortBy,
        sortOptions,
        selectedSortOption,
    } = useStore(stores => ({
        activeFilterCode: stores.alternativeFlightsStore.activeFilterCode,
        filters: stores.alternativeFlightsStore.filters,
        selectedFilters: stores.alternativeFlightsStore.selectedFilters,
        isFilterSelected: stores.alternativeFlightsStore.isFilterSelected,
        isFilterGroupDisabled: stores.alternativeFlightsStore.isFilterGroupDisabled,
        onCloseFilters: stores.alternativeFlightsStore.onCloseFilters,
        onSelectFilter: stores.alternativeFlightsStore.onSelectFilter,
        onSelectFilterGroup: stores.alternativeFlightsStore.onSelectFilterGroup,
        removeSelectedFilter: stores.alternativeFlightsStore.removeSelectedFilter,
        clearSelectedFilters: stores.alternativeFlightsStore.clearSelectedFilters,
        clearPriceGraph: stores.priceGraphStore.clearAlternativeOffers,
        clearPriceCalendar: stores.comparePricesCalendarStore.resetToInitial,
        sortBy: stores.alternativeFlightsStore.sortBy,
        setSortBy: stores.alternativeFlightsStore.setSortBy,
        sortOptions: stores.alternativeFlightsStore.sortOptions,
        selectedSortOption: stores.alternativeFlightsStore.selectedSortOption,
    }));

    return (
        <div className='alternative-flights__filters-bar'>
            {filters.length > 0 && (
                <div className='alternative-flights__filters'>
                    <FiltersContainer
                        activeFilterCode={activeFilterCode}
                        availableFilters={filters}
                        selectedFilters={selectedFilters}
                        status={DataStatus.Loaded}
                        isApplyDisabled={false}
                        isFiltersLoaded
                        isFilterGroupDisabled={isFilterGroupDisabled}
                        hideFiltersLabel
                        checkIsFilterSelected={isFilterSelected}
                        onCloseFilters={onCloseFilters}
                        onSelectFilters={onSelectFilter}
                        onSelectFilterGroup={onSelectFilterGroup}
                        onClearSelectedFilters={clearSelectedFilters}
                        onRemoveSpecificFilter={removeSelectedFilter}
                        selectedDestinationCodesQuery={null}
                        fetchResults={() => {
                            // Clear the price module data if filters changed, because they applied to price module too.
                            clearPriceGraph();
                            clearPriceCalendar();
                        }}
                        isInDrawer
                    />
                </div>
            )}
            <AmendmentSort
                options={sortOptions}
                selectedSortOption={selectedSortOption}
                sortBy={sortBy}
                onChangeSortBy={setSortBy}
                wrapperClassName='alternative-flights__sort'
            />
        </div>
    );
};

export default observer(AlternativeFlightsFilters);
