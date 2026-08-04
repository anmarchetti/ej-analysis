import { MutableRefObject } from 'react';
import Flatpickr from 'react-flatpickr';
import flatpickr from 'flatpickr';

export enum CalendarType {
    Modal = 'modal',
    Inline = 'inline',
}

export interface IDatePickerProps {
    calendarType: CalendarType;
    currentDates: Date[];
    focusCalendar: () => void;
    maxDate: Date;
    minDate: Date;
    nightsSelectedLabel: Nullable<string>;
    numberOfNights: number;
    refFpCalendar: MutableRefObject<Flatpickr | null>;
    setDates: (dates: Date[]) => Date[] | void;
    clearDates?: () => void;
    confirmDates?: () => void;
    defaultDate?: string[];
    focusOnMount?: boolean;
    isContinueDisabled?: boolean;
    isDatePickerOpen?: boolean;
    isSubmitLoading?: boolean;
    monthOptions?: string[];
    onCloseClick?: () => void;
    onContinueClick?: () => void;
    onDayCreate?: flatpickr.Options.Hook;
    overlayDisabledMonths?: boolean;
    selectedDates?: Date[];
    selectedMonth?: Date;
    setPastHoliday?: () => void;
    setSelectedMonth?: (date: Date) => void;
}
