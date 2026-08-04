import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { useDatesLabel, useNightsLabel } from 'frontend/hooks/viewBooking.hooks';
import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { getHotelMeta } from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils';

import ManageHolidayPopup, { IManageHolidayPopup } from './ManageHolidayPopup';

expect.extend(toHaveNoViolations);

let mockProps: IManageHolidayPopup;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/viewBooking.hooks', () => ({
    __esModule: true,
    useNightsLabel: jest.fn(() => 'useNightsLabel'),
    useDatesLabel: jest.fn(() => ['startDateLabel', 'endDateLabel']),
}));

jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils', () => ({
    __esModule: true,
    getHotelMeta: jest.fn(() => ({
        hotelImages: ['hotelImage'],
        hotelName: 'hotelName',
    })),
}));

const mockOfferCardProps = jest.fn();
jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    OfferCardSlider: props => {
        mockOfferCardProps(props);

        return <div data-tid='offer-card' />;
    },
}));

const mockHotelRating = jest.fn();
jest.mock('frontend/components/common/Hotel/HotelRating/HotelRating', () => ({
    __esModule: true,
    default: props => {
        mockHotelRating(props);

        return <div data-tid='hotel-rating' />;
    },
}));

const mockAmendHotelEntryProps = jest.fn();
jest.mock('frontend/components/renderings/AmendHotel/components/AmendHotelEntry/AmendHotelEntry', () => ({
    __esModule: true,
    default: props => {
        mockAmendHotelEntryProps(props);

        return <div data-tid='amend-hotel-entry' />;
    },
}));

const mockAmendDatesEntryProps = jest.fn();
jest.mock('frontend/components/renderings/AmendDates/components/AmendDatesEntry/AmendDatesEntry', () => ({
    __esModule: true,
    default: props => {
        mockAmendDatesEntryProps(props);

        return <div data-tid='amend-dates-entry' />;
    },
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupProps(props);

        return (
            <button data-tid={props.id} onClick={props.onClose} aria-label='popup'>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/utils/getHotelLocation', () => ({
    __esModule: true,
    getHotelLocation: jest.fn(() => 'getHotelLocation'),
}));

describe('<ManageHolidayPopup />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: {
                isAmendCTAVisible: true,
            },
        });
        mockProps = {
            booking: mockBooking,
            onAmendDatesClick: jest.fn(),
            onAmendHotelClick: jest.fn(),
            onClose: jest.fn(),
            amendDatesLabel: 'amendDatesLabel',
            amendHotelLabel: 'amendHotelLabel',
        };
    });

    it('Should render component', () => {
        render(<ManageHolidayPopup {...mockProps} />);

        expect(screen.getByTestId('manage-holiday-popup-title')).toHaveTextContent('hotelName');
        expect(screen.getByTestId('manage-holiday-popup-location')).toHaveTextContent('getHotelLocation');
        expect(screen.getByTestId('manage-holiday-popup')).toBeInTheDocument();
        expect(mockPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                onClose: mockProps.onClose,
                showCloseButton: true,
                containerClass: 'popup',
                id: 'manage-holiday-popup',
            }),
        );

        expect(screen.getByTestId('offer-card')).toBeInTheDocument();
        expect(mockOfferCardProps).toHaveBeenCalledWith(
            expect.objectContaining({
                images: ['hotelImage'],
                fallbackImage: 'HotelFallbackImage',
                className: 'gallery',
                showIndex: true,
            }),
        );

        expect(screen.getByTestId('hotel-rating')).toBeInTheDocument();
        expect(mockHotelRating).toHaveBeenCalledWith(
            expect.objectContaining({
                booking: mockProps.booking,
            }),
        );

        expect(screen.getByTestId('amend-hotel-entry')).toBeInTheDocument();
        expect(mockAmendHotelEntryProps).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'amendHotelLabel', onClick: mockProps.onAmendHotelClick }),
        );

        expect(screen.getByTestId('dates-label')).toHaveAttribute('data-cs-mask');
        expect(screen.getByTestId('amend-dates-entry')).toBeInTheDocument();
        expect(mockAmendDatesEntryProps).toHaveBeenCalledWith(
            expect.objectContaining({ onClick: mockProps.onAmendDatesClick, label: 'amendDatesLabel' }),
        );

        expect(useDatesLabel).toHaveBeenCalledWith(mockProps.booking, false, mockStores.layoutStore.getPhrase, {
            holiday: { start: 'ddd DD MMM', end: 'ddd DD MMM YY' },
        });
        expect(useNightsLabel).toHaveBeenCalledWith(
            mockProps.booking.package.accom.startDate,
            mockProps.booking.package.accom.endDate,
            mockStores.layoutStore.getPhrase,
        );
        expect(getHotelMeta).toHaveBeenCalledWith(mockProps.booking);
        expect(getHotelLocation).toHaveBeenCalledWith(mockProps.booking.hotel);

        expect(screen.getByText('hotelName')).toBeInTheDocument();
        expect(screen.getByText('getHotelLocation')).toBeInTheDocument();
        expect(screen.getByText('startDateLabel - endDateLabel, useNightsLabel')).toBeInTheDocument();
    });

    it('Should NOT render amend dates CTA when isAmendDatesCTAVisible is false', () => {
        mockStores.amendDatesStore.isAmendCTAVisible = false;
        render(<ManageHolidayPopup {...mockProps} />);

        expect(screen.queryByTestId('dates-label')).toBeInTheDocument();
        expect(screen.queryByTestId('amend-dates-entry')).not.toBeInTheDocument();
    });

    it("Should NOT render hotel location when no booking's hotel", () => {
        mockProps.booking.hotel = undefined;
        render(<ManageHolidayPopup {...mockProps} />);

        expect(screen.queryByText('getHotelLocation')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ManageHolidayPopup {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
