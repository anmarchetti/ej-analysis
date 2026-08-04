import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockAmendHotelOffer, mockHotel, mockTransfer } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendHotelDetails from './AmendHotelDetails';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDatesDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/DatesDetails/DatesDetails', () => ({
    __esModule: true,
    default: props => {
        mockDatesDetailsProps(props);

        return <div data-tid='dates-details' />;
    },
}));

const mockLuggageDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/LuggageDetails/LuggageDetails', () => ({
    __esModule: true,
    default: props => {
        mockLuggageDetailsProps(props);

        return <div data-tid='luggage-details' />;
    },
}));

const mockHolidaySummaryTransfersProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryTransfer/HolidaySummaryTransfer', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryTransfersProps(props);

        return <div data-tid='holiday-summary-transfer' />;
    },
}));

const mockHolidaySummaryRoomAndBoardProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryRoomAndBoard/HolidaySummaryRoomAndBoard', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryRoomAndBoardProps(props);

        return <div data-tid='holiday-summary-room-and-board'>{props.children}</div>;
    },
}));

const mockHolidaySummaryPlainOptionsProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryPlainOptions/HolidaySummaryPlainOptions', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryPlainOptionsProps(props);

        return <div data-tid='holiday-summary-plain-options' />;
    },
}));

let mockGetHotelChangeInfoResult;
jest.mock('frontend/components/renderings/AmendHotel/AmendHotel.utils', () => ({
    __esModule: true,
    getHotelChangeInfo: jest.fn().mockImplementation(() => mockGetHotelChangeInfoResult),
}));

const createMockProps = () => ({
    fields: {
        LuggageTitle: mockSitecoreField('Your luggage'),
    },
});

let mockStores;
let mockProps;

describe('<AmendHotelDetails />', () => {
    beforeEach(() => {
        mockGetHotelChangeInfoResult = {
            transfer: mockTransfer,
            startDate: '2029-06-19',
            endDate: '2029-07-19',
            roomType: 'Double Room',
            boardType: 'All Inclusive',
            hotel: mockHotel,
            location: { city: 'Barcelona', country: 'Spain', region: 'package-region' },
            hasSelectedNewHotel: false,
        };
        mockStores = createMockStores({
            amendHotelStore: {
                newlySelectedHotelOffer: mockAmendHotelOffer,
            },
        });
        mockProps = createMockProps();
    });

    it('should render', () => {
        render(<AmendHotelDetails {...mockProps} />);

        expect(screen.getByTestId('amend-payment-hotel-details')).toBeInTheDocument();

        expect(screen.getByTestId('holiday-summary-room-and-board')).toBeInTheDocument();
        expect(mockHolidaySummaryRoomAndBoardProps).toHaveBeenCalledWith({
            units: mockStores.amendHotelStore.newlySelectedHotelOffer.accom.unit,
            hotel: {
                resort: {
                    name: 'Resort Example',
                    region: 'United States',
                },
                name: mockHotel.name,
            },
            dataTid: 'amend-payment-hotel-room-and-board',
            accom: mockStores.viewBookingStore.booking.package.accom,
            children: expect.anything(),
        });

        expect(screen.getByTestId('dates-details')).toBeInTheDocument();
        expect(mockDatesDetailsProps).toHaveBeenCalledWith({
            startDate: mockGetHotelChangeInfoResult.startDate,
            endDate: mockGetHotelChangeInfoResult.endDate,
            className: 'datesDetails',
            dataTid: 'amend-payment-hotel-dates',
        });

        expect(screen.getByTestId('luggage-details')).toBeInTheDocument();
        expect(mockLuggageDetailsProps).toHaveBeenCalledWith({
            dataTid: 'amend-payment-hotel-luggage',
            booking: mockStores.viewBookingStore.booking,
            titleField: mockProps.fields.LuggageTitle,
            className: 'luggageDetails',
        });

        expect(screen.getByTestId('holiday-summary-transfer')).toBeInTheDocument();
        expect(mockHolidaySummaryTransfersProps).toHaveBeenCalledWith({
            transfer: mockGetHotelChangeInfoResult.transfer,
            dataTid: 'amend-payment-hotel-transfer',
        });

        expect(screen.getByTestId('holiday-summary-plain-options')).toBeInTheDocument();
        expect(mockHolidaySummaryPlainOptionsProps).toHaveBeenCalledWith({
            guestsCount: { ADULT: 2, CHILD: 0, INFANT: 0 },
            dataTid: 'amend-payment-hotel-guests',
        });
    });

    it('should pass hotel name as empty string if hotel is not available', () => {
        mockGetHotelChangeInfoResult.hotel = null as any;

        render(<AmendHotelDetails {...mockProps} />);

        expect(screen.getByTestId('holiday-summary-room-and-board')).toBeInTheDocument();
        expect(mockHolidaySummaryRoomAndBoardProps).toHaveBeenCalledWith({
            units: mockStores.amendHotelStore.newlySelectedHotelOffer.accom.unit,
            hotel: {
                resort: {
                    name: '',
                    region: '',
                },
                name: '',
            },
            accom: mockStores.viewBookingStore.booking.package.accom,
            dataTid: 'amend-payment-hotel-room-and-board',
            children: expect.any(Object),
        });
    });

    it('should not render if no booking', () => {
        mockStores.viewBookingStore.booking = null;

        render(<AmendHotelDetails {...mockProps} />);

        expect(screen.queryByTestId('amend-payment-hotel-details')).not.toBeInTheDocument();
    });

    it('should not render if no offer', () => {
        mockStores.amendHotelStore.newlySelectedHotelOffer = null;

        render(<AmendHotelDetails {...mockProps} />);

        expect(screen.queryByTestId('amend-payment-hotel-details')).not.toBeInTheDocument();
    });
});
