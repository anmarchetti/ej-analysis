import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockLuggageListFields, mockPaymentFields } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { gaClickPayDeposit, gaClickPayFullAmount } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import * as paymentUtils from 'frontend/components/renderings/Payment/Payment.utils';

import { IPaymentMethodsProps, PaymentMethods } from './PaymentMethods';

const createProps = (): IPaymentMethodsProps => ({
    fields: {
        ...mockPaymentFields,
        ...mockLuggageListFields,
    },
});

const createStores = () =>
    createMockStores({
        payStore: {
            hasCredit: false,
        },
        paymentStore: {
            fullPrice: 100,
            fullPricePP: 50,
            depositPrice: 50,
            isDeposit: false,
            balanceDueDate: '2020-08-02T00:00:00+00:00',
            depositDueDate: '2019-08-02T00:00:00+00:00',
            selectFullPayment: jest.fn(),
            selectDepositPayment: jest.fn(),
        },
        marketStore: {
            defaultDepositPrice: '£60',
        },
        layoutStore: {
            layout: {
                sitecore: {
                    context: {
                        pageEditing: false,
                    },
                },
            },
        },
    });

let mockStores = createStores();
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPushTrackingEvent = jest.fn();
jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

const mockPaymentMethodCard = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/PaymentMethodCard', () => props => {
    mockPaymentMethodCard(props);

    return <div data-tid='payment-method-card'>{props.children}</div>;
});

const mockPriceLabel = jest.fn();
jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => props => {
    mockPriceLabel(props);

    return <div data-tid='price-label' />;
});

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => props => {
    mockRichTextWithLinks(props);

    return <div data-tid='rich-text-with-links' />;
});

const mockErrorMessage = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => props => {
    mockErrorMessage(props);

    return <div data-tid='error-message' />;
});

const getDepositDescriptionFieldSpy = jest.spyOn(paymentUtils, 'getDepositDescriptionField');
const getFullPriceDescriptionFieldSpy = jest.spyOn(paymentUtils, 'getFullPriceDescriptionField');

describe('PaymentMethod', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render correctly with isCredit false', () => {
        render(<PaymentMethods {...mockProps} />);
        expect(mockPaymentMethodCard).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                checkboxId: 'pay-deposit',
                title: 'Payment.Labels.PayWithDeposit',
                isSelected: false,
            }),
        );
        expect(mockPaymentMethodCard).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                checkboxId: 'pay-full',
                title: 'Payment.Labels.PayFullAmount',
                isSelected: true,
            }),
        );

        const depositCardProps = mockPaymentMethodCard.mock.calls[0][0];
        depositCardProps.onSelect();
        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickPayDeposit);
        expect(mockStores.paymentStore.selectDepositPayment).toHaveBeenCalled();

        expect(mockPriceLabel).toHaveBeenNthCalledWith(1, {
            className: 'price-sub',
            price: '£60',
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPerson,
            tag: 'div',
        });
        expect(mockPriceLabel).toHaveBeenNthCalledWith(2, {
            className: 'price-sub',
            price: '£50',
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPerson,
            tag: 'div',
        });
        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(1, {
            className: 'payment-description',
            field: mockProps.fields?.PayWithDepositDescription,
        });

        expect(mockRichTextWithLinks).toHaveBeenNthCalledWith(2, {
            className: 'payment-description',
            field: mockProps.fields?.PayFullDescription,
        });
    });

    it('should render deposit first if hasCredit is false', () => {
        mockStores.payStore.hasCredit = true;
        mockStores.isDeposit = true;
        render(<PaymentMethods {...mockProps} />);
        expect(mockPaymentMethodCard).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                checkboxId: 'pay-full',
                title: 'Payment.Labels.PayFullAmount',
                isSelected: true,
            }),
        );
        expect(mockPaymentMethodCard).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                checkboxId: 'pay-deposit',
                title: 'Payment.Labels.PayWithDeposit',
                isSelected: false,
            }),
        );

        const fullCardProps = mockPaymentMethodCard.mock.calls[0][0];
        fullCardProps.onSelect();
        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickPayFullAmount);
        expect(mockStores.paymentStore.selectFullPayment).toHaveBeenCalled();
    });

    it('should render error message if balanceDueDate is not present', () => {
        mockStores.paymentStore.balanceDueDate = undefined;
        render(<PaymentMethods {...mockProps} />);
        expect(mockPaymentMethodCard).toHaveBeenCalled();
        expect(mockErrorMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Payment.Titles.PayWithDepositAttentionHeader',
                IsNotification: true,
            }),
        );
        expect(mockErrorMessage.mock.calls[0][0].description).toBeDefined();
    });

    it('should render error message if balanceDueDate is not present without description', () => {
        mockProps.fields!.PayWithDepositAttention = undefined;
        mockStores.paymentStore.balanceDueDate = undefined;
        render(<PaymentMethods {...mockProps} />);
        expect(mockPaymentMethodCard).toHaveBeenCalled();
        expect(mockErrorMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Payment.Titles.PayWithDepositAttentionHeader',
                IsNotification: true,
                description: undefined,
            }),
        );
    });

    it('should not call selectDepositPayment or selectFullPayment if isDisabled is true', () => {
        mockProps.isDisabled = true;
        render(<PaymentMethods {...mockProps} />);

        expect(screen.getByTestId('payment-methods-wrapper')).toHaveClass('is-disabled');
        // Simulate onSelect for both cards
        mockPaymentMethodCard.mock.calls[0][0].onSelect();
        mockPaymentMethodCard.mock.calls[1][0].onSelect();
        expect(mockPushTrackingEvent).not.toHaveBeenCalled();
        expect(mockStores.paymentStore.selectDepositPayment).not.toHaveBeenCalled();
        expect(mockStores.paymentStore.selectFullPayment).not.toHaveBeenCalled();
    });

    it('should use PayWithDepositDescriptionOnePassenger if price per person is not shown', () => {
        mockStores.paymentStore.fullPrice = 100;
        mockStores.paymentStore.fullPricePP = 100;
        mockStores.layoutStore.layout.sitecore.context.pageEditing = true;
        render(<PaymentMethods {...mockProps} />);
        expect(mockRichTextWithLinks).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'payment-description',
                field: mockProps.fields!.PayWithDepositDescriptionOnePassenger,
            }),
        );
    });

    describe('isTaxDisplayed logic', () => {
        it('should call getDepositDescriptionField and getFullPriceDescriptionField with isTaxDisplayed=true when touristTax is positive', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore = {
                selectedOffer: {
                    touristTax: 10,
                },
            };
            mockStores.paymentStore.fullPrice = 100;
            mockStores.paymentStore.fullPricePP = 50;

            render(<PaymentMethods {...mockProps} />);

            expect(getDepositDescriptionFieldSpy).toHaveBeenCalledWith(true, true, mockProps.fields);
            expect(getFullPriceDescriptionFieldSpy).toHaveBeenCalledWith(true, mockProps.fields);
        });

        it('should call getDepositDescriptionField and getFullPriceDescriptionField with isTaxDisplayed=false when touristTax is negative', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore = {
                selectedOffer: {
                    touristTax: -1,
                },
            };
            mockStores.paymentStore.fullPrice = 100;
            mockStores.paymentStore.fullPricePP = 50;

            render(<PaymentMethods {...mockProps} />);

            expect(getDepositDescriptionFieldSpy).toHaveBeenCalledWith(true, false, mockProps.fields);
            expect(getFullPriceDescriptionFieldSpy).toHaveBeenCalledWith(false, mockProps.fields);
        });

        it('should call getDepositDescriptionField and getFullPriceDescriptionField with isTaxDisplayed=false when touristTax is zero', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore = {
                selectedOffer: {
                    touristTax: 0,
                },
            };
            mockStores.paymentStore.fullPrice = 100;
            mockStores.paymentStore.fullPricePP = 50;

            render(<PaymentMethods {...mockProps} />);

            expect(getDepositDescriptionFieldSpy).toHaveBeenCalledWith(true, false, mockProps.fields);
            expect(getFullPriceDescriptionFieldSpy).toHaveBeenCalledWith(false, mockProps.fields);
        });

        it('should call getDepositDescriptionField and getFullPriceDescriptionField with isTaxDisplayed=false when touristTax is undefined', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore = {
                selectedOffer: {
                    touristTax: undefined,
                },
            };
            mockStores.paymentStore.fullPrice = 100;
            mockStores.paymentStore.fullPricePP = 50;

            render(<PaymentMethods {...mockProps} />);

            expect(getDepositDescriptionFieldSpy).toHaveBeenCalledWith(true, false, mockProps.fields);
            expect(getFullPriceDescriptionFieldSpy).toHaveBeenCalledWith(false, mockProps.fields);
        });

        it('should call getDepositDescriptionField and getFullPriceDescriptionField with isTaxDisplayed=false when isTouristTaxEnabled is false', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;
            mockStores.bookingStore = {
                selectedOffer: {
                    touristTax: 10,
                },
            };
            mockStores.paymentStore.fullPrice = 100;
            mockStores.paymentStore.fullPricePP = 50;

            render(<PaymentMethods {...mockProps} />);

            expect(getDepositDescriptionFieldSpy).toHaveBeenCalledWith(true, false, mockProps.fields);
            expect(getFullPriceDescriptionFieldSpy).toHaveBeenCalledWith(false, mockProps.fields);
        });
    });
});
