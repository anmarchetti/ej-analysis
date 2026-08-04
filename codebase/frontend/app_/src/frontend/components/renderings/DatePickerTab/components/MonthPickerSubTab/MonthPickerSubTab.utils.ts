import dayjs, { Dayjs } from 'dayjs';

export const getFirstAvailableMonth = (availableMonths: number[]): Dayjs => {
    const firstDayOfCurrentMonth = dayjs().startOf('month');
    const currentMonth = firstDayOfCurrentMonth.month();

    if (availableMonths.includes(currentMonth) || !availableMonths.length) {
        return firstDayOfCurrentMonth;
    }

    // find the nearest available month
    let firstDayOfNeareastAvailableMonth;
    let dateIterator = dayjs().startOf('month');
    const searchLimitDate = dayjs().add(2, 'year');

    do {
        // Months are zero indexed, so January is month 0!
        if (availableMonths.includes(dateIterator.month() + 1)) {
            firstDayOfNeareastAvailableMonth = dateIterator;
        } else {
            dateIterator = dateIterator.add(1, 'month');
        }
    } while (!firstDayOfNeareastAvailableMonth && dateIterator.isBefore(searchLimitDate));

    return firstDayOfNeareastAvailableMonth || firstDayOfCurrentMonth;
};
