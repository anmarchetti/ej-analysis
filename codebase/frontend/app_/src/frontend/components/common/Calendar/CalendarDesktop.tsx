import React, { useCallback, useEffect, useState } from 'react';
import FocusWithin from 'react-focus-within';
import { EventData, Swipeable } from 'react-swipeable';
import classNames from 'classnames';
import flatpickr from 'flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';
import { IReactionDisposer, when } from 'mobx';
import { observer } from 'mobx-react';

import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getPreviousMonthDate } from 'frontend/utils/date.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import Button from 'frontend/components/common/Button';
import Link from 'frontend/components/common/Link';
import SearchBarDropdownScrollableBox from 'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox';

import { makeOverlayOnDisabledMonths as _makeOverlayOnDisabledMonths } from './components/calendar.utils';
import { DynamicFlatPicker } from './components/FlatPickerDynamic';
import MonthPicker from './MonthPicker/MonthPicker';
import DatePickerButtons from './DatePickerButtons';
import { CalendarType, IDatePickerProps } from './IDatePickerProps';

import styles from './Calendar.module.scss';

const LAST_MONTH = 11;
const FULL_DATES_LENGTH = 2;
const ARRIVAL_DATE_INDEX = 1;

const FocusWithinAny = FocusWithin as any;

const CalendarDesktop: React.FC<IDatePickerProps> = props => {
    const {
        refFpCalendar,
        currentDates,
        minDate,
        maxDate,
        numberOfNights,
        isContinueDisabled,
        nightsSelectedLabel,
        selectedDates,
        overlayDisabledMonths,
        calendarType,
        focusCalendar,
        onDayCreate,
        setDates,
        clearDates,
        setPastHoliday,
        confirmDates,
        onCloseClick,
        monthOptions,
        selectedMonth,
        setSelectedMonth,
        onContinueClick,
        isSubmitLoading,
        focusOnMount,
    } = props;

    const [isHideNextArrow, setIsHideNextArrow] = useState<boolean>(false);
    const [isShowLaterBtn, setIsShowLaterBtn] = useState<boolean>(false);
    const isModalVariant = calendarType === CalendarType.Modal;
    const isInlineVariant = calendarType === CalendarType.Inline;
    const prevDate = usePrevious(currentDates);
    const titleId = 'holiday-date-picker';
    let onReadyReactionDisposer: IReactionDisposer;

    const { getPhrase, getSetting } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
    }));

    // Allow user to swiper calendar on touch desktop devices
    const onSwipe = (eventData: EventData) => {
        if (!refFpCalendar?.current) {
            return;
        }

        const instance: Instance = refFpCalendar.current.flatpickr;

        if (eventData.dir === 'Left') {
            instance?.changeMonth(1);
        } else if (eventData.dir === 'Right') {
            // eslint-disable-next-line no-magic-numbers
            instance?.changeMonth(-1);
        }
    };

    const makeOverlayOnDisabledMonthsWithParams = useCallback(
        () => _makeOverlayOnDisabledMonths(!!overlayDisabledMonths, refFpCalendar, getSetting),
        [overlayDisabledMonths, refFpCalendar, getSetting],
    );

    const onViewChange = () => {
        const selectedYear = refFpCalendar?.current?.flatpickr?.currentYear;
        const firstSelectedMonth = refFpCalendar?.current?.flatpickr?.currentMonth;

        if (selectedYear === undefined || firstSelectedMonth === undefined) {
            return;
        }

        const showLaterBtn = firstSelectedMonth === minDate.getMonth() && selectedYear === minDate.getFullYear();

        const hideArrow =
            firstSelectedMonth === LAST_MONTH
                ? selectedYear + 1 === maxDate.getFullYear() && maxDate.getMonth() === 0
                : firstSelectedMonth + 1 === maxDate.getMonth() && selectedYear === maxDate.getFullYear();

        setIsHideNextArrow(hideArrow);
        setIsShowLaterBtn(showLaterBtn);

        if (isInlineVariant && setSelectedMonth) {
            setSelectedMonth(new Date(selectedYear, firstSelectedMonth, 1));
        }

        makeOverlayOnDisabledMonthsWithParams();
    };

    const onChange = (onChangeSelectedDates: Date[], dateStr: string, instance: Instance) => {
        const validatedSelectedDates = setDates(onChangeSelectedDates);

        // If we get new dates back from setDates, it's because we modified them so use them instead of the ones passed in
        // eslint-disable-next-line no-param-reassign
        instance.selectedDates = validatedSelectedDates || onChangeSelectedDates;

        // If there is no automatically selected end date, skip the rest of the function
        if (instance.selectedDates.length !== FULL_DATES_LENGTH) {
            instance.redraw();

            return;
        }

        // If a pre-selected end date is in the month after the two on the calendar, scroll the calendar one month
        const monthOfArrivalDate = instance.selectedDates[ARRIVAL_DATE_INDEX].getMonth();
        const leftCalendarMonth = instance.currentMonth;
        // For right calendar month, we need to go back to zero if we're in December
        const rightCalendarMonth = instance.currentMonth === LAST_MONTH ? 0 : instance.currentMonth + 1;

        if (![leftCalendarMonth, rightCalendarMonth].includes(monthOfArrivalDate)) {
            // Increment month by one
            instance.changeMonth(1);
        }

        instance.redraw();
    };

    const onReady = (dates: Date[], currentDateString: string, instance: Instance) => {
        setTimeout(() => {
            if (onReadyReactionDisposer) {
                onReadyReactionDisposer();
            }

            const flatpickr = refFpCalendar?.current?.flatpickr;

            if (focusOnMount) {
                refFpCalendar?.current?.flatpickr.jumpToDate(dates[0]);
            }

            onReadyReactionDisposer = when(
                () => !!refFpCalendar?.current && minDate !== undefined,
                () => {
                    const currentCalendarDate = new Date(instance?.currentYear, instance?.currentMonth, 1, 0, 0, 0, 0);

                    if (currentDates.length === 0 && minDate.getMonth() !== currentCalendarDate.getMonth()) {
                        flatpickr?.jumpToDate(minDate, true);
                    }
                },
            );

            if (
                currentDates?.length === FULL_DATES_LENGTH &&
                flatpickr?.currentMonth === maxDate.getMonth() &&
                flatpickr?.currentYear === maxDate.getFullYear()
            ) {
                let prevMonth = new Date(maxDate);
                prevMonth.setDate(1);
                prevMonth = getPreviousMonthDate(prevMonth);
                flatpickr?.jumpToDate(prevMonth, true);
            }

            makeOverlayOnDisabledMonthsWithParams();
        });
    };

    const jumpToPrevSelectedMonth = (previousDate: Date) => {
        /* istanbul ignore next */
        if (!refFpCalendar?.current) {
            return;
        }

        const fp = refFpCalendar.current?.flatpickr;
        const currentFirstShownMonth = new Date(fp?.currentYear, fp?.currentMonth, 1);

        const nextMonth = new Date(currentFirstShownMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        fp?.clear();

        if (
            nextMonth.getMonth() === previousDate?.getMonth() &&
            previousDate?.getFullYear() === nextMonth.getFullYear()
        ) {
            /* istanbul ignore next */
            fp?.jumpToDate(currentFirstShownMonth, true);
        } else {
            fp?.jumpToDate(previousDate, true);
        }

        makeOverlayOnDisabledMonthsWithParams();
    };

    const handleDayCreate: flatpickr.Options.Hook = (dayElement, date, instance, dayElem): void => {
        onDayCreate?.(dayElement, date, instance, dayElem);
        dayElem.removeAttribute('tabindex');
    };

    useEffect(makeOverlayOnDisabledMonthsWithParams, [makeOverlayOnDisabledMonthsWithParams, selectedDates]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(onViewChange, []);

    useEffect(() => {
        const fp = refFpCalendar?.current?.flatpickr;

        if (!selectedMonth || !fp) {
            return;
        }

        fp.jumpToDate(selectedMonth, true);

        makeOverlayOnDisabledMonthsWithParams();
    }, [makeOverlayOnDisabledMonthsWithParams, refFpCalendar, selectedMonth]);

    // Setting Calendar position to submitted date when user reopens calendar
    useEffect(() => {
        if (prevDate && prevDate.length !== currentDates?.length && currentDates?.length === 0) {
            jumpToPrevSelectedMonth(prevDate[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDates]);

    return (
        <div
            className='search-bar__dropdown search-bar__dropdown__when search-bar__dropdown--active'
            id='calendar-date-picker'
            data-tid='calendar-date-picker'
            style={{ display: 'block' }}
            aria-modal='true'
            aria-labelledby={titleId}
        >
            <SearchBarDropdownScrollableBox>
                {isModalVariant && (
                    <div
                        className={classNames(
                            'search-bar__dropdown-head-wr',
                            currentDates?.length === 1 && 'head--alt',
                        )}
                    >
                        <div className='search-bar__dropdown-head' id={titleId}>
                            {getPhrase(SitecoreDictionary.DatePickerLabelsDepartureLabel)}
                        </div>
                        <div className='search-bar__dropdown-head search-bar__dropdown-head--alt'>
                            {getPhrase(SitecoreDictionary.DatePickerLabelsArrivalLabel)}
                        </div>
                    </div>
                )}

                <div className={styles.numDates}>
                    <div
                        className={classNames(
                            'date-description',
                            isInlineVariant && styles.selectionDetails,
                            numberOfNights <= 0 && 'justify-content-end',
                        )}
                    >
                        {numberOfNights > 0 && <p className='my-0'>{nightsSelectedLabel}</p>}
                        {isInlineVariant && monthOptions && <MonthPicker monthOptions={monthOptions} />}
                    </div>
                </div>

                <div className='skip-calendar-link-box'>
                    <button tabIndex={0} data-tid='calendar-before' id='calendarBefore' onFocus={focusCalendar} />
                </div>

                <div
                    className={classNames(
                        'search-bar__dropdown-values',
                        isInlineVariant && 'd-flex justify-content-center my-5',
                    )}
                >
                    <div
                        className={classNames(
                            'date-picker',
                            isHideNextArrow && 'hide-arrow',
                            isInlineVariant && styles.pageDatePickerDesktop,
                        )}
                        data-tid='date-picker'
                    >
                        <FocusWithinAny>
                            {({ getFocusProps, isFocused }) => (
                                <div
                                    {...getFocusProps()}
                                    className={isFocused ? 'calendar-box--focued' : 'calendar-box--not-foxused'}
                                >
                                    <Swipeable onSwiped={eventData => onSwipe(eventData)} trackTouch>
                                        <DynamicFlatPicker
                                            withOpenedCalendar
                                            calendarRef={refFpCalendar}
                                            options={{
                                                allowInput: false,
                                                inline: true,
                                                mode: 'range',
                                                showMonths: 2,
                                                animate: false,
                                                minDate,
                                                maxDate,
                                                defaultDate: currentDates,
                                                disableMobile: true,
                                            }}
                                            onDayCreate={handleDayCreate}
                                            onChange={onChange}
                                            onMonthChange={onViewChange}
                                            onYearChange={onViewChange}
                                            onReady={onReady}
                                        />
                                    </Swipeable>
                                </div>
                            )}
                        </FocusWithinAny>
                        {isShowLaterBtn && isModalVariant && (
                            <Button isTransparent className={styles['btn-past-holiday']} onClick={setPastHoliday}>
                                {getPhrase(SitecoreDictionary.ContactUsButtonsPastHoliday)}
                            </Button>
                        )}
                    </div>
                </div>

                <div className='skip-calendar-link-box'>
                    <button tabIndex={0} data-tid='calendar-after' id='calendarAfter' onFocus={focusCalendar} />
                </div>
            </SearchBarDropdownScrollableBox>
            {isModalVariant && clearDates && confirmDates && onCloseClick && (
                <DatePickerButtons
                    numberOfNights={numberOfNights}
                    nightsSelectedLabel={nightsSelectedLabel}
                    currentDates={currentDates}
                    clearDate={clearDates}
                    onApply={confirmDates}
                    onCloseClick={onCloseClick}
                />
            )}
            {isInlineVariant && (
                <div className={styles.calendarActions}>
                    <span className='me-4'>
                        <Link href={SitePath.ViewBooking}>
                            {getPhrase(SitecoreDictionary.AmendBookingButtonsGoBackNoChanges)}
                        </Link>
                    </span>
                    <Button
                        disabled={isContinueDisabled}
                        onClick={onContinueClick}
                        isLoading={isSubmitLoading}
                        dataTid='calendar-continue-cta'
                    >
                        {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default observer(CalendarDesktop);
