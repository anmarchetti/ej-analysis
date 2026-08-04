import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { CreditType } from 'models/enum/CreditType';
import { refundOptionsFieldsMock } from 'frontend/components/renderings/CancelBooking/__mocks__/mockFields';

import RefundOptions, { TRefundOptionsProps } from './RefundOptions';

const createProps = (): TRefundOptionsProps => ({
    refundOptions: refundOptionsFieldsMock,
    refundData: mockBooking.refund,
    currency: CurrencyCode.GBP,
});

const createStores = () =>
    createMockStores({
        holidayCreditStore: {
            selectedRefundType: CreditType.Credit,
            setSelectedRefundType: jest.fn(),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRefundOptionPopup = jest.fn();
jest.mock('frontend/components/renderings/CancelBooking/components/RefundOptionPopup/RefundOptionPopup', () => ({
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

describe('<RefundOptions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render component', () => {
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByTestId('refund-options')).toBeInTheDocument();
    });

    it('should NOT render component when there are no refund options', () => {
        mockProps.refundOptions = [];
        const { container } = render(<RefundOptions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render refund options based on refundOptions prop', () => {
        mockProps.refundOptions[0].fields.RefundUniqueId.value = 'Credit';
        render(<RefundOptions {...mockProps} />);

        expect(screen.getAllByTestId('payment-base-option')).toHaveLength(mockProps.refundOptions.length);
        expect(screen.queryAllByTestId('option-popup')).toHaveLength(1);

        mockProps.refundOptions.forEach(option => {
            const type = CreditType[option.fields.RefundUniqueId.value];

            expect(mockPaymentBaseOption).toHaveBeenCalledWith({
                checkboxId: `refund-option-${type}`,
                title: option.fields.OptionTitle.value,
                isSelected: mockStores.holidayCreditStore.selectedRefundType === type,
                price: expect.any(Number),
                priceDescription: option.fields.TotalLabel.value,
                onChange: expect.any(Function),
                currency: mockProps.currency,
            });

            if (mockProps.refundData[type].credit > 0) {
                expect(mockPaymentOptionBreakdown).toHaveBeenCalledWith({
                    label: option.fields.CreditLabel.value,
                    value: mockProps.refundData[type].credit,
                    className: 'option',
                    currency: mockProps.currency,
                });
            }

            if (mockProps.refundData[type].cash > 0) {
                expect(mockPaymentOptionBreakdown).toHaveBeenCalledWith({
                    label: option.fields.CashLabel.value,
                    value: mockProps.refundData[type].cash,
                    className: 'option',
                    currency: mockProps.currency,
                });
            }

            expect(mockRefundOptionPopup).toHaveBeenCalledWith({
                fields: mockProps.refundOptions[0].fields.Popups[1].fields,
            });
        });
    });

    it('should NOT render refund option when it is NOT eligible', () => {
        mockProps.refundData = {
            credit: {
                isEligible: false,
                credit: 100,
            },
            refund: {
                isEligible: true,
                credit: 10,
                cash: 100,
            },
        };

        render(<RefundOptions {...mockProps} />);

        expect(screen.getAllByTestId('payment-base-option')).toHaveLength(1);

        expect(mockPaymentBaseOption).toHaveBeenCalledWith(
            expect.objectContaining({
                checkboxId: `refund-option-refund`,
            }),
        );

        expect(mockPaymentBaseOption).not.toHaveBeenCalledWith(
            expect.objectContaining({
                checkboxId: `refund-option-credit`,
            }),
        );
    });

    it('should select refund option on click', async () => {
        render(<RefundOptions {...mockProps} />);

        const refundOptionCard = screen.getAllByTestId('payment-base-option')[0];
        await userEvent.click(refundOptionCard);

        expect(mockStores.holidayCreditStore.setSelectedRefundType).toHaveBeenCalled();
    });
});
