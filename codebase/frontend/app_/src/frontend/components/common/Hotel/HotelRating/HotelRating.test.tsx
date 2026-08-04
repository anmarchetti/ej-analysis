import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';

import HotelRating, { IHotelRating } from './HotelRating';

expect.extend(toHaveNoViolations);

let mockProps: IHotelRating;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockStarRatingProps = jest.fn();
jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: props => {
        mockStarRatingProps(props);

        return <div data-tid='star-rating' />;
    },
}));

const mockTARating = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: props => {
        mockTARating(props);

        return <div data-tid='ta-rating' />;
    },
}));

const mockEcoPill = jest.fn();
jest.mock('frontend/components/common/EcoCertifiedPill', () => ({
    __esModule: true,
    default: props => {
        mockEcoPill(props);

        return <div data-tid='eco-pill' />;
    },
}));

describe('<HotelRating />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage: true,
            },
        });
        mockProps = {
            booking: mockBooking,
        };
    });

    it('Should render component', () => {
        render(<HotelRating {...mockProps} />);

        expect(screen.getByTestId('hotel-rating')).toBeInTheDocument();
        expect(screen.getByTestId('eco-pill')).toBeInTheDocument();
        expect(mockEcoPill).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Eco Facility',
                tooltip: 'This hotel has eco-friendly facilities.',
            }),
        );
        expect(screen.getByTestId('ta-rating')).toBeInTheDocument();
        expect(mockTARating).toHaveBeenCalledWith(
            expect.objectContaining({
                rating: 4.5,
                reviews: 6769,
            }),
        );
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(mockStarRatingProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rating: 5,
            }),
        );
    });

    describe('TripadvisorInfo', () => {
        it('Should NOT render TripadvisorInfo when hotel rating is 0', () => {
            mockProps.booking.package.accom.hotel.rating = 0;
            render(<HotelRating {...mockProps} />);

            expect(screen.queryByTestId('ta-rating')).not.toBeInTheDocument();
        });

        it('Should NOT render TripadvisorInfo when hotel has 0 numberOfReviews', () => {
            mockProps.booking.package.accom.hotel.numberOfReviews = 0;
            render(<HotelRating {...mockProps} />);

            expect(screen.queryByTestId('ta-rating')).not.toBeInTheDocument();
        });
    });

    describe('Eco facility', () => {
        it('Should NOT render eco-pill when hotel has no ecoFacility name', () => {
            mockProps.booking.hotel!.ecoFacility.name = '';
            render(<HotelRating {...mockProps} />);

            expect(screen.queryByTestId('eco-pill')).not.toBeInTheDocument();
        });

        it('Should NOT render eco-pill when hotel has no ecoFacility tooltip', () => {
            mockProps.booking.hotel!.ecoFacility.tooltip = '';
            render(<HotelRating {...mockProps} />);

            expect(screen.queryByTestId('eco-pill')).not.toBeInTheDocument();
        });

        it('Should NOT render eco-pill when isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage is false', () => {
            mockStores.layoutStore.isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage = false;
            render(<HotelRating {...mockProps} />);

            expect(screen.queryByTestId('eco-pill')).not.toBeInTheDocument();
        });

        it('Should NOT render eco-pill when no hotel', () => {
            mockProps.booking.hotel = undefined;
            render(<HotelRating {...mockProps} />);

            expect(screen.queryByTestId('eco-pill')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HotelRating {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
