import React, { useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Instance } from 'flatpickr/dist/types/instance';
import { IReactionDisposer, when } from 'mobx';
import { observer } from 'mobx-react';

import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getFullMonthsDifference } from 'frontend/utils/date.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SearchBarDropdownScrollableBox from 'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox';
import Weekdays from 'frontend/components/common/Weekdays/Weekdays';
import { WeekDayFormat } from 'frontend/components/common/Weekdays/weekdays.utils';

import { makeOverlayOnDisabledMonths as _makeOverlayOnDisabledMonths } from './components/calendar.utils';
import { DynamicFlatPicker } from './components/FlatPickerDynamic';
import MonthPicker from './MonthPicker/MonthPicker';
import DatePickerButtons from './DatePickerButtons';
import { CalendarType, IDatePickerProps } from './IDatePickerProps';

import styles from './Calendar.module.scss';

const CalendarMobile: React.FC<IDatePickerProps> = props => {
    const {
        refFpCalendar,
        currentDates,
        minDate,
        maxDate,
        numberOfNights,
        nightsSelectedLabel,
        selectedDates,
        calendarType,
        monthOptions,
        isDatePickerOpen,
        overlayDisabledMonths,
        focusCalendar,
        setDates,
        clearDates,
        confirmDates,
        setPastHoliday,
        onCloseClick,
        selectedMonth,
        onDayCreate,
    } = props;

    const MAX_AMOUNT_OF_MONTHS = 36;
    const refScrollableContainer = useRef<HTMLDivElement | null>(null);
    const isModalVariant = calendarType === CalendarType.Modal;
    const isInlineVariant = calendarType === CalendarType.Inline;
    const prevDate = usePrevious(currentDates);
    const mobileMonthAmount = getFullMonthsDifference(maxDate, minDate) + 1;
    let onReadyReactionDisposer: IReactionDisposer;

    const { getPhrase, getSetting } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
    }));

    const makeOverlayOnDisabledMonthsWithParams = useCallback(
        () => _makeOverlayOnDisabledMonths(!!overlayDisabledMonths, refFpCalendar, getSetting),
        [overlayDisabledMonths, refFpCalendar, getSetting],
    );

    const scrollToMonth = (monthId: number) => {
        const monthsContainer = document.querySelectorAll('.dayContainer');

        if (monthsContainer?.[monthId]) {
            monthsContainer[monthId].scrollIntoView({
                block: 'start',
            });

            if (refScrollableContainer.current) {
                const FIRST_MONTH_SCROLL_OFFSET = 150;
                const OTHER_MONTHS_SCROLL_OFFSET = 50;
                refScrollableContainer.current.scrollTop -=
                    monthId === 0 ? FIRST_MONTH_SCROLL_OFFSET : OTHER_MONTHS_SCROLL_OFFSET;
            }
        }
    };

    const getScrollToDate = () => {
        if (selectedMonth) return selectedMonth;

        if (currentDates?.length === 0) return minDate;

        return currentDates[0];
    };

    const setInitialScrollPosition = () => {
        const date = new Date(minDate);
        const scrollToDate = getScrollToDate();

        if (!scrollToDate) {
            return;
        }

        let idx = 0;
        while (idx <= MAX_AMOUNT_OF_MONTHS) {
            if (date.getMonth() === scrollToDate.getMonth() && date.getFullYear() === scrollToDate.getFullYear()) {
                break;
            }

            date.setDate(1);
            date.setMonth(date.getMonth() + 1);
            idx += 1;
        }

        // Month for scrolling was not found
        if (idx > MAX_AMOUNT_OF_MONTHS) {
            return;
        }

        scrollToMonth(idx);

        makeOverlayOnDisabledMonthsWithParams();
    };

    const setFirstShowingMonth = (instance: Instance) => {
        if (currentDates?.length === 0) {
            return;
        }

        instance.jumpToDate(new Date(minDate.getFullYear(), minDate.getMonth(), 1));

        makeOverlayOnDisabledMonthsWithParams();
    };

    const onChange = (onChangeSelectedDates: Date[], dateStr: string, instance: Instance) => {
        const validatedSelectedDates = setDates(onChangeSelectedDates);

        // If we get new dates back from setDates, it's because we modified them so use them instead of the ones passed in
        // eslint-disable-next-line no-param-reassign
        instance.selectedDates = validatedSelectedDates || onChangeSelectedDates;
        instance.redraw();
    };

    const onReady = (dates: Date[], currentDateString: string, instance: Instance) => {
        setTimeout(() => {
            if (onReadyReactionDisposer) {
                onReadyReactionDisposer();
            }

            const flatpickr = refFpCalendar?.current?.flatpickr;
            onReadyReactionDisposer = when(
                () => !!refFpCalendar?.current && minDate !== undefined,
                () => {
                    const currentCalendarDate = new Date(instance?.currentYear, instance?.currentMonth, 1, 0, 0, 0, 0);

                    if (currentDates.length === 0 && minDate.getMonth() !== currentCalendarDate.getMonth()) {
                        flatpickr?.jumpToDate(minDate, true);
                    }
                },
            );

            if (refFpCalendar?.current !== null) {
                setFirstShowingMonth(instance);
            }

            makeOverlayOnDisabledMonthsWithParams();
        });
    };

    useEffect(() => {
        if (isDatePickerOpen || isInlineVariant) {
            setInitialScrollPosition();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDatePickerOpen, isInlineVariant, selectedMonth]);

    useEffect(() => {
        if (!refFpCalendar?.current) {
            return;
        }

        if (prevDate?.length !== currentDates?.length && currentDates?.length === 0) {
            refFpCalendar.current?.flatpickr?.clear();
            refFpCalendar.current?.flatpickr?.jumpToDate(minDate, true);
        }

        makeOverlayOnDisabledMonthsWithParams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDates]);

    useEffect(makeOverlayOnDisabledMonthsWithParams, [makeOverlayOnDisabledMonthsWithParams, selectedDates]);

    return (
        <>
            <div
                className={classNames(
                    'search-bar__dropdown__when__top-container',
                    styles.fixedHeader,
                    isInlineVariant && styles.fullWidth,
                )}
            >
                {isInlineVariant && monthOptions && <MonthPicker monthOptions={monthOptions} />}

                <Weekdays
                    className={classNames('search-bar__week-days', styles.weekdays)}
                    weekStart={refFpCalendar.current?.flatpickr?.l10n?.firstDayOfWeek}
                    format={isInlineVariant ? WeekDayFormat.Single : WeekDayFormat.Min}
                />
            </div>

            <div
                className='search-bar__dropdown search-bar__dropdown__when search-bar__dropdown--active'
                id='calendar-date-picker'
                data-tid='calendar-date-picker'
                style={{ display: 'block' }}
                ref={refScrollableContainer}
            >
                <SearchBarDropdownScrollableBox>
                    <div className='skip-calendar-link-box'>
                        <button tabIndex={0} data-tid='calendar-before' id='calendarBefore' onFocus={focusCalendar} />
                    </div>

                    <div
                        className={classNames(
                            'search-bar__dropdown-values',
                            isInlineVariant && 'd-flex justify-content-center',
                        )}
                    >
                        <div
                            className={classNames('date-picker', isInlineVariant && styles.dateChangePicker)}
                            data-tid='date-picker'
                        >
                            {isModalVariant && (
                                <Button isTransparent className={styles['btn-past-holiday']} onClick={setPastHoliday}>
                                    {getPhrase(SitecoreDictionary.ContactUsButtonsPastHoliday)}
                                </Button>
                            )}
                            <DynamicFlatPicker
                                withOpenedCalendar
                                calendarRef={refFpCalendar}
                                options={{
                                    allowInput: false,
                                    inline: true,
                                    mode: 'range',
                                    showMonths: mobileMonthAmount,
                                    animate: false,
                                    minDate,
                                    maxDate,
                                    defaultDate: currentDates,
                                    disableMobile: true,
                                }}
                                onChange={onChange}
                                onReady={onReady}
                                onDayCreate={onDayCreate}
                            />
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
            </div>
        </>
    );
};

export default observer(CalendarMobile);
