import React, { useMemo } from 'react';
import { observer } from 'mobx-react';

import Calendar from 'frontend/components/common/Calendar';
import { useContactUsStore } from 'frontend/components/renderings/ContactUs/store/createStore';

export type TCalendarWrapperProps = {
    monthLimit: number;
};

const CalendarWrapper: React.FC<TCalendarWrapperProps> = ({ monthLimit }) => {
    const {
        isDatePickerOpen,
        currentDates,
        numberOfNights,
        clearDates,
        setDates,
        closeDatePicker,
        confirmDates,
        setPastHoliday,
    } = useContactUsStore();

    const onCloseClick = (): void => {
        clearDates();
        closeDatePicker();
    };

    const calendarEnd = useMemo(() => {
        if (!monthLimit) return undefined;

        const date = new Date();
        date.setMonth(date.getMonth() + monthLimit);

        return date;
    }, [monthLimit]);

    return (
        <Calendar
            isDatePickerOpen={isDatePickerOpen}
            currentDates={currentDates}
            numberOfNights={numberOfNights}
            clearDates={clearDates}
            setDates={setDates}
            confirmDates={confirmDates}
            setPastHoliday={setPastHoliday}
            onCloseClick={onCloseClick}
            calendarEnd={calendarEnd}
        />
    );
};

export default observer(CalendarWrapper);
