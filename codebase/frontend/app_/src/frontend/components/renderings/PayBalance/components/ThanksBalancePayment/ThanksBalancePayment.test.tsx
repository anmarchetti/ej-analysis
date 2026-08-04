import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import { createMockStores, mockLuggageListFields } from 'frontend/__mocks__';
import { CardType } from 'models/enum/CardType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ThanksBalancePayment from './ThanksBalancePayment';

const createProps = () => ({
    fields: {
        PaymentDeny: { value: 'PaymentDeny' },
        AmountToPayByCard: { value: 'AmountToPayByCard' },
        PaymentImages: [
            {
                fields: {
                    Image: { value: { src: 'image1' } },
                    Name: { value: 'Visa' },
                },
            },
            {
                fields: {
                    Image: { value: { src: 'image2' } },
                    Name: { value: 'img2' },
                },
            },
        ],
        CvvInfo: { value: { src: 'cvv' } },
        CvvInfoAMEX: { value: { src: 'cvvAmex' } },
        IssueNumberInfo: { value: { src: 'issue' } },
        ...mockLuggageListFields,
        ShowInstalments: { value: true },
        ResidualBalance: { value: 10 },
        IsUseCreditShown: { value: true },
        UseCreditTitle: { value: 'UseCreditTitle' },
        UseCreditDescription: { value: 'UseCreditDescription' },
        UseCreditFormTitle: { value: 'UseCreditFormTitle' },
        UseCreditLogInText: { value: 'UseCreditLogInText' },
        IconCreditInfoBlock: { value: { src: 'credit' } },
        TextCreditInfoBlock: { value: 'TextCreditInfoBlock' },
    },
    booking: { paymentInfo: { totalPrice: 100, balanceDueAmount: 40, currency: CurrencyCode.GBP } },
    onBack: jest.fn(),
    paidDetails: {
        amount: 5,
        billingInfo: {},
        cardType: CardType.Visa,
        creditAmount: 20,
        cardNumber: '1234',
    },
});

let mockProps;
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/ErrorMessage', () => () => <div data-tid='error-message' />);

jest.mock('frontend/components/common/CreditCardLogoComponent/CardLogoComponent', () => ({
    CardLogoComponent: ({ cardType, className }: any) => (
        <div data-tid={cardType} data-card-type={cardType} className={className} />
    ),
}));

jest.mock('frontend/components/icons-new/ApplePayLogo', () => () => <div data-tid='apple-pay-logo' />);

const mockFormattedMoneyProps = jest.fn();
jest.mock('frontend/components/common/FormattedMoney/FormattedMoney', () => ({
    __esModule: true,
    default: props => {
        mockFormattedMoneyProps(props);

        return <div data-tid='formatted-money' />;
    },
    MIN_FRACTION_DIGITS: 2,
}));

describe('<ThanksBalancePayment />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render title', () => {
        render(<ThanksBalancePayment {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent(SitecoreDictionary.PaymentTitlesThanksForPayment);
    });

    it('should render error message', () => {
        render(<ThanksBalancePayment {...mockProps} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('should NOT render error message when PaymentLabelsPayBalanceSuccessTitle and PaymentLabelsPayBalanceSuccessDesc dictionary NOT provided', () => {
        mockStores.layoutStore.getPhrase = jest.fn();
        render(<ThanksBalancePayment {...mockProps} />);

        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should render PaymentLabelsTotalCost', () => {
        render(<ThanksBalancePayment {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.PaymentLabelsTotalCost)).toBeInTheDocument();
    });

    it('should render total price and remaining parts', () => {
        render(<ThanksBalancePayment {...mockProps} />);

        expect(screen.getByText('£100')).toBeInTheDocument();
        expect(screen.getByTestId('remaining-balance-price')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.PaymentLabelsRemainingBalance)).toBeInTheDocument();
        expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
            amount: mockProps.booking?.paymentInfo?.balanceDueAmount ?? 0,
            className: 'subtext',
            options: {
                currency: mockProps.booking?.paymentInfo?.currency,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            },
        });
    });

    it('should render PaymentLabelsPaidToDate and total paid', () => {
        render(<ThanksBalancePayment {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.PaymentLabelsPaidToDate)).toBeInTheDocument();
        expect(screen.getByText('£60')).toBeInTheDocument();
    });

    it('should render button', () => {
        render(<ThanksBalancePayment {...mockProps} />);

        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.PaymentButtonsBackToBooking);
    });

    describe('Current total paid provided', () => {
        it('should render amount paid today with parts', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.PaymentLabelsAmountPaidToday)).toBeInTheDocument();
            expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
                amount: 25,
                className: 'subtext',
                options: {
                    currency: mockProps.booking?.paymentInfo?.currency,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                },
            });
        });
    });

    describe('Current total paid NOT provided', () => {
        beforeEach(() => {
            mockProps.paidDetails = null;
            mockProps.booking.paymentInfo.paymentHistory = [];
        });

        it('should NOT render PaymentLabelsAmountPaidToday', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.PaymentLabelsAmountPaidToday)).not.toBeInTheDocument();
        });

        it('should NOT render current amount parts', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.queryByText('£25')).not.toBeInTheDocument();
        });
    });

    describe('Credit amount > 0', () => {
        describe('Current total paid provided', () => {
            it('should render 2 BookingPaymentLabelsPaymentMethods', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.getAllByText(SitecoreDictionary.BookingPaymentLabelsPaymentMethod).length).toBe(2);
            });

            it('should render BookingPaymentLabelsCreditOption', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.getByText(SitecoreDictionary.BookingPaymentLabelsCreditOption)).toBeInTheDocument();
            });

            it('should render credit amount', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.getByText('£20')).toBeInTheDocument();
            });
        });

        describe('Current total paid NOT provided', () => {
            beforeEach(() => {
                mockProps.paidDetails = null;
            });

            it('should NOT render BookingPaymentLabelsPaymentMethod', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(
                    screen.queryByText(SitecoreDictionary.BookingPaymentLabelsPaymentMethod),
                ).not.toBeInTheDocument();
            });

            it('should NOT render BookingPaymentLabelsCreditOption and credit amount', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.queryByText(SitecoreDictionary.BookingPaymentLabelsCreditOption)).not.toBeInTheDocument();
                expect(screen.queryByText('£20')).not.toBeInTheDocument();
            });
        });
    });

    describe('Credit amount is 0', () => {
        beforeEach(() => {
            mockProps.paidDetails.creditAmount = 0;
        });

        it('should render 1 BookingPaymentLabelsPaymentMethod', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.BookingPaymentLabelsPaymentMethod)).toBeInTheDocument();
        });

        it('should NOT render BookingPaymentLabelsCreditOption', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.BookingPaymentLabelsCreditOption)).not.toBeInTheDocument();
        });

        it('should NOT render credit amount', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.queryByText('£20')).not.toBeInTheDocument();
        });
    });

    describe('Amount > 0', () => {
        describe('Current total paid provided', () => {
            it('should render card logo for regular card types', () => {
                render(<ThanksBalancePayment {...mockProps} />);
                expect(screen.getByTestId('Visa')).toHaveAttribute('data-card-type', CardType.Visa.toString());
            });

            it('should render normal mask for non-Amex', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.getByText('**** **** **** 1234')).toBeInTheDocument();
            });

            it('should render american express mask', () => {
                mockProps.paidDetails.cardType = CardType.AmericanExpress;
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.getByText('*** ****** *1234')).toBeInTheDocument();
            });

            it('should render amount', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.getByText('£5')).toBeInTheDocument();
            });

            it('should render Apple Pay logo and masked display name when ApplePay', () => {
                mockProps.paidDetails = {
                    amount: 50,
                    cardType: CardType.ApplePay,
                    token: { paymentMethod: { displayName: 'MasterCard 1234' } },
                };
                render(<ThanksBalancePayment {...mockProps} />);
                expect(screen.getByTestId('apple-pay-logo')).toBeInTheDocument();
                expect(screen.getByText('**** **** **** 1234')).toBeInTheDocument();
            });
        });

        describe('Current total paid NOT provided', () => {
            beforeEach(() => {
                mockProps.paidDetails = null;
            });

            it('should NOT render card logo or mask', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.queryByTestId('card-logo')).not.toBeInTheDocument();
                expect(screen.queryByText('**** **** **** 1234')).not.toBeInTheDocument();
            });

            it('should NOT render amount', () => {
                render(<ThanksBalancePayment {...mockProps} />);

                expect(screen.queryByText('£5')).not.toBeInTheDocument();
            });
        });
    });

    describe('Amount = 0', () => {
        beforeEach(() => {
            mockProps.paidDetails.amount = 0;
        });

        it('should NOT render card logo', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.queryByTestId('card-logo')).not.toBeInTheDocument();
        });

        it('should NOT render mask', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.queryByText('**** **** **** 1234')).not.toBeInTheDocument();
        });

        it('should NOT render amount', () => {
            render(<ThanksBalancePayment {...mockProps} />);

            expect(screen.queryByText('£5')).not.toBeInTheDocument();
        });
    });
});
