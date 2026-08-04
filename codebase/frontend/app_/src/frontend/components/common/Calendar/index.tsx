import { FunctionComponent, useMemo, useRef } from 'react';
import flatpickr from 'flatpickr';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getCountOfNightLabel, getFullMonthsDifference } from 'frontend/utils/date.utils';
import isBackend from 'frontend/utils/isBackend';
import { TReactFlatpickr } from 'frontend/components/common/Calendar/components/FlatPickerDynamic';

import CalendarDesktop from './CalendarDesktop';
import CalendarMobile from './CalendarMobile';
import { CalendarType } from './IDatePickerProps';

export interface ICalendarProps {
    currentDates: Date[];
    numberOfNights: number;
    setDates: (dates: Date[]) => void;
    calendarEnd?: Date;
    calendarStart?: Date;
    calendarType?: CalendarType;
    clearDates?: () => void;
    confirmDates?: () => void;
    desktopCalendarEndDate?: Date;
    focusOnMount?: boolean;
    isContinueDisabled?: boolean;
    isDatePickerOpen?: boolean;
    isSubmitLoading?: boolean;
    onCloseClick?: () => void;
    onContinueClick?: () => void;
    onDayCreate?: flatpickr.Options.Hook;
    overlayDisabledMonths?: boolean;
    selectedDates?: Date[];
    selectedMonth?: Date;
    setPastHoliday?: () => void;
    setSelectedMonth?: (month: Date) => void;
}

const Calendar: FunctionComponent<ICalendarProps> = props => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const {
        currentDates,
        numberOfNights,
        setDates,
        onDayCreate,
        calendarStart,
        calendarEnd,
        selectedMonth,
        setSelectedMonth,
        isContinueDisabled,
        isDatePickerOpen,
        clearDates,
        confirmDates,
        onCloseClick,
        onContinueClick,
        setPastHoliday,
        selectedDates,
        overlayDisabledMonths,
        calendarType,
        isSubmitLoading,
        focusOnMount,
        desktopCalendarEndDate,
    } = props;

    const isMobile = useMobileViewport();

    const refFpCalendar = useRef<TReactFlatpickr>(null);

    const defaultMaxDate = useMemo(() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);

        return date;
    }, []);

    const defaultMinDate = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        const date = new Date(today);
        date.setDate(1);
        date.setMonth(date.getMonth() - 1);

        return date;
    }, []);

    const minDate = calendarStart || defaultMinDate;
    const maxDate = calendarEnd || defaultMaxDate;

    const monthOptions = useMemo(() => {
        const months: string[] = [];
        const date = new Date(minDate);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        const monthDifference = getFullMonthsDifference(maxDate, minDate);
        for (let i = 0; i <= monthDifference; i += 1) {
            months.push(date.toDateString());
            date.setMonth(date.getMonth() + 1);
        }

        return months;
    }, [maxDate, minDate]);

    const nightsSelectedLabel = getCountOfNightLabel(numberOfNights, getPhrase);

    const focusCalendar = () => {
        const days = document.querySelectorAll(
            '.flatpickr-day:not(.prevMonthDay):not(.not_available):not(.flatpickr-disabled):not(.hidden)',
        );
        const day = days[0] as HTMLDivElement;

        if (day) {
            day.focus();
        }
    };

    const calendarProps = {
        refFpCalendar,
        currentDates,
        minDate,
        maxDate,
        numberOfNights,
        nightsSelectedLabel,
        focusCalendar,
        setDates,
        onDayCreate,
        monthOptions,
        calendarType: calendarType ?? CalendarType.Modal,
        isContinueDisabled,
        isDatePickerOpen,
        clearDates,
        confirmDates,
        onCloseClick,
        onContinueClick,
        setPastHoliday,
        selectedMonth,
        setSelectedMonth,
        selectedDates,
        overlayDisabledMonths,
        isSubmitLoading,
        focusOnMount,
    };

    if (isBackend()) {
        return null;
    }

    if (!isMobile) {
        return <CalendarDesktop {...calendarProps} maxDate={desktopCalendarEndDate || calendarProps.maxDate} />;
    }

    return <CalendarMobile {...calendarProps} />;
};

export default Calendar;
