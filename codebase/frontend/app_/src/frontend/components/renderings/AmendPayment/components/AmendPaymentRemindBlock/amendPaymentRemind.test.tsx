import React from 'react';
import { render } from '@testing-library/react';

import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import AmendPaymentRemindBlock from './AmendPaymentRemindBlock';

const props = {
    fields: {
        AmendTitleReminder: {
            value: 'AmendTitleReminder',
        },
        AmendZeroPriceDescriptionReminder: {
            value: 'AmendZeroPriceDescriptionReminder',
        },
        AmendRefundCreditsOnlyTitleReminder: {
            value: 'AmendRefundCreditsOnlyTitleReminder',
        },
        AmendRefundCreditsOnlyDescriptionReminder: {
            value: 'AmendRefundCreditsOnlyDescriptionReminder',
        },
        AmendRefundDescriptionReminder: {
            value: 'AmendRefundDescriptionReminder',
        },
    },
};

const createStores = () => ({
    amendPaymentStore: {
        totalPrice: -20,
        isOnlyCreditRefund: false,
        isRefund: true,
        balanceAmount: 10,
        addToBalanceDueDate: new Date(),
        currency: 'GBP',
    },
    layoutStore: {
        isEditMode: false,
    },
    routerStore: {
        redirectTo: '/',
    },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockStores = createStores();
let mockProps = { ...props };

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendPaymentRemindBlock />', () => {
    afterEach(() => {
        mockStores = createStores();
        mockProps = { ...props };
    });

    it('Should render refund description', () => {
        const view = render(
            <AmendPaymentRemindBlock fields={mockProps.fields as IPaymentPageFields} moreThenBlockDays />,
        );
        expect(view.getByText('AmendTitleReminder')).toBeTruthy();
        expect(view.getByText('AmendRefundDescriptionReminder')).toBeTruthy();
    });

    it('Should render "refund only credits" content', () => {
        mockStores.amendPaymentStore.isOnlyCreditRefund = true;
        const view = render(<AmendPaymentRemindBlock fields={mockProps.fields as IPaymentPageFields} />);

        expect(view.getByText('AmendRefundCreditsOnlyTitleReminder')).toBeTruthy();
        expect(view.getByText('AmendRefundCreditsOnlyDescriptionReminder')).toBeTruthy();
    });

    it('Should render "refund only credits" content as well with 0 balance amount', () => {
        mockStores.amendPaymentStore.balanceAmount = 0;
        mockStores.amendPaymentStore.isRefund = true;
        mockStores.amendPaymentStore.isOnlyCreditRefund = true;
        const view = render(
            <AmendPaymentRemindBlock fields={mockProps.fields as IPaymentPageFields} moreThenBlockDays />,
        );

        expect(view.getByText('AmendRefundCreditsOnlyTitleReminder')).toBeTruthy();
        expect(view.getByText('AmendRefundCreditsOnlyDescriptionReminder')).toBeTruthy();
    });

    it('Should render nothing', () => {
        mockStores.amendPaymentStore.balanceAmount = 0;
        mockStores.amendPaymentStore.isRefund = false;
        const view = render(
            <AmendPaymentRemindBlock fields={mockProps.fields as IPaymentPageFields} moreThenBlockDays />,
        );

        expect(view.container.children.length).toBe(0);
    });

    it('Should render content with total price equal 0', () => {
        mockStores.amendPaymentStore.isRefund = false;
        mockStores.amendPaymentStore.totalPrice = 0;
        const view = render(
            <AmendPaymentRemindBlock fields={mockProps.fields as IPaymentPageFields} moreThenBlockDays />,
        );

        expect(view.getByText('AmendTitleReminder')).toBeTruthy();
        expect(view.getByText('AmendZeroPriceDescriptionReminder')).toBeTruthy();
    });

    it('Should render content with total price equal 0 refund credits only', () => {
        mockStores.amendPaymentStore.isOnlyCreditRefund = true;
        const view = render(
            <AmendPaymentRemindBlock fields={mockProps.fields as IPaymentPageFields} moreThenBlockDays />,
        );

        expect(view.getByText('AmendRefundCreditsOnlyTitleReminder')).toBeTruthy();
        expect(view.getByText('AmendRefundCreditsOnlyDescriptionReminder')).toBeTruthy();
    });
});
