import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import * as utils from 'frontend/components/renderings/AmendPayment/components/RefundOptions/refundOptions.utils';

import RefundOptionsCanCredit from './RefundOptionsCanCredit';

const createProps = () => ({ fields: {} });

const createStores = () =>
    createMockStores({
        amendPaymentStore: {
            canRefund: false,
            canCredit: false,
            refundData: { credit: { credit: 10 }, refund: { credit: 20, cash: 30 } },
            isCreditRefund: false,
            currency: 'GBP',
            setIsCreditRefund: jest.fn(),
        },
        layoutStore: { getPhrase: jest.fn(p => p) },
        marketStore: { formatMoney: jest.fn(a => `£${a}`) },
        routerStore: {},
        appStore: {
            toggleOfferConditions: jest.fn(),
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/Payment/components/PaymentMethodCard', () => ({ children }) => (
    <div data-tid='card'>{children}</div>
));

const mockPaymentOptionPriceProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptionPrice/PaymentOptionPrice',
    () => ({
        __esModule: true,
        default: props => {
            mockPaymentOptionPriceProps(props);

            return <div data-tid='payment-option-price' />;
        },
    }),
);

describe('<RefundOptionsCanCredit />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render PaymentMethodCard', () => {
        const { getByTestId } = render(<RefundOptionsCanCredit {...mockProps} />);

        expect(getByTestId('card')).toBeInTheDocument();
    });

    it('should render PaymentOptionPrice', () => {
        render(<RefundOptionsCanCredit {...mockProps} />);

        expect(mockPaymentOptionPriceProps).toHaveBeenCalledWith({
            price: 10,
            description: SitecoreDictionary.CreditConfirmRefundCardsTotal,
            isTotal: true,
            currency: mockStores.amendPaymentStore.currency,
        });
    });

    it('should render credit description', () => {
        jest.spyOn(utils, 'getCreditField').mockReturnValueOnce({ value: 'description' as any });
        const { getByText } = render(<RefundOptionsCanCredit {...mockProps} />);

        expect(getByText('description')).toBeInTheDocument();
    });

    it('should NOT render credit description', () => {
        jest.spyOn(utils, 'getCreditField').mockReturnValueOnce({ value: '' as any });
        const { container } = render(<RefundOptionsCanCredit {...mockProps} />);

        expect(container.getElementsByClassName('credit-description').length).toBe(0);
    });
});
