import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import PriceChangeBanner, { IPriceChangeBanner } from './PriceChangeBanner';

const createProps = (): IPriceChangeBanner => ({
    ReservationNotificationDescription: mockSitecoreField('Description'),
    ReservationNotificationTitle: mockSitecoreField('Title'),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isHotelDetailsBookPage: true,
        },
        marketStore: {
            formatMoney: jest.fn(),
        },
        seatMapStore: {
            isSeatMapFlowEnabled: true,
            haveSelectedSeats: true,
            selectedSeatsPrice: 20,
        },
        bookingStore: {
            extraLuggage: {
                extraLuggagePriceTotal: 30,
            },
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockInfoBlockComponent = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockInfoBlockComponent(props);

        return <div data-tid='info-message' />;
    },
}));

describe('<PriceChangeBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if isHotelDetailsBookPage is false', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = false;

        const { container } = render(<PriceChangeBanner {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if totalReservationPrice is 0', () => {
        mockStores.bookingStore.extraLuggage.extraLuggagePriceTotal = 0;
        mockStores.seatMapStore.selectedSeatsPrice = 0;

        const { container } = render(<PriceChangeBanner {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if sitecore fields are emtpy', () => {
        mockProps.ReservationNotificationDescription = undefined;
        mockProps.ReservationNotificationTitle = undefined;

        const { container } = render(<PriceChangeBanner {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if isLuxuryPackage is true', () => {
        mockStores.bookingStore.isLuxuryPackage = true;

        const { container } = render(<PriceChangeBanner {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should render default', () => {
        const { getByTestId } = render(<PriceChangeBanner {...mockProps} />);

        expect(getByTestId('info-message')).toBeInTheDocument();
        expect(mockInfoBlockComponent).toBeCalledWith({
            title: mockProps.ReservationNotificationTitle,
            text: mockProps.ReservationNotificationDescription,
            className: 'seats-reservation-notification container',
        });
    });
});
