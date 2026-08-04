import React, { Component, ReactNode } from 'react';
import classNames from 'classnames';
import { action, computed, makeObservable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { getFilterTitle } from 'frontend/utils/filter.utils';
import { IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { DataStatus, isErrorStatus, isLoadingStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import withOptimizelyExperiment from 'frontend/components/cro/ExperimentOptimizely/hoc/withOptimizelyExperiment';
import { IExperimentConfig } from 'frontend/components/cro/ExperimentOptimizely/models';
import { IActiveExperiment } from 'frontend/components/cro/ExperimentOptimizely/utils/experiment.utils';
import NoResultsErrorBlock from 'frontend/components/renderings/SearchResults/components/NoResultsErrorBlock/NoResultsErrorBlock';

import FilterContent from './FilterContent';
import FiltersContainerMobile from './FiltersContainerMobile';
import FilterTile from './FilterTile';
import SelectedFilters from './SelectedFilters';

export interface IFiltersContainerProps extends IComponentWithDictionary {
    activeFilterCode: FilterGroupCodes;
    availableFilters: IFilters[];
    checkIsFilterSelected: (filter: IFilterOption) => boolean;
    getSetting: (setting: SiteSettings) => any;
    isFilterGroupDisabled: (filters: IFilters) => boolean;
    isFiltersLoaded: boolean;
    isPromoPage: boolean;
    isScreenLessMedium: boolean;
    isSearchResultsPage: boolean;
    onChangeSearchFilterStore: ({ key, value }: { key: string; value: boolean }) => void;
    onClearSelectedFilters: () => void;
    onCloseFilters: () => void;
    onRemoveSpecificFilter: (filterGroupCode: string, filterCode: string) => void;
    onSelectFilterGroup: (filterCode: FilterGroupCodes) => void;
    onSelectFilters: (filters?: IFilterOption) => void;
    selectedDestinationCodesQuery: Nullable<string>;
    selectedFilters: ISelectedFilter[];
    setPrevPageNumber: (value: Nullable<number>) => void;
    setSeachPerformWithNewParams: (state: boolean) => void;
    status: DataStatus;
    updateSearchResultsPage: () => void;
    changeIsPresetDestinationFilter?: (isPreset: boolean) => void;
    className?: string;
    clearIsClickBackToSearch?: () => void;
    experiment?: IActiveExperiment;
    fetchResults?: (force?: boolean) => void;
    flightDurationFilterLabel?: Nullable<string>;
    hideFiltersLabel?: boolean;
    isApplyDisabled?: boolean;
    isInDrawer?: boolean;
    onApply?: () => void;
    onCancel?: () => void;
    onOpenDrawer?: () => void;
    priceFilterLabel?: Nullable<string>;
    setPageNumber?: (page: number) => void;
    showParentOffers?: boolean;
}

// This is a AB test related - EHD-140 + EJH-17022 >>
const experimentConfigs: IExperimentConfig[] = [
    {
        experimentId: '25803030761',
        pagesId: '25808730036',
        variantA: '25812630033',
        originalVariant: '25750360760',
    },
    {
        experimentId: '25227820632',
        pagesId: '25245251131',
        variantA: '25220840590',
        originalVariant: '25261060476',
    },
];
// << This is a AB test related - EHD-140 + EJH-17022

export class FiltersContainer extends Component<IFiltersContainerProps> {
    constructor(props: IFiltersContainerProps) {
        super(props);
        makeObservable(this);
    }

    componentWillUnmount(): void {
        this.onCancel();
    }

    @computed get filtersLabel(): SitecoreDictionary {
        if (this.props.isPromoPage) {
            return SitecoreDictionary.SearchPodFiltersPromoLabelsFilterResults;
        }

        return SitecoreDictionary.SearchPodFiltersLabelsFilterToRefineYourResults;
    }

    @action onApply = (): void => {
        if (!!this.props.onApply) {
            this.props.onApply();
        }

        this.props.onCloseFilters();
    };

    @action onCancel = (): void => {
        if (!!this.props.onCancel) {
            this.props.onCancel();
        }

        this.props.onCloseFilters();
        this.props.onSelectFilters();
        this.props.clearIsClickBackToSearch?.();
    };

    @action onApplyFilters = (): void => {
        this.props.clearIsClickBackToSearch?.();
        this.loadResults();
    };

    @action onClearAllSelectedFilters = (): void => {
        this.props.onCloseFilters();
        this.props.onClearSelectedFilters();
        this.props.clearIsClickBackToSearch?.();
        this.props.changeIsPresetDestinationFilter?.(false);
        this.loadResults();
    };

    @action onRemoveSelectedFilter = (filterGroupCode: string, filterCode: string): void => {
        this.props.onRemoveSpecificFilter(filterGroupCode, filterCode);
        this.loadResults();
    };

    @action loadResults = (): void => {
        this.props.setSeachPerformWithNewParams(true);
        this.props.setPageNumber?.(1);
        //simulate the initial render of the page
        this.props.setPrevPageNumber(null);
        this.props.fetchResults?.(true);

        if (this.props.isSearchResultsPage) {
            this.props.updateSearchResultsPage();
        }

        if (this.props.isPromoPage) {
            this.props.onChangeSearchFilterStore({ key: 'isFiltersLoadingScreenEnabled', value: false });
        }
    };

    @action onChangeFilters = (filters?: IFilterOption): void => {
        this.props.onSelectFilters(filters);
        this.onApplyFilters();
    };

    /**
     * Fires on some filter click. Will close/open filter group only in case if filter group is not disabled.
     */
    private filterTileClick = (filterCode: FilterGroupCodes) => {
        const filtersGroup = this.props.availableFilters.find(el => el.code === filterCode);
        const isDisabled = filtersGroup
            ? filtersGroup.code === FilterGroupCodes.Date
                ? false
                : this.props.isFilterGroupDisabled(filtersGroup)
            : false;

        if (filtersGroup && !isDisabled) {
            /** Fire functions only if some item from group available */
            if (this.props.activeFilterCode === filterCode) {
                this.props.onCloseFilters();
            } else {
                this.props.onSelectFilterGroup(filterCode);
            }
        }
    };

    render(): ReactNode {
        const { activeFilterCode, status, isFiltersLoaded, getPhrase, experiment } = this.props;
        const isABTest = experiment?.activeVariantId && experiment.config?.variantA === experiment.activeVariantId;

        if (isLoadingStatus(status) && !isFiltersLoaded) {
            return this.props.isScreenLessMedium ? (
                <div
                    className='placeholder-filter-btn placeholder-shimmer'
                    data-tid='placeholder-filter-loading-mobile'
                />
            ) : (
                <div className='search-filter' data-tid='placeholder-filter-loading-desktop'>
                    <div className='filters'>
                        <div className='placeholder-filter-btn placeholder-shimmer' />
                        <div className='placeholder-filter-btn placeholder-shimmer' />
                        <div className='placeholder-filter-btn placeholder-shimmer' />
                    </div>
                </div>
            );
        }

        if (
            (!this.props.availableFilters?.length ||
                this.props.availableFilters.every(el => el.options.length === 0)) &&
            !this.props.selectedFilters.length
        ) {
            return <div className='search-filter' />;
        }

        return this.props.isScreenLessMedium ? (
            <FiltersContainerMobile
                className={this.props.className}
                onChangeFilters={this.onChangeFilters}
                onCancel={this.onCancel}
                onApply={this.onApply}
                onClearAllSelectedFilters={this.onClearAllSelectedFilters}
                onRemoveSelectedFilter={this.onRemoveSelectedFilter}
                filterTileClick={this.filterTileClick}
                availableFilters={this.props.availableFilters}
                selectedFilters={this.props.selectedFilters}
                onCloseFilters={this.props.onCloseFilters}
                onSelectFilters={this.props.onSelectFilters}
                activeFilterCode={this.props.activeFilterCode}
                selectedDestinationCodesQuery={this.props.selectedDestinationCodesQuery}
                checkIsFilterSelected={this.props.checkIsFilterSelected}
                status={this.props.status}
                priceFilterLabel={this.props.priceFilterLabel}
                flightDurationFilterLabel={this.props.flightDurationFilterLabel}
                isFilterGroupDisabled={this.props.isFilterGroupDisabled}
                onOpenDrawer={this.props.onOpenDrawer}
                isInDrawer={this.props.isInDrawer}
            />
        ) : (
            <div className={classNames('search-filter', this.props.className)} data-tid='search-filter'>
                {!this.props.hideFiltersLabel && (
                    <p className='search-pod-filter__label'>{getPhrase(this.filtersLabel)}</p>
                )}

                <div className='filters'>
                    {(this.props.availableFilters || [])
                        .filter(el => el.code !== FilterGroupCodes.TripAdvisorRating)
                        .map((el, idx) => {
                            const titlePhrase = getFilterTitle(el.code);

                            return (
                                <FilterTile
                                    title={titlePhrase.length ? this.props.getPhrase(titlePhrase) : ''}
                                    key={idx}
                                    code={el.code}
                                    isActive={activeFilterCode === el.code}
                                    isDisabled={
                                        el.code === FilterGroupCodes.Date ? false : this.props.isFilterGroupDisabled(el)
                                    }
                                    onClick={this.filterTileClick}
                                />
                            );
                        })}
                </div>

                {activeFilterCode !== FilterGroupCodes.NoFilter && (
                    <FilterContent
                        isApplyDisabled={this.props.isApplyDisabled}
                        onApply={this.onApply}
                        onCancel={this.onCancel}
                        codeFilters={activeFilterCode}
                        onSelectFilters={this.onChangeFilters}
                        availableFilters={this.props.availableFilters}
                        selectedFilters={this.props.selectedFilters}
                        checkIsFilterSelected={this.props.checkIsFilterSelected}
                        selectedDestinationCodesQuery={this.props.selectedDestinationCodesQuery}
                        status={this.props.status}
                        isPromoPage={this.props.isPromoPage}
                    />
                )}
                {!isABTest && (
                    <SelectedFilters
                        selectedFilters={this.props.selectedFilters}
                        onClearAll={this.onClearAllSelectedFilters}
                        onRemoveFilter={this.onRemoveSelectedFilter}
                        onClick={this.filterTileClick}
                        availableFilters={this.props.availableFilters}
                        priceFilterLabel={this.props.priceFilterLabel}
                        flightDurationFilterLabel={this.props.flightDurationFilterLabel}
                    />
                )}

                {this.props.showParentOffers && !isErrorStatus(status) && (
                    <NoResultsErrorBlock
                        title={this.props.getSetting(SiteSettings.NoResultsErrorBlockTitle)}
                        description={this.props.getSetting(SiteSettings.NoResultsErrorBlockDescription)}
                        icon={this.props.getSetting(SiteSettings.NoResultsErrorBlockIcon)}
                    />
                )}
            </div>
        );
    }
}

const ConnectedFiltersContainer = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isScreenLessMedium: stores.appStore.isScreenLessMedium,
    getSetting: stores.layoutStore.getSetting,
    isPromoPage: stores.layoutStore.isPromoPage,
    isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
    setSeachPerformWithNewParams: stores.searchStore.setSeachPerformWithNewParams,
    setPrevPageNumber: stores.searchStore.setPrevPageNumber,
    updateSearchResultsPage: stores.routerStore.updateSearchResultsPage,
    onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
}))(observer(class WrappedFiltersContainer extends FiltersContainer {}));

export default withOptimizelyExperiment(ConnectedFiltersContainer, experimentConfigs);
