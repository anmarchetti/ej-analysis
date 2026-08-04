import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import PaymentOptionsFull from './PaymentOptionsFull';

const createProps = () => ({
    onChange: jest.fn(),
    isSelected: false,
    fields: {
        PayFullAmendDescription: mockSitecoreField('PayFullAmendDescription'),
        PayFeeAmendDescription: mockSitecoreField('PayFeeAmendDescription'),
        PayFullAmendTitle: mockSitecoreField('Title'),
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBaseOptionProps = jest.fn();
jest.mock('frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption', () => ({
    __esModule: true,
    default: ({ onChange, children, ...props }) => {
        mockBaseOptionProps(props);

        return <div data-tid='base-option'>{children}</div>;
    },
}));

const mockRichTextProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextProps(props);

        return <div data-tid='rich-text' />;
    },
}));

describe('<PaymentOptionsFull />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            amendPaymentStore: {
                totalPrice: 10,
                getAmendTransportLabel: jest.fn(title => title),
                currency: 'GBP',
                isFromAmendDates: false,
                isPayingFeesOnly: false,
            },
        });
    });

    describe('Base option', () => {
        it('Should render base option with appropriate props', () => {
            render(<PaymentOptionsFull {...mockProps} />);

            expect(screen.getByTestId('base-option')).toBeInTheDocument();
            expect(mockBaseOptionProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    checkboxId: 'pay-full-option',
                    title: 'Title',
                    isSelected: false,
                    price: 10,
                    priceDescription: 'CreditConfirm.RefundCards.Total',
                    currency: mockStores.amendPaymentStore.currency,
                }),
            );
        });

        it('Should render base option with 0 price', () => {
            mockStores.amendPaymentStore.totalPrice = 0;
            render(<PaymentOptionsFull {...mockProps} />);

            expect(mockBaseOptionProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: 0,
                }),
            );
        });

        it('Should render base option with no title', () => {
            mockProps.fields.PayFullAmendTitle = mockSitecoreField(undefined);
            render(<PaymentOptionsFull {...mockProps} />);

            expect(mockBaseOptionProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: '',
                }),
            );
        });
    });

    describe('Description', () => {
        it('Should render Rich text with appropriate props', () => {
            render(<PaymentOptionsFull {...mockProps} />);

            expect(screen.getByTestId('rich-text')).toBeInTheDocument();
            expect(mockRichTextProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: mockProps.fields.PayFullAmendDescription,
                    className: 'credit-description',
                }),
            );
        });

        it('should render fees description when isPayingFeesOnly is true', () => {
            mockStores.amendPaymentStore.isPayingFeesOnly = true;
            render(<PaymentOptionsFull {...mockProps} />);
            expect(mockRichTextProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: mockProps.fields.PayFeeAmendDescription,
                }),
            );
        });
    });
});
