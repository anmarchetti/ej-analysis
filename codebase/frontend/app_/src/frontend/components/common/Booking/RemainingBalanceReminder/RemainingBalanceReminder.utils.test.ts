import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import {
    getRemainingBalanceButtonDescription,
    getRemainingBalanceDescription,
    getRemainingBalanceTitle,
} from './RemainingBalanceReminder.utils';

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

jest.mock('frontend/utils/date.utils', () => ({
    __esModule: true,
    formatDateL10n: jest.fn(date => date),
}));

describe('RemainingBalanceReminder.utils', () => {
    const getPhrase = jest.fn(p => p);

    describe('getRemainingBalanceTitle', () => {
        it('return BookingHeaderLabelsRemainingBalanceOverdue when remainingDays < 0', () => {
            expect(getRemainingBalanceTitle(-1, getPhrase)).toBe(
                `${SitecoreDictionary.BookingHeaderLabelsRemainingBalanceOverdue} -1`,
            );
        });

        it('return BookingHeaderLabelsRemainingBalanceDueToday when remainingDays = 0', () => {
            expect(getRemainingBalanceTitle(0, getPhrase)).toBe(
                `${SitecoreDictionary.BookingHeaderLabelsRemainingBalanceDueToday} 0`,
            );
        });

        it('return BookingHeaderLabelsRemainingBalanceDueTomorrow when remainingDays = 1', () => {
            expect(getRemainingBalanceTitle(1, getPhrase)).toBe(
                `${SitecoreDictionary.BookingHeaderLabelsRemainingBalanceDueTomorrow} 1`,
            );
        });

        it('return BookingHeaderLabelsRemainingBalanceDueDate when remainingDays > 1', () => {
            expect(getRemainingBalanceTitle(10, getPhrase)).toBe(
                `${SitecoreDictionary.BookingHeaderLabelsRemainingBalanceDueDate} 10`,
            );
        });
    });

    describe('getRemainingBalanceDescription', () => {
        it('return BookingHeaderLabelsRemainingBalanceWasDue when remainingDays < 0', () => {
            expect(
                getRemainingBalanceDescription(-1, 'date', getPhrase, 'balanceDueLabel', 'destination', 'price'),
            ).toBe('BookingHeader.Labels.RemainingBalanceWasDue price,destination,date');
        });

        it('return balanceDueLabel when remainingDays >= 0 and use empty strings instead of missing token values', () => {
            expect(getRemainingBalanceDescription(0, 'date', getPhrase, 'balanceDueLabel')).toBe(
                'balanceDueLabel ,,date',
            );
        });
    });

    describe('getRemainingBalanceButtonDescription', () => {
        it('return BookingPaymentLabelsPayRemainingBalanceOverdue when remainingDays < 0', () => {
            expect(getRemainingBalanceButtonDescription(-1, 'date', getPhrase)).toBe(
                'BookingPayment.Labels.PayRemainingBalanceOverdue date',
            );
        });

        it('return BookingPaymentLabelsPayRemainingBalanceByDate when remainingDays >= 0', () => {
            expect(getRemainingBalanceButtonDescription(0, 'date', getPhrase)).toBe(
                'BookingPayment.Labels.PayRemainingBalanceByDate date',
            );
        });
    });
});
