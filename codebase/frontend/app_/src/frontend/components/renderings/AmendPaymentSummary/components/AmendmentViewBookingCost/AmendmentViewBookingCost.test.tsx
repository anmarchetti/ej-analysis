import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendmentViewBookingCost, { IAmendmentViewBookingCostProps } from './AmendmentViewBookingCost';

const createProps = (): IAmendmentViewBookingCostProps => ({
    fields: {
        AccommodationLabel: mockSitecoreField('AccommodationLabel'),
        BalanceLabel: mockSitecoreField('BalanceLabel'),
        CommissionLabel: mockSitecoreField('CommissionLabel'),
        DepositLabel: mockSitecoreField('DepositLabel'),
        FeesAndTaxesLabel: mockSitecoreField('FeesAndTaxesLabel'),
        PopupTitle: mockSitecoreField('PopupTitle'),
        TotalPriceLabel: mockSitecoreField('TotalPriceLabel'),
        VATOnCommissionLabel: mockSitecoreField('VATOnCommissionLabel'),
    },
});

jest.mock('next/dynamic', () => () => () => <div data-tid='fees-popup' />);

const createStores = () => ({
    amendSeatsStore: {
        paymentInfo: {},
    },
    bookingStore: {
        booking: {},
    },
    trackingStore: {
        trackEventWithParams: jest.fn(),
    },
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('Amendment View Booking Cost Component', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should NOT render when fields are empty', () => {
        props.fields = null;

        const { container } = render(<AmendmentViewBookingCost {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when paymentInfo is empty', () => {
        mockStores.amendSeatsStore.paymentInfo = null;

        const { container } = render(<AmendmentViewBookingCost {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        render(<AmendmentViewBookingCost {...props} />);

        expect(screen.getByTestId('booking-cost')).toBeInTheDocument();
        expect(screen.getByTestId('fees-popup-link')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: props.fields.FeesAndTaxesLabel.value })).toBeInTheDocument();
    });

    it('should NOT render FeesAndTaxesLabel when such field is not defined', () => {
        props.fields.FeesAndTaxesLabel.value = null;

        render(<AmendmentViewBookingCost {...props} />);

        expect(screen.queryByTestId('fees-popup-link')).not.toBeInTheDocument();
    });

    it('should render Fees Popup', async () => {
        render(<AmendmentViewBookingCost {...props} />);

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByTestId('fees-popup')).toBeInTheDocument();
    });

    it('should apply right class to priceBreakdown', () => {
        render(<AmendmentViewBookingCost {...props} linkClass={'testClass'} />);

        expect(screen.getByTestId('fees-popup-link')).toHaveClass('testClass');
    });
});
