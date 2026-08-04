import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { CardType, CardTypeShort } from 'models/enum/CardType';

import CardPayments from './CardPayments';

const resetMocks = () => ({
    fields: {
        PaymentImages: [
            {
                fields: {
                    Image: { value: { src: 'test' } },
                    Name: { value: CardType.AmericanExpress },
                },
            },
        ],
    },
    isLoggedInUserLead: false,
    paymentHistory: [
        {
            paymentDate: 'December 17, 1995 03:24:00',
            amount: 100,
        },
        {
            paymentDate: 'December 17, 1995 03:24:00',
            amount: 100,
        },
    ],
});

let mockStores;
let mock;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CardPayments />', () => {
    beforeEach(() => {
        mock = resetMocks();
        mockStores = createMockStores();
    });

    it('should render 2 paid items', () => {
        render(<CardPayments {...mock} />);

        expect(screen.getAllByTestId('paid-amount')).toHaveLength(2);
    });

    it('should not render card details', () => {
        render(<CardPayments {...mock} />);

        expect(screen.queryByTestId('card-number')).not.toBeInTheDocument();
    });

    it.each([
        { code: CardTypeShort.VI, testId: 'Visa' },
        { code: CardTypeShort.AX, testId: 'AmericanExpress' },
        { code: CardTypeShort.MC, testId: 'Mastercard' },
        { code: CardTypeShort.SW, testId: 'Maestro' },
        { code: CardTypeShort.AV, testId: 'apple-pay-logo' },
    ])('should render card details with image for %s', ({ code, testId }) => {
        mock.isLoggedInUserLead = true;
        mock.paymentHistory[0].card = {
            code,
            number: 'XXXXXXXXXXXX1111',
        };
        render(<CardPayments {...mock} />);

        expect(screen.getByTestId(testId)).toBeInTheDocument();
    });

    it('should render card details without image', () => {
        mock.isLoggedInUserLead = true;
        mock.paymentHistory[0].card = {
            code: null,
            number: 'XXXXXXXXXXXX1111',
        };
        const { container } = render(<CardPayments {...mock} />);

        expect(screen.getByTestId('card-number')).toBeInTheDocument();
        expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('should render nothing if paymentHistory is empty', () => {
        mock.paymentHistory = [];
        const { container } = render(<CardPayments {...mock} />);
        expect(container.firstChild).toBeNull();
    });
});
