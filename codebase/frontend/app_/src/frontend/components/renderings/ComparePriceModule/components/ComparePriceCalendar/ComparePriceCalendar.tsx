import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import classNames from 'classnames';
import { Instance } from 'flatpickr/dist/types/instance';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { cmsUrls } from 'code/endpoints';
import { MarketStore } from 'frontend/store/base';
import { TStores } from 'frontend/store/IStores';
import { addDays, getPreviousMonthDate } from 'frontend/utils/date.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { DynamicFlatPicker, TReactFlatpickr } from 'frontend/components/common/Calendar/components/FlatPickerDynamic';
import { Spinner } from 'frontend/components/common/Spinner';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import Child from 'frontend/components/icons-new/Child';
import InfoFilled from 'frontend/components/icons-new/InfoFilled';
import SvgPromo from 'frontend/components/icons-new/Promo';

interface IComperePriceCalendarProps extends IComponentWithDictionary {
    activeDate: Date;
    alternativeOffers: Map<number, IAlternativeOffer>;
    bestPriceOffers: Map<number, IAlternativeOffer>;
    changeActiveDate: (date: Date) => void;
    changesRequired: (
        offer: IAlternativeOffer | undefined,
        items: IUnit[],
        date: Date,
        isFreeKidsChangeDisabled?: boolean,
    ) => boolean;
    formatMoney: MarketStore['formatMoney'];
    getCurrencySymbol: MarketStore['getCurrencySymbol'];
    getSetting: (setting: SiteSettings) => any;
    holidayDuration: number;
    isBestValueEnabled: boolean;
    isExtrasPage: boolean;
    isFreeForKidsEnabled: boolean;
    isHotelDetailsBookPage: boolean;
    isLoadingAlternativeDates: boolean;
    isMobileView: boolean;
    isResetingSelectedOffer: boolean;
    loadAlternativeOffersForCalendar: (start?: Date, end?: Date) => void;
    priceGraphPopupVisible: boolean;
    resetToInitial: () => void;
    selectedDate: Date;
    selectedOffer: Nullable<IOfferWithoutAltBoards>;
    totalPriceWithTouristTax: number;
    weekdaysContainerClass: string;
    isCheapest?: boolean;
}

export class ComparePriceCalendar extends React.Component<IComperePriceCalendarProps> {
    @observable private firstShownMonth: Date;
    private readonly refFpCalendar = React.createRef<TReactFlatpickr>();
    private readonly refMobileMonthsContainer: React.RefObject<HTMLInputElement> = React.createRef();

    state = {
        isCalendarReady: false,
    };

    constructor(props: IComperePriceCalendarProps) {
        super(props);
        makeObservable(this);
    }

    removeScrollListener = (): void => {
        document.querySelectorAll('.dayContainer').forEach(container => {
            container.removeEventListener('scroll', this.onScroll);
        });
        const weekdaysContainer = document.getElementsByClassName(this.props.weekdaysContainerClass)?.[0];

        weekdaysContainer?.removeEventListener('scroll', this.onScroll);
    };

    addScrollListener = (): void => {
        document.querySelectorAll('.dayContainer').forEach(container => {
            container.addEventListener('scroll', this.onScroll);
        });
        const weekdaysContainer = document.getElementsByClassName(this.props.weekdaysContainerClass)?.[0];

        weekdaysContainer?.addEventListener('scroll', this.onScroll);
    };

    onScroll = (e: Event): void => {
        const target = e.currentTarget as HTMLDivElement;
        document.querySelectorAll('.dayContainer').forEach(container => {
            container.scrollLeft = target.scrollLeft;
        });
        const weekdaysContainer = document.getElementsByClassName(this.props.weekdaysContainerClass)?.[0];

        if (weekdaysContainer) {
            weekdaysContainer.scrollLeft = target.scrollLeft;
        }
    };

    componentDidMount(): void {
        this.props.resetToInitial();

        if (this.props.isMobileView) {
            this.addScrollListener();
        }
    }

    componentDidUpdate(prevProps: IComperePriceCalendarProps): void {
        const {
            alternativeOffers,
            isLoadingAlternativeDates,
            isResetingSelectedOffer,
            isCheapest,
            activeDate,
            isMobileView,
        } = this.props;

        if (prevProps.isCheapest !== undefined && prevProps.isCheapest !== isCheapest) {
            this.changeFirstShownMonth(isMobileView ? getPreviousMonthDate(activeDate) : activeDate);
        }

        if (!alternativeOffers.size && !isLoadingAlternativeDates) {
            this.handleDataLoad();
        }

        this.handleScrollListener(prevProps.isMobileView);

        if (this.props.isMobileView) {
            /** Draw correct calendar view only after applying new date and opening compare price module once again */
            if (isResetingSelectedOffer || (!isResetingSelectedOffer && prevProps.isResetingSelectedOffer)) {
                return;
            }

            this.handleSelectedDateRender(prevProps.priceGraphPopupVisible);
        }
    }

    componentWillUnmount(): void {
        this.removeScrollListener();
    }

    handleDataLoad = async (): Promise<void> => {
        await this.props.loadAlternativeOffersForCalendar();

        if (!this.props.isMobileView) {
            this.changeFirstShownMonth(this.props.activeDate);

            return;
        }

        this.changeFirstShownMonth(getPreviousMonthDate(this.props.activeDate));
    };

    private readonly handleScrollListener = (wasMobileView: boolean): void => {
        const { isMobileView } = this.props;

        if (wasMobileView !== isMobileView) {
            if (isMobileView) {
                this.addScrollListener();
            } else {
                this.removeScrollListener();
            }
        }
    };

    private readonly handleSelectedDateRender = (wasPriceGraphPopupVisible: boolean): void => {
        const { priceGraphPopupVisible, selectedDate, activeDate } = this.props;

        if (!priceGraphPopupVisible && wasPriceGraphPopupVisible) {
            this.renderCalendarViewAccordingSelectedDate();
        }

        /** If user aplly new date, but in Alternative flights drawer click on cancel, we need redraw calendar to initial selected date */
        if (priceGraphPopupVisible && !wasPriceGraphPopupVisible && selectedDate.getTime() !== activeDate.getTime()) {
            this.renderCalendarViewAccordingSelectedDate();
        }

        if (priceGraphPopupVisible && !wasPriceGraphPopupVisible) {
            this.scrollToMonth(1);
        }
    };

    @action changeFirstShownMonth = (state: Date): void => {
        this.firstShownMonth = state;
    };

    private readonly renderCalendarViewAccordingSelectedDate = (): void => {
        this.props.changeActiveDate(this.props.selectedDate);
        const date = getPreviousMonthDate(this.props.selectedDate);
        date.setDate(1);

        this.refFpCalendar?.current?.flatpickr.setDate(this.props.selectedDate);
        this.refFpCalendar?.current?.flatpickr.jumpToDate(date);
        this.changeFirstShownMonth(date);
    };

    private readonly getOfferByDate = (date: Date) => {
        const dateTime = date.getTime();

        if (
            (this.props.isExtrasPage || this.props.isHotelDetailsBookPage) &&
            this.props.selectedOffer &&
            dateTime === new Date(this.props.selectedOffer.date).getTime()
        ) {
            return { ...this.props.selectedOffer, price: this.props.totalPriceWithTouristTax };
        }

        return this.props.alternativeOffers.get(dateTime);
    };

    private readonly appendPrice = (el, date: Date): void => {
        const { price, currency } = this.getOfferByDate(date) || {};

        if (price) {
            const currencyCode = currency?.code;
            const currencySymbol = this.props.getCurrencySymbol(currencyCode);
            const isLineBreakAfterCurrencyNeeded = currencySymbol.length > 1;
            const priceValueSpan = document.createElement('span');
            const priceContainer = document.createElement('div');

            priceContainer.classList.add('price-wrapper');
            el.classList.add('available');

            priceValueSpan.innerText = this.props.formatMoney(price, {
                currency: currencyCode,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                hideCurrencySymbol: isLineBreakAfterCurrencyNeeded,
            });

            if (isLineBreakAfterCurrencyNeeded) {
                const currencySpan = document.createElement('span');

                currencySpan.innerText = currencySymbol;
                priceContainer.appendChild(currencySpan);
            }

            priceContainer.appendChild(priceValueSpan);
            el.appendChild(priceContainer);
        } else {
            el.classList.add('not-available');
            const img = document.createElement('img');
            img.src = cmsUrls.media(this.props.getSetting(SiteSettings.PriceGraphNoFlightIcon));
            el.appendChild(img);
        }
    };

    get arrivalDate(): Date {
        return addDays(this.props.holidayDuration, this.props.activeDate);
    }

    private readonly onDayCreate = (dObj, dStr, fp, dayElem): void => {
        const {
            isBestValueEnabled,
            isFreeForKidsEnabled,
            bestPriceOffers,
            changesRequired,
            activeDate,
            alternativeOffers,
            selectedOffer,
            isCheapest,
        } = this.props;

        const date: Date = dayElem.dateObj;
        const isAvailable = this.isDateAvailable(date);
        const offer = alternativeOffers.get(date.getTime());

        dayElem.classList.remove(['in-range', 'arrival-date', 'not-available', 'available', 'best-price']);

        if (isAvailable) {
            dayElem.tabIndex = 0;
        }

        this.appendPrice(dayElem, date);

        const bestPrice = isBestValueEnabled && isAvailable && bestPriceOffers.get(date.getTime());

        if (bestPrice) {
            ComparePriceCalendar.appendIcon({ day: dayElem, icon: <SvgPromo />, className: 'best-price' });
        }

        const { unit: items } = selectedOffer?.accom ?? { unit: [] as IUnit[] };
        const changes = !isCheapest && isAvailable && changesRequired(offer, items, date, true);

        if (changes) {
            ComparePriceCalendar.appendIcon({ day: dayElem, icon: <InfoFilled />, className: 'changes' });
        }

        const isFreeForKids =
            isFreeForKidsEnabled && isAvailable && !!offer?.rooms!.find(({ isFreeForKids }) => isFreeForKids);

        if (isFreeForKids) {
            ComparePriceCalendar.appendIcon({ day: dayElem, icon: <Child />, className: 'free-kids' });
        }

        if (date.getTime() > activeDate.getTime() && date.getTime() < this.arrivalDate.getTime()) {
            dayElem.classList.add('in-range');
        } else if (date.getTime() === this.arrivalDate.getTime()) {
            dayElem.classList.add('arrival-date');
        }
    };

    isDateAvailable = (date: Date): boolean => {
        const offer = this.props.alternativeOffers.get(date.getTime());

        return !!offer?.price;
    };

    onChangeDate = (dates: Date[]): void => {
        this.props.changeActiveDate(dates[0]);
    };

    onMonthChange = async (dates: Date[], currentDateString: string, instance: Instance): Promise<void> => {
        const nextDate = new Date(instance.currentYear, instance.currentMonth, 1);

        /** Prevent strange behaviot of Flatpikr
         * Flatpikr change month when user selects date and year of this date is different from first showing month year.
         * In this case logic of month change is not needed
         */
        if (instance.selectedDates[0].getTime() !== this.props.activeDate.getTime()) {
            instance.jumpToDate(this.firstShownMonth);

            return;
        }

        if (this.props.isMobileView) {
            if (nextDate.getTime() > this.firstShownMonth.getTime()) {
                nextDate.setMonth(nextDate.getMonth() + 2);
            } else {
                nextDate.setMonth(nextDate.getMonth() - 2);
            }
        }

        this.loadOffersForCalendar(nextDate);
    };

    loadOffersForCalendar = async (nextFirstShownDate: Date): Promise<void> => {
        let startDate;
        let endDate;

        /** Check if next month arrow was clicked */
        if (nextFirstShownDate.getTime() > this.firstShownMonth.getTime()) {
            if (!this.props.isMobileView) {
                endDate = new Date(nextFirstShownDate);
                endDate.setMonth(endDate.getMonth() + 3);
                endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);

                startDate = new Date(endDate);
                startDate.setDate(1);
            } else {
                startDate = new Date(nextFirstShownDate);
                endDate = new Date(nextFirstShownDate.getFullYear(), nextFirstShownDate.getMonth() + 3, 0);

                this.refFpCalendar?.current?.flatpickr.jumpToDate(startDate);
            }
        } else {
            /** Check if prev month arrow was clicked */
            if (!this.props.isMobileView) {
                endDate = new Date(nextFirstShownDate);
                endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);

                startDate = new Date(endDate);
                startDate.setDate(1);
            } else {
                startDate = new Date(nextFirstShownDate);
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);

                this.refFpCalendar?.current?.flatpickr.jumpToDate(startDate);
            }
        }

        await this.props.loadAlternativeOffersForCalendar(startDate, endDate);
        runInAction(() => {
            nextFirstShownDate.setDate(1);
            this.changeFirstShownMonth(nextFirstShownDate);
            this.refFpCalendar?.current?.flatpickr.redraw();

            if (this.props.isMobileView) {
                this.updateMobileMonthHeights();
            }
        });
    };

    /**
     * Add Months for vertical viewing calendar. Flatpick doesn't allow this by configuring.
     */
    renderMobileMonths(): JSX.Element | null {
        const months = this.refFpCalendar?.current?.flatpickr?.monthElements;

        if (this.props.isMobileView && months?.length && this.firstShownMonth && this.state.isCalendarReady) {
            const monthsArray = Array.prototype.slice.call(months);
            const month = this.refFpCalendar?.current?.flatpickr.currentMonth as number;
            const year = this.refFpCalendar?.current?.flatpickr.currentYear as number;
            const container: NodeListOf<HTMLDivElement> = document.querySelectorAll('.dayContainer');

            return (
                <div
                    className='custom-month__container'
                    ref={this.refMobileMonthsContainer}
                    id={`${this.firstShownMonth.getTime()}`}
                >
                    {monthsArray.map((item, i) => (
                        <div
                            className='custom-month'
                            key={item.innerText}
                            style={{ height: container[i]?.offsetHeight || 'auto' }}
                        >
                            <p>{`${item.innerText} ${month + i < 12 ? year : year + 1}`}</p>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    }

    private readonly scrollToMonth = (monthId: number): void => {
        const monthsContainer = this.refFpCalendar.current?.flatpickr.daysContainer?.querySelectorAll('.dayContainer');

        monthsContainer?.[monthId]?.scrollIntoView({
            block: 'start',
        });
    };

    private readonly updateMobileMonthHeights = (scrollToMonthIndex?: number): void => {
        if (!this.props.isMobileView || !this.refMobileMonthsContainer.current) {
            return;
        }

        requestAnimationFrame(() => {
            const container: NodeListOf<HTMLDivElement> = document.querySelectorAll('.dayContainer');
            const monthDivs = this.refMobileMonthsContainer.current?.querySelectorAll('.custom-month');

            monthDivs?.forEach((monthDiv: HTMLDivElement, i: number) => {
                if (container[i] && container[i].offsetHeight > 0) {
                    monthDiv.style.height = `${container[i].offsetHeight}px`;
                }
            });

            if (scrollToMonthIndex !== undefined) {
                this.scrollToMonth(scrollToMonthIndex);
            }
        });
    };

    private readonly onReady = (dates: Date[], currentDateString: string, instance: Instance): void => {
        if (this.props.isMobileView) {
            const firstMonth = new Date(this.props.activeDate.getFullYear(), this.props.activeDate.getMonth() - 1, 1);
            instance.jumpToDate(firstMonth);
        }

        this.setState(
            {
                isCalendarReady: true,
            },
            () => {
                // Recalculate heights and scroll to selected month (index 1 = middle month) on mobile
                requestAnimationFrame(() => {
                    this.updateMobileMonthHeights(1);
                });
            },
        );
    };

    get isShowSpinner(): boolean {
        if (!this.props.isMobileView) {
            return this.props.isLoadingAlternativeDates && !this.props.alternativeOffers.size;
        }

        return this.props.isLoadingAlternativeDates;
    }

    static readonly appendIcon = ({ day, icon, className }): void => {
        const span = document.createElement('span');

        span.innerHTML = ReactDOMServer.renderToString(icon);

        span.classList.add(className);

        day.appendChild(span);
    };

    render(): JSX.Element {
        const { isMobileView, alternativeOffers } = this.props;

        return (
            <div
                className={classNames('compare-price-calendar', {
                    ['compare-price-calendar--mobile']: isMobileView,
                })}
            >
                {this.isShowSpinner && (
                    <div className='compare-price-calendar'>
                        <Spinner />
                    </div>
                )}

                {alternativeOffers.size ? (
                    <div className={classNames('compare-price-calendar__wrapper', { ['d-none']: this.isShowSpinner })}>
                        {this.renderMobileMonths()}

                        <DynamicFlatPicker
                            calendarRef={this.refFpCalendar}
                            options={{
                                prevArrow: ReactDOMServer.renderToStaticMarkup(<SvgChevronLeft />),
                                nextArrow: ReactDOMServer.renderToStaticMarkup(<SvgChevronRight />),
                                allowInput: false,
                                inline: true,
                                showMonths: this.props.isMobileView ? 3 : 2,
                                animate: false,
                                defaultDate: this.props.activeDate,
                                disable: [
                                    date =>
                                        date.getTime() === this.props.selectedDate.getTime()
                                            ? false
                                            : !this.isDateAvailable(date),
                                ],
                            }}
                            onDayCreate={this.onDayCreate}
                            onChange={this.onChangeDate}
                            onMonthChange={this.onMonthChange}
                            onReady={this.onReady}
                        />
                    </div>
                ) : null}
            </div>
        );
    }
}

const ConnectedComparePriceCalendar = inject((stores: TStores) => ({
    getSetting: stores.layoutStore.getSetting,
    getPhrase: stores.layoutStore.getPhrase,
    alternativeOffers: stores.comparePricesCalendarStore.alternativeOffersMap,
    loadAlternativeOffersForCalendar: stores.comparePricesCalendarStore.loadAlternativeOffers,
    resetToInitial: stores.comparePricesCalendarStore.resetToInitial,
    changesRequired: stores.comparePricesCalendarStore.changesRequired,
    bestPriceOffers: stores.comparePricesCalendarStore.bestPriceOffers,
    isMobileView: stores.priceGraphStore.isMobileView,
    isLoadingAlternativeDates: stores.comparePricesCalendarStore.isLoadingAlternativeDates,
    priceGraphPopupVisible: stores.priceGraphStore.priceGraphPopupVisible,
    isExtrasPage: stores.layoutStore.isExtrasPage,
    isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
    selectedOffer: stores.bookingStore.selectedOffer,
    totalPriceWithTouristTax: stores.bookingStore.totalPriceWithTouristTax,
    formatMoney: stores.marketStore.formatMoney,
    getCurrencySymbol: stores.marketStore.getCurrencySymbol,
}))(observer(class WrappedComparePriceCalendar extends ComparePriceCalendar {}));

export default ConnectedComparePriceCalendar;
