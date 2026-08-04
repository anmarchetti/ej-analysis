import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/mocks';

import SummaryDetails, { ISummaryDetailsProps } from './SummaryDetails';

const createProps = (): ISummaryDetailsProps => ({
    ...mockSummaryBarSitecoreFields,
    onEditClick: jest.fn(),
});

let mockProps;

jest.mock('frontend/components/renderings/SummaryBar/SummaryHotelImagesCarousel/SummaryHotelImagesCarousel', () => ({
    __esModule: true,
    default: () => <div data-tid='summary-hotel-images-carousel' />,
}));

jest.mock('frontend/components/renderings/SummaryBar/SummaryHotelDetails/SummaryHotelDetails', () => ({
    __esModule: true,
    default: () => <div data-tid='summary-hotel-details' />,
}));

jest.mock('frontend/components/renderings/SummaryBar/SummaryFlightDetails/SummaryFlightDetails', () => ({
    __esModule: true,
    default: () => <div data-tid='summary-flight-details' />,
}));

jest.mock('frontend/components/renderings/SummaryBar/SummaryRoomAndBoardDetails/SummaryRoomAndBoardDetails', () => ({
    __esModule: true,
    default: () => <div data-tid='summary-room-and-board-details' />,
}));

jest.mock(
    'frontend/components/renderings/SummaryBar/SummaryTransferAndParkingDetails/SummaryTransferAndParkingDetails',
    () => ({
        __esModule: true,
        default: () => <div data-tid='summary-transfer-and-parking-details' />,
    }),
);

jest.mock('frontend/components/renderings/SummaryBar/SummaryPriceDetails/SummaryPriceDetails', () => ({
    __esModule: true,
    default: () => <div data-tid='summary-price-details' />,
}));

describe('<SummaryDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<SummaryDetails {...mockProps} />);

        expect(screen.getByTestId('summary-hotel-images-carousel')).toBeInTheDocument();
        expect(screen.getByTestId('summary-hotel-details')).toBeInTheDocument();
        expect(screen.getByTestId('summary-flight-details')).toBeInTheDocument();
        expect(screen.getByTestId('summary-room-and-board-details')).toBeInTheDocument();
        expect(screen.getByTestId('summary-transfer-and-parking-details')).toBeInTheDocument();
        expect(screen.getByTestId('summary-price-details')).toBeInTheDocument();
    });
});
