import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { getTextMeta } from './PaymentOptionAddToBalance.utils';

const createProps = () => ({
    remainingBalance: 10,
    fields: {
        OutstandingPaymentOptionDescriptionExtraPrice: mockSitecoreField(
            'OutstandingPaymentOptionDescriptionExtraPrice',
        ),
        AddAmendToBalanceDescription: mockSitecoreField('AddAmendToBalanceDescription'),
        OutstandingPaymentOptionTitleExtraPrice: mockSitecoreField('OutstandingPaymentOptionTitleExtraPrice'),
        AddAmendToBalanceTitle: mockSitecoreField('AddAmendToBalanceTitle'),
        OutstandingPaymentOptionPrice: mockSitecoreField('OutstandingPaymentOptionPrice'),
        AddToAmendBalanceTotalLabel: mockSitecoreField('AddToAmendBalanceTotalLabel'),
        ChangeFeeDescription: mockSitecoreField('ChangeFeeDescription'),
    },
    dueDate: 'date',
    totalPrice: 20,
    balanceAmount: 15,
    formatMoney: jest.fn().mockImplementation(a => `£${a}`),
});

let mockProps;
const mockGetTextMeta = jest.fn().mockImplementation(a => a);
jest.mock('./PaymentOptionAddToBalance', () => {
    getTextMeta: mockGetTextMeta;
});

describe('PaymentOptionAddToBalance.utils', () => {
    describe('getTextMeta', () => {
        beforeEach(() => {
            mockProps = createProps();
        });

        test('should return text meta with outstanding option when there is a remaining balance ', () => {
            const textMeta = getTextMeta(mockProps);
            expect(textMeta).toStrictEqual({
                description: mockProps.fields.OutstandingPaymentOptionDescriptionExtraPrice,
                title: mockProps.fields.AddAmendToBalanceTitle.value,
                subdescription: { value: '' },
            });
        });

        test('should return text meta without outstanding option when no remaining balance ', () => {
            mockProps.balanceAmount = 0;
            const textMeta = getTextMeta(mockProps);
            expect(textMeta).toStrictEqual({
                description: mockProps.fields.AddAmendToBalanceDescription,
                title: mockProps.fields.AddAmendToBalanceTitle.value,
                subdescription: { value: '' },
            });
        });

        test('should return text meta with subdescription when includes fee ', () => {
            mockProps.amendmentPaymentInfo = {
                totalFeesAmount: 5,
                amendmentChargesWithoutFees: 10,
            };
            const textMeta = getTextMeta(mockProps);
            expect(textMeta).toStrictEqual({
                description: mockProps.fields.OutstandingPaymentOptionDescriptionExtraPrice,
                title: mockProps.fields.AddAmendToBalanceTitle.value,
                subdescription: mockProps.fields.ChangeFeeDescription,
            });
            const totalBalance =
                mockProps.totalPrice + mockProps.balanceAmount - mockProps.amendmentPaymentInfo.totalFeesAmount;
            expect(mockProps.formatMoney).toHaveBeenCalledWith(totalBalance);
        });
    });
});
