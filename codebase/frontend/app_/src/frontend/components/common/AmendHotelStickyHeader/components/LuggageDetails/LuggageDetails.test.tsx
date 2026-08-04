import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import LuggageDetails, { ILuggageDetailsProps } from './LuggageDetails';

const createMockProps = (): ILuggageDetailsProps => ({
    booking: mockBooking,
    dataTid: 'luggage-details',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field }) => <div>{field.value}</div>,
}));

jest.mock('frontend/components/icons-new/HoldBagFilled', () => () => <div data-tid='hold-bag-filled' />);
jest.mock('frontend/utils/luggage.utils', () => ({
    getHoldItemsLabel: jest.fn().mockReturnValue('5 Basket.Labels.HoldBagsPlural'),
}));

jest.mock(
    'frontend/components/common/Booking/BookingCard/components/BookingCardDetails/BookingCardDetails.utils',
    () => ({
        usePreparedBookingDetailsData: jest.fn().mockReturnValue({
            details: {
                luggageCount: 5,
            },
        }),
    }),
);

describe('<LuggageDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores();
    });

    it('should render component', () => {
        render(<LuggageDetails {...mockProps} />);

        expect(screen.getByTestId('luggage-details-hold-bags')).toBeInTheDocument();
        expect(screen.getByTestId('hold-bag-filled')).toBeInTheDocument();
        expect(screen.getByText('5 Basket.Labels.HoldBagsPlural')).toBeInTheDocument();
    });

    it('should render titleField if provided', () => {
        const titleField = mockSitecoreField('Your luggage');
        mockProps.titleField = titleField;
        render(<LuggageDetails {...mockProps} />);

        expect(screen.getByText(titleField.value)).toBeInTheDocument();
    });

    it('should render className if provided', () => {
        const testClass = 'test-class';
        mockProps.className = testClass;
        render(<LuggageDetails {...mockProps} />);

        expect(screen.getByTestId('luggage-details-hold-bags')).toHaveClass(testClass);
    });
});
