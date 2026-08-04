import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { IPriceBreakdownFields } from './PriceBreakdown';
import { getPaymentField } from './PriceBreakdown.utils';

const fields = {
    NoChangeTotal: mockSitecoreField('NoChangeTotal'),
    PayNow: mockSitecoreField('PayNow'),
    RefundAmount: mockSitecoreField('RefundAmount'),
} as IPriceBreakdownFields;

describe('PriceBreakdown.utils', () => {
    describe('getPaymentField', () => {
        it('Should return PayNow when price is 0', () => {
            const result = getPaymentField(fields, 0);

            expect(result).toBe(fields.PayNow);
        });

        it('Should return PayNow when price is greater than 0', () => {
            const result = getPaymentField(fields, 1);

            expect(result).toBe(fields.PayNow);
        });

        it('Should return RefundAmount when price is less than 0', () => {
            const result = getPaymentField(fields, -1);

            expect(result).toBe(fields.RefundAmount);
        });

        it('Should return NoChangeTotal when it is the trade portal', () => {
            const result = getPaymentField(fields, 1, true);

            expect(result).toBe(fields.NoChangeTotal);
        });
    });
});
