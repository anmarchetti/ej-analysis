import * as React from 'react';
import Select from 'react-select';
import classNames from 'classnames';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';

import { ISortItem } from 'frontend/store/base/search/BaseSearchStore';
import { TStores } from 'frontend/store/IStores';
import { ISelectOption } from 'models/data/ISelectOption';
import { DataStatus, isLoadingStatus } from 'models/enum/DataStatus';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import DropdownIndicator from 'frontend/components/common/Select/DropdownIndicator/DropdownIndicator';
import ValueContainer from 'frontend/components/common/Select/ValueContainer';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import SvgSortBy from 'frontend/components/icons/SortBy';
import OffersSortDrawer from 'frontend/components/renderings/SearchResults/components/OffersSortDrawer';

import styles from './OffersSort.module.scss';

export interface IOffersSortProps extends IComponentWithDictionary {
    buildSearchQuery: () => string;
    fetchOffers: (force?: boolean, clearFlow?: boolean) => Promise<void>;
    hasDiscont: boolean;
    isDynamicPromoPage: boolean;
    isFiltersLoaded: boolean;
    isPromoPage: boolean;
    isScreenLessMedium: boolean;
    layoutId: string;
    onSelectOrder: (orderBy: OrderBy, orderDirection: OrderDirection) => void;
    orderBy: Nullable<OrderBy>;
    orderDirection: Nullable<OrderDirection>;
    setPageNumber: (page: number) => void;
    sortConfig: ISortItem[];
    status: DataStatus;
    updateDataLayer: () => void;
    updateSearchParamsAndExecuteSearch: (applyFilters: boolean) => Promise<void>;
    updateSearchResultsPage: () => void;
    className?: string;
}

@observer
export class OffersSort extends React.Component<IOffersSortProps> {
    constructor(props: IOffersSortProps) {
        super(props);
        makeObservable(this);
    }

    @observable selectedOrderCode: string;
    @observable isDrawerOpen: boolean;

    componentDidMount(): void {
        this.setSelectedOrderCode();
    }

    componentDidUpdate(prevProps): void {
        runInAction(() => {
            if (prevProps.sortConfig !== this.props.sortConfig) {
                this.setSelectedOrderCode();
            }

            // reset OrderBy value if we switching between Promo pages
            if (
                (prevProps.orderBy && !this.props.orderBy) ||
                (this.props.isPromoPage && prevProps.layoutId !== this.props.layoutId)
            ) {
                this.selectedOrderCode = this.props.sortConfig[0]?.code ?? '';
                // set OrderBy to previous value after back from booking details
            } else if (!prevProps.orderBy && this.props.orderBy) {
                const sort = (this.props.sortConfig || []).find(this.findActualOrderById);

                if (sort) {
                    this.selectedOrderCode = sort.code;
                }
                // handle OrderBy dropdown for actual value after response without discount
            } else if (prevProps.hasDiscont && !this.props.hasDiscont) {
                this.selectedOrderCode = (this.props.sortConfig || []).find(this.findActualOrderById)?.code ?? '';
            } else if (
                prevProps.orderBy !== this.props.orderBy ||
                prevProps.orderDirection !== this.props.orderDirection
            ) {
                this.setSelectedOrderCode();
            }
        });
    }

    @action private setSelectedOrderCode = (): void => {
        if (this.props.orderBy || this.props.orderDirection) {
            const sort = this.props.sortConfig.find(this.findActualOrderById);

            if (sort) {
                this.selectedOrderCode = sort.code;

                return;
            }
        }

        this.selectedOrderCode = this.props.sortConfig?.[0]?.code ?? '';
    };

    private findActualOrderById = (el: ISortItem): boolean =>
        el.orderBy === this.props.orderBy && el.orderDirection === this.props.orderDirection;

    @computed private get options(): Array<ISelectOption> {
        return (this.props.sortConfig || []).reduce((res, el) => {
            if ((el.orderBy !== OrderBy.DiscAmount && el.orderBy !== OrderBy.DiscPercent) || this.props.hasDiscont) {
                res.push({ label: el.title, value: el.code });
            }

            return res;
        }, [] as ISelectOption[]);
    }

    private get selectedOption(): ISelectOption | undefined {
        return this.options.find(el => el.value === this.selectedOrderCode);
    }

    @action onSelectOrder = (selectedOption: ISelectOption): void => {
        const {
            setPageNumber,
            fetchOffers,
            onSelectOrder,
            updateDataLayer,
            updateSearchResultsPage,
            updateSearchParamsAndExecuteSearch,
            isDynamicPromoPage,
        } = this.props;
        const code = selectedOption.value as string;
        const selectedOrder = (this.props.sortConfig || []).find(el => el.code === code);

        if (selectedOrder && this.selectedOrderCode + '' !== code) {
            this.selectedOrderCode = code;
            onSelectOrder(selectedOrder.orderBy, selectedOrder.orderDirection);
            setPageNumber(1);

            if (!this.props.isPromoPage) {
                updateSearchResultsPage();
            }

            if (isDynamicPromoPage) {
                updateSearchParamsAndExecuteSearch(false);
                updateDataLayer();

                return;
            }

            fetchOffers(true);
            updateDataLayer();
        }
    };

    @action openDrawer = (): boolean => (this.isDrawerOpen = !this.isDrawerOpen);

    private closeDrawer = (selectedOption: ISelectOption): void => {
        this.onSelectOrder(selectedOption);
        this.openDrawer();
    };

    @action cancelDrawer = (): void => {
        this.openDrawer();
    };

    render(): JSX.Element {
        const { getPhrase, isScreenLessMedium, status, isFiltersLoaded } = this.props;

        const tooltipText = getPhrase(SitecoreDictionary.SearchResultsLabelsInformationAboutSort);

        const containerClassName = classNames('hotel-sort', this.props.className);

        if (isLoadingStatus(status) && !isFiltersLoaded) {
            return <div className='placeholder-filter-btn placeholder-shimmer' />;
        }

        if (isScreenLessMedium) {
            return (
                <div className={containerClassName}>
                    <Button
                        isText
                        id='sort-button'
                        onClick={() => this.openDrawer()}
                        className='search-pod-filter__button'
                    >
                        <i>
                            <SvgSortBy />
                        </i>
                        <span>{getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}</span>
                    </Button>
                    <OffersSortDrawer
                        onCloseDrawer={this.closeDrawer}
                        onCancel={this.cancelDrawer}
                        isOpen={this.isDrawerOpen}
                        sortOptions={this.options}
                        selectedOrderCode={this.selectedOrderCode}
                    />
                </div>
            );
        }

        return (
            <div className={containerClassName}>
                <Select
                    className={classNames('custom-select', styles.select)}
                    classNamePrefix='custom-select'
                    options={this.options}
                    placeholder={getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}
                    defaultValue={this.selectedOption}
                    value={this.selectedOption}
                    onChange={this.onSelectOrder}
                    isSearchable={false}
                    components={{ DropdownIndicator, ValueContainer }}
                    blurInputOnSelect={true}
                    tabIndex={0}
                />

                {!!tooltipText && (
                    <Tooltip>
                        <TooltipTrigger />
                        <TooltipContent text={tooltipText} />
                    </Tooltip>
                )}
            </div>
        );
    }
}

const ConnectedOffersSort = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    orderBy: stores.searchStore.orderBy,
    orderDirection: stores.searchStore.orderDirection,
    isPromoPage: stores.layoutStore.isPromoPage,
    status: stores.hotelsStore.status,
    hasDiscont: stores.hotelsStore.hasDiscont,
    isFiltersLoaded: stores.searchFiltersStore.isFiltersLoaded,
    onSelectOrder: stores.searchStore.updateOrder,
    fetchOffers: stores.hotelsStore.fetchOffers,
    isDynamicPromoPage: stores.layoutStore.isDynamicPromoPage,
    updateSearchParamsAndExecuteSearch: stores.promoPageStore.updateSearchParamsAndExecuteSearch,
    buildSearchQuery: stores.queryParamStore.buildSearchQuery,
    setPageNumber: stores.searchStore.setPageNumber,
    updateSearchResultsPage: stores.routerStore.updateSearchResultsPage,
    updateDataLayer: stores.trackingStore.searchSortUpdateTrigger,
    isScreenLessMedium: stores.appStore.isScreenLessMedium,
    layoutId: stores.layoutStore.layoutId,
    sortConfig: stores.searchStore.sortConfig,
}))(OffersSort);

export default ConnectedOffersSort;
