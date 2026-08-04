import dayjs from 'dayjs';

export enum WeekDayFormat {
    Min = 'min', // 'Mo'
    Short = 'short', // 'Mon'
    Full = 'full', // 'Monday'
    Single = 'single', // 'M'
}

const NUMBER_OF_DAYS_IN_WEEK = 7;

const getOriginalWeekdays = (format: WeekDayFormat) => {
    switch (format) {
        case WeekDayFormat.Min:
            return dayjs.weekdaysMin();
        case WeekDayFormat.Short:
            return dayjs.weekdaysShort();
        case WeekDayFormat.Single:
            return dayjs.weekdaysShort().map(day => day[0]);
        default:
            return dayjs.weekdays();
    }
};

/**
 * Get the weekdays in the given format and starting with the given week day
 * @param format
 * @param weekStart - 0 - Sunday, 1 - Monday, etc.
 */
const getWeekdays = (format: WeekDayFormat, weekStart?: number) => {
    const days = getOriginalWeekdays(format);

    // Reorder the days to start with the given week day
    const orderedDays = weekStart ? days.map((_, i) => days[(i + weekStart) % NUMBER_OF_DAYS_IN_WEEK]) : days;

    return orderedDays;
};

export default getWeekdays;
