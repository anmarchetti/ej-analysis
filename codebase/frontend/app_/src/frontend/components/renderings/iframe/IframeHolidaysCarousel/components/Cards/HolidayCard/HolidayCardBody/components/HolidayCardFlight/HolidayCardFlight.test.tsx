import React from 'react';
import { render, screen } from '@testing-library/react';

import { IRoute } from 'models/data/IRoute';
import { mockIframeOffer } from 'frontend/components/renderings/iframe/IframeHolidaysCarousel/__mocks__/iframe.mocks';

import HolidayCardFlight from './HolidayCardFlight';

describe('HolidayCardFlight', () => {
    const mockRoutes: IRoute[] = mockIframeOffer.transport?.routes;

    it('should render outbound flight details correctly', () => {
        render(<HolidayCardFlight route={mockRoutes[0]} />);

        expect(screen.getByTestId('departure-airport')).toHaveTextContent('London Gatwick');
        expect(screen.getByTestId('departure-date')).toHaveTextContent('Sun 6th Aug 16:45');
        expect(screen.getByLabelText('departure-icon')).toBeInTheDocument();
    });

    it('should render inbound flight details correctly', () => {
        render(<HolidayCardFlight route={mockRoutes[1]} />);

        expect(screen.getByTestId('arrival-airport')).toHaveTextContent('Barcelona');
        expect(screen.getByTestId('arrival-date')).toHaveTextContent('Sun 13th Aug 07:40');
        expect(screen.getByLabelText('departure-icon')).toHaveClass('icon--reflect-x');
    });

    it('should return null if route is undefined', () => {
        const { container } = render(<HolidayCardFlight route={undefined} />);

        expect(container).toBeEmptyDOMElement();
    });
});
