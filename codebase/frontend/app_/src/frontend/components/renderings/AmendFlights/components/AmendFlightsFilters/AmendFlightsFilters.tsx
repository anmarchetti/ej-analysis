import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import AmendmentSort from 'frontend/components/common/Amend/AmendmentSort/AmendmentSort';
import FiltersContainer from 'frontend/components/common/SearchFilters/FiltersContainer';
import { FlightsPreFilteredMessage } from 'frontend/components/renderings/AmendFlights/components/FlightsPreFilteredMessage';

interface IAmendFlightsFiltersProps {
    isShowPrefilteredMessage?: boolean;
}

export const AmendFlightsFilters = ({ isShowPrefilteredMessage }: IAmendFlightsFiltersProps) => {
    const {
        isScreenLessMedium,
        activeFilterCode,
        filters,
        selectedFilters,
        status,
        isFilterSelected,
        isFilterGroupDisabled,
        onCloseFilters,
        onSelectFilter,
        onSelectFilterGroup,
        onRemoveSelectedFilter,
        onClearAllSelectedFilters,
        fetchResults,
        togglePreFilteredMessage,
        sortBy,
        onChangeSortBy,
        sortOptions,
        selectedSortOption,
    } = useStore((stores: IHolidaysStores) => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        activeFilterCode: stores.amendFlightsStore.activeFilterCode,
        filters: stores.amendFlightsStore.filters,
        selectedFilters: stores.amendFlightsStore.selectedFilters,
        status: stores.amendFlightsStore.status,
        isFilterSelected: stores.amendFlightsStore.isFilterSelected,
        isFilterGroupDisabled: stores.amendFlightsStore.isFilterGroupDisabled,
        onCloseFilters: stores.amendFlightsStore.onCloseFilters,
        onSelectFilter: stores.amendFlightsStore.onSelectFilter,
        onSelectFilterGroup: stores.amendFlightsStore.onSelectFilterGroup,
        onRemoveSelectedFilter: stores.amendFlightsStore.onRemoveSelectedFilter,
        onClearAllSelectedFilters: stores.amendFlightsStore.onClearAllSelectedFilters,
        fetchResults: stores.amendFlightsStore.loadInitialAlternativeFlights,
        togglePreFilteredMessage: stores.amendFlightsStore.togglePreFilteredMessage,
        sortBy: stores.amendFlightsStore.sorting.sortBy,
        onChangeSortBy: stores.amendFlightsStore.onChangeSortBy,
        sortOptions: stores.amendFlightsStore.sorting.sortOptions,
        selectedSortOption: stores.amendFlightsStore.sorting.selectedSortOption,
    }));

    if (!filters.length) {
        return null;
    }

    return (
        <div className='alternative-flights__filters-bar'>
            <div className='alternative-flights__filters'>
                <FiltersContainer
                    activeFilterCode={activeFilterCode}
                    availableFilters={filters}
                    selectedFilters={selectedFilters}
                    status={status}
                    isApplyDisabled={false}
                    isFiltersLoaded
                    isFilterGroupDisabled={isFilterGroupDisabled}
                    hideFiltersLabel
                    checkIsFilterSelected={isFilterSelected}
                    onCloseFilters={onCloseFilters}
                    onSelectFilters={onSelectFilter}
                    onSelectFilterGroup={onSelectFilterGroup}
                    onClearSelectedFilters={onClearAllSelectedFilters}
                    onRemoveSpecificFilter={onRemoveSelectedFilter}
                    selectedDestinationCodesQuery={null}
                    fetchResults={fetchResults}
                    onOpenDrawer={() => togglePreFilteredMessage(false)}
                />
                {isShowPrefilteredMessage && isScreenLessMedium && <FlightsPreFilteredMessage />}
            </div>
            <AmendmentSort
                options={sortOptions}
                selectedSortOption={selectedSortOption}
                sortBy={sortBy}
                onChangeSortBy={onChangeSortBy}
                wrapperClassName='alternative-flights__sort'
            />
        </div>
    );
};

export default observer(AmendFlightsFilters);
