import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores as createDefaultMockStores, mockOutboundFlight, mockSelectedSeat } from 'frontend/__mocks__';
import { SeatType } from 'models/enum/SeatType';
import { IFastTrackInfoFields } from 'frontend/components/common/Booking/FastTrackInfo/FastTrackInfo';

import HolidaySummaryFlightsItem, { IHolidaySummaryFlightsItemProps } from './HolidaySummaryFlightsItem';

const mockFastTrackInfoFields: IFastTrackInfoFields = {
    FastTrackLabel: { value: 'Fast Track' },
    FastTrackLogo: { value: { src: '/logo.svg', alt: 'logo' } },
};

const createProps = (): IHolidaySummaryFlightsItemProps => ({
    chosenSeats: mockSelectedSeat.seats as any,
    guestsAmountByType: { adults: 1, children: 0, infants: 0 },
    flight: mockOutboundFlight,
    dataTid: 'tid',
    cabinBagsInfoFields: {},
    showSpeedyBoardingTooltip: false,
});

const createMockStores = () =>
    createDefaultMockStores({
        viewBookingStore: {
            extraLuggage: {
                LCBCount: 0,
            },
        },
        amendDatesStore: {
            extraLuggage: {
                LCBCount: 1,
            },
        },
    });

let mockProps: IHolidaySummaryFlightsItemProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSeatSelectionProps = jest.fn();
jest.mock('frontend/components/renderings/SeatAndBags/components/desktop/SeatSelectionDesktop', () => ({
    __esModule: true,
    default: props => {
        mockSeatSelectionProps(props);

        return <div data-tid='seat-selection' />;
    },
}));

const mockSeatBagProps = jest.fn();
jest.mock('frontend/components/renderings/SeatAndBags/components/SeatBag', () => ({
    __esModule: true,
    default: props => {
        mockSeatBagProps(props);

        return <div data-tid='seat-bag' />;
    },
}));

const mockCabinBagsInfoComponent = jest.fn();
jest.mock('frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo', () => ({
    __esModule: true,
    default: props => {
        mockCabinBagsInfoComponent(props);

        return <div data-tid='cabin-bags' />;
    },
}));

const mockFastTrackInfoComponent = jest.fn();
jest.mock('frontend/components/common/Booking/FastTrackInfo/FastTrackInfo', () => ({
    __esModule: true,
    default: props => {
        mockFastTrackInfoComponent(props);

        return <div data-tid='fast-track' />;
    },
}));

describe('<HolidaySummaryFlightsItem />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('should render flight and chosen seats', () => {
        render(<HolidaySummaryFlightsItem {...mockProps} />);

        expect(screen.getByTestId('tid-icon')).toBeInTheDocument();
        expect(screen.getByTestId('tid-route')).toHaveTextContent('London Gatwick - Lanzarote');
        expect(screen.getByTestId('tid-date')).toHaveTextContent('Thu 11th May 2023 - 12:10');
        expect(screen.queryByTestId('tid-no-seats')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('seat-selection').length).toBe(2);
        expect(mockSeatSelectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                text: SeatType.Standard,
                color: 'orange',
                seatNumber: '12A',
                price: '50.00',
                hasSecondaryStyle: undefined,
                isPricesHidden: true,
            }),
        );
        expect(mockSeatSelectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                text: SeatType.UpFront,
                color: 'blue',
                seatNumber: '15C',
                price: '20.00',
                hasSecondaryStyle: undefined,
                isPricesHidden: true,
            }),
        );

        expect(mockCabinBagsInfoComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.cabinBagsInfoFields,
                LCBCount: 0,
                guestsAmountByType: mockProps.guestsAmountByType,
                showSpeedyBoardingTooltip: mockProps.showSpeedyBoardingTooltip,
            }),
        );
    });

    it('should render flight and NO chosen seats', () => {
        mockProps.chosenSeats = undefined;
        render(<HolidaySummaryFlightsItem {...mockProps} />);

        expect(screen.getByText('London Gatwick - Lanzarote')).toBeInTheDocument();
        expect(screen.getByText('Thu 11th May 2023 - 12:10')).toBeInTheDocument();
        expect(screen.getByText('Globals.Labels.NoSeatSelected')).toBeInTheDocument();
        expect(screen.queryAllByTestId('seat-selection').length).toBe(0);
        expect(screen.queryByTestId('tid-seats')).not.toBeInTheDocument();
    });

    it('should pass offer`s LCBCount if it is the amendment page', () => {
        mockStores.layoutStore.isAmendPaymentPage = true;

        render(<HolidaySummaryFlightsItem {...mockProps} />);

        expect(mockCabinBagsInfoComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.cabinBagsInfoFields,
                LCBCount: 1,
                guestsAmountByType: mockProps.guestsAmountByType,
            }),
        );
    });

    describe('Fast Track for Lux', () => {
        it('should render FastTrackInfo when includesFastTrack is true and fields are provided', () => {
            mockProps.includesFastTrack = true;
            mockProps.fastTrackInfoFields = mockFastTrackInfoFields;

            render(<HolidaySummaryFlightsItem {...mockProps} />);

            expect(screen.getByTestId('fast-track')).toBeInTheDocument();
            expect(mockFastTrackInfoComponent).toHaveBeenCalledTimes(1);
            expect(mockFastTrackInfoComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockFastTrackInfoFields,
                    count: 0,
                }),
            );
        });

        it('should NOT render FastTrackInfo when includesFastTrack is false', () => {
            mockProps.includesFastTrack = false;
            mockProps.fastTrackInfoFields = mockFastTrackInfoFields;

            render(<HolidaySummaryFlightsItem {...mockProps} />);

            expect(screen.queryByTestId('fast-track')).not.toBeInTheDocument();
            expect(mockFastTrackInfoComponent).not.toHaveBeenCalled();
        });

        it('should NOT render FastTrackInfo when fastTrackInfoFields are not provided', () => {
            mockProps.includesFastTrack = true;
            mockProps.fastTrackInfoFields = undefined;

            render(<HolidaySummaryFlightsItem {...mockProps} />);

            expect(screen.queryByTestId('fast-track')).not.toBeInTheDocument();
            expect(mockFastTrackInfoComponent).not.toHaveBeenCalled();
        });
    });
});
