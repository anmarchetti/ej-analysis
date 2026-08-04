import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { CardType } from 'models/enum/CardType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { PayMethodItem } from './PayMethodItem';

const createProps = () => ({
    details: {
        amount: 5,
        cardType: CardType.Visa,
        cardNumber: '1234',
    } as any,
    showSplitAmount: true,
    currency: 'GBP',
    formatMoney: (v: number) => `£${v}`,
    getPhrase: (k: any) => k,
    hasApplePayPayment: false,
    maskApplePayCardNumber: '**** **** **** 9999',
});

const createStores = () => createMockStores({});

let mockProps: ReturnType<typeof createProps>;
let mockStores: ReturnType<typeof createStores>;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/CreditCardLogoComponent/CardLogoComponent', () => ({
    CardLogoComponent: ({ cardType, className }: any) => <div data-tid={cardType} className={className} />,
}));

jest.mock('frontend/components/icons-new/ApplePayLogo', () => (props: any) => (
    <div data-tid='apple-pay-logo' className={props.className} />
));

describe('<PayMethodItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render BookingPaymentLabelsPaymentMethod label', () => {
        render(<PayMethodItem {...mockProps} />);
        expect(screen.getByText(SitecoreDictionary.BookingPaymentLabelsPaymentMethod)).toBeInTheDocument();
    });

    it('should render card logo for regular card types', () => {
        render(<PayMethodItem {...mockProps} />);
        expect(screen.getByTestId('Visa')).toBeInTheDocument();
    });

    it('should render normal mask for non-Amex', () => {
        render(<PayMethodItem {...mockProps} />);
        expect(screen.getByText('**** **** **** 1234')).toBeInTheDocument();
    });

    it('should render american express mask', () => {
        mockProps.details.cardType = CardType.AmericanExpress;
        render(<PayMethodItem {...mockProps} />);
        expect(screen.getByText('*** ****** *1234')).toBeInTheDocument();
    });

    it('should render split amount when showSplitAmount is true', () => {
        render(<PayMethodItem {...mockProps} />);
        expect(screen.getByText('£5')).toBeInTheDocument();
    });

    it('should NOT render split amount when showSplitAmount is false', () => {
        mockProps.showSplitAmount = false;
        render(<PayMethodItem {...mockProps} />);
        expect(screen.queryByText('£5')).not.toBeInTheDocument();
    });

    it('should render Apple Pay logo and masked display name when ApplePay with hasApplePayPayment', () => {
        mockProps.details = {
            amount: 50,
            cardType: CardType.ApplePay,
            cardNumber: '5555',
        } as any;
        mockProps.hasApplePayPayment = true;
        mockProps.maskApplePayCardNumber = '**** **** **** 1234';

        render(<PayMethodItem {...mockProps} />);

        expect(screen.getByTestId('apple-pay-logo')).toBeInTheDocument();
        expect(screen.getByText('**** **** **** 1234')).toBeInTheDocument();
    });
});
