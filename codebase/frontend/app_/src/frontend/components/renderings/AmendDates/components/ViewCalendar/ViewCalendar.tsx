import React, { useMemo } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Calendar from 'frontend/components/common/Calendar';
import { CalendarType } from 'frontend/components/common/Calendar/IDatePickerProps';
import CalendarSkeleton from 'frontend/components/renderings/AmendDates/components/CalendarSkeleton/CalendarSkeleton';

function ViewCalendar() {
    const {
        availableDates,
        selectedDates,
        numberOfNights,
        isError,
        calendarStartDate,
        calendarEndDate,
        setDates,
        onDayCreate,
        selectedMonth,
        setSelectedMonth,
        isDatesChanged,
        isInitialDataLoading,
        submitDates,
        isSubmitDatesLoading,
        getPhrase,
    } = useStore((stores: IHolidaysStores) => ({
        numberOfNights: stores.amendDatesStore.numberOfNights,
        availableDates: stores.amendDatesStore.availableDates,
        selectedDates: stores.amendDatesStore.selectedDates,
        isError: stores.amendDatesStore.isError,
        calendarStartDate: stores.amendDatesStore.calendarStartDate,
        calendarEndDate: stores.amendDatesStore.calendarEndDate,
        setDates: stores.amendDatesStore.setDates,
        onDayCreate: stores.amendDatesStore.onDayCreate,
        selectedMonth: stores.amendDatesStore.selectedMonth,
        setSelectedMonth: stores.amendDatesStore.setSelectedMonth,
        isDatesChanged: stores.amendDatesStore.isDatesChanged,
        isInitialDataLoading: stores.amendDatesStore.isInitialDataLoading,
        submitDates: stores.amendDatesStore.submitDates,
        isSubmitDatesLoading: stores.amendDatesStore.isSubmitDatesLoading,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    // Fixes the issue where an additional month is added when displaying 2 months on desktop.
    const desktopCalendarEndDate = useMemo(() => {
        const endMonth = new Date(calendarEndDate).getMonth();

        return new Date(new Date(calendarEndDate).setMonth(endMonth - 1));
    }, [calendarEndDate]);

    // @TODO: This is only a temporary solution to prevent the calendar from rendering nothing
    if (isError) {
        return (
            <div>
                <h3>{getPhrase(SitecoreDictionary.ViewBookingErrorMessagesTryAgainLater)}</h3>
            </div>
        );
    }

    if (!availableDates || isInitialDataLoading) return <CalendarSkeleton />;

    const isContinueDisabled = numberOfNights === 0 || !isDatesChanged;

    return (
        <Calendar
            calendarType={CalendarType.Inline}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            currentDates={selectedDates || []}
            numberOfNights={numberOfNights}
            setDates={setDates}
            calendarStart={calendarStartDate}
            calendarEnd={calendarEndDate}
            desktopCalendarEndDate={desktopCalendarEndDate}
            selectedDates={selectedDates || []}
            onDayCreate={onDayCreate}
            overlayDisabledMonths
            onContinueClick={submitDates}
            isContinueDisabled={isContinueDisabled}
            isSubmitLoading={isSubmitDatesLoading}
            focusOnMount
        />
    );
}

export default observer(ViewCalendar);
