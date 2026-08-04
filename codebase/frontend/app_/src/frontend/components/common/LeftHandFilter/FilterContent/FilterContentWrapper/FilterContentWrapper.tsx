import React, { useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays/create-stores';
import styles from 'frontend/components/common/LeftHandFilter/FilterContent/FilterContent.module.scss';
import FiltersHeader from 'frontend/components/common/LeftHandFilter/FilterContent/FilterHeader';

import FilterContentElement from './FilterContentElement/FilterContentElement';

interface IFilterContentWrapperProps {
    isCollapsed?: boolean;
}

const FilterContentWrapper = ({ isCollapsed }: IFilterContentWrapperProps) => {
    const { filterGroups, availableFilters, totalOffers, hideAllFilter, store } = useStore(
        (stores: IHolidaysStores) => ({
            filterGroups: stores.searchFiltersStore.filterGroups,
            availableFilters: stores.searchFiltersStore.filters,
            totalOffers: stores.hotelsStore.numberOfHotels,
            hideAllFilter: stores.searchFiltersStore.hideAllFilter,
            countableFilters: stores.searchFiltersStore.countableFilters,
            store: stores.searchFiltersStore,
        }),
    );

    const isMobile = useMobileViewport();

    useEffect(() => {
        if (isCollapsed !== undefined) {
            hideAllFilter(isCollapsed, availableFilters);
        }
    }, [totalOffers, isCollapsed, availableFilters, hideAllFilter]);

    return (
        <div className={classNames('search-filter', styles.filterWrapper)}>
            {!isMobile && <FiltersHeader storeInstance={store} />}

            <div className={styles.filters}>
                {filterGroups.map(group => (
                    <FilterContentElement key={group.code} group={group} storeInstance={store} />
                ))}
            </div>
        </div>
    );
};

export default observer(FilterContentWrapper);
