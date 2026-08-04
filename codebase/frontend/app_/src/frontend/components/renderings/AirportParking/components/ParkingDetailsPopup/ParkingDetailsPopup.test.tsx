import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ParkingDetailsPopup from './ParkingDetailsPopup';

const mockFullScreenPopup = jest.fn();
jest.mock('frontend/components/common/FullScreenPopup/FullScreenPopup', () => ({
    __esModule: true,
    default: ({ navigationActionBlock, popupBarContent, children, onClose, ...props }) => {
        mockFullScreenPopup(props);

        return (
            <div data-tid='full-screen-popup'>
                {navigationActionBlock}
                {popupBarContent}
                {children}
                <button data-tid='close-popup' onClick={onClose} />
            </div>
        );
    },
}));

const mockParkingCard = jest.fn();
jest.mock('frontend/components/renderings/AirportParking/components/ParkingCard/ParkingCard', () => ({
    __esModule: true,
    default: airportParking => {
        mockParkingCard(airportParking);

        return <div data-tid='parking-card' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const props = {
    ParkingCardTransfersText: mockSitecoreField('Transfers'),
    BackToExtrasButtonText: mockSitecoreField('Back to Extras'),
    onClose: jest.fn(),
    SkipParkingButtonText: mockSitecoreField('Skip Parking'),
    title: 'Parking List',
    promoBanner: <div data-tid='promo-banner' />,
    ParkingDetailsViewBackButtonText: mockSitecoreField('Back to details'),
    ParkingDetailsViewBackButtonTextMobile: mockSitecoreField('Back to mobile'),
};

const createLocalStore = () => ({});

jest.mock('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/AirportParking/stores/airportParkingLocalStore'),
    useAirportParkingLocalStore: () => mockUseAirportParkingLocalStore,
}));

let mockStores;
let mockUseAirportParkingLocalStore;

describe('ParkingDetailsPopup', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            airportParkingStore: {
                toggleIsParkingDetailsPopupOpened: jest.fn(),
                selectedAirportParkingDetails: {
                    title: `Parking Title`,
                    address: '123 Main St., Luton 123EAB',
                    bookingDetails: {
                        totalPrice: 25,
                        endDate: '',
                        endTime: '',
                        extRefId: '',
                        productCode: '',
                        promotionCode: '',
                        startDate: '',
                        startTime: '',
                        type: '',
                        keyData: '',
                    },
                    description: 'Sell point',
                    transferTip: 'Transfer tip',
                    brandImage: '/image.jpg',
                    isMeetAndGreet: false,
                    isParkAndRide: false,
                    isParkAndStroll: false,
                },
            },
            layoutStore: {
                getSetting: jest.fn().mockReturnValue(6),
            },
        });
        mockUseAirportParkingLocalStore = createLocalStore();
    });

    it('should render null when selectedAirportParkingDetails is not defined', () => {
        mockStores = createMockStores({
            airportParkingStore: {
                selectedAirportParkingDetails: undefined,
            },
        });

        const { container } = render(<ParkingDetailsPopup {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should toggle pop up with close button is pressed', async () => {
        render(<ParkingDetailsPopup {...props} />);
        const closePopUpButton = screen.getByTestId('close-popup');
        closePopUpButton.click();

        expect(mockStores.airportParkingStore.toggleIsParkingDetailsPopupOpened).toHaveBeenCalled();
    });
});
