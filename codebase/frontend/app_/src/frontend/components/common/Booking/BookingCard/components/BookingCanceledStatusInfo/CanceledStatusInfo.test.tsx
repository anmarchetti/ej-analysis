import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BookingCanceledStatusInfo } from './BookingCanceledStatusInfo';

jest.mock('frontend/components/icons-new/WarningFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='svg-warning-filled' />,
}));

describe('<BookingCanceledStatusInfo />', () => {
    it('should standard render', () => {
        const { container } = render(<BookingCanceledStatusInfo getPhrase={jest.fn(i => i)} />);

        expect(container.getElementsByClassName('cancelledText')).toHaveLength(1);
        expect(container.getElementsByClassName('errorIcon')).toHaveLength(1);
        expect(screen.getByTestId('svg-warning-filled')).toBeInTheDocument();
        expect(screen.getByTestId('booking-canceled-status-info')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ViewBookingsLabelsHolidayCanceled)).toBeInTheDocument();
    });
});
