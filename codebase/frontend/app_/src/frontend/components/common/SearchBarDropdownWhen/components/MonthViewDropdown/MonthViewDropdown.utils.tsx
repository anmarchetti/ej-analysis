import { Dayjs } from 'dayjs';

import { DATE_FORMATS } from 'code/dates';
import { ICheapestMonth } from 'models/data/ICheapestMonth';

export const getMonthFields = (
    date: Dayjs,
    cheapestMonthList: ICheapestMonth[] | undefined,
): { cheapestMonthPrice: number; cheapestMonthPricePP: number; date: Dayjs; monthName: string; year: number } => {
    const cheapestMonth = cheapestMonthList?.find(m => m.year === date.year() && m.month === date.month());
    const { price, pricePP } = cheapestMonth ?? {};

    return {
        date,
        monthName: date.format(DATE_FORMATS.fullMonth),
        year: date.year(),
        cheapestMonthPrice: price ?? 0,
        cheapestMonthPricePP: pricePP ?? 0,
    };
};
