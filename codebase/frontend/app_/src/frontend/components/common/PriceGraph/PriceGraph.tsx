import * as React from 'react';
import { Chart } from 'chart.js';
import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';
import { inject, observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import { MarketStore } from 'frontend/store/base';
import { TStores } from 'frontend/store/IStores';
import { addDays, getDate, getDaysDifference } from 'frontend/utils/date.utils';
import { reverseNumberValue } from 'frontend/utils/object.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IPriceGraphBarConfig } from 'models/data/IPriceGraphBarConfig';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';

import GraphNavigation from './components/Navigation/GraphNavigation';
import PriceGraphShimmer from './components/Shimmer/PriceGraphShimmer';
import BarChart from './BarChart';
import PriceGraphSettings from './constants';
import MobileYAxis from './MobileYAxis';
import { getEdgeAvailableDate, getFormattedDates } from './priceGraphUtils';

export interface IPriceGraphProps extends IComponentWithDictionary {
    alternativeOffers: IAlternativeOffer[];
    changeActiveDate: (date: Date) => void;
    currency: CurrencyCode | undefined;
    formatMoney: MarketStore['formatMoney'];
    getSetting: (setting: SiteSettings) => any;
    getSettingAsNumber: (setting: SiteSettings) => number;
    holidayDuration: number;
    isExternalHotel: boolean;
    isLoadingAlternativeDates: boolean;
    isMobileView: boolean;
    isScreenExtraLarge: boolean;
    isScreenLarge: boolean;
    loadAlternativeOffers: (isSingleNoResult?: boolean, middleDate?: Date, isNext?: boolean) => void;
    middleDate: Date;
    numTotalPrice: number;
    resetToInitial: () => void;
    selectedDate: Date;
    isLoadSingleOffers?: boolean;
}

export class PriceGraph extends React.Component<IPriceGraphProps> {
    barChart = React.createRef<Chart<'bar', IPriceGraphBarConfig[]>>();
    graphContainer = React.createRef<any>();
    graphWrapper = React.createRef<any>();
    @observable startIdx: number = 0;
    @observable activeDate = this.props.selectedDate;
    @observable isLoadingData = false;

    @observable alternativeOffers: IPriceGraphBarConfig[] = getFormattedDates(
        this.props.alternativeOffers,
        this.props.selectedDate,
        this.props.holidayDuration,
        this.props.numTotalPrice,
        this.props.selectedDate,
    );

    scrollDirection: 'LEFT' | 'RIGHT' | null = null;
    prevAlternativeOffersLength: number = this.props.alternativeOffers.length;

    constructor(props: IPriceGraphProps) {
        super(props);
        makeObservable(this);
        this.resetIndexToInitial();
    }

    async componentDidMount(): Promise<void> {
        this.props.alternativeOffers.length === 0 && (await this.loadGraphData());

        if (this.props.isMobileView && this.graphContainer.current && this.graphWrapper.current) {
            this.scrollToSelectedDate();
            this.graphWrapper.current.addEventListener('scroll', this.scroll);
        }
    }

    componentWillUnmount(): void {
        if (this.props.isMobileView) {
            this.graphWrapper.current.removeEventListener('scroll', this.scroll);
        }

        this.props.resetToInitial();
    }

    scrollToSelectedDate = (): void => {
        const selectedOfferIdx = this.alternativeOffers.findIndex(
            item => getDate(item.date).getTime() === this.props.selectedDate.getTime(),
        );
        this.graphWrapper.current?.scroll({
            left:
                selectedOfferIdx * this.barWidth +
                this.barWidth / 2 -
                this.graphWrapper.current.getBoundingClientRect().width / 2,
        });
    };

    componentDidUpdate(prevProps: IPriceGraphProps): void {
        if (prevProps.selectedDate.getTime() !== this.props.selectedDate.getTime()) {
            this.loadData();
        }

        if (prevProps.alternativeOffers.length === 0 && this.props.alternativeOffers.length > 0) {
            this.resetToInitial();

            if (this.props.isMobileView && this.graphContainer.current && this.graphWrapper.current) {
                this.scrollToSelectedDate();
                this.graphWrapper.current.addEventListener('scroll', this.scroll);
            }
        }

        if (this.props.isMobileView) {
            if (prevProps.alternativeOffers.length !== this.props.alternativeOffers.length) {
                this.prevAlternativeOffersLength = prevProps.alternativeOffers.length;
            } else if (this.scrollDirection) {
                this.scroll();
            }
        }
    }

    @action resetIndexToInitial(): void {
        if (this.props.isMobileView || !this.props.selectedDate || !this.props.alternativeOffers.length) {
            this.startIdx = 0;

            return;
        }

        const selectedTime = this.props.selectedDate.getTime();
        const selectedDateIdx = this.props.alternativeOffers.findIndex(
            item => item.date && selectedTime === getDate(item.date).getTime(),
        );
        this.startIdx = selectedDateIdx - this.halfOfBarsPerSlide;
    }

    @computed get barWidth(): number {
        return this.props.isMobileView ? PriceGraphSettings.barWidth.mobile : PriceGraphSettings.barWidth.desktop;
    }

    @computed get barsPerSlide(): number {
        if (this.props.isScreenExtraLarge) {
            return PriceGraphSettings.barsPerSlide.largeDesktop;
        } else if (this.props.isScreenLarge) {
            return PriceGraphSettings.barsPerSlide.desktop;
        }

        return PriceGraphSettings.barsPerSlide.tablet;
    }

    @computed get halfOfBarsPerSlide(): number {
        return Math.floor(this.barsPerSlide / 2);
    }

    loadData = async (): Promise<void> => {
        if (this.props.selectedDate) {
            await this.props.loadAlternativeOffers();

            runInAction(() => {
                this.resetToInitial();
                this.updateGraphData();
                this.scrollToSelectedDate();
            });
        }
    };

    @computed get datesToShow(): IPriceGraphBarConfig[] {
        if (this.props.isMobileView) {
            return toJS(this.alternativeOffers);
        }

        return this.alternativeOffers.slice(this.startIdx, this.startIdx + this.barsPerSlide);
    }

    @action resetToInitial(): void {
        this.resetIndexToInitial();
        this.alternativeOffers = getFormattedDates(
            this.props.alternativeOffers,
            this.props.middleDate,
            this.props.holidayDuration,
            this.props.numTotalPrice,
            this.props.selectedDate,
        );
        this.prevAlternativeOffersLength = this.alternativeOffers.length;
    }

    @action changeActiveDate = async (idx: number): Promise<void> => {
        const newStartIdx = idx + this.startIdx;

        // Don't change date if there no flights in this date (i.e. price = 0)
        if (this.alternativeOffers[newStartIdx].price === 0) {
            return;
        }

        const startDateIdx = this.alternativeOffers.findIndex(item => item.isStartDate);
        const endDateIdx = this.alternativeOffers.findIndex(item => item.isEndDate);

        this.alternativeOffers[startDateIdx].isStartDate = false;

        if (this.alternativeOffers[endDateIdx]) {
            this.alternativeOffers[endDateIdx].isEndDate = false;
        }

        this.alternativeOffers[newStartIdx].isStartDate = true;

        if (this.alternativeOffers.length > newStartIdx + this.props.holidayDuration) {
            this.alternativeOffers[newStartIdx + this.props.holidayDuration].isEndDate = true;
        }

        this.alternativeOffers = [...this.alternativeOffers];

        const date = getDate(this.alternativeOffers[newStartIdx].date);
        this.activeDate = date;
        this.props.changeActiveDate(date);
    };

    @action loadGraphData = async (): Promise<void> => {
        await this.props.loadAlternativeOffers();
        runInAction(() => {
            this.alternativeOffers = getFormattedDates(
                this.props.alternativeOffers,
                this.activeDate,
                this.props.holidayDuration,
                this.props.numTotalPrice,
                this.props.selectedDate,
            );
            this.resetToInitial();
            this.updateGraphData();
        });
    };

    updateGraphData(): void {
        if (this.barChart.current) {
            this.datesToShow.forEach((data, i) => (this.barChart.current!.data.datasets[0].data[i] = data));
            this.barChart.current.update();
        }
    }

    getDaysDifference(isNext: boolean, availableEdgeDate: Date, nextEdgeShowDate: Date): number {
        return isNext
            ? getDaysDifference(availableEdgeDate, nextEdgeShowDate)
            : getDaysDifference(nextEdgeShowDate, availableEdgeDate);
    }

    calculateNewMiddleDate(isNext: boolean, daysDiff: number, nextEdgeShowDate: Date): Date {
        let newMiddleDate;
        const amountOfLoadingItems = this.props.getSettingAsNumber(SiteSettings.PriceGraphAmountOfLoadingItems);

        if (this.props.isMobileView) {
            if (daysDiff > 0) {
                newMiddleDate = new Date(nextEdgeShowDate);
                newMiddleDate.setDate(
                    isNext
                        ? newMiddleDate.getDate() - this.halfOfBarsPerSlide
                        : newMiddleDate.getDate() + this.halfOfBarsPerSlide,
                );
            } else {
                newMiddleDate = getDate(
                    isNext
                        ? this.alternativeOffers[this.alternativeOffers.length - 1].date
                        : this.alternativeOffers[0].date,
                );
                newMiddleDate.setDate(
                    isNext
                        ? newMiddleDate.getDate() + (amountOfLoadingItems + daysDiff) - this.halfOfBarsPerSlide
                        : newMiddleDate.getDate() - (amountOfLoadingItems + daysDiff) + this.halfOfBarsPerSlide,
                );
            }
        } else {
            newMiddleDate = new Date(this.props.middleDate);

            if (daysDiff >= amountOfLoadingItems) {
                newMiddleDate.setDate(
                    isNext
                        ? newMiddleDate.getDate() + amountOfLoadingItems
                        : newMiddleDate.getDate() - amountOfLoadingItems,
                );
            } else {
                newMiddleDate.setDate(isNext ? newMiddleDate.getDate() + daysDiff : newMiddleDate.getDate() - daysDiff);
            }
        }

        return newMiddleDate;
    }

    showOtherDates = async (availableEdgeDate: Date, nextEdgeShowDate: Date, isNext: boolean): Promise<void> => {
        try {
            this.toggleIsLoading();
            const daysDiff = this.getDaysDifference(isNext, availableEdgeDate, nextEdgeShowDate);
            const newMiddleDate = this.calculateNewMiddleDate(isNext, daysDiff, nextEdgeShowDate);

            await this.props.loadAlternativeOffers(this.props.isLoadSingleOffers, newMiddleDate, isNext);
            this.updateAfterLoadingNewData(isNext);
        } finally {
            this.toggleIsLoading(false);
        }
    };

    @action toggleIsLoading = (state: boolean = true): void => {
        this.isLoadingData = state;
    };

    @action changeScrollDirection(direction: 'LEFT' | 'RIGHT'): void {
        this.scrollDirection = direction;
    }

    @action updateAfterLoadingNewData = (isNext: boolean): void => {
        this.changeScrollDirection(isNext ? 'RIGHT' : 'LEFT');
        this.alternativeOffers = getFormattedDates(
            this.props.alternativeOffers,
            this.activeDate,
            this.props.holidayDuration,
            this.props.numTotalPrice,
            this.props.selectedDate,
        );

        const middleDateIdx = this.alternativeOffers.findIndex(
            item => getDate(item.date).getTime() === this.props.middleDate.getTime(),
        );

        this.startIdx = this.props.isMobileView ? 0 : middleDateIdx - this.halfOfBarsPerSlide;

        this.updateGraphData();
    };

    showNewDates = (isNext: boolean = false): void => {
        if (this.isLoadingData) {
            return;
        }

        const date = getEdgeAvailableDate(new Date(this.props.selectedDate), this.barsPerSlide, isNext);
        let newDate;

        if (this.props.isMobileView) {
            newDate = isNext
                ? getDate(this.alternativeOffers[this.alternativeOffers.length - 1].date)
                : getDate(this.alternativeOffers[0].date);
            newDate.setDate(
                newDate.getDate() +
                    reverseNumberValue(
                        this.props.getSettingAsNumber(SiteSettings.PriceGraphAmountOfLoadingItems),
                        !isNext,
                    ),
            );
        } else {
            newDate = addDays(reverseNumberValue(this.halfOfBarsPerSlide, !isNext), this.props.middleDate);
        }

        this.showOtherDates(date, newDate, isNext);
    };

    @computed get lastShowDate(): Nullable<Date> {
        const date = this.datesToShow[this.datesToShow.length - 1]?.date;

        return date ? getDate(date) : null;
    }

    @computed get firstShowDate(): Nullable<Date> {
        const date = this.datesToShow[0]?.date;

        return date ? getDate(date) : null;
    }

    @computed get isNextBtnAvailable(): boolean {
        return (
            !this.isLoadingData &&
            !!this.lastShowDate &&
            this.lastShowDate.getTime() <
                getEdgeAvailableDate(new Date(this.props.selectedDate), this.barsPerSlide, true).getTime()
        );
    }

    @computed get isPrevBtnAvailable(): boolean {
        return (
            !this.isLoadingData &&
            !!this.firstShowDate &&
            this.firstShowDate.getTime() >
                getEdgeAvailableDate(new Date(this.props.selectedDate), this.barsPerSlide).getTime()
        );
    }

    scroll = (): void => {
        const containerRect = this.graphContainer.current?.getBoundingClientRect();
        const wrapperRect = this.graphWrapper.current?.getBoundingClientRect();

        const maxScrollLeft =
            this.graphWrapper.current && this.graphWrapper.current.scrollWidth - this.graphWrapper.current.clientWidth;

        if (this.prevAlternativeOffersLength !== this.props.alternativeOffers.length && !this.scrollDirection) {
            this.prevAlternativeOffersLength = this.alternativeOffers.length;

            return;
        }

        if (
            this.prevAlternativeOffersLength !== this.props.alternativeOffers.length &&
            this.scrollDirection === 'RIGHT'
        ) {
            const left = this.isNextBtnAvailable
                ? this.alternativeOffers.length * this.barWidth - wrapperRect.width - this.barWidth / 2
                : this.alternativeOffers.length * this.barWidth - wrapperRect.width - 1;
            this.graphWrapper.current.scrollLeft = left;
            this.scrollDirection = null;
        } else if (
            this.prevAlternativeOffersLength !== this.props.alternativeOffers.length &&
            this.scrollDirection === 'LEFT'
        ) {
            const right = this.isPrevBtnAvailable ? 20 : 1;
            this.graphWrapper.current.scrollLeft = right;
            this.scrollDirection = null;
        } else if (
            containerRect &&
            wrapperRect &&
            Math.round(this.graphWrapper.current?.scrollLeft) === 0 &&
            this.isPrevBtnAvailable &&
            !this.scrollDirection
        ) {
            this.showNewDates();
        } else if (
            containerRect &&
            wrapperRect &&
            Math.round(this.graphWrapper.current?.scrollLeft) === Math.round(maxScrollLeft) &&
            this.isNextBtnAvailable &&
            !this.scrollDirection
        ) {
            this.showNewDates(true);
        }
    };

    @computed get graphWidth(): string {
        if (this.props.isMobileView) {
            const bars = this.props.alternativeOffers.length;
            const width = bars * (this.barWidth + PriceGraphSettings.barMargin);

            return `${width}px`;
        }

        return 'calc(100% - 32px - 32px)';
    }

    getPriceTick = (tick: number): string =>
        this.props.formatMoney(tick, { currency: this.props.currency, maximumFractionDigits: 0 });

    render(): React.ReactNode {
        return (
            <div className='graph-navigation'>
                {!this.props.isMobileView && (
                    <GraphNavigation
                        showNextDates={() => this.showNewDates(true)}
                        showPrevDates={() => this.showNewDates()}
                        isNextDisabled={!this.isNextBtnAvailable}
                        isPrevDisabled={!this.isPrevBtnAvailable}
                    />
                )}

                <div className='mobile-shadow-left' />
                <div className={`graph-wrapper ${!this.props.isMobileView ? 'desktop' : ''}`} ref={this.graphWrapper}>
                    {this.props.isLoadingAlternativeDates || this.datesToShow.length === 0 ? (
                        <PriceGraphShimmer width={!this.props.isMobileView ? this.graphWidth : undefined} />
                    ) : (
                        <div className='graph-container' ref={this.graphContainer} style={{ width: this.graphWidth }}>
                            <BarChart
                                holidayDuration={this.props.holidayDuration}
                                barChartRef={this.barChart}
                                data={this.datesToShow}
                                changeActiveDate={this.changeActiveDate}
                                getPriceTick={this.getPriceTick}
                            />
                        </div>
                    )}
                </div>
                <div className='mobile-shadow-right' />

                {this.props.isMobileView && <MobileYAxis data={this.datesToShow} getPriceTick={this.getPriceTick} />}

                {this.props.isExternalHotel &&
                    !this.props.isMobileView &&
                    !this.props.getSetting(SiteSettings.PriceGraphHideInfoMessage) && (
                        <ErrorMessage
                            message={this.props.getPhrase(SitecoreDictionary.PriceGraphLabelsInfoMessage)}
                            icon={<IconInfoCircle />}
                            IsNotification
                            IsDesc
                        />
                    )}
            </div>
        );
    }
}

const ConnectedPriceGraph = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isMobileView: stores.priceGraphStore.isMobileView,
    isScreenLarge: stores.appStore.isScreenLarge,
    isScreenExtraLarge: stores.appStore.isScreenExtraLarge,
    alternativeOffers: stores.priceGraphStore.alternativeOffers,
    loadAlternativeOffers: stores.priceGraphStore.loadAlternativeOffers,
    holidayDuration: stores.priceGraphStore.holidayDurationSingleSearch
        ? stores.priceGraphStore.holidayDurationSingleSearch
        : stores.bookingStore.selectedOffer
        ? stores.bookingStore.selectedOffer.stay
        : 0,
    isLoadingAlternativeDates: stores.priceGraphStore.isLoadingAlternativeDates,
    resetToInitial: stores.priceGraphStore.resetToInitial,
    isExternalHotel: stores.bookingStore.isExternalHotel,
    numTotalPrice: stores.priceGraphStore.totalPriceForSelectedDate,
    getSetting: stores.layoutStore.getSetting,
    getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
    currency: stores.priceGraphStore.currency,
    formatMoney: stores.marketStore.formatMoney,
}))(observer(class WrappedPriceGraph extends PriceGraph {}));

export default ConnectedPriceGraph;
