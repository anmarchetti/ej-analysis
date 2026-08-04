import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { boardTypeMock, mockFlightsRoutes, mockHotel, mockTransfer } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketPopup } from './BasketPopup';

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: (phrase, token, replacer) => `${phrase} ${replacer}`,
    },
}));

const createMockProps = () => ({
    board: boardTypeMock,
    offer: {
        stay: 7,
        accom: {
            unit: [
                {
                    roomType: {
                        title: 'room title',
                    },
                },
            ],
        },
        hotel: mockHotel,
        transport: {
            routes: mockFlightsRoutes,
            errataFlightInfo: ['errataFlightInfo#1', 'errataFlightInfo#2'],
        },
    },
    onClosePopup: jest.fn(),
    className: 'className',
    isNextButtonVisible: true,
    isPricePPShown: true,
});

const createMockStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isErrataEnabled: true,
        isATOLProtectionEnabled: true,
    },
    seatMapStore: {
        haveOutboundSelectedSeats: false,
        haveInboundSelectedSeats: false,
    },
    flightsPassengersStore: {
        outBoundPassengers: [
            {
                seat: {
                    products: [
                        {
                            id: 'B0003',
                            name: 'LargeOverheadBag',
                            icon: {
                                value: {
                                    src: 'icon src',
                                },
                            },
                        },
                    ],
                },
            },
        ],
        inBoundPassengers: [
            {
                seat: {
                    products: [
                        {
                            id: 'B0001',
                            name: 'SmallUnderSeatBag',
                            icon: {
                                value: {
                                    src: 'icon src',
                                },
                            },
                        },
                    ],
                },
            },
        ],
    },
    bookingStore: {
        outboundFlight: {
            isExt: true,
            arrDate: '2019-08-22T14:00:00',
            depDate: '2019-08-22T11:30:00',
            arrName: 'outbound arr name',
            depName: 'outbound dep name',
        },
        inboundFlight: {
            isExt: true,
            arrDate: '2019-09-22T17:20:00',
            depDate: '2019-09-22T15:00:00',
            arrName: 'inbound arr name',
            depName: 'inbound dep name',
        },
        whoValueOnlyGuests: '1 adult, 1 child',
        totalGuestsQuantity: 2,
        transfer: mockTransfer,
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

describe('BasketPopup', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockProps = createMockProps();
        mockStores = createMockStores();
    });

    it('should call close popup prop after click on close popup button', () => {
        const { getByTestId } = render(<BasketPopup {...mockProps} />);
        const closePopupButton = getByTestId('close-basket-popup-button');
        fireEvent.click(closePopupButton);

        expect(mockProps.onClosePopup).toBeCalled();
    });

    it('should render hotel data', () => {
        const { getByText } = render(<BasketPopup {...mockProps} />);

        expect(getByText(mockHotel.name as string)).not.toBeNull();
        expect(getByText(`${mockHotel.resort.name}, ${mockHotel.country.name}`)).not.toBeNull();
        expect(getByText(`${SitecoreDictionary.GlobalsLabelsNightsStayPlural} ${mockProps.offer.stay}`)).not.toBeNull();
    });

    it('should render board title', () => {
        const { getByText } = render(<BasketPopup {...mockProps} />);

        expect(getByText(boardTypeMock.title)).not.toBeNull();
    });

    it('should staked and unic rooms', () => {
        mockProps.offer.accom.unit = [
            {
                roomType: {
                    title: 'room title 1',
                },
            },
            {
                roomType: {
                    title: 'room title 1',
                },
            },
            {
                roomType: {
                    title: 'room title 2',
                },
            },
        ];
        const { getByText } = render(<BasketPopup {...mockProps} />);

        expect(getByText('2 x room title 1')).not.toBeNull();
        expect(getByText('room title 2')).not.toBeNull();
    });

    it('should render who value', () => {
        const { getByText } = render(<BasketPopup {...mockProps} />);

        expect(getByText('1 adult, 1 child')).not.toBeNull();
    });

    it('should not show error message if errata disabled', () => {
        mockStores.layoutStore.isErrataEnabled = false;
        const { queryByTestId } = render(<BasketPopup {...mockProps} />);

        expect(queryByTestId('flight-errata')).toBeNull();
    });

    it('should not show error message if there are no error messages', () => {
        mockProps.offer.transport.errataFlightInfo = [];
        const { queryByTestId } = render(<BasketPopup {...mockProps} />);

        expect(queryByTestId('flight-errata')).toBeNull();
    });

    it('should show plural total guests label and seat label if more then 1 guest', () => {
        const { getByText } = render(<BasketPopup {...mockProps} />);

        expect(getByText(`2 x ${SitecoreDictionary.PaymentLabelsLUG23HoldBagsPlural}`)).not.toBeNull();
        expect(getByText(`2 x ${SitecoreDictionary.StandardSeatsIncluded}`)).not.toBeNull();
    });

    it('should show single total guests label and seat label if one guest', () => {
        mockStores.bookingStore.totalGuestsQuantity = 1;
        const { getByText } = render(<BasketPopup {...mockProps} />);

        expect(getByText(`1 x ${SitecoreDictionary.PaymentLabelsLUG23HoldBagSingular}`)).not.toBeNull();
        expect(getByText(`1 x ${SitecoreDictionary.StandardSeatIncluded}`)).not.toBeNull();
    });

    it('should show ATOL protection label', () => {
        const { getByText } = render(<BasketPopup {...mockProps} />);

        expect(getByText(SitecoreDictionary.HotelDetailsLabelsAtolProtected)).not.toBeNull();
    });

    it('should not show ATOL protection label when ATOL is disabled on sitecore', () => {
        mockStores.layoutStore.isATOLProtectionEnabled = false;
        const { queryByText } = render(<BasketPopup {...mockProps} />);

        expect(queryByText(SitecoreDictionary.HotelDetailsLabelsAtolProtected)).not.toBeInTheDocument();
    });
});
