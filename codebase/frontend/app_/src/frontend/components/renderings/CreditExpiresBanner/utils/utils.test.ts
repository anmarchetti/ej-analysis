import { CurrencyCode } from 'code/currency';
import { IBalanceHistory, IBalanceHistoryItem } from 'models/data/IBalanceHistory';
import { mockCreditExpiresBannerFields } from 'frontend/components/renderings/CreditExpiresBanner/mocks/creditExpiresBannerFields.mock';
import { mockBalanceHistoryItems } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistory.mocks';
import {
    getBalanceOnStep,
    isCreditExpired,
    isCreditExpiresSoon,
    isCreditUsed,
} from 'frontend/components/renderings/HolidayCredit/utils';

import { getExpiringCreditsTotalAmount, getSitecoreContent, isThereAnyExpiringCreditForOtherMarkets } from './utils';

jest.mock('frontend/components/renderings/HolidayCredit/utils');

const mockGetBalanceOnStep = getBalanceOnStep as jest.MockedFunction<typeof getBalanceOnStep>;
const mockIsCreditUsed = isCreditUsed as jest.MockedFunction<typeof isCreditUsed>;
const mockIsCreditExpired = isCreditExpired as jest.MockedFunction<typeof isCreditExpired>;
const mockIsCreditExpiresSoon = isCreditExpiresSoon as jest.MockedFunction<typeof isCreditExpiresSoon>;

describe('CreditExpiresBanner utils', () => {
    describe('getExpiringCreditsTotalAmount', () => {
        it('should return empty array when no balance history items', () => {
            const result = getExpiringCreditsTotalAmount([], 30);
            expect(result).toEqual([]);
        });

        it('should skip credits that are used', () => {
            mockIsCreditUsed.mockReturnValue(true);

            const result = getExpiringCreditsTotalAmount(mockBalanceHistoryItems, 30);

            expect(result).toEqual([]);
        });

        it('should skip credits that are expired', () => {
            mockIsCreditUsed.mockReturnValue(false);
            mockIsCreditExpired.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);
            mockIsCreditExpiresSoon.mockReturnValue(true);
            mockGetBalanceOnStep.mockReturnValueOnce(300);

            const result = getExpiringCreditsTotalAmount(mockBalanceHistoryItems, 30);

            expect(mockGetBalanceOnStep).toHaveBeenCalledTimes(1);
            expect(result).toEqual([300]);
        });

        it('should skip credits that do NOT expire soon', () => {
            mockIsCreditUsed.mockReturnValue(false);
            mockIsCreditExpired.mockReturnValue(false);
            mockIsCreditExpiresSoon.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);
            mockGetBalanceOnStep.mockReturnValueOnce(100).mockReturnValueOnce(200).mockReturnValueOnce(300);

            const result = getExpiringCreditsTotalAmount(mockBalanceHistoryItems, 30);

            expect(mockGetBalanceOnStep).toHaveBeenCalledTimes(2);
            expect(result).toEqual([100, 200]);
        });
    });

    describe('isThereAnyExpiringCreditForOtherMarkets', () => {
        it('should return false when balance history is empty', () => {
            const balanceHistory: IBalanceHistory = {};
            const result = isThereAnyExpiringCreditForOtherMarkets(balanceHistory, CurrencyCode.EUR, 30);
            expect(result).toBe(false);
        });

        it('should return false when only current market has entries', () => {
            const balanceHistory: IBalanceHistory = {
                [CurrencyCode.GBP]: mockBalanceHistoryItems,
            };
            const result = isThereAnyExpiringCreditForOtherMarkets(balanceHistory, CurrencyCode.GBP, 30);
            expect(result).toBe(false);
        });

        it('should return false when other markets have no expiring credits', () => {
            const balanceHistory: IBalanceHistory = {
                [CurrencyCode.EUR]: mockBalanceHistoryItems,
                [CurrencyCode.GBP]: mockBalanceHistoryItems,
            };
            mockIsCreditUsed.mockReturnValue(false);
            mockIsCreditExpired.mockReturnValue(false);
            mockIsCreditExpiresSoon.mockReturnValue(false);

            const result = isThereAnyExpiringCreditForOtherMarkets(balanceHistory, CurrencyCode.GBP, 30);

            expect(mockIsCreditExpiresSoon).toHaveBeenCalledTimes(3);
            expect(result).toBe(false);
        });

        it('should return true when other markets have expiring credits', () => {
            const balanceHistory: IBalanceHistory = {
                [CurrencyCode.GBP]: mockBalanceHistoryItems,
                [CurrencyCode.EUR]: [{ ...mockBalanceHistoryItems[0], expires: '1111-11-11' } as IBalanceHistoryItem],
            };
            mockIsCreditUsed.mockReturnValue(false);
            mockIsCreditExpired.mockReturnValue(false);
            mockIsCreditExpiresSoon.mockReturnValue(true);

            const result = isThereAnyExpiringCreditForOtherMarkets(balanceHistory, CurrencyCode.GBP, 30);

            expect(mockIsCreditExpiresSoon).toHaveBeenCalledWith('1111-11-11', 30);
            expect(mockIsCreditExpiresSoon).toHaveBeenCalledTimes(1);
            expect(result).toBe(true);
        });

        it('should exclude used credits from other markets', () => {
            const balanceHistory: IBalanceHistory = {
                [CurrencyCode.EUR]: mockBalanceHistoryItems,
                [CurrencyCode.GBP]: mockBalanceHistoryItems,
            };
            mockIsCreditUsed.mockReturnValue(true);

            const result = isThereAnyExpiringCreditForOtherMarkets(balanceHistory, CurrencyCode.GBP, 30);

            expect(mockIsCreditExpiresSoon).not.toHaveBeenCalled();
            expect(result).toBe(false);
        });

        it('should exclude expired credits from other markets', () => {
            const balanceHistory: IBalanceHistory = {
                [CurrencyCode.EUR]: mockBalanceHistoryItems,
                [CurrencyCode.GBP]: [
                    { expires: '1111-11-11' },
                    { expires: '2222-22-22' },
                    { expires: '3333-33-33' },
                ] as IBalanceHistoryItem[],
            };
            mockIsCreditUsed.mockReturnValue(false);
            mockIsCreditExpired.mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValueOnce(true);
            mockIsCreditExpiresSoon.mockReturnValue(true);

            const result = isThereAnyExpiringCreditForOtherMarkets(balanceHistory, CurrencyCode.EUR, 30);

            expect(mockIsCreditExpiresSoon).toHaveBeenCalledWith('2222-22-22', 30);
            expect(mockIsCreditExpiresSoon).toHaveBeenCalledTimes(1);
            expect(result).toBe(true);
        });
    });

    describe('getSitecoreContent', () => {
        mockGetBalanceOnStep.mockReturnValue(100);

        it('should return undefined when no content matches', () => {
            const fields = [];
            const balanceHistory = { GBP: mockBalanceHistoryItems };
            mockIsCreditExpiresSoon.mockReturnValue(true);

            const result = getSitecoreContent(fields, balanceHistory, CurrencyCode.EUR, 30, jest.fn());
            expect(result).toBeUndefined();
        });

        it('should return content for CreditExpiresOnMultipleMarkets', () => {
            mockIsCreditExpiresSoon.mockReturnValue(true);
            const balanceHistory = { GBP: mockBalanceHistoryItems, EUR: mockBalanceHistoryItems };

            const result = getSitecoreContent(
                mockCreditExpiresBannerFields.Children,
                balanceHistory,
                CurrencyCode.EUR,
                30,
                jest.fn(),
            );

            expect(result).toEqual(mockCreditExpiresBannerFields.Children[1].fields);
        });

        it('should return content for CreditExpiresOnOtherMarkets', () => {
            mockIsCreditExpiresSoon.mockReturnValue(true);
            const balanceHistory = { GBP: mockBalanceHistoryItems };
            const result = getSitecoreContent(
                mockCreditExpiresBannerFields.Children,
                balanceHistory,
                CurrencyCode.EUR,
                30,
                jest.fn(),
            );

            expect(result).toEqual(mockCreditExpiresBannerFields.Children[2].fields);
        });

        it('should return content for CreditExpiresCurrentMarket', () => {
            mockIsCreditExpiresSoon.mockReturnValue(true);
            const balanceHistory = { GBP: mockBalanceHistoryItems };
            const result = getSitecoreContent(
                mockCreditExpiresBannerFields.Children,
                balanceHistory,
                CurrencyCode.GBP,
                30,
                jest.fn(),
            );

            expect(result).toEqual(mockCreditExpiresBannerFields.Children[0].fields);
        });

        /*   it('should calculate total of multiple expiring credits', () => {
        const fields = [
            {
                fields: {
                    ContentType: { value: CreditExpiresBannerContentType.CreditExpiresCurrentMarket },
                    Title: { value: 'Total: {amount}' },
                },
            },
        ];
        const balanceHistory: IBalanceHistory = {
            [CurrencyCode.EUR]: [{ expires: '2024-06-30' }, { expires: '2024-07-15' }],
        };

        (isCreditUsed as jest.Mock).mockReturnValue(false);
        (isCreditExpired as jest.Mock).mockReturnValue(false);
        (isCreditExpiresSoon as jest.Mock).mockReturnValue(true);
        (getBalanceOnStep as jest.Mock).mockReturnValueOnce(-100).mockReturnValueOnce(-200);

        const result = getSitecoreContent(fields, balanceHistory, CurrencyCode.EUR, 30, jest.fn());

        expect(result?.Title.value).toBe('Total: 300');
    });*/
    });
});
