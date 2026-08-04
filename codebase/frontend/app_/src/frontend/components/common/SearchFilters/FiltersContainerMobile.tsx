import React, { Component } from 'react';
import classNames from 'classnames';
import { action, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { getFilterTitle } from 'frontend/utils/filter.utils';
import { IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import LeftHandFilter from 'frontend/components/common/LeftHandFilter';
import FiltersDrawer from 'frontend/components/common/SearchFilters/FiltersDrawer';
import FilterTile from 'frontend/components/common/SearchFilters/FilterTile';
import SelectedFilters from 'frontend/components/common/SearchFilters/SelectedFilters';
import SvgFilterLined from 'frontend/components/icons-new/FilterLined';
import SvgTick from 'frontend/components/icons-new/Tick';
import SearchResultsContentStyles from 'frontend/components/renderings/SearchResults/SearchResultsContent/SearchResultsContent.module.scss';

export interface IFiltersContainerMobileProps extends IComponentWithDictionary {
    activeFilterCode: FilterGroupCodes;
    availableFilters: IFilters[];
    checkIsFilterSelected: (filter: IFilterOption) => boolean;
    filterTileClick: (code: FilterGroupCodes) => void;
    isBodyScrollLocked: boolean;
    isFilterGroupDisabled: (filters: IFilters) => boolean;
    isScreenExtraSmall: boolean;
    isSearchResultsPage: boolean;
    onCancel: () => void;
    onChangeFilters: (filters?: IFilterOption | undefined) => void;
    onChangeSearchFilterStore: <T>({ key, value }: { key: string; value: Set<T> }) => void;
    onClearAllSelectedFilters: () => void;
    onCloseFilters: () => void;
    onRemoveSelectedFilter: (filterGroupCode: string, filterCode: string) => void;
    onSelectFilters: (filters?: IFilterOption) => void;
    selectedDestinationCodesQuery: Nullable<string>;
    selectedFilters: ISelectedFilter[];
    status: DataStatus;
    className?: string;
    flightDurationFilterLabel?: Nullable<string>;
    isInDrawer?: boolean;
    onApply?: () => void;
    onOpenDrawer?: () => void;
    priceFilterLabel?: Nullable<string>;
}

export class FiltersContainerMobile extends Component<IFiltersContainerMobileProps> {
    constructor(props: IFiltersContainerMobileProps) {
        super(props);
        makeObservable(this);
    }

    @observable isDrawerOpen: boolean;
    @observable isFiltersChanged: boolean = false;

    componentDidUpdate(prevProps: IFiltersContainerMobileProps) {
        if (
            !this.props.isBodyScrollLocked &&
            prevProps.isBodyScrollLocked &&
            this.isFiltersChanged &&
            !this.props.isInDrawer
        ) {
            window.scrollTo(0, 0);
            this.setIsFiltersChanged(false);
        }
    }

    // show tick near the active filter on extra small screens
    private isMobileActiveFilter = (code: string) => {
        if (code === FilterGroupCodes.PriceRange) {
            return !!this.props.priceFilterLabel;
        }

        if (code === FilterGroupCodes.FlightDuration) {
            return !!this.props.flightDurationFilterLabel;
        }

        if (code === FilterGroupCodes.Destination) {
            return !!this.props.selectedFilters.find(
                el => el.groupCode === FilterGroupCodes.Destination && !el.preChecked,
            );
        }

        if (code === FilterGroupCodes.FlightTimes) {
            return !!this.props.selectedFilters.find(el =>
                [FilterGroupCodes.InboundDepartureTime, FilterGroupCodes.OutboundDepartureTime].includes(el.groupCode),
            );
        }

        return (
            this.props.selectedFilters.findIndex(filter =>
                filter.groupCode === FilterGroupCodes.TripAdvisorRating
                    ? FilterGroupCodes.StarRating === code
                    : filter.groupCode === code,
            ) !== -1
        );
    };

    onChangeFilter = option => {
        this.props.onChangeFilters(option);
        this.setIsFiltersChanged(true);
    };

    onOpen = () => {
        if (this.props.isSearchResultsPage) {
            // collapse the filter
            this.props.onChangeSearchFilterStore({ key: 'selectedFilterGroups', value: new Set() });
        }

        this.openDrawer();
    };

    @action openDrawer = () => {
        this.isDrawerOpen = !this.isDrawerOpen;

        if (this.isDrawerOpen && this.props.onOpenDrawer) {
            this.props.onOpenDrawer();
        }
    };

    @action setIsFiltersChanged = (state: boolean) => {
        this.isFiltersChanged = state;
    };

    promoPageContent = () => (
        <div>
            <div className='drawer__content'>
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
                                    isActive={this.isMobileActiveFilter(el.code)}
                                    isDisabled={this.props.isFilterGroupDisabled(el)}
                                    onClick={this.props.filterTileClick}
                                    isScreenExtraSmall={this.props.isScreenExtraSmall}
                                />
                            );
                        })}
                </div>
                <FiltersDrawer
                    onApplyFilters={this.props.onCloseFilters}
                    onSelectFilters={this.onChangeFilter}
                    onCloseFilters={this.props.onCloseFilters}
                    onCancel={this.props.onCancel}
                    onApply={this.props.onApply}
                    activeFilterCode={this.props.activeFilterCode}
                    availableFilters={this.props.availableFilters}
                    selectedDestinationCodesQuery={this.props.selectedDestinationCodesQuery}
                    selectedFilters={this.props.selectedFilters}
                    status={this.props.status}
                    checkIsFilterSelected={this.props.checkIsFilterSelected}
                />

                <SelectedFilters
                    selectedFilters={this.props.selectedFilters}
                    onClearAll={this.props.onClearAllSelectedFilters}
                    onRemoveFilter={this.props.onRemoveSelectedFilter}
                    onClick={this.props.filterTileClick}
                    availableFilters={this.props.availableFilters}
                    priceFilterLabel={this.props.priceFilterLabel}
                    flightDurationFilterLabel={this.props.flightDurationFilterLabel}
                />
            </div>
            <div className='drawer__actions'>
                <Button
                    isTransparent
                    isFullWidth
                    onClick={() => this.openDrawer()}
                    dataTid='close-filters-container-mobile-btn'
                >
                    {this.props.getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
                <Button isFullWidth onClick={() => this.openDrawer()} dataTid='apply-filters-container-mobile-btn'>
                    {this.props.getPhrase(SitecoreDictionary.SearchPodFiltersButtonsApplyAndSeeResults)}
                </Button>
            </div>
        </div>
    );

    render() {
        const { getPhrase, className } = this.props;

        return (
            <div className={classNames('search-filter', className)}>
                <Button
                    isText
                    id='sort-button'
                    onClick={this.onOpen}
                    className='search-pod-filter__button'
                    dataTid='filter-button'
                >
                    <i>
                        <SvgFilterLined />
                    </i>
                    <span>{getPhrase(SitecoreDictionary.SearchPodFiltersTitlesFilters)}</span>
                    {!!this.props.selectedFilters.length && (
                        <i className='active-icon'>
                            <SvgTick />
                        </i>
                    )}
                </Button>

                <Drawer open={this.isDrawerOpen} isInDrawer={this.props.isInDrawer}>
                    {this.props.isSearchResultsPage ? (
                        <div className={SearchResultsContentStyles.leftColumn}>
                            <LeftHandFilter />

                            <div className={classNames('drawer__actions', SearchResultsContentStyles.footer)}>
                                <Button
                                    isTransparent
                                    isFullWidth
                                    onClick={() => this.openDrawer()}
                                    dataTid='close-filters-container-mobile-btn'
                                >
                                    {this.props.getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                                </Button>
                                <Button
                                    isFullWidth
                                    onClick={() => this.openDrawer()}
                                    dataTid='apply-filters-container-mobile-btn'
                                >
                                    {this.props.getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        this.promoPageContent()
                    )}
                </Drawer>
            </div>
        );
    }
}

const ConnectedFiltersContainerMobile = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
    isBodyScrollLocked: stores.layoutStore.isBodyScrollLocked,
    isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
    onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
}))(observer(class WrappedFiltersContainerMobile extends FiltersContainerMobile {}));

export default ConnectedFiltersContainerMobile;
