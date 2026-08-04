import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ITransport } from 'models/data/IOffer';

import AirportParkingInfo from './AirportParkingInfo';

jest.mock('frontend/components/icons-new/Parking', () => ({
    __esModule: true,
    default: () => <div data-tid='parking-icon' />,
}));

jest.mock('frontend/utils/date.utils', () => ({
    __esModule: true,
    formatDateL10n: jest.fn(date => date),
    getTimeWithoutSeconds: jest.fn(time => time),
}));

const createProps = () => ({
    transport: { routes: [{}, {}] } as ITransport,
    fields: {
        DepartureAirportText: mockSitecoreField('DepartureAirportText'),
        EmailInstruction: mockSitecoreField('EmailInstruction'),
        ParkingDates: mockSitecoreField('ParkingDates'),
    },
    airportParkingDetails: {
        bookingDetails: {
            endDate: '2025-04-06',
            endTime: '12:00:00',
            startDate: '2025-04-01',
            startTime: '09:00:00',
        },
        title: 'Parking name - purple',
    },
});

let props;

describe('AirportParkingInfo', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render correctly', () => {
        render(<AirportParkingInfo {...props} />);

        expect(screen.queryByTestId('airport-name')).toBeInTheDocument();
        expect(screen.queryByTestId('parking-name')).toHaveTextContent('Parking name - purple');
        expect(screen.queryByTestId('parking-date-time')).toBeInTheDocument();
        expect(screen.queryByTestId('email-instruction')).toHaveTextContent('EmailInstruction');
        expect(screen.queryByTestId('parking-icon')).toBeInTheDocument();
    });

    it('should not render sitecore fields when they are empty', () => {
        props.fields = {
            DepartureAirportText: { value: '' },
            ParkingDates: { value: '' },
            EmailInstruction: { value: '' },
        };

        render(<AirportParkingInfo {...props} />);

        expect(screen.queryByTestId('email-instruction')).not.toBeInTheDocument();
        expect(screen.queryByTestId('parking-date-time')).not.toBeInTheDocument();
        expect(screen.queryByTestId('airport-name')).toHaveTextContent('');
    });
});
