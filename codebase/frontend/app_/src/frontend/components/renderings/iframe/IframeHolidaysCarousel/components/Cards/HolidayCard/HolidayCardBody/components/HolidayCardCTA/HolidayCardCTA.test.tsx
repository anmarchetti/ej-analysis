import React from 'react';
import { render, screen } from '@testing-library/react';

import HolidayCardCTA from './HolidayCardCTA';

const createProps = () => ({
    hotelLink: '/hotel-url',
    isLuxuryPackage: false,
    isCityBreak: false,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HolidayCardCTA />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render component with correct link and text', () => {
        render(<HolidayCardCTA {...mockProps} />);

        const link = screen.getByTestId('view-holiday-btn');
        expect(link).toHaveTextContent('IframePromotingHolidays.Buttons.ViewHoliday');
        expect(link).toHaveAttribute('href', '/hotel-url');
    });

    it('should render luxury holiday text when isLuxuryPackage is true', () => {
        mockProps.isLuxuryPackage = true;
        render(<HolidayCardCTA {...mockProps} />);

        const link = screen.getByTestId('view-holiday-btn');
        expect(link).toHaveTextContent('IframePromotingHolidays.Buttons.ViewLuxuryHoliday');
    });

    it('should render city break text when isCityBreak is true', () => {
        mockProps.isCityBreak = true;
        render(<HolidayCardCTA {...mockProps} />);

        const link = screen.getByTestId('view-holiday-btn');
        expect(link).toHaveTextContent('IframePromotingHolidays.Buttons.ViewCityBreak');
    });
});
