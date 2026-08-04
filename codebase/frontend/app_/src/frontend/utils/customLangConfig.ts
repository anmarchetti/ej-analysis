import dayjs from 'dayjs';

export const customLocale = {
    code: dayjs.locale(),
    localize: {
        month: (value: number): string => dayjs.months()[value],
        day: (value: number): string => dayjs.weekdaysShort()[value],
    },
    formatLong: {
        date: options => {
            switch (options.width) {
                case 'any':
                    return `EEEE, d MMMM y`;
                case 'full':
                    return `EEEE, d MMMM y`;
                case 'long':
                    return `d MMMM y`;
                case 'medium':
                    return `d MMM y`;
                case 'short':
                    return `dd.MM.y`;
                default:
                    return `EEEE, d MMMM y`;
            }
        },
    },
};
