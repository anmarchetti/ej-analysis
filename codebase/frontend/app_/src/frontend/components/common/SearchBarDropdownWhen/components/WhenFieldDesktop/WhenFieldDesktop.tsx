import * as React from 'react';
import FocusWithin from 'react-focus-within';
import { EventData, Swipeable } from 'react-swipeable';
import classNames from 'classnames';
import { Instance } from 'flatpickr/dist/types/instance';
import { action, IReactionDisposer, makeObservable, observable, runInAction, when } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { formatDateToQuery, getMaxDateInMonth, getPreviousMonthDate, isSameMonth } from 'frontend/utils/date.utils';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { DynamicFlatPicker } from 'frontend/components/common/Calendar/components/FlatPickerDynamic';
import FlexibilityPills from 'frontend/components/common/Pills/FlexibilityPills/FlexibilityPills';
import SearchBarDropdownScrollableBox from 'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox';
import { IBaseWhenFieldProps } from 'frontend/components/common/SearchBarDropdownWhen/components/IBaseWhenFieldProps';
import WhenFieldButtons from 'frontend/components/common/SearchBarDropdownWhen/components/WhenFieldButtons/WhenFieldButtons';

import { focusDateForAccessibility } from './WhenFieldDesktop.utils';

const FocusWithinAny = FocusWithin as any;

interface IWhenFieldDesktopProps extends IBaseWhenFieldProps {
    focusElementNearCalendar: (state: boolean) => void;
    isTitleHidden: boolean;
    onChangeFlexible: (flexDates: number) => void;
    refCalendarBefore: React.RefObject<HTMLInputElement>;
    refCalendarClear: React.RefObject<HTMLButtonElement>;
    refCalendarClose: React.RefObject<HTMLButtonElement>;
}

export class WhenFieldDesktop extends React.Component<IWhenFieldDesktopProps> {
    private isCalendarFocused: boolean = false;
    private onReadyReactionDisposer?: IReactionDisposer;
    private readonly refScrollableContainer: React.RefObject<HTMLDivElement> = React.createRef();

    @observable isHideNextArrow: boolean = false;

    constructor(props: IWhenFieldDesktopProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount(): void {
        document.addEventListener('keydown', this.keydownFunction, false);
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keydownFunction, false);
    }

    componentDidUpdate(prevProps: IWhenFieldDesktopProps): void {
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

        // perform navigation to available dates in case of dates changing
        // change current dates only if ref is available and user does not working with calendar
        if (
            this.props.refFpCalendar.current !== null &&
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
                this.props.refFpCalendar.current.flatpickr.jumpToDate(this.props.firstAvailableDepartureDate, true);
            }
        }

        // force flatpickr clearing if component received empty array of selected dates
        if (prevProps.value.length !== this.props.value.length && this.props.value.length === 0) {
            this.jumpToPrevSelectedMonth(prevProps.value[0]);
        }

        if (!this.props.value.length && prevProps.value.length) {
            this.changeHideNextArrow();

            if (
                /**
                 * When user select dates in last available month and reset detes,
                 */
                instance?.currentMonth === this.props.maxDate.getMonth() &&
                instance?.currentYear === this.props.maxDate.getFullYear() &&
                !this.props.isOneMonthPromoPage
            ) {
                const prevMonth = new Date(this.props.maxDate.getFullYear(), this.props.maxDate.getMonth() - 1, 1);
                instance?.jumpToDate(prevMonth, true);
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

    private setCalendarFocused(isFocused: boolean) {
        this.isCalendarFocused = isFocused;
    }

    private readonly handleSingleDateChange = (dates: Date[], instance) => {
        if (!this.props.isDateAvailable(dates[0])) {
            this.props.setFlatPikrDateValue(this.props.value);

            return;
        } else if (this.props.isOneMonthPromoPage) {
            this.props.oneMonthPromoPageFlow(dates, instance, this.refScrollableContainer);

            /**  If first selected date from the next month -> Break */
            if (this.props.promoMaxDate && isSameMonth(dates[0], this.props.promoMaxDate)) {
                return;
            }
        }

        this.props.onChangeDates(dates);
    };

    private readonly onChangePickerDates = (dates: Date[], dateStr, instance) => {
        if (dates.length == 1) {
            this.handleSingleDateChange(dates, instance);
        } else if (dates.length == 2) {
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

            if (formatDateToQuery(dates[0]) === formatDateToQuery(dates[1])) {
                this.props.setFlatPikrDateValue([dates[0]]);
            } else if (dates[0] < this.props.value[0]) {
                if (!this.props.isDateAvailable(dates[0])) {
                    this.props.setFlatPikrDateValue(this.props.value);

                    return;
                }

                this.props.onChangeDates([dates[0]]);
                this.props.setFlatPikrDateValue([dates[0]]);
            } else {
                if (!this.props.isDateAvailable(dates[1])) {
                    this.props.setFlatPikrDateValue(this.props.value);

                    return;
                }

                this.props.onChangeDates(dates);
            }
        }

        focusDateForAccessibility(dates, instance);
        this.props.showEmptyMonths(instance);
    };

    private readonly jumpToPrevSelectedMonth = (prevDate: Date) => {
        if (!this.props.refFpCalendar.current) {
            return;
        }

        const fp = this.props.refFpCalendar.current?.flatpickr;
        const currentFirstShownMonth = new Date(fp.currentYear, fp.currentMonth, 1);

        const nextMonth = new Date(currentFirstShownMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        fp.clear();

        if (nextMonth.getMonth() === prevDate.getMonth() && prevDate.getFullYear() === nextMonth.getFullYear()) {
            fp.jumpToDate(currentFirstShownMonth);
        } else {
            fp.jumpToDate(prevDate);
        }
    };

    private readonly keydownFunction = (event: KeyboardEvent): void => {
        if (!this.isCalendarFocused) {
            return;
        }

        if (event.key === KeyboardKey.ESC && document.activeElement?.classList.contains('flatpickr-day')) {
            this.props.focusElementNearCalendar(true);
        }

        if (event.key === KeyboardKey.Tab && event.shiftKey) {
            this.props.focusElementNearCalendar(false);
        }

        if (event.key === KeyboardKey.Tab) {
            event.preventDefault();
            this.props.focusElementNearCalendar(true);
        }
    };

    private readonly onViewChange = (dates: Date[], currentDateString: string, instance: Instance) => {
        let startDate;
        const endDate = new Date(instance.currentYear, instance.currentMonth + 3, 3, 0, 0, 0, 0);

        startDate = new Date(instance.currentYear, instance.currentMonth - 1, -3, 0, 0, 0, 0);

        this.props.setActiveDate(new Date(instance.currentYear, instance.currentMonth, 1, 0, 0, 0, 0));

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (startDate < now) {
            startDate = now;
        }

        this.props.debouncedChangeDateAvailabilityInterval(startDate, endDate);

        this.changeHideNextArrow();
        this.props.showEmptyMonths(instance);
    };

    @action changeHideNextArrow = (): void => {
        const selectedYear = this.props.refFpCalendar.current?.flatpickr.currentYear;
        const selectedMonth = this.props.refFpCalendar.current?.flatpickr.currentMonth;

        if (selectedYear && selectedMonth !== undefined) {
            if (this.props.isOneMonthPromoPage) {
                this.isHideNextArrow = true;

                return;
            }

            if (selectedMonth === 11) {
                this.isHideNextArrow =
                    selectedYear + 1 === this.props.maxDate.getFullYear() && this.props.maxDate.getMonth() === 0;
            } else {
                this.isHideNextArrow =
                    selectedMonth + 1 === this.props.maxDate.getMonth() &&
                    selectedYear === this.props.maxDate.getFullYear();
            }
        }
    };

    private readonly onSwipe = (eventData: EventData) => {
        if (this.props.refFpCalendar.current) {
            const instance: Instance = this.props.refFpCalendar.current.flatpickr;

            if (eventData.dir == 'Left') {
                instance.changeMonth(1);
            } else if (eventData.dir == 'Right') {
                instance.changeMonth(-1);
            }
        }
    };

    // we add timeout to be sure that ref is ready
    private readonly onReady = (dates: Date[], currentDateString: string, instance: Instance) => {
        setTimeout(() => this._onReady(dates, currentDateString, instance), 0);
    };

    private readonly _onReady = async (dates: Date[], currentDateString: string, instance: Instance) => {
        // if another waiter is available - skip them to avoid double execution
        if (this.onReadyReactionDisposer) {
            this.onReadyReactionDisposer();
        }

        // perform initial navigation to available dates at the time of calendar opening
        this.onReadyReactionDisposer = when(
            // wait unitil the first available date and for the calendar ref are available
            () =>
                this.props.firstAvailableDepartureDate !== undefined &&
                this.props.refFpCalendar.current !== null &&
                this.props.minDate !== undefined,
            () => {
                const currentCalendarDate = new Date(instance.currentYear, instance.currentMonth, 1, 0, 0, 0, 0);

                /**
                 * Jump to firstAvailableDepartureDate only if open after cleaning on desktop
                 */
                if (
                    this.props.firstAvailableDepartureDate &&
                    this.props.firstAvailableDepartureDate.getTime() >= this.props.minDate.getTime() &&
                    this.props.firstAvailableDepartureDate.getMonth() !== currentCalendarDate.getMonth() && // skip useless update
                    this.props.value.length === 0 // change dates only if user is not working with calendar
                ) {
                    /** If firstAvailableDepartureDate in the same month as maxDate then jump to previous month
                     *  to prevent showing unavailable month that goes after maxDate */
                    if (
                        this.props.firstAvailableDepartureDate.getMonth() === this.props.maxDate.getMonth() &&
                        this.props.firstAvailableDepartureDate.getFullYear() === this.props.maxDate.getFullYear()
                    ) {
                        const monthBeforeLastAvailable = new Date(this.props.maxDate);
                        monthBeforeLastAvailable.setDate(0);

                        this.props.refFpCalendar?.current?.flatpickr.jumpToDate(monthBeforeLastAvailable, true);
                    } else {
                        this.props.refFpCalendar?.current?.flatpickr.jumpToDate(
                            this.props.firstAvailableDepartureDate,
                            true,
                        );
                    }
                } else if (
                    this.props.value.length === 0 &&
                    this.props.minDate?.getMonth() !== currentCalendarDate.getMonth() &&
                    this.props.promoMinDate &&
                    this.props.isPromoPage
                ) {
                    this.props.refFpCalendar?.current?.flatpickr.jumpToDate(this.props.minDate, true);
                }
            },
        );

        /**
         *  When user select dates in last available month and open calendar once again,
         * we need jump to previous month to make selected month as last month as user can see
         */
        if (
            this.props.value.length === 2 &&
            this.props.refFpCalendar?.current?.flatpickr.currentMonth === this.props.maxDate.getMonth() &&
            this.props.refFpCalendar?.current?.flatpickr.currentYear === this.props.maxDate.getFullYear() &&
            !this.props.isOneMonthPromoPage
        ) {
            let prevMonth = new Date(this.props.maxDate);
            prevMonth.setDate(1);
            prevMonth = getPreviousMonthDate(prevMonth);
            this.props.refFpCalendar?.current?.flatpickr.jumpToDate(prevMonth, true);
        }

        this.changeHideNextArrow();
        this.props.showEmptyMonths(instance);
    };

    private static readonly getDropdownHintLabel = (dateLength): string => {
        let label = SitecoreDictionary.SearchPodLabelsWhenDropdown;

        if (dateLength === 1) {
            label = SitecoreDictionary.SearchPodLabelsWhenReturnDate;
        } else if (dateLength === 2) {
            label = SitecoreDictionary.SearchPodLabelsWhenBothDates;
        }

        return label;
    };

    render(): React.ReactNode {
        const { getPhrase, nightsNum, nightsSelectedLabel, isTitleHidden } = this.props;
        const titleId = 'search-when-dd-title';

        return (
            <div
                className='search-bar__dropdown search-bar__dropdown__when search-bar__dropdown--active'
                id='search-when-dd'
                role='dialog'
                aria-modal='true'
                aria-labelledby={titleId}
                data-tid='search-when-field-desktop'
                ref={this.refScrollableContainer}
            >
                {!isTitleHidden && (
                    <div data-tid='when-field-title' className='search-bar__dropdown-head-wr'>
                        <h2 className='search-bar__dropdown-head' id={titleId}>
                            {getPhrase(WhenFieldDesktop.getDropdownHintLabel(this.props.value.length))}
                        </h2>
                    </div>
                )}
                <SearchBarDropdownScrollableBox>
                    <div className='search-bar__date-options'>
                        {nightsNum > 0 && (
                            <div className='date-description'>
                                <p>{nightsSelectedLabel}</p>
                            </div>
                        )}

                        <FlexibilityPills
                            onChange={this.props.onChangeFlexible}
                            flexDays={this.props.flexDays}
                            className='search-bar__dropdown-flexible'
                        />
                    </div>

                    <div className='skip-calendar-link-box'>
                        <button tabIndex={0} id='calendarBefore' onFocus={this.props.focusCalendar} />
                    </div>

                    <div className='search-bar__dropdown-values'>
                        <div className={classNames('date-picker', this.isHideNextArrow && 'hide-arrow')}>
                            <FocusWithinAny
                                onFocus={() => this.setCalendarFocused(true)}
                                onBlur={() => this.setCalendarFocused(false)}
                            >
                                {({ getFocusProps, isFocused }) => (
                                    <div
                                        {...getFocusProps()}
                                        className={isFocused ? 'calendar-box--focued' : 'calendar-box--not-foxused'}
                                    >
                                        <Swipeable onSwiped={eventData => this.onSwipe(eventData)} trackTouch={true}>
                                            <DynamicFlatPicker
                                                withOpenedCalendar
                                                calendarRef={this.props.refFpCalendar}
                                                options={{
                                                    allowInput: false,
                                                    inline: true,
                                                    mode: 'range',
                                                    showMonths: 2,
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
                                        </Swipeable>
                                    </div>
                                )}
                            </FocusWithinAny>
                        </div>
                    </div>

                    <div className='skip-calendar-link-box'>
                        <button tabIndex={0} id='calendarAfter' onFocus={this.props.focusCalendar} role='tab' />
                    </div>
                </SearchBarDropdownScrollableBox>

                {this.props.renderError()}

                <WhenFieldButtons
                    nightsNum={nightsNum}
                    nightsSelectedLabel={nightsSelectedLabel}
                    refCalendarClose={this.props.refCalendarClose}
                    refCalendarClear={this.props.refCalendarClear}
                    value={this.props.value}
                    clearDate={this.props.clearDate}
                    onApply={this.props.onApply}
                    onCloseClick={this.props.onCloseClick}
                    applyBtnText={this.props.applyBtnText}
                    isApplyDisabled={this.props.isApplyDisabled}
                    ignoreIsPromoPage={this.props.ignoreIsPromoPage}
                />
            </div>
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
    onChangeFlexible: stores.searchStore.searchWhen.onChangeFlexible,
}))(observer(class WrappedWhenFieldDesktop extends WhenFieldDesktop {}));
