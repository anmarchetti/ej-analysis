import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { RouteDirection } from 'models/enum/RouteDirection';
import { mockSummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/mocks';

import SummaryHotelDetails from './SummaryHotelDetails';

const createStores = () =>
    createMockStores({
        layoutStore: {
            getPhrase: jest.fn((key: string) => key),
        },
        bookingStore: {
            selectedOffer: {
                hotel: {
                    name: 'Hotel Cool Breeze',
                    country: { name: 'Spain' },
                    location: { name: 'Catalonia' },
                    resort: { name: 'Costa Brava' },
                    images: [
                        {
                            description: '',
                            large: 'https://example.com/large1.jpg',
                            medium: 'https://example.com/medium1.jpg',
                            small: 'https://example.com/small1.jpg',
                        },
                    ],
                },
                transport: {
                    routes: [
                        { direction: RouteDirection.Outbound, depDate: new Date('2025-08-01T10:00:00Z') },
                        { direction: RouteDirection.Inbound, depDate: new Date('2025-08-06T18:00:00Z') },
                    ],
                },
                accom: {
                    unit: [
                        { occupation: { adults: 2, children: 1, infants: 1 } },
                        { occupation: { adults: 1, children: 0, infants: 0 } },
                    ],
                },
                stay: 5,
            },
        },
    });

let mockStores;
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    OfferCardSlider: () => <div data-tid='slider' />,
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn((date: Date) => `formatted-${date.toISOString()}`),
}));

jest.mock('frontend/utils/accommodation.utils', () => ({
    getDurationLabel: jest.fn((getPhrase: any, stay: number) => `${stay} nights`),
}));

jest.mock('frontend/utils/guestsValidation', () => ({
    getNumberOfGuestsByCategory: jest.fn(
        (_getPhrase: any, adults: number, children: number, infants: number) =>
            `${adults} adults, ${children} children, ${infants} infants`,
    ),
}));

describe('<SummaryHotelDetails />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render hotel title with country, location, and resort', () => {
        render(<SummaryHotelDetails {...mockSummaryBarSitecoreFields} />);
        expect(screen.getByTestId('hotel-details-location')).toHaveTextContent('Spain, Catalonia, Costa Brava');
    });

    it('should render hotel name', () => {
        render(<SummaryHotelDetails {...mockSummaryBarSitecoreFields} />);
        expect(screen.getByText('Hotel Cool Breeze')).toBeInTheDocument();
    });

    it('should render formatted dates', () => {
        render(<SummaryHotelDetails {...mockSummaryBarSitecoreFields} />);
        expect(screen.getByTestId('hotel-details-dates')).toHaveTextContent(
            'formatted-2025-08-01T10:00:00.000Z - formatted-2025-08-06T18:00:00.000Z',
        );
    });

    it('should render duration and guests', () => {
        render(<SummaryHotelDetails {...mockSummaryBarSitecoreFields} />);
        expect(screen.getByTestId('hotel-details-duration-guest')).toHaveTextContent(
            '5 nights • 3 adults, 1 children, 1 infants',
        );
    });

    it('should NOT render refundable label when ShowRefundableLabel is false', () => {
        render(<SummaryHotelDetails {...mockSummaryBarSitecoreFields} ShowRefundableLabel={{ value: false }} />);

        expect(screen.queryByTestId('hotel-details-refundable')).not.toBeInTheDocument();
    });

    it('should NOT render refundable label when ShowRefundableLabel is true and unit is undefined', () => {
        render(<SummaryHotelDetails {...mockSummaryBarSitecoreFields} ShowRefundableLabel={{ value: true }} />);

        expect(screen.queryByTestId('hotel-details-refundable')).not.toBeInTheDocument();
    });

    it('should render non-refundable label when ShowRefundableLabel is true and unit is NOT refundable', () => {
        mockStores.bookingStore.selectedOffer.accom.unit[0].isRefundable = false;

        render(<SummaryHotelDetails {...mockSummaryBarSitecoreFields} ShowRefundableLabel={{ value: true }} />);

        expect(screen.getByTestId('hotel-details-refundable')).toHaveTextContent('NonRefundableLabel');
    });

    it('should render refundable label when ShowRefundableLabel is true and unit is refundable', () => {
        mockStores.bookingStore.selectedOffer.accom.unit[0].isRefundable = true;

        render(<SummaryHotelDetails {...mockSummaryBarSitecoreFields} ShowRefundableLabel={{ value: true }} />);

        expect(screen.getByTestId('hotel-details-refundable')).toHaveTextContent('RefundableLabel');
    });
});
