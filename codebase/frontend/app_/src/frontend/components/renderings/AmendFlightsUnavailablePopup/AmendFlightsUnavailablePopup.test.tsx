import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendDatesOffer, mockBooking, mockUnavailablePopupFields } from 'frontend/__mocks__';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import AmendFlightsUnavailablePopup from './AmendFlightsUnavailablePopup';

let mockProps: ISitecoreComponent<IUnavailablePopupFields>;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUnavailablePopupProps = jest.fn();
jest.mock('frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup', () => ({
    __esModule: true,
    default: ({ onClose, ...props }) => {
        mockUnavailablePopupProps(props);

        return <div data-tid='unavailable-popup' onClick={onClose} />;
    },
}));

const mockedBookingData = jest.fn().mockImplementation(() => ({
    arrAirportName: 'Lanzarote',
    bookingStartDate: '2029-06-19',
    depAirportName: 'London Gatwick',
}));
jest.mock('./AmendFlightsUnavailablePopup.utils', () => ({
    __esModule: true,
    getBookingData: (...params) => mockedBookingData(...params),
}));

describe('<AmendFlightsUnavailablePopup />', () => {
    beforeEach(() => {
        mockProps = {
            fields: mockUnavailablePopupFields,
            params: {},
            rendering: 'rendering',
        };
        mockProps.fields!.Title.value = 'Title {airport}';
        mockProps.fields!.Description!.value = 'Description {date} {airport}';

        mockStores = createMockStores({
            amendFlightsStore: {
                isNoAvailableFlightsPopupShown: true,
                toggleNoAvailableFlightsPopup: jest.fn(),
                isFromChangeDate: false,
            },
            viewBookingStore: {
                booking: mockBooking,
            },
            amendDatesStore: {
                offer: mockAmendDatesOffer,
            },
        });
    });

    it('should NOT be rendered if no fields', () => {
        mockProps.fields = undefined;
        render(<AmendFlightsUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should NOT be rendered if no booking', () => {
        mockStores.viewBookingStore.booking = undefined;
        render(<AmendFlightsUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should NOT be rendered if no isNoAvailableFlightsPopupShown', () => {
        mockStores.amendFlightsStore.isNoAvailableFlightsPopupShown = false;
        render(<AmendFlightsUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should call onClose functions', async () => {
        render(<AmendFlightsUnavailablePopup {...mockProps} />);

        const popup = screen.getByTestId('unavailable-popup');
        await userEvent.click(popup);

        expect(mockStores.amendFlightsStore.toggleNoAvailableFlightsPopup).toHaveBeenCalledWith(false);
    });
});
