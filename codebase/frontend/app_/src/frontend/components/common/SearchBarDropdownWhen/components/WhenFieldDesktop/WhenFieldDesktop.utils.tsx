import { formatDateToQuery } from 'frontend/utils/date.utils';

export const focusDateForAccessibility = (dates: Date[], instance): void => {
    if (!dates.length) {
        return;
    }

    const dateToFocus = dates[dates.length - 1];
    const dateToFocusStr = formatDateToQuery(dateToFocus);

    setTimeout(() => {
        const dayElements = instance.calendarContainer.querySelectorAll('.flatpickr-day');

        dayElements.forEach(el => {
            const dayDate = el.dateObj;

            if (formatDateToQuery(dayDate) === dateToFocusStr) {
                el.focus();
            }
        });
    });
};
