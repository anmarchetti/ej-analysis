import { CurrencyCode } from 'code/currency';
import * as dateUtils from 'frontend/utils/date.utils';
import { IMyCreditInfo } from 'models/data/MyCreditInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockBalanceHistoryItem } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistory.mocks';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';
import { mockMarketCreditsField } from 'frontend/components/renderings/HolidayCredit/__mocks__/holidayCredit.mocks';
import { BalanceOrderStatuses } from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryChip/BalanceHistoryChip';
import {
    META_BOOKING_REF,
    META_HOTEL_COUNTRY_NAME,
    META_HOTEL_COUNTRY_OBJECT_OBSOLETE,
    META_HOTEL_NAME,
    META_ORIGINAL_VOUCHER_CODE,
    META_SOURCE,
    STATUS_CANCELED,
} from 'frontend/components/renderings/HolidayCredit/constants';
import {
    getBalanceOnStep,
    getCreditStatus,
    getCreditTabs,
    getExpireSoonLabel,
    getHistoryItemCurrency,
    getMarketSitecoreContent,
    getOriginalVoucherCode,
    getRedemptionBookingRef,
    getRedemptionOrigin,
    getSubItemLabel,
    isCreditExpired,
    isCreditExpiresSoon,
    isCreditUsed,
} from 'frontend/components/renderings/HolidayCredit/utils';

describe('HolidayCredit utils', () => {
    describe('getOriginalVoucherCode', () => {
        it('should return empty string when no metadata', () => {
            const code = getOriginalVoucherCode([]);

            expect(code).toBe('');
        });

        it('should return empty string when no META_ORIGINAL_VOUCHER_CODE in metadata keys', () => {
            const code = getOriginalVoucherCode([
                { key: META_BOOKING_REF, value: 'value1' },
                { key: META_HOTEL_COUNTRY_NAME, value: 'value2' },
            ]);

            expect(code).toBe('');
        });

        it('should return value when META_ORIGINAL_VOUCHER_CODE in metadata keys', () => {
            const code = getOriginalVoucherCode([
                { key: META_ORIGINAL_VOUCHER_CODE, value: 'value1' },
                { key: META_HOTEL_COUNTRY_NAME, value: 'value2' },
            ]);

            expect(code).toBe('value1');
        });
    });

    describe('getRedemptionBookingRef', () => {
        it('should return empty string when no metadata', () => {
            const bookingRef = getRedemptionBookingRef([]);

            expect(bookingRef).toBe('');
        });

        it('should return empty string when no META_BOOKING_REF in metadata keys', () => {
            const bookingRef = getRedemptionBookingRef([
                { key: META_ORIGINAL_VOUCHER_CODE, value: 'value1' },
                { key: META_HOTEL_COUNTRY_NAME, value: 'value2' },
            ]);

            expect(bookingRef).toBe('');
        });

        it('should return value when META_BOOKING_REF in metadata keys', () => {
            const bookingRef = getRedemptionBookingRef([
                { key: META_BOOKING_REF, value: 'value1' },
                { key: META_HOTEL_COUNTRY_NAME, value: 'value2' },
            ]);

            expect(bookingRef).toBe('value1');
        });
    });

    describe('getRedemptionOrigin', () => {
        const mockGetPhrase = jest.fn(p => p);

        it('should return empty string when no metadata', () => {
            const origin = getRedemptionOrigin([], mockGetPhrase);

            expect(origin).toBe('');
        });

        it('should return empty string when META_HOTEL_NAME and META_HOTEL_COUNTRY_NAME are not provided in metadata', () => {
            const origin = getRedemptionOrigin([{ key: META_SOURCE, value: 'value2' }], mockGetPhrase);

            expect(origin).toBe('');
        });

        it('should return RedeemVoucherLabelsPromotion with promotion campaign when META_ORIGINAL_VOUCHER_CODE in metadata keys', () => {
            const origin = getRedemptionOrigin(
                [
                    { key: META_ORIGINAL_VOUCHER_CODE, value: 'value1' },
                    { key: META_SOURCE, value: 'value2' },
                ],
                mockGetPhrase,
            );

            expect(origin).toBe(`value2 ${SitecoreDictionary.RedeemVoucherLabelsPromotion}`);
        });

        it('should return "hotel, country" when META_HOTEL_NAME and META_HOTEL_COUNTRY_NAME in metadata keys', () => {
            const origin = getRedemptionOrigin(
                [
                    { key: META_HOTEL_NAME, value: 'value1' },
                    { key: META_HOTEL_COUNTRY_NAME, value: 'value2' },
                ],
                mockGetPhrase,
            );

            expect(origin).toBe('value1, value2');
        });

        it('should return "hotel, country" when META_HOTEL_NAME and META_HOTEL_COUNTRY_OBJECT_OBSOLETE in metadata keys', () => {
            const origin = getRedemptionOrigin(
                [
                    { key: META_HOTEL_NAME, value: 'value1' },
                    { key: META_HOTEL_COUNTRY_OBJECT_OBSOLETE, value: { Name: 'value2' } },
                ],
                mockGetPhrase,
            );

            expect(origin).toBe('value1, value2');
        });
    });

    describe('getHistoryItemCurrency', () => {
        it('should return currency code from metadata', () => {
            const currency = getHistoryItemCurrency(mockBalanceHistoryItem);

            expect(currency).toBe(CurrencyCode.GBP);
        });

        it('should return undefined when no currency metadata is provided', () => {
            mockBalanceHistoryItem.metadata = [];
            const currency = getHistoryItemCurrency(mockBalanceHistoryItem);

            expect(currency).toBe(undefined);
        });
    });

    describe('getMarketSitecoreContent', () => {
        it('should return market flag', () => {
            const result = getMarketSitecoreContent(CurrencyCode.GBP, mockMarketCreditsField);

            expect(result).toEqual({ flag: { value: { src: 'src', alt: 'UK' } }, screenReaderLabel: undefined });
        });

        it('should return undefined when market credit field is undefined', () => {
            const result = getMarketSitecoreContent(CurrencyCode.GBP, undefined);

            expect(result).toEqual({ flag: undefined, screenReaderLabel: undefined });
        });
    });

    describe('getCreditTabs()', () => {
        it('should return tabs where the first tab is market credit', () => {
            const credits = [
                { balance: 100, currency: CurrencyCode.CHF },
                { balance: 200, currency: CurrencyCode.GBP },
                { balance: 300, currency: 'EUR' },
            ] as IMyCreditInfo[];

            const result = getCreditTabs(mockMarketCreditsField, credits, CurrencyCode.GBP);
            expect(result).toEqual([
                {
                    currency: 'GBP',
                    balance: 200,
                    flag: { value: { src: 'src', alt: 'UK' } },
                },
                {
                    currency: 'CHF',
                    balance: 100,
                    flag: { value: { src: 'src', alt: 'CH' } },
                },
                {
                    currency: 'EUR',
                    balance: 300,
                    flag: { value: { src: 'src', alt: 'EU' } },
                },
            ]);
        });

        it('should return tabs where the first tab is 0 market credit', () => {
            const credits = [{ balance: 100, currency: CurrencyCode.CHF }] as IMyCreditInfo[];

            const result = getCreditTabs(mockMarketCreditsField, credits, CurrencyCode.GBP);
            expect(result).toEqual([
                {
                    currency: 'GBP',
                    balance: 0,
                    hasCreditHistory: false,
                    flag: { value: { src: 'src', alt: 'UK' } },
                },
                {
                    currency: 'CHF',
                    balance: 100,
                    flag: { value: { src: 'src', alt: 'CH' } },
                },
            ]);
        });

        it('should return empty array when user do not have credits', () => {
            const availableMarkets = [] as IMyCreditInfo[];

            const result = getCreditTabs(mockMarketCreditsField, availableMarkets, CurrencyCode.GBP);
            expect(result).toEqual([]);
        });
    });

    describe('getBalanceOnStep', () => {
        it('should return right amount of balance (step 0)', () => {
            const balanceResult = getBalanceOnStep(mockBalanceHistoryItem, 0);

            expect(balanceResult).toBe(300);
        });

        it('should return right amount of balance (step 1)', () => {
            const balanceResult = getBalanceOnStep(mockBalanceHistoryItem, 1);

            expect(balanceResult).toBe(1000);
        });
    });

    describe('isCreditExpired', () => {
        it('should return true when credit is expired', () => {
            const DATE_MARGIN = 3;
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(-DATE_MARGIN).toString(),
                createdAt: dateUtils.addDays(-DATE_MARGIN * 2).toString(),
            };
            const isExpired = isCreditExpired(newMock.expires);
            expect(isExpired).toBe(true);
        });

        it('should return false when credit is NOT expired', () => {
            const isExpired = isCreditExpired(mockBalanceHistoryItem.expires);

            expect(isExpired).toBe(false);
        });
    });

    describe('isCreditUsed', () => {
        it('should return true when credit is used', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                order: {
                    amount: 800,
                    date: '2024-12-19T11:48:27.327Z',
                },
            };
            const isUsed = isCreditUsed(newMock);
            expect(isUsed).toBe(true);
        });

        it('should return false when credit is NOT used', () => {
            const isUsed = isCreditUsed(mockBalanceHistoryItem);

            expect(isUsed).toBe(false);
        });
    });

    describe('isCreditExpiresSoon', () => {
        it('should return true when credit expires within X days', () => {
            jest.useFakeTimers().setSystemTime(new Date('2025-12-01'));
            const isExpiresSoon = isCreditExpiresSoon('2025-12-15', 20);
            expect(isExpiresSoon).toBe(true);
        });

        it('should return false when credit does NOT expires within X days', () => {
            jest.useFakeTimers().setSystemTime(new Date('2025-12-01'));
            const isExpiresSoon = isCreditExpiresSoon('2025-12-15', 10);
            expect(isExpiresSoon).toBe(false);
        });

        it('should take default expireSoonWithinDays when it is NOT provided', () => {
            jest.useFakeTimers().setSystemTime(new Date('2025-12-01'));
            const isExpiresSoon = isCreditExpiresSoon('2025-12-25');
            expect(isExpiresSoon).toBe(true);
        });
    });

    describe('getCreditStatus', () => {
        it('should return "Used" when credit is used', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                order: {
                    amount: 800,
                    date: '2024-12-19T11:48:27.327Z',
                },
            };

            expect(getCreditStatus(newMock)).toBe(BalanceOrderStatuses.Used);
        });

        it('should return "Expired" when credit is expired', () => {
            const DATE_MARGIN = 3;
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(-DATE_MARGIN).toString(),
                createdAt: dateUtils.addDays(-DATE_MARGIN * 2).toString(),
            };

            expect(getCreditStatus(newMock)).toBe(BalanceOrderStatuses.Expired);
        });

        it('should return "ExpireSoon" when credit is expiring within default 31 days', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(15).toString(),
            };

            expect(getCreditStatus(newMock)).toBe(BalanceOrderStatuses.ExpireSoon);
        });

        it('should return "ExpireSoon" when credit is expiring within custom days', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(35).toString(),
            };

            expect(getCreditStatus(newMock, 100)).toBe(BalanceOrderStatuses.ExpireSoon);
        });

        it('should return "Active" when credit is active and not expiring soon', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(60).toString(),
            };

            expect(getCreditStatus(newMock)).toBe(BalanceOrderStatuses.Active);
        });
    });

    describe('getExpireSoonLabel', () => {
        const getPhrase = (key: string) => {
            if (key === SitecoreDictionary.GlobalsLabelsTimeHoursSingular) return 'hour';

            if (key === SitecoreDictionary.GlobalsLabelsTimeHoursPlural) return 'hours';

            if (key === SitecoreDictionary.GlobalsLabelsTimeDaySingular) return 'day';

            if (key === SitecoreDictionary.GlobalsLabelsTimeDaysPlural) return 'days';

            return key;
        };

        it('should return expires in hours label for desktop when less than 24 hours', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours from now
            };
            jest.spyOn(dateUtils, 'getTotalHoursDifference').mockReturnValueOnce(12);

            const result = getExpireSoonLabel(newMock.expires, mockBalanceHistoryFields, getPhrase, false);

            expect(result).toContain(mockBalanceHistoryFields.ExpiresInLabel.value);
            expect(result).toContain('12 hours');
        });

        it('should return expires in hours label for mobile when less than 24 hours', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours from now
            };

            const result = getExpireSoonLabel(newMock.expires, mockBalanceHistoryFields, getPhrase, true);

            expect(result).toContain(mockBalanceHistoryFields.ExpiresInShortLabel.value);
            expect(result).toMatch(/\d+ hours?/);
        });

        it('should return expires in hour (singular) label when 1 hour left', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 1.1).toISOString(), // 1 hour from now
            };

            const result = getExpireSoonLabel(newMock.expires, mockBalanceHistoryFields, getPhrase, false);

            expect(result).toContain(mockBalanceHistoryFields.ExpiresInLabel.value);
            expect(result).toContain('1 hour');
        });

        it('should return expires in days label for desktop when more than 24 hours', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(5).toString(),
            };

            const result = getExpireSoonLabel(newMock.expires, mockBalanceHistoryFields, getPhrase, false);

            expect(result).toContain(mockBalanceHistoryFields.ExpiresInLabel.value);
            expect(result).toContain('5 days');
        });

        it('should return expires in days label for mobile when more than 24 hours', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(5).toString(),
            };

            const result = getExpireSoonLabel(newMock.expires, mockBalanceHistoryFields, getPhrase, true);

            expect(result).toContain(mockBalanceHistoryFields.ExpiresInShortLabel.value);
            expect(result).toContain('5 days');
        });

        it('should return expires in day (singular) label when 1 day left', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(), // 25 hours from now to ensure it's > 24
            };

            const result = getExpireSoonLabel(newMock.expires, mockBalanceHistoryFields, getPhrase, false);

            expect(result).toContain(mockBalanceHistoryFields.ExpiresInLabel.value);
            expect(result).toContain('1 day');
        });

        it('should return empty string when credit is expired', () => {
            const DATE_MARGIN = 3;
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(-DATE_MARGIN).toString(),
            };

            const result = getExpireSoonLabel(newMock.expires, mockBalanceHistoryFields, getPhrase);

            expect(result).toBe('');
        });

        it('should return empty string when credit expires beyond ExpireSoonWithinDays', () => {
            const newMock = {
                ...mockBalanceHistoryItem,
                expires: dateUtils.addDays(mockBalanceHistoryFields.ExpireSoonWithinDays.value + 1).toString(),
            };

            const result = getExpireSoonLabel(newMock.expires, mockBalanceHistoryFields, getPhrase);

            expect(result).toBe('');
        });
    });

    describe('getSubItemLabel', () => {
        it('should return failure label when status is canceled', () => {
            const label = getSubItemLabel(STATUS_CANCELED, true, mockBalanceHistoryFields, 'REF123', 'Compensation');

            expect(label).toBe(mockBalanceHistoryFields.FailureLabel.value);
        });

        it('should return credit type title when amount is more than zero and creditTypeTitle provided', () => {
            const label = getSubItemLabel('Active', true, mockBalanceHistoryFields, 'REF123', 'Compensation');

            expect(label).toBe('Compensation');
        });

        it('should return credit label when amount is more than zero and no creditTypeTitle', () => {
            const label = getSubItemLabel('Active', true, mockBalanceHistoryFields, 'REF123');

            expect(label).toBe(mockBalanceHistoryFields.CreditLabel.value);
        });

        it('should return purchase label with holidayRef when amount is zero or less', () => {
            const label = getSubItemLabel('Used', false, mockBalanceHistoryFields, 'REF123');

            expect(label).toBe(`${mockBalanceHistoryFields.PurchaseLabel.value} REF123`);
        });
    });
});
