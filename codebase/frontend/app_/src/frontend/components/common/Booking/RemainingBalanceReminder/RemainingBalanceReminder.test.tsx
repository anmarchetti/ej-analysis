import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { IBookingInfo } from 'models/data/IBookingInfo';

import RemainingBalanceReminder from './RemainingBalanceReminder';

const createProps = () => ({
    booking: mockBooking as IBookingInfo,
});

let mockProps;
let mockStores;

jest.mock('./RemainingBalanceReminder.utils', () => ({
    __esModule: true,
    getRemainingBalanceButtonDescription: jest.fn().mockReturnValue('Button Description'),
    getRemainingBalanceDescription: jest.fn().mockReturnValue('Description'),
    getRemainingBalanceTitle: jest.fn().mockReturnValue('Title'),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/payment.utls', () => ({
    __esModule: true,
    goPayRemainingBalance: jest.fn(),
}));

describe('<RemainingBalanceReminder />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                basePath: '/balance',
                daysBeforeDepartureToShowReminder: 28,
            },
        });
        mockProps = createProps();
        // @ts-ignore
        jest.useFakeTimers('modern');
        // eslint-disable-next-line no-magic-numbers
        jest.setSystemTime(new Date(2023, 5, 26));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should render all components', () => {
        render(<RemainingBalanceReminder {...mockProps} />);

        expect(screen.getByTestId('reminder-icon')).toBeInTheDocument();
        expect(screen.getByTestId('reminder-title')).toHaveTextContent('Title');
        expect(screen.getByTestId('reminder-price')).toHaveTextContent('Description');
        expect(screen.getByTestId('reminder-text')).toHaveTextContent('Button Description');
    });
});
