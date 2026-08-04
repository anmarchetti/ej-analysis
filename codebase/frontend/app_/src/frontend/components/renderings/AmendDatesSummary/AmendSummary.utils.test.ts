import { IAmendDatesSummaryFields } from './AmendDatesSummary';
import { getAmendDatesPriceLabel } from './AmendDatesSummary.utils';

describe('AmendSummary.utils', () => {
    describe('getAmendDatesPriceLabel', () => {
        const fields: IAmendDatesSummaryFields = {
            AdditionalCostLabel: {
                value: 'AdditionalCostLabel',
            },
            RefundLabel: {
                value: 'RefundLabel',
            },
        } as IAmendDatesSummaryFields;

        it('Return additional cost label ', () => {
            const result = getAmendDatesPriceLabel(fields, 10);

            expect(result.value).toBe('AdditionalCostLabel');
        });

        it('Return refund cost label ', () => {
            const result = getAmendDatesPriceLabel(fields, -10);

            expect(result.value).toBe('RefundLabel');
        });
    });
});
