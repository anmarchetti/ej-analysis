import React, { FC, useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import FiltersContainer from 'frontend/components/common/SearchFilters/FiltersContainer';
import PathBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

import styles from './MediaCenterFilters.module.scss';

export interface IMediaCenterFiltersSitecoreFields {
    Title: ISitecoreField<string>;
}

export type TMediaCenterFiltersProps = ISitecoreComponent<IMediaCenterFiltersSitecoreFields>;

const MediaCenterFilters: FC<TMediaCenterFiltersProps> = ({ fields }) => {
    const {
        isApplyDisabled,
        onApply,
        onCancel,
        fetchResults,
        availableFilters,
        onSelectFilterGroup,
        onCloseFilters,
        activeFilterCode,
        selectedFilters,
        onSelectFilters,
        onClearSelectedFilters,
        onRemoveSpecificFilter,
        isFiltersLoaded,
        setPageNumber,
        status,
        checkIsFilterSelected,
        parseBrowserQuery,
        setFiltersFromQueryParamsStore,
        isFilterGroupDisabled,
    } = useStore((stores: IHolidaysStores) => ({
        isApplyDisabled: stores.mediaCenterStore.isApplyDisabled,
        onApply: stores.mediaCenterStore.onApplyDateFilter,
        onCancel: stores.mediaCenterStore.onCloseDateFilter,
        fetchResults: stores.mediaCenterStore.fetchArticles,
        availableFilters: stores.mediaCenterStore.filters,
        onSelectFilterGroup: stores.mediaCenterStore.onSelectFilterGroup,
        onCloseFilters: stores.mediaCenterStore.onCloseFilters,
        activeFilterCode: stores.mediaCenterStore.activeFilterCode,
        selectedFilters: stores.mediaCenterStore.selectedFilters,
        onSelectFilters: stores.mediaCenterStore.onSelectFilters,
        onClearSelectedFilters: stores.mediaCenterStore.onClearAllSelectedFilters,
        onRemoveSpecificFilter: stores.mediaCenterStore.onRemoveSelectedFilter,
        isFiltersLoaded: stores.mediaCenterStore.isFiltersLoaded,
        setPageNumber: stores.mediaCenterStore.setPageNumber,
        status: stores.mediaCenterStore.status,
        checkIsFilterSelected: stores.mediaCenterStore.isFilterSelected,
        parseBrowserQuery: stores.queryParamStore.parseBrowserQuery,
        setFiltersFromQueryParamsStore: stores.mediaCenterStore.setFiltersFromQueryParamsStore,
        isFilterGroupDisabled: stores.mediaCenterStore.isFilterGroupDisabled,
    }));

    const isMoreThenMobile = useMoreThenMobileViewport();

    useEffect(() => {
        // set filters from URL query
        parseBrowserQuery(location.search);
        setFiltersFromQueryParamsStore();

        return () => {
            onClearSelectedFilters();
        };
    }, []);

    return (
        <>
            <div className={styles.pressReleasesBreadcrumbs}>
                <PathBreadcrumbs wrapperClassName={styles.pathBreadcrumbsWrapper} className={styles.pathBreadcrumbs} />
            </div>
            <div
                className={classNames(styles.filtersWrapper, {
                    [styles.filtersApplied]: activeFilterCode !== FilterGroupCodes.NoFilter,
                })}
                data-tid='media-center-filters-wrapper'
            >
                <div className='wrapper-container py-0 wrapper-container--px search-pod-filters'>
                    <Text tag='h1' className='search-title page-title d-none d-md-block' field={fields?.Title} />

                    <FiltersContainer
                        className={styles.mediaCenterFilters}
                        onApply={onApply}
                        onCancel={isMoreThenMobile ? onCancel : undefined}
                        isApplyDisabled={isApplyDisabled}
                        activeFilterCode={activeFilterCode}
                        onSelectFilterGroup={onSelectFilterGroup}
                        onCloseFilters={onCloseFilters}
                        selectedFilters={selectedFilters}
                        onSelectFilters={onSelectFilters}
                        onClearSelectedFilters={onClearSelectedFilters}
                        onRemoveSpecificFilter={onRemoveSpecificFilter}
                        availableFilters={availableFilters}
                        isFiltersLoaded={isFiltersLoaded}
                        fetchResults={fetchResults}
                        status={status}
                        setPageNumber={setPageNumber}
                        checkIsFilterSelected={checkIsFilterSelected}
                        selectedDestinationCodesQuery={null}
                        isFilterGroupDisabled={isFilterGroupDisabled}
                    />
                </div>
            </div>
        </>
    );
};

export default observer(MediaCenterFilters);
