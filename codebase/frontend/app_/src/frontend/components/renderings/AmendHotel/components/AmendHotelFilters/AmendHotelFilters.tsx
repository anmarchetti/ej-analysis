import React, { FC, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import ClearAllPanel from 'frontend/components/common/LeftHandFilter/ClearAllPanel';
import FilterContentElement from 'frontend/components/common/LeftHandFilter/FilterContent/FilterContentWrapper/FilterContentElement/FilterContentElement';
import FiltersHeader from 'frontend/components/common/LeftHandFilter/FilterContent/FilterHeader';

import styles from './AmendHotelFilters.module.scss';

const filtersToShow = [
    FilterGroupCodes.BoardType,
    FilterGroupCodes.StarRating,
    FilterGroupCodes.Facilities,
    FilterGroupCodes.PriceRange,
];

const AmendHotelFilters: FC = () => {
    const { availableFilters, hideAllFilter, isFiltersLoaded, filtersStore, isMobileDrawerOpen } = useStore(
        (stores: IHolidaysStores) => ({
            availableFilters: stores.amendHotelStore.filters.filters,
            isFiltersLoaded: stores.amendHotelStore.filters.isFiltersLoaded,
            hideAllFilter: stores.amendHotelStore.filters.hideAllFilter,
            isMobileDrawerOpen: stores.amendHotelStore.filters.isMobileDrawerOpen,
            filtersStore: stores.amendHotelStore.filters,
        }),
    );

    const isMobile = useMobileViewport();

    useEffect(() => {
        if (isFiltersLoaded) {
            hideAllFilter(isMobile, availableFilters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFiltersLoaded, isMobileDrawerOpen]);

    return (
        <div data-tid='filters-wrapper' className={classNames(styles.filters, 'search-filter')}>
            {!isMobile && <FiltersHeader storeInstance={filtersStore} />}

            <div className={styles.allFilters}>
                {availableFilters
                    .filter(el => filtersToShow.includes(el.code))
                    .map(group => (
                        <FilterContentElement key={group.code} group={group} storeInstance={filtersStore} />
                    ))}
            </div>

            <ClearAllPanel storeInstance={filtersStore} />
        </div>
    );
};

export default observer(AmendHotelFilters);
