import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IRefundBreakdownFields } from 'frontend/components/renderings/RefundBreakdown/RefundBreakdown';

export const refundBreakdownFields: IRefundBreakdownFields = {
    CreditRefundLabel: mockSitecoreField('credit refund'),
    OriginalMethodRefundLabel: mockSitecoreField('original payment refund'),
    NoChangeTotal: mockSitecoreField('no change total'),
    PayNow: mockSitecoreField('pay now'),
    PriceBreakdownTitle: mockSitecoreField('total refund'),
    RefundAmount: mockSitecoreField('total refund'),
};
