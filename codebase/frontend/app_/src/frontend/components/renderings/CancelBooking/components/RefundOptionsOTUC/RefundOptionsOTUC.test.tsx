import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockCancellationSummary } from 'frontend/__mocks__/cancellationSummary';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { CreditType } from 'models/enum/CreditType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import {
    refundOptionsContentMock,
    refundOptionsFieldsMock,
    refundOptionsOTUCFieldsMock,
} from 'frontend/components/renderings/CancelBooking/__mocks__/mockFields';
import {
    getRefundPopupContent,
    getRefundPopupContentTrade,
    RefundPopups,
} from 'frontend/components/renderings/CancelBooking/CancelBooking.utils';

import RefundOptions, { TRefundOptionsProps } from './RefundOptionsOTUC';

const createProps = (): TRefundOptionsProps => ({
    fields: refundOptionsOTUCFieldsMock,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            allowRefundsForXOrMoreDaysBeforeDeparture: 60,
        },
        holidayCreditStore: {
            selectedRefundOTUC: mockCancellationSummary.refunds[0],
            setSelectedRefundOTUC: jest.fn(),
            cancellationSummary: mockCancellationSummary,
            booking: mockBooking,
            depositPerPassenger: 80,
            isFlightAndHotelPackage: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: jest.fn(t => t),
    },
}));

const mockRefundOptionPopup = jest.fn();
jest.mock('../RefundOptionPopup/RefundOptionPopup', () => ({
    __esModule: true,
    default: props => {
        mockRefundOptionPopup(props);

        return <div data-tid='option-popup' />;
    },
}));

const mockPaymentOptionBreakdown = jest.fn();
jest.mock('frontend/components/common/PriceOptions/PaymentOptionBreakdown/PaymentOptionBreakdown', () => ({
    __esModule: true,
    default: props => {
        mockPaymentOptionBreakdown(props);

        return <div data-tid='payment-option-breakdown'>{props.children}</div>;
    },
}));

const mockPaymentBaseOption = jest.fn();
jest.mock('frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption', () => ({
    __esModule: true,
    default: ({ children, ...restOption }) => {
        mockPaymentBaseOption(restOption);

        return (
            <div data-tid='payment-base-option' onClick={restOption.onChange}>
                {children}
            </div>
        );
    },
}));

jest.mock('frontend/components/renderings/CancelBooking/CancelBooking.utils', () => ({
    ...jest.requireActual('frontend/components/renderings/CancelBooking/CancelBooking.utils'),
    getRefundPopupContent: jest.fn(),
    getRefundPopupContentTrade: jest.fn(),
}));

describe('<RefundOptions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render component', () => {
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByTestId('refund-options')).toBeInTheDocument();
    });

    it('should not render component when there are no cancellation summary', () => {
        mockStores.holidayCreditStore.cancellationSummary = null;
        const { container } = render(<RefundOptions {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should not render when there are no booking', () => {
        mockStores.holidayCreditStore.booking = null;
        const { container } = render(<RefundOptions {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should render DepositOnlyCloseToDepartureDescription when getRefundPopupContent returns DepositLess60Days', () => {
        (getRefundPopupContent as jest.Mock).mockReturnValue(RefundPopups.DepositLess60Days);

        render(<RefundOptions {...mockProps} />);

        expect(screen.getByTestId('no-refund-block')).toBeInTheDocument();
        expect(screen.getByTestId('no-refund-title')).toBeInTheDocument();
        expect(screen.getByTestId('no-refund-text')).toBeInTheDocument();
        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoRefundTitle.value)).toHaveClass('infoTitle');
        expect(screen.getByText(refundOptionsOTUCFieldsMock.DepositOnlyCloseToDepartureDescription.value)).toHaveClass(
            'text',
        );

        expect(Tokenizer.replaceToken).toHaveBeenNthCalledWith(
            1,
            mockStores.layoutStore.getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
            Tokens.Price,
            mockStores.marketStore.formatMoney(mockStores.holidayCreditStore.depositPerPassenger, {
                currency: mockBooking.paymentInfo.currency,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            }),
        );
    });

    it('should render NoRefundDescription when getRefundPopupContent returns FlightPlusHotelNonRefundable', () => {
        (getRefundPopupContent as jest.Mock).mockReturnValue(RefundPopups.FlightPlusHotelNonRefundable);
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByTestId('no-refund-block')).toBeInTheDocument();
        expect(screen.getByTestId('no-refund-title')).toBeInTheDocument();
        expect(screen.getByTestId('no-refund-text')).toBeInTheDocument();
        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoRefundTitle.value)).toHaveClass('infoTitle');
        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoRefundDescription.value)).toHaveClass('text');
    });

    it('should render NoRefundDescription when getRefundPopupContent returns DepositFullOTUC', () => {
        (getRefundPopupContent as jest.Mock).mockReturnValue(RefundPopups.DepositFullOTUC);
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByTestId('no-refund-block')).toBeInTheDocument();
        expect(screen.getByTestId('no-refund-title')).toBeInTheDocument();
        expect(screen.getByTestId('no-refund-text')).toBeInTheDocument();
        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoRefundTitle.value)).toHaveClass('infoTitle');
        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoRefundDescription.value)).toHaveClass('text');
    });

    it('should render NoPaymentMadeDescription when getRefundPopupContent returns TradeBookingNoPaymentMade', () => {
        mockStores.layoutStore.isTradePortal = true;
        (getRefundPopupContentTrade as jest.Mock).mockReturnValue(RefundPopups.TradeBookingNoPaymentMade);
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoRefundTitle.value)).toBeInTheDocument();
        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoPaymentMadeDescription.value)).toBeInTheDocument();
    });

    it('should render DepositOnlyPaidDescription when getRefundPopupContent returns TradeBookingDepositOnlyPaid', () => {
        mockStores.layoutStore.isTradePortal = true;
        (getRefundPopupContentTrade as jest.Mock).mockReturnValue(RefundPopups.TradeBookingDepositOnlyPaid);
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoRefundTitle.value)).toBeInTheDocument();
        expect(screen.getByText(refundOptionsOTUCFieldsMock.DepositOnlyPaidDescription.value)).toBeInTheDocument();
    });

    it('should render PaidLessThanTotalChargeDescription when getRefundPopupContent returns TradeBookingPaidLessThanTotalCharge', () => {
        mockStores.layoutStore.isTradePortal = true;
        (getRefundPopupContentTrade as jest.Mock).mockReturnValue(RefundPopups.TradeBookingPaidLessThanTotalCharge);
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByText(refundOptionsOTUCFieldsMock.NoRefundTitle.value)).toBeInTheDocument();
        expect(
            screen.getByText(refundOptionsOTUCFieldsMock.PaidLessThanTotalChargeDescription.value),
        ).toBeInTheDocument();
    });

    it('should NOT render component when there are no Children', () => {
        (getRefundPopupContent as jest.Mock).mockReturnValue(RefundPopups.DepositNoOTUC);

        mockProps.fields.Children = [];
        const { container } = render(<RefundOptions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when there are no refund options available for booking', () => {
        (getRefundPopupContent as jest.Mock).mockReturnValue(RefundPopups.DepositPartialOTUC);
        mockStores.holidayCreditStore = {
            ...mockStores.holidayCreditStore,
            cancellationSummary: {
                ...mockCancellationSummary,
                refunds: [],
            },
        };
        const { container } = render(<RefundOptions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render only refund options that has sitecore content set up', () => {
        (getRefundPopupContent as jest.Mock).mockReturnValue(RefundPopups.DepositPartialOTUC);
        mockProps.fields.Children = refundOptionsContentMock;
        mockProps.fields.Children[0].fields.RefundUniqueId.value = 'Refund';
        render(<RefundOptions {...mockProps} />);

        const { cancellationSummary, selectedRefundOTUC } = mockStores.holidayCreditStore;
        expect(screen.getAllByTestId('payment-base-option')).toHaveLength(1);
        expect(screen.queryAllByTestId('option-popup')).toHaveLength(1);

        const refund = cancellationSummary.refunds[1];
        const refundContent = mockProps.fields.Children.find(
            content => content.fields.RefundUniqueId.value === refund.refundOption,
        );

        expect(mockPaymentBaseOption).toHaveBeenCalledWith({
            checkboxId: `refund-option-OriginalPayment`,
            title: refundContent?.fields.OptionTitle.value,
            isSelected: selectedRefundOTUC.refundOption === refundContent?.fields.RefundUniqueId.value,
            price: expect.any(Number),
            priceDescription: refundContent?.fields.TotalLabel.value,
            onChange: expect.any(Function),
            currency: 'GBP',
        });

        expect(mockPaymentOptionBreakdown).toHaveBeenCalledWith({
            label: refundContent?.fields.CreditLabel.value,
            value: refund.credit + refund.oneTimeUseCredit,
            className: 'option',
            currency: 'GBP',
        });

        expect(mockPaymentOptionBreakdown).toHaveBeenCalledWith({
            label: refundContent?.fields.CashLabel.value,
            value: refund.originalPayment,
            className: 'option',
            currency: 'GBP',
        });

        expect(mockRefundOptionPopup).toHaveBeenCalledWith({
            fields: refundOptionsFieldsMock[0].fields.Popups[0].fields,
        });
    });

    it('should render all refund options when sitecore content set up', () => {
        (getRefundPopupContent as jest.Mock).mockReturnValue(RefundPopups.DepositPartialOTUC);
        mockProps.fields.Children = refundOptionsContentMock;
        mockProps.fields.Children[0].fields.RefundUniqueId.value = 'CreditOTUC';
        render(<RefundOptions {...mockProps} />);

        const { cancellationSummary, selectedRefundOTUC } = mockStores.holidayCreditStore;
        expect(screen.getAllByTestId('payment-base-option')).toHaveLength(2);
        expect(screen.queryAllByTestId('option-popup')).toHaveLength(2);

        cancellationSummary.refunds.forEach(option => {
            let refundType;
            const refundContent = mockProps.fields.Children.find(content => {
                refundType = CreditType[content.fields.RefundUniqueId.value];

                return refundType === option.refundOption;
            });

            expect(mockPaymentBaseOption).toHaveBeenCalledWith({
                checkboxId: `refund-option-${refundType}`,
                title: refundContent?.fields.OptionTitle.value,
                isSelected: selectedRefundOTUC.refundOption === refundType,
                price: expect.any(Number),
                priceDescription: refundContent?.fields.TotalLabel.value,
                onChange: expect.any(Function),
                currency: 'GBP',
            });

            const credit = option.credit + option.oneTimeUseCredit;

            if (credit > 0) {
                expect(mockPaymentOptionBreakdown).toHaveBeenCalledWith({
                    label: refundContent?.fields.CreditLabel.value,
                    value: credit,
                    className: 'option',
                    currency: 'GBP',
                });
            }

            if (option.originalPayment > 0) {
                expect(mockPaymentOptionBreakdown).toHaveBeenCalledWith({
                    label: refundContent?.fields.CashLabel.value,
                    value: option.originalPayment,
                    className: 'option',
                    currency: 'GBP',
                });
            }

            expect(mockRefundOptionPopup).toHaveBeenNthCalledWith(1, {
                fields: refundOptionsContentMock[0].fields.Popups[0].fields,
            });
            expect(mockRefundOptionPopup).toHaveBeenNthCalledWith(2, {
                fields: refundOptionsContentMock[2].fields.Popups[0].fields,
            });
        });
    });

    it('should select refund option on click', async () => {
        render(<RefundOptions {...mockProps} />);

        const refundOptionCard = screen.getAllByTestId('payment-base-option')[0];
        await userEvent.click(refundOptionCard);

        expect(mockStores.holidayCreditStore.setSelectedRefundOTUC).toHaveBeenCalled();
    });

    it('should call getRefundPopupContentTarde for trade portal', () => {
        mockStores.layoutStore.isTradePortal = true;
        render(<RefundOptions {...mockProps} />);

        expect(getRefundPopupContentTrade as jest.Mock).toHaveBeenCalled();
    });

    it('should call getRefundPopupContent with isFlightAndHotelPackage true when holidayCreditStore.isFlightAndHotelPackage is true', () => {
        mockStores.holidayCreditStore.isFlightAndHotelPackage = true;
        render(<RefundOptions {...mockProps} />);

        expect(getRefundPopupContent as jest.Mock).toHaveBeenCalledWith(
            mockCancellationSummary,
            mockBooking.paymentInfo,
            mockStores.layoutStore.allowRefundsForXOrMoreDaysBeforeDeparture,
            mockCancellationSummary.isDestinationRulesApplied,
            true,
        );
    });

    it('should call getRefundPopupContent with isFlightAndHotelPackage false when holidayCreditStore.isFlightAndHotelPackage is false', () => {
        mockStores.holidayCreditStore.isFlightAndHotelPackage = false;
        render(<RefundOptions {...mockProps} />);

        expect(getRefundPopupContent as jest.Mock).toHaveBeenCalledWith(
            mockCancellationSummary,
            mockBooking.paymentInfo,
            mockStores.layoutStore.allowRefundsForXOrMoreDaysBeforeDeparture,
            mockCancellationSummary.isDestinationRulesApplied,
            false,
        );
    });
});
