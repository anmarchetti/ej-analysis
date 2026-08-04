import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { SeatType } from 'models/enum/SeatType';
import { mockSummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/mocks';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';

import SummaryFlightDetails from './SummaryFlightDetails';

let mockContainsLuxuryPromoCode = false;
jest.mock('frontend/utils/offer.utils', () => ({
    containsLuxuryPromoCode: jest.fn(() => mockContainsLuxuryPromoCode),
}));

let mockUseLuxuryInternalFlight = false;
jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlight: jest.fn(() => mockUseLuxuryInternalFlight),
}));

const mockSummaryEditButton = jest.fn();
jest.mock('frontend/components/renderings/SummaryBar/SummaryEditButton/SummaryEditButton', () => ({
    __esModule: true,
    default: ({ dataTid, scrollAnchorId, onClick, isHidden }) => {
        mockSummaryEditButton(isHidden);

        return (
            <button data-tid={dataTid} data-scroll-anchor-id={scrollAnchorId} onClick={onClick}>
                Edit
            </button>
        );
    },
}));

const createProps = (): ISummaryBarSitecoreFields => ({
    ...mockSummaryBarSitecoreFields,
});

const createStores = (isMobile: boolean) =>
    createMockStores({
        appStore: {
            isScreenLessMedium: isMobile,
        },
        layoutStore: {
            getPhrase: jest.fn((key: string) => key),
        },
        bookingStore: {
            selectedOffer: {
                transport: {
                    routes: [
                        {
                            direction: 'outbound',
                            arrDate: '2019-09-16T14:20:00+00:00',
                            arrName: 'Palma Airport',
                            depDate: '2019-09-16T11:55:00+00:00',
                            depName: 'London Gatwick Airport',
                            isExt: true,
                        },
                        {
                            direction: 'inbound',
                            depDate: '2019-09-16T16:45:00+00:00',
                            depName: 'Palma Airport',
                            arrDate: '2019-09-16T19:20:00+00:00',
                            arrName: 'London Gatwick Airport',
                        },
                    ],
                },
                seatSelection: [
                    {
                        seats: [
                            { price: 20, priceBand: SeatType.UpFront },
                            { price: 20, priceBand: SeatType.UpFront },
                        ],
                    },
                    {
                        seats: [
                            { price: 20, priceBand: SeatType.Standard },
                            { price: 30, priceBand: SeatType.ExtraLegroom },
                        ],
                    },
                ],
                extraLuggageInfo: {
                    items: [
                        { quantity: 1, itemCode: '0', name: 'extra 15Kg hold bag', price: 20 },
                        { quantity: 1, itemCode: '0', name: 'extra 15Kg hold bag', price: 20 },
                        { quantity: 1, itemCode: '1', name: 'extra 23kg hold bag', price: 50 },
                        { quantity: 1, itemCode: '1', name: 'extra 23kg hold bag', price: 50 },
                        { quantity: 1, itemCode: '1', name: 'extra 23kg hold bag', price: 50 },
                        { quantity: 1, itemCode: '1', name: 'extra 23kg hold bag', price: 50 },
                    ],
                },
            } as IOfferWithoutAltBoards,
            extraLuggage: {
                canAddHoldLuggage: true,
                isLCBAddingUnavailable: false,
            },
        },
        guestDetailsStore: {
            infants: [{ value: 'infant 1' }],
        },
    });

let mockProps;
let mockStores;
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SummaryFlightDetails />', () => {
    beforeEach(() => {
        mockContainsLuxuryPromoCode = false;
        mockProps = createProps();
        mockSummaryEditButton.mockClear();
    });

    it.each([false, true])('should render the expected information', isMobile => {
        mockStores = createStores(isMobile);
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.queryByTestId('flight-details-title')).toHaveTextContent('FlightSectionTitle');
        expect(screen.queryByTestId('flight-details-outbound-direction')).toHaveTextContent(
            'SeatMap.Labels.Outbound: FlightSectionToDestination',
        );
        expect(screen.queryByTestId('flight-details-outbound-date')).toHaveTextContent(
            'Mon 16th Sep 2019 • 11:55 - 14:20',
        );
        expect(screen.queryByTestId('flight-details-inbound-direction')).toHaveTextContent(
            'SeatMap.Labels.Return: FlightSectionToDestination',
        );
        expect(screen.queryByTestId('flight-details-inbound-date')).toHaveTextContent(
            'Mon 16th Sep 2019 • 16:45 - 19:20',
        );

        // Flight items
        const outboundItems = screen.getByTestId('flight-details-outbound-items');
        expect(outboundItems.children).toHaveLength(1);
        expect(outboundItems.children[0].children[0]).toHaveTextContent('2 x FlightSectionSeatTypeUpFront');
        expect(outboundItems.children[0].children[1]).toHaveTextContent('£40');

        const inboundItems = screen.getByTestId('flight-details-inbound-items');
        expect(inboundItems.children).toHaveLength(2);
        expect(inboundItems.children[0].children[0]).toHaveTextContent('1 x FlightSectionSeatTypeStandard');
        expect(inboundItems.children[0].children[1]).toHaveTextContent('£20');
        expect(inboundItems.children[1].children[0]).toHaveTextContent('1 x FlightSectionSeatTypeExtraLegroom');
        expect(inboundItems.children[1].children[1]).toHaveTextContent('£30');

        // Cabin bags and luggage items
        const extras = screen.getByTestId('flight-details-extras');
        expect(extras.children).toHaveLength(3);
        expect(extras.children[0].children[0]).toHaveTextContent('1 x extra 15Kg hold bag');
        expect(extras.children[0].children[1]).toHaveTextContent('£40');
        expect(extras.children[1].children[0]).toHaveTextContent('2 x extra 23kg hold bag');
        expect(extras.children[1].children[1]).toHaveTextContent('£200');
        expect(extras.children[2].children[0]).toHaveTextContent(`1 x ${mockProps.FlightSectionExtrasPram.value}`);
        expect(extras.children[2].children[1]).toHaveTextContent('Included');
    });

    it('should correctly calculate the total amount for flight extras when the prices are different between routes', () => {
        createStores(false);
        mockStores.bookingStore.selectedOffer.extraLuggageInfo.items = [
            { quantity: 1, route: 1, itemCode: '1', name: 'extra 15Kg hold bag', price: 40 },
            { quantity: 1, route: 2, itemCode: '1', name: 'extra 15Kg hold bag', price: 35 },
            { quantity: 1, route: 1, itemCode: '2', name: 'LCB', price: 16 },
            { quantity: 1, route: 2, itemCode: '2', name: 'LCB', price: 16 },
        ];

        render(<SummaryFlightDetails {...mockProps} />);

        const extras = screen.getByTestId('flight-details-extras');
        expect(extras.children[0].children[0]).toHaveTextContent('1 x extra 15Kg hold bag');
        expect(extras.children[0].children[1]).toHaveTextContent('£75');
        expect(extras.children[1].children[0]).toHaveTextContent('1 x LCB');
        expect(extras.children[1].children[1]).toHaveTextContent('£32');
    });

    it.each([false, true])('should render empty string for title, direction and date if route is empty', isMobile => {
        createStores(isMobile);
        mockStores.bookingStore.selectedOffer.transport.routes = [];
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.queryByTestId('flight-category-title')).not.toBeInTheDocument();

        expect(screen.queryByTestId('flight-details-outbound-direction')).toHaveTextContent('');
        expect(screen.queryByTestId('flight-details-outbound-date')).toHaveTextContent('');

        expect(screen.queryByTestId('flight-details-inbound-direction')).toHaveTextContent('');
        expect(screen.queryByTestId('flight-details-inbound-date')).toHaveTextContent('');
    });

    it.each([false, true])('should NOT render flight items if there are none', isMobile => {
        mockStores = createStores(isMobile);
        mockStores.bookingStore.selectedOffer.seatSelection = [];
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.getByTestId('flight-details-inbound-items')).toBeEmptyDOMElement();
        expect(screen.getByTestId('flight-details-outbound-items')).toBeEmptyDOMElement();
    });

    it.each([false, true])('should NOT render flight items if there are none', isMobile => {
        mockStores = createStores(isMobile);
        mockStores.bookingStore.selectedOffer.seatSelection = [];
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.getByTestId('flight-details-inbound-items')).toBeEmptyDOMElement();
        expect(screen.getByTestId('flight-details-outbound-items')).toBeEmptyDOMElement();
    });

    it('should NOT render flight items for lux if the flight is internal', () => {
        mockContainsLuxuryPromoCode = true;
        mockProps = createProps();
        mockStores = createStores(false);
        mockStores.bookingStore.selectedOffer.extraLuggageInfo.items = [
            { quantity: 1, route: 1, itemCode: '1', name: 'extra 15Kg hold bag', price: 40 },
            { quantity: 1, route: 2, itemCode: '1', name: 'extra 15Kg hold bag', price: 35 },
            { quantity: 1, route: 1, itemCode: '2', name: 'LCB', price: 16 },
            { quantity: 1, route: 2, itemCode: '2', name: 'LCB', price: 16 },
        ];
        mockStores.bookingStore.selectedOffer.transport.routes[0].isExt = false;
        mockStores.bookingStore.selectedOffer.seatSelection = [];
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.queryByTestId('flight-details-extras')).not.toBeInTheDocument();
    });

    it('should render flight items for lux if the flight is external', () => {
        mockContainsLuxuryPromoCode = true;
        mockProps = createProps();
        mockStores = createStores(false);
        mockStores.bookingStore.selectedOffer.extraLuggageInfo.items = [
            { quantity: 1, route: 1, itemCode: '1', name: 'extra 15Kg hold bag', price: 40 },
            { quantity: 1, route: 2, itemCode: '1', name: 'extra 15Kg hold bag', price: 35 },
            { quantity: 1, route: 1, itemCode: '2', name: 'LCB', price: 16 },
            { quantity: 1, route: 2, itemCode: '2', name: 'LCB', price: 16 },
        ];
        mockStores.bookingStore.selectedOffer.seatSelection = [];

        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.queryByTestId('flight-details-extras')).toBeInTheDocument();
    });

    it('should NOT render luggage items dropdown if there are no extras items in desktop', () => {
        mockStores = createStores(false);
        mockStores.guestDetailsStore.infants = [];
        mockStores.bookingStore.selectedOffer.extraLuggageInfo.items = [];
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.queryByTestId('flight-details-extras')).not.toBeInTheDocument();
    });

    it('should render extras if there are infants and no extras items in desktop', () => {
        mockStores = createStores(false);
        mockStores.bookingStore.selectedOffer.extraLuggageInfo.items = [];
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.queryByTestId('flight-details-extras')).toBeInTheDocument();
    });

    it('should not render any luggage items if there are no extras items in mobile', () => {
        mockStores = createStores(true);
        mockStores.bookingStore.selectedOffer.extraLuggageInfo.items = [];
        mockStores.guestDetailsStore.infants = [];
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.getByTestId('flight-details-extras')).toBeEmptyDOMElement();
    });

    it('should render extras if there are infants and no extras items in mobile', () => {
        mockStores = createStores(true);
        mockStores.bookingStore.selectedOffer.extraLuggageInfo.items = [];
        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.getByTestId('flight-details-extras')).not.toBeEmptyDOMElement();
    });

    it('should display included label if standard seats and luxury holiday', () => {
        mockContainsLuxuryPromoCode = true;
        mockStores = createStores(true);
        render(<SummaryFlightDetails {...mockProps} />);

        const extraContainers = screen.getAllByTestId(/^luggage-item-container-/);
        extraContainers.forEach(container => {
            const priceElement = within(container).getByTestId(/^luggage-item-price-/);

            if (container.getAttribute('data-key') === SeatType.Standard) {
                expect(priceElement).toHaveTextContent(mockProps.CommonFieldsItemIncluded.value);
            }
        });
    });

    it('should display the price if standard seats and not luxury holiday', () => {
        mockStores = createStores(true);
        render(<SummaryFlightDetails {...mockProps} />);

        const extraContainers = screen.getAllByTestId(/^luggage-item-container-/);
        extraContainers.forEach(container => {
            const priceElement = within(container).getByTestId(/^luggage-item-price-/);

            if (container.getAttribute('data-key') === SeatType.Standard) {
                expect(priceElement).toHaveTextContent('£20');
            }
        });
    });

    it('should render edit button with correct scroll anchor', () => {
        mockStores = createStores(false);

        render(<SummaryFlightDetails {...mockProps} />);

        expect(screen.getByTestId('flight-details-edit')).toHaveAttribute(
            'data-scroll-anchor-id',
            ScrollAnchorId.CabinBags,
        );
    });

    it('should pass onEditClick to edit button', () => {
        const mockOnEditClick = jest.fn();
        mockStores = createStores(false);

        render(<SummaryFlightDetails {...mockProps} onEditClick={mockOnEditClick} />);

        const editButton = screen.getByTestId('flight-details-edit');
        editButton.click();

        expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    });

    describe('Edit button visibility based on luxury internal flight', () => {
        beforeEach(() => {
            mockUseLuxuryInternalFlight = false;
        });

        it('should hide edit button for luxury internal flights', () => {
            mockUseLuxuryInternalFlight = true;
            mockStores = createStores(false);

            render(<SummaryFlightDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });

        it('should show edit button for non-luxury or external flights', () => {
            mockUseLuxuryInternalFlight = false;
            mockStores = createStores(false);
            mockStores.bookingStore.extraLuggage = {
                canAddHoldLuggage: true,
                isLCBAddingUnavailable: false,
            };

            render(<SummaryFlightDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(false);
        });

        it('should hide edit button when EnableEditButtons is false', () => {
            mockProps.EnableEditButtons = mockSitecoreField(false);
            mockUseLuxuryInternalFlight = false;
            mockStores = createStores(false);

            render(<SummaryFlightDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });

        it('should hide edit button when both canAddHoldLuggage is false and isLCBAddingUnavailable is true', () => {
            mockUseLuxuryInternalFlight = false;
            mockStores = createStores(false);
            mockStores.bookingStore.extraLuggage = {
                canAddHoldLuggage: false,
                isLCBAddingUnavailable: true,
            };

            render(<SummaryFlightDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });

        it('should show edit button when only canAddHoldLuggage is false but isLCBAddingUnavailable is false', () => {
            mockUseLuxuryInternalFlight = false;
            mockStores = createStores(false);
            mockStores.bookingStore.extraLuggage = {
                canAddHoldLuggage: false,
                isLCBAddingUnavailable: false,
            };

            render(<SummaryFlightDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(false);
        });
    });
});
