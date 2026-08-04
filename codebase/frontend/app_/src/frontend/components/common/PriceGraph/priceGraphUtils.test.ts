import { DATE_FORMATS } from 'code/dates';
import { altOffer } from 'frontend/__mocks__/altOffer';
import * as dateUtils from 'frontend/utils/date.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';

import PriceGraphSettings from './constants';
import {
    dateFormatter,
    getBackgroundColor,
    getEdgeAvailableDate,
    getHolidayDates,
    getLabelColor,
    isEndDate,
} from './priceGraphUtils';

describe('Price Graph utils', () => {
    describe('getBackgroundColor', () => {
        it('should return orange when date is not start or active', () => {
            const result = getBackgroundColor({ active: false, raw: { isStartDate: false } } as any);

            expect(result).toEqual(PriceGraphSettings.colors.orange);
        });

        it('should return white for start date', () => {
            const result = getBackgroundColor({ active: false, raw: { isStartDate: true } } as any);

            expect(result).toEqual(PriceGraphSettings.colors.white);
        });

        it('should return dark orange for active date', () => {
            const result = getBackgroundColor({ active: true, raw: { isStartDate: false } } as any);

            expect(result).toEqual(PriceGraphSettings.colors.darkOrange);
        });
    });

    describe('isEndDate', () => {
        test('should return false if selected date is Nullable', () => {
            const result1 = isEndDate(new Date('2020-02-08T00:00:00'), null, 2);
            const result2 = isEndDate(new Date('2020-02-08T00:00:00'), undefined, 2);

            expect(result1).toBeFalsy();
            expect(result2).toBeFalsy();
        });

        test('should return false if date is not end date', () => {
            const result = isEndDate(new Date('2020-02-08T00:00:00'), new Date('2020-02-07T00:00:00'), 2);

            expect(result).toBeFalsy();
        });

        test('should return true if date is end date', () => {
            const result = isEndDate(new Date('2020-02-08T00:00:00'), new Date('2020-02-06T00:00:00'), 2);

            expect(result).toBeTruthy();
        });
    });

    describe('isEndDate', () => {
        test('should return false if selected date is Nullable', () => {
            const result1 = isEndDate(new Date('2020-02-08T00:00:00'), null, 2);
            const result2 = isEndDate(new Date('2020-02-08T00:00:00'), undefined, 2);

            expect(result1).toBeFalsy();
            expect(result2).toBeFalsy();
        });

        test('should return false if date is not end date', () => {
            const result = isEndDate(new Date('2020-02-08T00:00:00'), new Date('2020-02-07T00:00:00'), 2);

            expect(result).toBeFalsy();
        });

        test('should return true if date is end date', () => {
            const result = isEndDate(new Date('2020-02-08T00:00:00'), new Date('2020-02-06T00:00:00'), 2);

            expect(result).toBeTruthy();
        });
    });

    describe('dateFormatter', () => {
        test('should return object with y === 0 if data has no price', () => {
            const result = dateFormatter(
                {
                    ...altOffer,
                    price: 0,
                    date: '2020-02-08T00:00:00',
                } as IAlternativeOffer,
                new Date('2020-02-05T00:00:00'),
                3,
                { date: '2020-02-05T00:00:00', price: 100 } as any,
                new Date('2020-02-05T00:00:00'),
            );

            expect(result).toEqual({
                y: 0,
                price: 0,
                isStartDate: false,
                date: '2020-02-08T00:00:00',
                isEndDate: true,
            });
        });

        test('should return object with y === price if data has price', () => {
            const result = dateFormatter(
                {
                    ...altOffer,
                    date: '2020-02-08T00:00:00',
                    price: 100,
                } as IAlternativeOffer,
                new Date('2020-02-05T00:00:00'),
                2,
                { date: '2020-02-05T00:00:00', price: 100 } as any,
                new Date('2020-02-05T00:00:00'),
            );

            expect(result).toEqual({
                y: 100,
                price: 100,
                isStartDate: false,
                date: '2020-02-08T00:00:00',
                isEndDate: false,
            });
        });

        test('should return object with y === price and isStartDate === true if data has price and date is selected', () => {
            const result = dateFormatter(
                {
                    ...altOffer,
                    date: '2020-02-05T00:00:00',
                    price: 100,
                } as IAlternativeOffer,
                new Date('2020-02-05T00:00:00'),
                2,
                100,
                new Date('2020-02-05T00:00:00'),
            );

            expect(result).toEqual({
                y: 100,
                price: 100,
                isStartDate: true,
                date: '2020-02-05T00:00:00',
                isEndDate: false,
            });
        });

        test('should return object with y === price and isStartDate === false there is no selectedDate', () => {
            const result = dateFormatter(
                {
                    ...altOffer,
                    date: '2020-02-05T00:00:00',
                    price: 100,
                } as IAlternativeOffer,
                null,
                2,
                { date: '2020-02-05T00:00:00', price: 100 } as any,
                new Date('2020-02-05T00:00:00'),
            );

            expect(result).toEqual({
                y: 100,
                price: 100,
                isStartDate: false,
                date: '2020-02-05T00:00:00',
                isEndDate: false,
            });
        });
    });

    describe('getEdgeAvailableDate', () => {
        test('should return first available date', () => {
            const result = getEdgeAvailableDate(new Date('2020-02-05T00:00:00'), 3);

            expect(result.getTime()).toEqual(new Date('2020-02-02T00:00:00').getTime());
        });

        test('should return last available date', () => {
            const result = getEdgeAvailableDate(new Date('2020-02-05T00:00:00'), 3, true);

            expect(result.getTime()).toEqual(new Date('2020-02-08T00:00:00').getTime());
        });
    });

    describe('getLabelColor', () => {
        const resetMocks = () => ({
            dataIndex: 0,
            active: false,
            dataset: {
                data: [
                    {
                        price: 100,
                        isStartDate: false,
                    },
                ],
            },
        });

        let mocks = resetMocks() as any;

        beforeEach(() => {
            mocks = resetMocks();
        });

        it('should return grey color when no price', () => {
            mocks.dataset.data[0].price = 0;
            const result = getLabelColor(mocks);

            expect(result).toEqual(PriceGraphSettings.colors.grey);
        });

        it('should return white color when date is not start and not active', () => {
            mocks.active = false;
            mocks.dataset.data[0].isStartDate = false;

            const result = getLabelColor(mocks);
            expect(result).toEqual(PriceGraphSettings.colors.white);
        });

        it('should return white color for active data', () => {
            mocks.active = true;

            const result = getLabelColor(mocks);
            expect(result).toEqual(PriceGraphSettings.colors.white);
        });

        it('should return dark orange when date is start and not active', () => {
            mocks.active = false;
            mocks.dataset.data[0].isStartDate = true;
            const result = getLabelColor(mocks);

            expect(result).toEqual(PriceGraphSettings.colors.darkOrange);
        });
    });

    describe('getHolidayDates ', () => {
        it('should count return date and return departure and return date in format', () => {
            const spyOnFormatDateL10n = jest.spyOn(dateUtils, 'formatDateL10n').mockImplementation(jest.fn());

            const selectedDate = new Date('2023-11-30');
            const returnDate = new Date('2023-12-05');

            const DURATION_OF_VACATION = 5;
            const TIMES_OF_CALLING_FormatDateL10n = 2;

            getHolidayDates(selectedDate, DURATION_OF_VACATION);
            expect(spyOnFormatDateL10n).toBeCalledTimes(TIMES_OF_CALLING_FormatDateL10n);
            expect(spyOnFormatDateL10n).toBeCalledWith(selectedDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr);
            expect(spyOnFormatDateL10n).toBeCalledWith(returnDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr);
        });
    });
});
