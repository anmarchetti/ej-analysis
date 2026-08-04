import * as React from 'react';
import dayjs from 'dayjs';
import { action, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { SearchWhenStore } from 'frontend/store/base/search/SearchWhenStore';
import { TStores } from 'frontend/store/IStores';
import { getCountOfNightLabel, getMaxDateInMonth, isSameMonth } from 'frontend/utils/date.utils';
import { isDateAvailable } from 'frontend/utils/dateAvailability.utils';
import { debounce } from 'frontend/utils/debounce';
import { IAvailableDate } from 'models/data/IAvailableDate';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { unavailableMonthOverlay } from 'frontend/components/common/Calendar/components/calendar.utils';
import {
    TReactFlatpickr,
    TReactFlatpickrInstance,
} from 'frontend/components/common/Calendar/components/FlatPickerDynamic';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import WhenFieldDesktop from 'frontend/components/common/SearchBarDropdownWhen/components/WhenFieldDesktop/WhenFieldDesktop';
import WhenFieldMobile from 'frontend/components/common/SearchBarDropdownWhen/components/WhenFieldMobile/WhenFieldMobile';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import { getProperErrorMessage } from './DateViewDropdown.utils';

import styles from './DateViewDropdown.module.scss';

export interface IDateViewDropdownProps extends IComponentWithDictionary {
    availableDates: Nullable<IAvailableDate[]>;
    changeDateAvailabilityInterval: (start: Date, end: Date, isIgnorePromo?: boolean) => void;
    clearErrorMessage: () => void;
    earliestDateField: null | Date;
    flexDays: number;
    getSetting: (setting: SiteSettings) => any;
    isAvailableDatesLoading: boolean;
    isFlexible: boolean;
    isOneMonthPromoPage: boolean;
    isPromoPage: boolean;
    isScreenMedium: boolean;
    isTitleHidden: boolean;
    lastAvailableDate: Nullable<Date>;
    minDate: Date | undefined;
    onApply: () => void;
    onChangeFlexible: (flexDates: number) => void;
    onClearDates: (noUpdate?: boolean) => void;
    onClose: () => void;
    promoMaxDate: Nullable<Date>;
    promoMinDate: Nullable<Date>;
    resetDateAvailabilityInterval: () => void;
    selectedNumberOfNights: number;
    setAvailableDatesLoading: (state: boolean) => void;
    updateAvailableDates: SearchWhenStore['updateAvailableDates'];
    value: Date[];
    applyBtnText?: string;
    errorMessage?: string;
    ignoreIsPromoPage?: boolean; // TO DO remove as it is always false
    isApplyDisabled?: boolean;
}

@observer
export class DateViewDropdown extends React.Component<IDateViewDropdownProps> {
    private readonly refFpCalendar = React.createRef<TReactFlatpickr>();
    private activeViewDate: Date;
    private readonly debounceDelay = 300; //ms
    private readonly minDate: Date;
    private maxDate: Date;
    private toSeed;

    private readonly refCalendarBefore: React.RefObject<HTMLInputElement> = React.createRef();
    private readonly refCalendarClear: React.RefObject<HTMLButtonElement> = React.createRef();
    private readonly refCalendarClose: React.RefObject<HTMLButtonElement> = React.createRef();

    private readonly focusTimeoutDeleay: number = 10; //ms

    @observable isOneMonthsPromoPageErrorShown: boolean = false;

    constructor(props: IDateViewDropdownProps) {
        super(props);
        makeObservable(this);

        // get current date without hours
        const today = new Date().setHours(0, 0, 0, 0);

        this.minDate = new Date(today);

        if (this.props.minDate) {
            this.minDate = this.props.minDate;
        }

        if (
            this.props.isPromoPage &&
            !this.props.ignoreIsPromoPage &&
            this.props.promoMinDate &&
            this.props.promoMaxDate
        ) {
            this.minDate = this.props.promoMinDate;

            if (this.props.isOneMonthPromoPage) {
                this.getMaxDateForOneMonthPromoPage(this.props.promoMaxDate, this.props.promoMinDate);
            } else {
                this.maxDate = getMaxDateInMonth(this.props.promoMaxDate);
            }
        }

        if (!this.maxDate && this.props.lastAvailableDate) {
            const date = dayjs(this.props.lastAvailableDate).add(1, 'M').toDate();
            this.maxDate = getMaxDateInMonth(date);
        }

        if (!this.maxDate) {
            this.maxDate = new Date();
            this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
        }

        // Min allowed date can't be earlier than today & tomorrow;
        const minAllowedDate = new Date(today);
        minAllowedDate.setDate(minAllowedDate.getDate() + 2);

        if (this.minDate < minAllowedDate) {
            this.minDate = minAllowedDate;
        }

        this.activeViewDate =
            this.props.value && this.props.value.length > 0 ? this.props.value[0] : new Date(this.minDate);
    }

    private getMaxDateForOneMonthPromoPage(promoMaxDate: Date, promoMinDate: Date): void {
        if (this.props.value.length === 2 && this.props.value[1].getMonth() === promoMaxDate.getMonth()) {
            this.maxDate = getMaxDateInMonth(promoMaxDate);
        } else {
            this.maxDate = getMaxDateInMonth(promoMinDate);
        }
    }

    componentDidUpdate(prevProps: IDateViewDropdownProps) {
        if (
            prevProps.value !== this.props.value ||
            prevProps.isAvailableDatesLoading !== this.props.isAvailableDatesLoading ||
            prevProps.availableDates !== this.props.availableDates
        ) {
            setTimeout(() => {
                if (this.refFpCalendar?.current?.flatpickr) {
                    this.showEmptyMonths(this.refFpCalendar.current.flatpickr);
                }
            }, 0);
        }
    }

    componentWillUnmount(): void {
        if (!this.props.value.length || this.props.value.length < 2) {
            this.props.resetDateAvailabilityInterval();
            this.activeViewDate = new Date(this.minDate);
        } else {
            // if dates are selected, then loading of available dates +1 month from the first selected date to +3 months from the second selected date is called
            // so that there are no problems with displaying the calendar when opening, when the selected dates are in different months
            let startDate = new Date(
                this.props.value[0].getFullYear(),
                this.props.value[0].getMonth() - 1,
                -3,
                0,
                0,
                0,
                0,
            );
            const endDate = new Date(
                this.props.value[1].getFullYear(),
                this.props.value[1].getMonth() + 3,
                3,
                0,
                0,
                0,
                0,
            );

            this.activeViewDate = new Date(
                this.props.value[0].getFullYear(),
                this.props.value[0].getMonth(),
                1,
                0,
                0,
                0,
                0,
            );

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (startDate < now) {
                startDate = now;
            }

            this.debouncedChangeDateAvailabilityInterval(startDate, endDate);
        }
    }

    private readonly oneMonthPromoPageFlow = (dates: Date[], instance, refScrollableContainer) => {
        /** For 'One Month promo page' user can select outbound date only from month of earliestDateField.
         * For 'One month page'promoMaxDate is always next month after earliestDateField month.
         * If first selected date from the next month -> show error and set previous selected dates in calendar.
         */
        if (this.props.promoMaxDate && isSameMonth(this.props.promoMaxDate, dates[0])) {
            this.setFlatPikrDateValue(instance.config.defaultDate);

            this.setOneMonthsPromoPageErrorShown(true);

            if (refScrollableContainer) {
                const errorEl = refScrollableContainer.current?.getElementsByClassName(
                    'search-bar__dropdown__when__error',
                )[0];
                errorEl?.scrollIntoView();
            }

            return;
        }

        this.isOneMonthsPromoPageErrorShown && this.setOneMonthsPromoPageErrorShown(false);

        if (this.props.earliestDateField && this.props.promoMaxDate) {
            /** If first selected date > than earliestDateField -> make next month available for choosing inbound date */
            if (
                this.props.earliestDateField.getTime() < dates[0].getTime() &&
                dates[0].getMonth() !== this.props.promoMaxDate.getMonth()
            ) {
                this.setMaxDate(this.props.promoMaxDate);
            } else if (
                /** If first selected date < earliestDateField and next month is shown -> make next month unavailable for selecting */
                this.props.earliestDateField.getTime() >= dates[0].getTime() &&
                this.maxDate.getMonth() !== this.props.earliestDateField.getMonth()
            ) {
                const newMaxDate = new Date(this.maxDate);
                newMaxDate.setDate(0);
                this.setMaxDate(newMaxDate);
            }
        }
    };

    private readonly isDateAvailable = (date: Date): boolean =>
        isDateAvailable(date, this.props.availableDates, this.props.value);

    private readonly focusElementNearCalendar = (isNext: boolean): void => {
        const refCalendarAfter = this.props.value.length > 0 ? this.refCalendarClear : this.refCalendarClose;
        const ref = isNext ? refCalendarAfter : this.refCalendarBefore;

        if (ref?.current) {
            ref.current.focus();
        }
    };

    private readonly getFirstShowingDateAfterClearing = () => {
        if (!this.props.value.length) {
            return;
        }

        if (this.props.isPromoPage && !this.props.ignoreIsPromoPage && this.props.promoMinDate) {
            return this.props.promoMinDate;
        }

        return new Date();
    };

    private readonly clearDate = (noJump?: boolean) => {
        this.isOneMonthsPromoPageErrorShown && this.setOneMonthsPromoPageErrorShown(false);
        this.props.clearErrorMessage();

        if (this.props.isOneMonthPromoPage && this.props.promoMaxDate) {
            const newMaxDate = new Date(this.props.promoMaxDate);
            newMaxDate.setDate(0);
            this.setMaxDate(newMaxDate);
        }

        if (this.refFpCalendar.current) {
            this.props.onClearDates();
            this.refFpCalendar.current.flatpickr.clear();

            if (!noJump) {
                let targetDate;

                if (this.props.isScreenMedium) {
                    targetDate = this.activeViewDate || this.minDate;
                } else {
                    targetDate = this.getFirstShowingDateAfterClearing();
                }

                this.refFpCalendar.current.flatpickr.jumpToDate(targetDate);

                const now = new Date(targetDate);
                now.setHours(0, 0, 0, 0);
                this.activeViewDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                let startDate = new Date(now.getFullYear(), now.getMonth(), -3, 0, 0, 0, 0);
                const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 3, 0, 0, 0, 0);

                if (startDate < now) {
                    startDate = now;
                }

                this.props.changeDateAvailabilityInterval(startDate, endDate, this.props.ignoreIsPromoPage);
            }
        }
    };

    @action private readonly setOneMonthsPromoPageErrorShown = (state: boolean) => {
        this.isOneMonthsPromoPageErrorShown = state;
    };

    private readonly setFlatPikrDateValue = (dates: Date[], noJump?: boolean) => {
        if (this.refFpCalendar.current) {
            this.refFpCalendar.current.flatpickr.setDate(dates);

            !noJump && this.activeViewDate && this.refFpCalendar.current.flatpickr.jumpToDate(this.activeViewDate);
        }
    };

    private readonly changeDateAvailabilityInterval = (start: Date, end: Date) => {
        this.props.setAvailableDatesLoading(true);
        this.debouncedChangeDateAvailabilityInterval(start, end);
    };

    private readonly debouncedChangeDateAvailabilityInterval = debounce((start: Date, end: Date) => {
        this.props.changeDateAvailabilityInterval(start, end, this.props.ignoreIsPromoPage);
        this.props.setAvailableDatesLoading(false);
    }, this.debounceDelay);

    private readonly onDayCreate = (dObj, dStr, fp, dayElem) => {
        const date: Date = dayElem.dateObj;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (date < now) {
            return;
        }

        if (this.props.value.length == 1) {
            if (this.props.value[0] > date) {
                dayElem.classList.add('not_in_range');
            }
        }

        if (!this.isDateAvailable(date)) {
            dayElem.classList.add('not_available');
        }
    };

    private readonly showEmptyMonths = (instance: TReactFlatpickrInstance) => {
        if (this.props.isAvailableDatesLoading) {
            return;
        }

        unavailableMonthOverlay(instance, this.props.getSetting);
    };

    private readonly setToSeed = (func: () => void) => {
        this.toSeed = setTimeout(func, this.focusTimeoutDeleay);
    };

    private readonly focusCalendar = () => {
        const days = document.querySelectorAll(
            '.flatpickr-day:not(.prevMonthDay):not(.not_available):not(.flatpickr-disabled):not(.hidden)',
        );
        const day = days[0] as HTMLDivElement;

        if (day) {
            day.focus();
        }
    };

    private readonly onCloseClick = () => {
        // Clear dates before closing on Promo Pages
        if (this.props.isPromoPage && !this.props.ignoreIsPromoPage) {
            this.clearDate();
        }

        this.props.onClose();
    };

    @action setMaxDate = (date: Date): void => {
        this.maxDate = date;
    };

    @action setActiveDate = (date: Date): void => {
        this.activeViewDate = date;
    };

    private readonly renderError = () => {
        const errorMessage = getProperErrorMessage(
            this.isOneMonthsPromoPageErrorShown,
            this.props.getPhrase,
            this.props.errorMessage,
            this.minDate,
        );

        return errorMessage ? (
            <div className={styles.searchBarDropdownWhenErrorWrapper}>
                <ErrorMessage
                    message={errorMessage}
                    icon={<SvgWarningFilled />}
                    errorMessageClass={styles.searchBarDropdownWhenError}
                />
            </div>
        ) : null;
    };

    render(): React.ReactNode {
        const nightsNum = this.props.selectedNumberOfNights ? this.props.selectedNumberOfNights : 0;
        const nightsSelectedLabel = getCountOfNightLabel(nightsNum, this.props.getPhrase);

        const fieldProps = {
            minDate: this.minDate,
            maxDate: this.maxDate,
            activeViewDate: this.activeViewDate,
            value: this.props.value,
            refFpCalendar: this.refFpCalendar,
            isFlexible: this.props.isFlexible,
            flexDays: this.props.flexDays,
            focusCalendar: this.focusCalendar,
            setMaxDate: this.setMaxDate,
            setActiveDate: this.setActiveDate,
            debouncedChangeDateAvailabilityInterval: this.changeDateAvailabilityInterval,
            onDayCreate: this.onDayCreate,
            clearDate: this.clearDate,
            isDateAvailable: this.isDateAvailable,
            setFlatPikrDateValue: this.setFlatPikrDateValue,
            onCloseClick: this.onCloseClick,
            onApply: this.props.onApply,
            toSeed: this.toSeed,
            setToSeed: this.setToSeed,
            nightsNum: nightsNum,
            nightsSelectedLabel: nightsSelectedLabel,
            availableDates: this.props.availableDates,
            applyBtnText: this.props.applyBtnText,
            isApplyDisabled: this.props.isApplyDisabled,
            ignoreIsPromoPage: this.props.ignoreIsPromoPage,
            oneMonthPromoPageFlow: this.oneMonthPromoPageFlow,
            isOneMonthPromoPage: this.props.isOneMonthPromoPage,
            earliestDateField: this.props.earliestDateField,
            renderError: this.renderError,
            showEmptyMonths: this.showEmptyMonths,
        };

        return this.props.isScreenMedium ? (
            <WhenFieldDesktop
                {...fieldProps}
                refCalendarBefore={this.refCalendarBefore}
                focusElementNearCalendar={this.focusElementNearCalendar}
                isTitleHidden={this.props.isTitleHidden}
                refCalendarClear={this.refCalendarClear}
                refCalendarClose={this.refCalendarClose}
            />
        ) : (
            <WhenFieldMobile {...fieldProps} />
        );
    }
}

export default inject((stores: TStores) => ({
    selectedNumberOfNights: stores.searchStore.searchWhen.selectedNumberOfNights,
    updateAvailableDates: stores.searchStore.searchWhen.updateAvailableDates,
    onClearDates: stores.searchStore.searchWhen.clearDates,
    changeDateAvailabilityInterval: stores.searchStore.searchWhen.changeDateAvailabilityInterval,
    resetDateAvailabilityInterval: stores.searchStore.searchWhen.resetDateAvailabilityInterval,
    getPhrase: stores.layoutStore.getPhrase,
    getSetting: stores.layoutStore.getSetting,
    isScreenMedium: stores.appStore.isScreenMedium,
    minDate: stores.searchStore.searchWhen.minDate,
    isPromoPage: stores.layoutStore.isPromoPage,
    promoMinDate: stores.promoPageStore.availableDateStart,
    promoMaxDate: stores.promoPageStore.availableDateEnd,
    lastAvailableDate: stores.searchStore.searchWhen.lastAvailableDate,
    isOneMonthPromoPage: stores.promoPageStore.isOneMonthPromoPage,
    earliestDateField: stores.promoPageStore.earliestDateField,
    isAvailableDatesLoading: stores.searchStore.searchWhen.isAvailableDatesLoading,
    setAvailableDatesLoading: stores.searchStore.searchWhen.setAvailableDatesLoading,
    clearErrorMessage: stores.searchStore.clearErrorMessage,
}))(DateViewDropdown);
