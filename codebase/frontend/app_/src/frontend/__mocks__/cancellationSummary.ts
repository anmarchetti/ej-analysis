import { ICancellationSummaryResponse } from 'models/data/MyCreditInfo';
import { RefundOption } from 'models/enum/RefundOptions';

export const mockCancellationSummary: ICancellationSummaryResponse = {
    currency: 'GBP',
    daysBeforeDeparture: 60,
    oneTimeUseCreditTotalPaid: 100,
    refundBreakdownValidationHash: 777,
    refunds: [
        {
            credit: 100,
            oneTimeUseCredit: 50,
            refundOption: RefundOption.Credit,
            originalPayment: 250,
            total: 150,
        },
        {
            credit: 100,
            oneTimeUseCredit: 50,
            refundOption: RefundOption.OriginalPayment,
            total: 150,
            originalPayment: 250,
        },
    ],
    isDestinationRulesApplied: false,
    amendmentFeeAmount: 0,
};
