import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { CreditMethodItem } from './CreditMethodItem';

const createProps = () => ({
    creditAmount: 20,
    showSplitAmount: true,
    currency: 'GBP',
    formatMoney: (v: number) => `£${v}`,
    getPhrase: (k: any) => k,
});

const createStores = () => createMockStores({});

let mockProps: ReturnType<typeof createProps>;
let mockStores: ReturnType<typeof createStores>;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CreditMethodItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render payment method label', () => {
        render(<CreditMethodItem {...mockProps} />);
        expect(screen.getByText(SitecoreDictionary.BookingPaymentLabelsPaymentMethod)).toBeInTheDocument();
    });

    it('should render credit option label', () => {
        render(<CreditMethodItem {...mockProps} />);
        expect(screen.getByText(SitecoreDictionary.BookingPaymentLabelsCreditOption)).toBeInTheDocument();
    });

    it('should render formatted credit amount when split amount is shown', () => {
        render(<CreditMethodItem {...mockProps} />);
        expect(screen.getByText('£20')).toBeInTheDocument();
    });

    it('should not render credit amount when split amount is hidden', () => {
        mockProps.showSplitAmount = false;
        render(<CreditMethodItem {...mockProps} />);
        expect(screen.queryByText('£20')).not.toBeInTheDocument();
    });

    it('should render zero amount correctly when creditAmount is undefined and split amount is shown', () => {
        (mockProps as any).creditAmount = undefined;
        mockProps.showSplitAmount = true;
        render(<CreditMethodItem {...mockProps} />);
        expect(screen.getByText('£0')).toBeInTheDocument();
    });
});
