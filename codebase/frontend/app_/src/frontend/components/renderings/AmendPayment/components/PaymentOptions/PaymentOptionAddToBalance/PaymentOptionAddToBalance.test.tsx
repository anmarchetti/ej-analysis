import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PaymentOptionAddToBalance, { IPaymentOptionAddToBalanceProps } from './PaymentOptionAddToBalance';
import * as utils from './PaymentOptionAddToBalance.utils';

const createProps = (): IPaymentOptionAddToBalanceProps => ({
    onChange: jest.fn(),
    isSelected: false,
});

const createStore = () =>
    createMockStores({
        amendPaymentStore: {
            addToBalanceDueDate: new Date(),
            balanceAmount: 10,
            totalPrice: 20,
            remainingBalance: 15,
            currency: 'GBP',
        },
    });

let mockProps = createProps();
let mockStores = createStore();

const spy = jest.spyOn(utils, 'getTextMeta');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPaymentBaseOptionProps = jest.fn();
jest.mock('frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption', () => ({
    __esModule: true,
    default: props => {
        mockPaymentBaseOptionProps(props);

        return <div data-tid='payment-base-options'>{props.children}</div>;
    },
}));

describe('<PaymentOptionAddToBalance />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStore();
    });

    it('renders component', () => {
        spy.mockReturnValueOnce({
            title: 'title',
            subdescription: { value: 'subdescription' },
            description: { value: 'description' },
        });
        render(<PaymentOptionAddToBalance {...mockProps} />);

        expect(mockPaymentBaseOptionProps).toHaveBeenCalledWith({
            checkboxId: 'add-to-balance-option',
            isSelected: mockProps.isSelected,
            onChange: mockProps.onChange,
            title: 'title',
            price: mockStores.amendPaymentStore.totalPrice,
            priceDescription: SitecoreDictionary.CreditConfirmRefundCardsTotal,
            currency: mockStores.amendPaymentStore.currency,
            children: expect.anything(),
        });

        expect(screen.getByTestId('add-to-balance-option-description')).toHaveTextContent('description');
        expect(screen.getByTestId('add-to-balance-option-fee-description')).toHaveTextContent('subdescription');
    });

    it('does NOT render description and subdescription', () => {
        spy.mockReturnValueOnce({} as any);
        render(<PaymentOptionAddToBalance {...mockProps} />);

        expect(screen.queryByTestId('add-to-balance-option-description')).not.toBeInTheDocument();
        expect(screen.queryByTestId('add-to-balance-option-fee-description')).not.toBeInTheDocument();
    });
});
