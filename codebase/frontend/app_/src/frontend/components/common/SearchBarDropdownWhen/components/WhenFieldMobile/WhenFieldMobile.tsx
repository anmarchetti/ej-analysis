import * as React from 'react';
import Select from 'react-select';
import { Instance } from 'flatpickr/dist/types/instance';
import { action, computed, IReactionDisposer, makeObservable, observable, runInAction, when } from 'mobx';
import { inject, observer } from 'mobx-react';

import { ONE, TWO } from 'code/commonNumbers';
import { TStores } from 'frontend/store/IStores';
import { formatDateToQuery, getFullMonthsDifference, getMaxDateInMonth, isSameMonth } from 'frontend/utils/date.utils';
import { DynamicFlatPicker } from 'frontend/components/common/Calendar/components/FlatPickerDynamic';
import FlexibilityPills from 'frontend/components/common/Pills/FlexibilityPills/FlexibilityPills';
import SearchBarDropdownScrollableBox from 'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox';
import { IBaseWhenFieldProps } from 'frontend/components/common/SearchBarDropdownWhen/components/IBaseWhenFieldProps';
import WhenFieldButtons from 'frontend/components/common/SearchBarDropdownWhen/components/WhenFieldButtons/WhenFieldButtons';
import DropdownIndicator from 'frontend/components/common/Select/DropdownIndicator/DropdownIndicator';
import MenuList from 'frontend/components/common/Select/MenuList';
import { Spinner } from 'frontend/components/common/Spinner';
import Weekdays from 'frontend/components/common/Weekdays/Weekdays';

// 36 months = 3 years we don't have holidays later than next 3 years
const MAX_AMOUNT_OF_MONTHS = 36;

interface IYearOptions {
    label: number;
    value: number;
}
export interface IWhenFieldMobileProps extends IBaseWhenFieldProps {
    isAvailableDatesLoading: boolean;
    onChangeFlexible: (flexDates: number) => void;
}

@observer
export class WhenFieldMobile extends React.Component<IWhenFieldMobileProps> {
    private readonly refScrollableContainer: React.RefObject<HTMLDivElement> = React.createRef();
    private isScrolled: boolean = false;
    private onReadyReactionDisposer?: IReactionDisposer;

    @observable selectedYear: number;
    @observable isYearDropdownOpened: boolean = false;

    constructor(props: IWhenFieldMobileProps) {
        super(props);
        makeObservable(this);

        this.selectedYear = this.props.activeViewDate.getFullYear();
    }

    componentDidMount(): void {
        // check if need to change year when scroll
        this.refScrollableContainer.current?.addEventListener('scroll', this.touchMoveFunction, false);

        // set scroll to preselected month
        this.setInitialScrollPosition();

        /** Fix for EJH-11766 */
        this.isScrolled = true;
    }

    componentWillUnmount(): void {
        document.removeEventListener('scroll', this.touchMoveFunction, false);
    }

    componentDidUpdate(prevProps: IWhenFieldMobileProps): void {
        const instance: Instance | undefined = this.props.refFpCalendar?.current?.flatpickr;
        runInAction(() => {
            if (
                (!this.props.isPromoPage || (this.props.isPromoPage && this.props.ignoreIsPromoPage)) &&
                ((this.props.lastAvailableDate && !prevProps.lastAvailableDate) ||
                    (this.props.lastAvailableDate &&
                        prevProps.lastAvailableDate &&
                        this.props.lastAvailableDate.getTime() !== prevProps.lastAvailableDate.getTime()))
            ) {
                this.props.setMaxDate(getMaxDateInMonth(this.props.lastAvailableDate));
            }
        });

        if (!this.props.isAvailableDatesLoading && prevProps.isAvailableDatesLoading) {
            this.setInitialScrollPosition();
        }

        // perform navigation to available dates in case of dates changing
        // change current dates only if ref is available and user does not working with calendar
        if (
            this.props.refFpCalendar?.current !== null &&
            this.props.firstAvailableDepartureDate !== undefined &&
            prevProps.firstAvailableDepartureDate !== undefined &&
            this.props.value.length === 0 // no need to change dates if user is working with calendar
        ) {
            if (
                this.props.firstAvailableDepartureDate.getTime() !== prevProps.firstAvailableDepartureDate.getTime() && // check if props changed
                this.props.firstAvailableDepartureDate.getMonth() !== this.props.activeViewDate.getMonth() && // if calendar is on active month there is no need to change dates
                this.props.firstAvailableDepartureDate.getMonth() >= this.props.minDate.getMonth()
            ) {
                // perform update in case of props changing
                this.setInitialScrollPosition();
            }
        }

        // force flatpickr clearing if component received empty array of selected dates
        if (prevProps.value.length !== this.props.value.length && this.props.value.length === 0) {
            instance?.clear();
        }

        if (!this.isScrolled) {
            if (this.props.value.length) {
                this.scrollToMonth(
                    this.props.value[0].getMonth() -
                        (this.props.refFpCalendar.current?.flatpickr.currentMonth as number),
                );
            } else if (this.props.firstAvailableDepartureDate) {
                this.scrollToMonth(
                    this.props.firstAvailableDepartureDate.getMonth() - this.props.activeViewDate.getMonth(),
                );
            }
        }

        /**
         * Force redraw calendar if available dates are updated, but value is the same. (EJH-11305)
         */
        if (
            this.props.availableDates &&
            this.props.availableDates !== prevProps.availableDates &&
            this.props.value === prevProps.value
        ) {
            instance?.redraw();

            if (instance) {
                this.props.showEmptyMonths(instance);
            }
        }
    }

    private readonly handleSingleDateChange = (dates: Date[], instance): void => {
        if (!this.props.isDateAvailable(dates[0])) {
            this.props.setFlatPikrDateValue(this.props.value);

            return;
        }

        if (this.props.isOneMonthPromoPage) {
            this.props.oneMonthPromoPageFlow(dates, instance, this.refScrollableContainer);

            /**  If first selected date from the next month -> Break */
            if (this.props.promoMaxDate && isSameMonth(this.props.promoMaxDate, dates[0])) {
                return;
            }
        }

        this.props.onChangeDates(dates);
    };

    private readonly handleMultipleDatesChange = (dates: Date[], instance): void => {
        /** If first selected date < earliestDateField and next month is available for selecting -> make it not available */
        if (
            this.props.isOneMonthPromoPage &&
            this.props.earliestDateField &&
            this.props.earliestDateField.getTime() >= dates[0].getTime() &&
            this.props.maxDate.getMonth() !== this.props.earliestDateField.getMonth()
        ) {
            const newMaxDate = new Date(this.props.maxDate);
            newMaxDate.setDate(0);
            this.props.setMaxDate(newMaxDate);
        }

        if (formatDateToQuery(dates[0]) == formatDateToQuery(dates[1])) {
            dates.splice(0, 1);
        } else if (dates[0] < this.props.value[0]) {
            if (!this.props.isDateAvailable(dates[0])) {
                this.props.setFlatPikrDateValue(this.props.value);

                return;
            }

            this.props.onChangeDates([dates[0]]);
            this.props.setFlatPikrDateValue([dates[0]]);

            // when flatpicker set Value the min and max dates of calendar are reset
            // that's why we set first month and scroll to selected
            this.setFirstShowingMonth(instance);
            this.setInitialScrollPosition();
        } else {
            if (!this.props.isDateAvailable(dates[1])) {
                this.props.setFlatPikrDateValue(this.props.value);

                return;
            }

            this.props.onChangeDates(dates);
        }
    };

    private readonly onChangePickerDates = (dates: Date[], dateStr, instance): void => {
        if (!dates.length) {
            this.props.refFpCalendar.current?.flatpickr.jumpToDate(this.props.activeViewDate);
        } else if (dates.length === ONE) {
            this.handleSingleDateChange(dates, instance);
        } else if (dates.length === TWO) {
            this.handleMultipleDatesChange(dates, instance);
        }

        this.props.showEmptyMonths(instance);
    };

    private readonly touchMoveFunction = (): void => {
        const monthsContainer =
            this.props.refFpCalendar?.current?.flatpickr.monthNav.querySelectorAll('.flatpickr-month');

        if (!monthsContainer) return;

        const maxDateMonth = this.props.maxDate.getMonth();
        const minDateMonth = this.props.minDate.getMonth();

        /**
         * Define intervals of month indexes that includes in each year
         */
        const yearIntervals = this.yearDropdownOptions.map((year, i) => {
            if (i === 0) {
                /** Interval for first year */
                return [
                    0,
                    this.props.minDate.getFullYear() === this.props.maxDate.getFullYear()
                        ? maxDateMonth - minDateMonth + 1
                        : 12 - minDateMonth - 1,
                ];
            }

            if (i === this.yearDropdownOptions.length - 1) {
                /** Interval for last year */
                const monthAmount = monthsContainer.length;

                return [monthAmount - maxDateMonth - 1, monthAmount - 1];
            }

            /** Interval for other years year */
            const startIndex = 12 * (i - 1) + 12 - minDateMonth;

            return [startIndex, startIndex + 12 - 1];
        });

        /** Find month that is fully shown in screen. Select year depends on interval that include this month.  */
        const container = this.refScrollableContainer?.current;

        if (container) {
            const monthIndex = Array.prototype.slice.call(monthsContainer).findIndex(yearEl => {
                const yearElCoordinates = yearEl.getBoundingClientRect();
                const elementTop = yearElCoordinates.top;
                const elementBottom = yearElCoordinates.bottom;

                if (
                    (yearElCoordinates.height > container.clientHeight && elementTop > 0) ||
                    (elementTop > 0 &&
                        /** When we start scrolling from top to bottom  */
                        (elementBottom <= container.clientHeight ||
                            /** When we start scrolling from bottom to top.  */
                            elementBottom - yearElCoordinates.y < container.clientHeight))
                ) {
                    return true;
                }

                return false;
            });

            if (monthIndex > -1) {
                const idx = yearIntervals.findIndex(interval => monthIndex >= interval[0] && monthIndex <= interval[1]);
                this.changeSelectedYear(this.yearDropdownOptions[idx].value);
            }
        }
    };

    private readonly onViewChange = (dates: Date[], currentDateString: string, instance: Instance): void => {
        let startDate;

        if (new Date().getFullYear() === this.selectedYear) {
            startDate = new Date();
        } else {
            startDate = new Date(this.selectedYear, 0, 1);
        }

        const endDate = new Date(this.selectedYear, 11, 31);

        this.props.setActiveDate(new Date(instance.currentYear, instance.currentMonth, 1, 0, 0, 0, 0));

        this.props.debouncedChangeDateAvailabilityInterval(startDate, endDate);
        this.props.showEmptyMonths(instance);
    };

    /**
     * By default Flatpickr show first month that correspond current month.
     * This method setup first month depending on current year.
     */
    private readonly setFirstShowingMonth = (instance: Instance): void => {
        if (this.props.value.length === 0) {
            return;
        }

        if (
            this.props.isPromoPage &&
            !this.props.ignoreIsPromoPage &&
            this.props.promoMaxDate &&
            this.props.promoMinDate
        ) {
            instance.jumpToDate(new Date(this.props.promoMinDate.getFullYear(), this.props.promoMinDate.getMonth(), 1));
        } else {
            instance.jumpToDate(new Date(this.props.minDate.getFullYear(), this.props.minDate.getMonth(), 1));
        }
    };

    // we add timeout to be sure that ref is ready
    private readonly onReady = (dates: Date[], currentDateString: string, instance: Instance): void => {
        setTimeout(() => this._onReady(dates, currentDateString, instance), 0);
    };

    private readonly _onReady = async (dates: Date[], currentDateString: string, instance: Instance): Promise<void> => {
        // if another waiter is available - skip them to avoid double execution
        if (this.onReadyReactionDisposer) {
            this.onReadyReactionDisposer();
        }

        // perform initial navigation to available dates at the time of calendar opening
        this.onReadyReactionDisposer = when(
            // wait until the first available date and for the calendar ref are available
            () =>
                this.props.firstAvailableDepartureDate !== undefined &&
                this.props.refFpCalendar.current !== null &&
                this.props.minDate !== undefined,
            () => {
                const currentCalendarDate = new Date(instance.currentYear, instance.currentMonth, 1, 0, 0, 0, 0);

                if (
                    this.props.value.length === 0 &&
                    this.props.minDate?.getMonth() !== currentCalendarDate.getMonth() &&
                    this.props.promoMinDate &&
                    this.props.isPromoPage
                ) {
                    this.props.refFpCalendar?.current?.flatpickr.jumpToDate(this.props.minDate, true);
                }
            },
        );

        this.setFirstShowingMonth(instance);
        this.props.showEmptyMonths(instance);
    };

    private readonly getScrollToDate = (): Date | undefined => {
        if (this.props.value.length) {
            return this.props.value[0];
        }

        // to avoid infinity loop if firstAvailableDepartureDate < minDate
        if (
            this.props.firstAvailableDepartureDate &&
            this.props.firstAvailableDepartureDate.getTime() < this.props.minDate.getTime()
        ) {
            return this.props.minDate;
        }

        return this.props.firstAvailableDepartureDate;
    };

    // sets scroll to selected month position
    private readonly setInitialScrollPosition = (): void => {
        const date = new Date(this.props.minDate);
        const scrollToDate = this.getScrollToDate();

        if (scrollToDate) {
            let idx = 0;

            // Fix for http://jra.europe.easyjet.local/browse/EJH-11728
            while (idx <= MAX_AMOUNT_OF_MONTHS) {
                if (date.getMonth() === scrollToDate.getMonth() && date.getFullYear() === scrollToDate.getFullYear()) {
                    break;
                }

                date.setDate(1);
                date.setMonth(date.getMonth() + 1);
                idx++;
            }

            // Month for scrolling was not found
            if (idx > MAX_AMOUNT_OF_MONTHS) {
                return;
            }

            this.scrollToMonth(idx);
        }
    };

    @action toggleYearDropdownOpened = (state: boolean): void => {
        this.isYearDropdownOpened = state;
    };

    @action changeSelectedYear = (year: number): void => {
        this.selectedYear = year;
    };

    private readonly onChangeYear = (selectedOption: IYearOptions): void => {
        this.toggleYearDropdownOpened(false);

        if (selectedOption.value !== this.selectedYear) {
            this.changeSelectedYear(selectedOption.value);
            // select year -> scroll to the first month of the selected year

            const isCurrentYear = this.props.minDate.getFullYear() === selectedOption.value;
            this.scrollToMonth(
                isCurrentYear
                    ? 0
                    : (selectedOption.value - this.props.minDate.getFullYear()) * 12 - this.props.minDate.getMonth(),
            );
        }
    };

    @computed private get mobileMonthAmount(): number {
        return this.props.isOneMonthPromoPage ? 2 : getFullMonthsDifference(this.props.maxDate, this.props.minDate) + 1;
    }

    private readonly scrollToMonth = (monthId: number): void => {
        const monthsContainer = document.querySelectorAll('.dayContainer');

        if (monthsContainer?.[monthId]) {
            monthsContainer[monthId].scrollIntoView({
                block: 'start',
            });

            // -50 cause month label has 40px height
            if (this.refScrollableContainer.current) {
                this.refScrollableContainer.current.scrollTop -= 50;
            }
        }

        this.isScrolled = true;
    };

    private get yearDropdownOptions() {
        const firstYear = this.props.minDate.getFullYear();

        return new Array(this.props.maxDate.getFullYear() - firstYear + 1).fill({}).map((item, i) => ({
            value: firstYear + i,
            label: firstYear + i,
        }));
    }

    render(): React.ReactNode {
        const { nightsNum, nightsSelectedLabel } = this.props;

        return (
            <>
                <div className='search-bar__dropdown__when__top-container'>
                    <div className='search-bar__date-options mobile'>
                        <div className='year-dropdown'>
                            <Select
                                className='year-dropdown__select'
                                classNamePrefix='custom-select'
                                options={this.yearDropdownOptions}
                                value={{
                                    value: this.selectedYear,
                                    label: this.selectedYear,
                                }}
                                isSearchable={false}
                                components={{ DropdownIndicator, MenuList }}
                                blurInputOnSelect
                                maxMenuHeight={210}
                                selectProps={{ hasCustomPlaceholder: false }}
                                onMenuOpen={() => {
                                    this.yearDropdownOptions.length && this.toggleYearDropdownOpened(true);
                                }}
                                onOverlayClick={e => {
                                    e.preventDefault();
                                    this.toggleYearDropdownOpened(false);
                                }}
                                hasOverlay={this.isYearDropdownOpened}
                                menuIsOpen={this.isYearDropdownOpened}
                                onChange={this.onChangeYear}
                                isOptionDisabled={option => option.disabled}
                            />
                        </div>
                    </div>
                    <FlexibilityPills
                        onChange={this.props.onChangeFlexible}
                        flexDays={this.props.flexDays}
                        className='search-bar__dropdown-flexible'
                    />
                    <Weekdays
                        className='search-bar__week-days'
                        weekStart={this.props.refFpCalendar?.current?.flatpickr?.l10n?.firstDayOfWeek}
                    />
                </div>

                <div
                    className='search-bar__dropdown search-bar__dropdown__when search-bar__dropdown--active'
                    id='search-when-dd'
                    style={{ display: 'block' }}
                    ref={this.refScrollableContainer}
                >
                    {this.props.isAvailableDatesLoading ? (
                        <Spinner />
                    ) : (
                        <SearchBarDropdownScrollableBox>
                            <div className='skip-calendar-link-box'>
                                <button tabIndex={0} id='calendarBefore' onFocus={this.props.focusCalendar} />
                            </div>

                            <div className='search-bar__dropdown-values'>
                                <div className='date-picker'>
                                    <DynamicFlatPicker
                                        calendarRef={this.props.refFpCalendar}
                                        withOpenedCalendar
                                        options={{
                                            allowInput: false,
                                            inline: true,
                                            mode: 'range',
                                            showMonths: this.mobileMonthAmount,
                                            animate: false,
                                            minDate: this.props.minDate,
                                            maxDate: this.props.maxDate,
                                            defaultDate: this.props.value,
                                            disableMobile: true,
                                        }}
                                        onChange={this.onChangePickerDates}
                                        onMonthChange={this.onViewChange}
                                        onYearChange={this.onViewChange}
                                        onDayCreate={this.props.onDayCreate}
                                        onReady={this.onReady}
                                    />
                                </div>
                            </div>

                            <div className='skip-calendar-link-box'>
                                <button tabIndex={0} id='calendarAfter' onFocus={this.props.focusCalendar} />
                            </div>
                        </SearchBarDropdownScrollableBox>
                    )}

                    <WhenFieldButtons
                        nightsNum={nightsNum}
                        nightsSelectedLabel={nightsSelectedLabel}
                        value={this.props.value}
                        clearDate={this.props.clearDate}
                        onApply={this.props.onApply}
                        onCloseClick={this.props.onCloseClick}
                        applyBtnText={this.props.applyBtnText}
                        isApplyDisabled={this.props.isApplyDisabled}
                        ignoreIsPromoPage={this.props.ignoreIsPromoPage}
                        renderError={this.props.renderError}
                    />
                </div>
            </>
        );
    }
}

export default inject((stores: TStores) => ({
    firstAvailableDepartureDate: stores.searchStore.searchWhen.firstAvailableDepartureDate,
    onChangeDates: stores.searchStore.searchWhen.onChangeDates,
    getPhrase: stores.layoutStore.getPhrase,
    isPromoPage: stores.layoutStore.isPromoPage,
    promoMinDate: stores.promoPageStore.availableDateStart,
    promoMaxDate: stores.promoPageStore.availableDateEnd,
    lastAvailableDate: stores.searchStore.searchWhen.lastAvailableDate,
    isAvailableDatesLoading: stores.searchStore.searchWhen.isAvailableDatesLoading,
    onChangeFlexible: stores.searchStore.searchWhen.onChangeFlexible,
}))(WhenFieldMobile);
