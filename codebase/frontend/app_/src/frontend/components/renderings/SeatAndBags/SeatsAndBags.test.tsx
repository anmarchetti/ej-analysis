import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { SeatType } from 'models/enum/SeatType';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';

import { mockSeatsAndBagsFields } from './__mocks__/mockSeatAndBagsFields';
import { SeatsAndBags } from './SeatsAndBags';

expect.extend(toHaveNoViolations);

const mockUsePricePanelInfo = jest.fn().mockReturnValue({
    inboundPricePanels: null,
    outboundPricePanels: null,
});
jest.mock('./hooks/usePricePanelInfo', () => ({
    __esModule: true,
    usePricePanelInfo: () => mockUsePricePanelInfo(),
}));

const departureDate = 'test';
const countryName = 'test';
const bookingReference = 'test';
const flightReference = 'test';

const mockBookingWithRoutes = (
    routes = [
        {
            extRefId: flightReference,
            depDate: departureDate,
        },
    ],
) =>
    ({
        package: {
            accom: {
                hotel: {
                    name: '',
                    country: {
                        name: countryName,
                    },
                    location: {
                        name: '',
                    },
                    region: {
                        name: '',
                    },
                },
                rooms: [],
            },
            transport: {
                routes,
            },
            location: {
                region: '',
            },
        },
        guests: [],
        bookingReference,
        prom: 'PROMO1',
    } as any);

const createProps = () => ({
    fields: mockSeatsAndBagsFields,
    params: {},
    rendering: {},
    booking: {},
});

const createStore = () =>
    createMockStores({
        layoutStore: {
            isExtrasPage: true,
        },
        bookingStore: {
            selectedOffer: null,
        },
        viewBookingsStore: {
            isPreviousBooking: jest.fn(() => false),
        },
        seatMapStore: {
            isSeatMapFailed: true,
            outboundFlight: {
                id: '170430/2979',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'outbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
            inboundFlight: {
                id: '170430/2978',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'inbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
        },
        flightsPassengersStore: {
            passengersByQueue: [
                {
                    outboundPassenger: {
                        passengerId: 'passengerId',
                        seat: {
                            price: 'price',
                            seatNumber: 'seatNumber',
                            priceBand: SeatType.ExtraLegroom,
                            products: [],
                        },
                        firstName: 'firstName',
                        lastName: 'lastName',
                        title: 'title',
                        type: 'type',
                        withInfant: false,
                        age: 20,
                        index: 'index',
                        isLead: true,
                        notBornYet: false,
                        sex: 'sex',
                        dateOfBirth: 'dateOfBirth',
                    },
                    inboundPassenger: {
                        passengerId: 'passengerId',
                        seat: {
                            price: 'price',
                            seatNumber: 'seatNumber',
                            priceBand: SeatType.ExtraLegroom,
                            products: [],
                        },
                        firstName: 'firstName',
                        lastName: 'lastName',
                        title: 'title',
                        type: 'type',
                        withInfant: false,
                        age: 20,
                        index: 'index',
                        isLead: true,
                        notBornYet: false,
                        sex: 'sex',
                        dateOfBirth: 'dateOfBirth',
                    },
                },
            ],
        },
        amendSeatsStore: {
            newSeatMapPassengers: null,
            prevSeatMapPassengers: null,
        },
    });

let mockProps;
let mockStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

const mockOutlineBannerContext = jest.fn();
const mockOutlineBanner = jest.fn();
jest.mock('frontend/components/common/OutlineBanner/OutlineBanner', () => ({
    __esModule: true,
    OutlineBannerContext: {
        Provider: props => {
            mockOutlineBannerContext(props);

            return <div data-tid='outline-banner-context'>{props.children}</div>;
        },
    },
    default: props => {
        mockOutlineBanner(props);

        return <div data-tid='outline-banner'>{props.children}</div>;
    },
}));

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: ({ name, onClose }) => <div data-tid={name} onClick={() => onClose()} />,
    Text: ({ ...props }) => {
        mockTextComponent(props);

        return <div {...props}>{props.field.value}</div>;
    },
}));

const mockAncillaries = jest.fn();
jest.mock('frontend/components/common/Ancillaries/Ancillaries', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockAncillaries(props);

        return <div {...props} data-tid='ancillaries' />;
    },
}));

const mockSeatsAndBagsLuxuryInternalFlight = jest.fn();
jest.mock('./components/SeatsAndBagsLuxuryInternalFlight/SeatsAndBagsLuxuryInternalFlight', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockSeatsAndBagsLuxuryInternalFlight(props);

        return <div {...props} data-tid='seats-and-bags-luxury-internal-flight' />;
    },
}));

const mockAncillariesDropdown = jest.fn();
jest.mock('frontend/components/common/AncillariesDropdown/AncillariesDropdown', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockAncillariesDropdown(props);

        return <div {...props} data-tid='ancillaries-dropdown' />;
    },
}));

const mockAncillariesMainContent = jest.fn();
jest.mock('frontend/components/common/Ancillaries/components/AncillariesMainContent/AncillariesMainContent', () => ({
    __esModule: true,
    default: props => {
        mockAncillariesMainContent(props);

        return <div data-tid='ancillaries-main-content' />;
    },
}));

const mockInfoMessagesProps = jest.fn();
jest.mock('./components/SeatInfoMessages/SeatInfoMessages', () => ({
    __esModule: true,
    default: props => {
        mockInfoMessagesProps(props);

        return <div data-tid='info-messages' />;
    },
}));

const mockRemoveWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    removeWebStorageItem: () => mockRemoveWebStorageItem(),
}));

const mockUseLuxuryInternalFlight = jest.fn().mockReturnValue(false);
jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlight: () => mockUseLuxuryInternalFlight(),
}));

describe('<SeatsAndBags />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStore = createStore();
    });

    it('should renders shimmer while loading on Extras Page', () => {
        mockStore.appStore.isLoading = true;
        render(<SeatsAndBags {...mockProps} />);

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
        expect(screen.queryByTestId('seats-and-bags-container')).not.toBeInTheDocument();
    });

    it('should NOT render shimmer while loading on other pages', () => {
        mockStore.appStore.isLoading = true;
        mockStore.layoutStore.isExtrasPage = false;
        render(<SeatsAndBags {...mockProps} />);

        expect(screen.queryByTestId('shimmer')).not.toBeInTheDocument();
        expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
    });

    it('should NOT render title when booking is out of sync', () => {
        mockStore.viewBookingStore.isBookingOutOfSync = true;

        const { container } = render(<SeatsAndBags {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(screen.queryByTestId('seats-and-bags-title')).not.toBeInTheDocument();
    });

    it('should render component when passengersByQueue is empty in internal flight for Extras', () => {
        mockStore.bookingStore.isFlightExternal = false;
        mockStore.viewBookingStore.isFlightExternal = false;
        mockStore.seatMapStore.isSeatMapFlowEnabled = true;
        mockStore.flightsPassengersStore.passengersByQueue = [];
        mockStore.seatMapStore.isSeatMapFailed = false;

        const { container } = render(<SeatsAndBags {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();

        const seatsAndBagsContainer = screen.getByTestId('seats-and-bags-container');
        const ancillariesTitle = screen.getByTestId('seats-and-bags-title');

        expect(ancillariesTitle).toHaveTextContent('SeriesSeatFlightsPageTitle');
        expect(seatsAndBagsContainer).toHaveClass('internalFlightContainer');

        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields.SeriesSeatFlightsPageTitle,
            tag: 'h2',
            className: 'title',
            ['data-tid']: 'seats-and-bags-title',
        });
    });

    describe('internal flight ', () => {
        it('should NOT render alt title on Post Booking Flow for internal flight', () => {
            mockStore.bookingStore.isFlightExternal = false;
            mockStore.seatMapStore.isSeatMapFlowEnabled = true;
            mockStore.layoutStore.isViewBookingPage = true;
            mockStore.flightsPassengersStore.passengersByQueue = [];

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.queryByTestId('seats-and-bags-title')).not.toBeInTheDocument;
        });

        it('should render correctly when bookingStore.isFlightExternal is true and viewBookingStore.isFlightExternal is false', () => {
            mockStore.bookingStore.isFlightExternal = true;
            mockStore.viewBookingStore.isFlightExternal = false;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
            expect(screen.queryByTestId('seats-and-bags-title')).not.toBeInTheDocument();
            expect(screen.getByTestId('ancillaries')).toBeInTheDocument();
        });

        it('should render correctly when bookingStore.isFlightExternal is false and viewBookingStore.isFlightExternal is true', () => {
            mockStore.bookingStore.isFlightExternal = false;
            mockStore.viewBookingStore.isFlightExternal = true;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
            expect(screen.queryByTestId('seats-and-bags-title')).not.toBeInTheDocument();
            expect(screen.getByTestId('ancillaries')).toBeInTheDocument();
        });

        it('should render correctly when both bookingStore.isFlightExternal and viewBookingStore.isFlightExternal are true', () => {
            mockStore.bookingStore.isFlightExternal = true;
            mockStore.viewBookingStore.isFlightExternal = true;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
            expect(screen.queryByTestId('seats-and-bags-title')).not.toBeInTheDocument();
            expect(screen.getByTestId('ancillaries')).toBeInTheDocument();
        });

        it('should NOT have internal flight logic when both bookingStore.isFlightExternal and viewBookingStore.isFlightExternal are false', () => {
            mockStore.bookingStore.isFlightExternal = false;
            mockStore.viewBookingStore.isFlightExternal = false;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.queryByTestId('seats-and-bags-container')).not.toHaveClass('internalFlightContainer');
        });
    });

    describe('urgency message', () => {
        it('should clear seats urgency message from sessionStorage when rendered', () => {
            render(<SeatsAndBags {...mockProps} />);

            expect(mockRemoveWebStorageItem).toHaveBeenCalled();
        });
    });

    describe('for post booking', () => {
        beforeEach(() => {
            mockStore.layoutStore.isViewBookingPage = true;
            mockStore.layoutStore.isBookingFlow = false;
            mockStore.seatMapStore.isSeatMapFailed = false;
        });

        it('should show seats component', () => {
            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
            expect(screen.queryByTestId('seats-and-bags-title')).not.toBeInTheDocument();
            expect(screen.getByTestId('ancillaries')).toBeInTheDocument();
        });

        it('should not show unavailable seats and bags availability info message if seats reservation is possible', () => {
            mockStore.viewBookingStore.isBookingOutOfSync = false;
            render(<SeatsAndBags {...mockProps} />);

            expect(mockInfoMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    shouldShowInfoMessage: false,
                    shouldShowOutOfSyncMessage: false,
                    shouldShowNotAvailableMessage: false,
                    shouldShowWarning: false,
                }),
            );
        });

        it('should show out of sync messageif seats reservation is not possible', () => {
            mockStore.viewBookingStore.isBookingOutOfSync = true;
            render(<SeatsAndBags {...mockProps} />);

            expect(screen.queryByTestId('info-messages')).toBeInTheDocument();
            expect(mockInfoMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    shouldShowInfoMessage: false,
                    shouldShowOutOfSyncMessage: true,
                    shouldShowNotAvailableMessage: false,
                    shouldShowWarning: false,
                }),
            );
        });

        it('should show series seats message when it is series seats flight', () => {
            mockStore.viewBookingStore.isBookingOutOfSync = true;
            mockStore.viewBookingStore.isFlightExternal = false;
            mockStore.bookingStore.isFlightExternal = false;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('info-messages')).toBeInTheDocument();
            expect(mockInfoMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                    shouldShowInfoMessage: true,
                    shouldShowNotAvailableMessage: false,
                    shouldShowOutOfSyncMessage: false,
                    shouldShowWarning: false,
                }),
            );
        });
    });

    it('should NOT render component when NO fields', () => {
        delete mockProps.fields;

        const { container } = render(<SeatsAndBags {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when passengersByQueue is empty in external flight', () => {
        mockStore.flightsPassengersStore.passengersByQueue = [];

        const { container } = render(<SeatsAndBags {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when inboundFlight and outboundFlight are empty on Extras page', () => {
        delete mockStore.seatMapStore.inboundFlight;
        delete mockStore.seatMapStore.outboundFlight;

        const { container } = render(<SeatsAndBags {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when isSeatMapPostBookingFlowEnabled is false', () => {
        mockStore.layoutStore.isExtrasPage = false;
        mockProps.booking = mockBookingWithRoutes();
        mockStore.layoutStore.isAmendPaymentPage = false;
        mockStore.seatMapStore.isSeatMapPostBookingFlowEnabled = false;
        mockStore.layoutStore.isViewBookingPage = true;
        mockStore.seatMapStore.outboundFlight.isExt = true;

        const { container } = render(<SeatsAndBags {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(mockStore.seatMapStore.fetchSeatMap).not.toHaveBeenCalled();
    });

    describe('fetchSeatMap', () => {
        describe('ExtrasPage', () => {
            it('should call fetchSeatMap on Extras page when booking routes are defined', () => {
                mockProps.booking = mockBookingWithRoutes();
                mockStore.bookingStore.selectedOffer = {
                    pricePP: 100,
                    date: '2020-02-05T00:00:00',
                    transport: {
                        routes: [
                            {
                                extRefId: flightReference,
                                depDate: departureDate,
                            },
                        ],
                    },
                    accom: {
                        prom: 'PROMO2',
                    },
                } as IOffer;

                render(<SeatsAndBags {...mockProps} />);

                expect(mockStore.seatMapStore.fetchSeatMap).toHaveBeenCalledWith(
                    mockStore.bookingStore.selectedOffer.transport.routes,
                    mockStore.bookingStore.selectedOffer.accom.prom,
                );
            });

            it('should NOT call fetchSeatMap on Extras page when booking is not defined', () => {
                mockStore.bookingStore.selectedOffer = {
                    pricePP: 100,
                    date: '2020-02-05T00:00:00',
                    transport: {
                        errataFlightInfo: ['errataFlightInfo'],
                    },
                } as IOffer;

                render(<SeatsAndBags {...mockProps} />);

                expect(mockStore.seatMapStore.fetchSeatMap).not.toHaveBeenCalled();
            });

            it('should NOT call fetchSeatMap on Extras page when booking routes are empty', () => {
                mockStore.bookingStore.selectedOffer = {
                    pricePP: 100,
                    date: '2020-02-05T00:00:00',
                    transport: {
                        errataFlightInfo: ['errataFlightInfo'],
                    },
                } as IOffer;
                mockProps.booking = mockBookingWithRoutes([]);

                render(<SeatsAndBags {...mockProps} />);

                expect(mockStore.seatMapStore.fetchSeatMap).not.toHaveBeenCalled();
            });
        });

        describe('ViewBookingPage', () => {
            it('should call fetchSeatMap on ViewBooking page when booking routes are defined', () => {
                mockStore.layoutStore.isExtrasPage = false;
                mockStore.layoutStore.isViewBookingPage = true;
                mockProps.booking = mockBookingWithRoutes();

                render(<SeatsAndBags {...mockProps} />);

                expect(mockStore.seatMapStore.fetchSeatMap).toHaveBeenCalledWith(
                    mockProps.booking.package.transport.routes,
                    mockProps.booking.prom,
                );
            });

            it('should NOT call fetchSeatMap on ViewBooking page when booking is not defined', () => {
                mockStore.layoutStore.isExtrasPage = false;
                mockStore.layoutStore.isViewBookingPage = true;

                render(<SeatsAndBags {...mockProps} />);

                expect(mockStore.seatMapStore.fetchSeatMap).not.toHaveBeenCalled();
            });

            it('should NOT call fetchSeatMap on ViewBooking page when booking routes are empty', () => {
                mockStore.layoutStore.isExtrasPage = false;
                mockStore.layoutStore.isViewBookingPage = true;
                mockProps.booking = mockBookingWithRoutes([]);
                mockProps.booking.package.transport.routes = [];

                render(<SeatsAndBags {...mockProps} />);

                expect(mockStore.seatMapStore.fetchSeatMap).not.toHaveBeenCalled();
            });
        });
    });

    describe('ErrorMessages', () => {
        beforeEach(() => {
            mockStore.bookingStore.isFlightExternal = false;
            mockStore.viewBookingStore.isFlightExternal = false;
        });

        it('should show info message when seat map flow is disabled', () => {
            mockStore.seatMapStore.isSeatMapFlowEnabled = false;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('info-messages')).toBeInTheDocument();
            expect(mockInfoMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                    shouldShowInfoMessage: false,
                    shouldShowNotAvailableMessage: true,
                    shouldShowOutOfSyncMessage: false,
                    shouldShowWarning: false,
                }),
            );
        });

        it('should show series seats message when it is series seats flight', () => {
            mockStore.seatMapStore.isSeatMapFailed = false;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('info-messages')).toBeInTheDocument();
            expect(mockInfoMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                    shouldShowInfoMessage: true,
                    shouldShowNotAvailableMessage: false,
                    shouldShowOutOfSyncMessage: false,
                    shouldShowWarning: false,
                }),
            );
        });

        it('should show out of sync message when booking is out of sync and NONE of the warning message or series seats message are shown', () => {
            mockProps.booking = { seatSelection: [{ isSeatReservationPossible: false }] };
            mockStore.viewBookingStore.isBookingOutOfSync = true;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('info-messages')).toBeInTheDocument();
            expect(mockInfoMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    shouldShowInfoMessage: false,
                    shouldShowNotAvailableMessage: false,
                    shouldShowOutOfSyncMessage: true,
                    shouldShowWarning: false,
                }),
            );
        });

        it('should NOT show out of sync message when booking is out of sync BUT the info message is shown', () => {
            mockProps.booking = { seatSelection: [{ isSeatReservationPossible: false }] };
            mockStore.seatMapStore.isSeatMapFlowEnabled = false;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('info-messages')).toBeInTheDocument();
            expect(mockInfoMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    shouldShowInfoMessage: false,
                    shouldShowNotAvailableMessage: true,
                    shouldShowOutOfSyncMessage: false,
                    shouldShowWarning: false,
                }),
            );
        });

        it('should NOT show out of sync message when booking is out of sync BUT series seats message is shown', () => {
            mockProps.booking = { seatSelection: [{ isSeatReservationPossible: false }] };
            mockStore.seatMapStore.isSeatMapFailed = false;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('info-messages')).toBeInTheDocument();
            expect(mockInfoMessagesProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    shouldShowInfoMessage: true,
                    shouldShowNotAvailableMessage: false,
                    shouldShowOutOfSyncMessage: false,
                    shouldShowWarning: false,
                }),
            );
        });

        it('should not show any seat map warning message when isHideSeatMapWarningMessages is true', () => {
            mockStore.seatMapStore.isHideSeatMapWarningMessages = true;
            render(<SeatsAndBags {...mockProps} />);

            expect(screen.queryByTestId('info-messages')).not.toBeInTheDocument();
        });

        it('should not show any seat map warning message when it is main payment holiday page', () => {
            mockStore.seatMapStore.isHideSeatMapWarningMessages = false;
            mockStore.layoutStore.isAmendPaymentPage = true;
            mockStore.layoutStore.isTradePortal = false;
            render(<SeatsAndBags {...mockProps} />);

            expect(screen.queryByTestId('info-messages')).not.toBeInTheDocument();
        });
    });

    describe('SeatMap', () => {
        it('should render seat map', () => {
            mockStore.seatMapStore.isSeatMapOpened = true;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.SeatMap)).toBeInTheDocument();
        });

        it('should close seat map', async () => {
            mockStore.seatMapStore.isSeatMapOpened = true;

            render(<SeatsAndBags {...mockProps} />);

            await userEvent.click(screen.getByTestId(PlaceholderNames.SeatMap));

            expect(mockStore.seatMapStore.setSeatMapOpened).toHaveBeenCalledWith(false);
        });
    });

    describe('Force open seat map', () => {
        it('should force open the SeatMap when flag shouldOpenSeatMapForced = true and seatsResponse length > 0', () => {
            mockStore.seatMapStore.shouldOpenSeatMapForced = true;
            mockStore.seatMapStore.seatsResponse = [{} as any];

            render(<SeatsAndBags {...mockProps} />);

            expect(mockStore.seatMapStore.setSeatMapOpened).toHaveBeenCalledWith(true);
        });

        it('should NOT force open the SeatMap when flag shouldOpenSeatMapForced = true BUT seatsResponse length == 0', () => {
            mockStore.seatMapStore.shouldOpenSeatMapForced = true;

            render(<SeatsAndBags {...mockProps} />);

            expect(mockStore.seatMapStore.setSeatMapOpened).not.toHaveBeenCalledWith(true);
        });

        it('should NOT force open the SeatMap when flag shouldOpenSeatMapForced = false and seatsResponse length == 0', () => {
            render(<SeatsAndBags {...mockProps} />);

            expect(mockStore.seatMapStore.setSeatMapOpened).not.toHaveBeenCalledWith();
        });

        it('should NOT force open the SeatMap when flag shouldOpenSeatMapForced = false and seatsResponse length > 0', () => {
            mockStore.seatMapStore.seatsResponse = [{} as any];
            render(<SeatsAndBags {...mockProps} />);

            expect(mockStore.seatMapStore.setSeatMapOpened).not.toHaveBeenCalledWith();
        });
    });

    describe('new seats component', () => {
        beforeEach(() => {
            mockStore.seatMapStore.isSeatMapFailed = false;
            mockProps.booking = { seatSelection: [{ seats: [], isSeatReservationPossible: true }] };
            mockStore.seatMapStore.outboundFlight.isExt = true;
        });

        it('should render new seat component for extras page with correct props', async () => {
            mockStore.layoutStore.isExtrasPage = true;
            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('ancillaries')).toBeInTheDocument();

            expect(mockAncillaries).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                    Subtitle: mockProps.fields.DefaultTitling.fields.Subtitle,
                    Description: mockProps.fields.DefaultTitling.fields.Description,
                }),
            );
            expect(screen.getByTestId('ancillaries-dropdown')).toBeInTheDocument();

            expect(mockAncillariesDropdown).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                }),
            );
        });

        it('should render new seat component for confirmation page', async () => {
            mockStore.layoutStore.isConfirmationPage = true;
            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('ancillaries-dropdown')).toBeInTheDocument();

            expect(mockAncillariesDropdown).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                }),
            );
        });

        it('should render new seat component for view booking page', async () => {
            mockStore.layoutStore.isViewBookingPage = true;
            render(<SeatsAndBags {...mockProps} />);

            expect(screen.getByTestId('ancillaries')).toBeInTheDocument();

            expect(mockAncillaries).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                    Subtitle: mockProps.fields.DefaultTitling.fields.Subtitle,
                    Description: mockProps.fields.DefaultTitling.fields.Description,
                }),
            );

            expect(screen.getByTestId('ancillaries-dropdown')).toBeInTheDocument();

            expect(mockAncillariesDropdown).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                }),
            );
        });

        it('should render component with Luxury Subtitle and Description', () => {
            mockStore.bookingStore.isLuxuryPackage = true;
            render(<SeatsAndBags {...mockProps} />);

            expect(mockAncillaries).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                    Subtitle: mockProps.fields.LuxuryTitling.fields.Subtitle,
                    Description: mockProps.fields.LuxuryTitling.fields.Description,
                }),
            );
        });
    });

    describe('Luxury internal flight', () => {
        describe('on Extras page', () => {
            it('should render Luxury internal flight component with correct props', () => {
                mockUseLuxuryInternalFlight.mockReturnValue(true);

                render(<SeatsAndBags {...mockProps} />);

                expect(screen.getByTestId('seats-and-bags-luxury-internal-flight')).toBeInTheDocument();
                expect(mockSeatsAndBagsLuxuryInternalFlight).toHaveBeenCalledWith({
                    Subtitle: mockProps.fields.LuxuryInternalFlightTitling.fields.Subtitle,
                    Description: mockProps.fields.LuxuryInternalFlightTitling.fields.Description,
                    Icon: mockProps.fields.Icon,
                    LuxurySeriesSeatFlightsTitlePostBook: mockProps.fields.LuxurySeriesSeatFlightsTitlePostBook,
                    SeriesSeatFlightsPageTitle: mockProps.fields.SeriesSeatFlightsPageTitle,
                });

                expect(screen.queryByTestId('info-messages')).not.toBeInTheDocument();
                expect(screen.queryByTestId('seats-and-bags-container')).not.toBeInTheDocument();
            });

            it('should NOT render Luxury internal flight component when isLuxuryInternalFlight is false', () => {
                mockUseLuxuryInternalFlight.mockReturnValue(false);

                render(<SeatsAndBags {...mockProps} />);

                expect(screen.getByTestId('info-messages')).toBeInTheDocument();
                expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
                expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
            });
        });

        describe('on View Booking page', () => {
            beforeEach(() => {
                mockStore.layoutStore.isViewBookingPage = true;
                mockStore.layoutStore.isExtrasPage = false;
                mockUseLuxuryInternalFlight.mockReturnValue(true);
                mockStore.viewBookingStore.isBookingOutOfSync = true;
            });

            it('should render Luxury internal flight component with correct props', () => {
                render(<SeatsAndBags {...mockProps} />);

                expect(screen.getByTestId('seats-and-bags-luxury-internal-flight')).toBeInTheDocument();
                expect(mockSeatsAndBagsLuxuryInternalFlight).toHaveBeenCalledWith({
                    Subtitle: mockProps.fields.LuxuryInternalFlightTitling.fields.Subtitle,
                    Description: mockProps.fields.LuxuryInternalFlightTitling.fields.Description,
                    Icon: mockProps.fields.Icon,
                    LuxurySeriesSeatFlightsTitlePostBook: mockProps.fields.LuxurySeriesSeatFlightsTitlePostBook,
                    SeriesSeatFlightsPageTitle: mockProps.fields.SeriesSeatFlightsPageTitle,
                });

                expect(screen.queryByTestId('info-messages')).not.toBeInTheDocument();
                expect(screen.queryByTestId('seats-and-bags-container')).not.toBeInTheDocument();
            });

            it('should NOT render Luxury internal flight component when isLuxuryInternalFlight is false', () => {
                mockUseLuxuryInternalFlight.mockReturnValue(false);

                render(<SeatsAndBags {...mockProps} />);

                expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
                expect(screen.getByTestId('info-messages')).toBeInTheDocument();
                expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
            });

            it('should NOT render Luxury internal flight component when isBookingOutOfSync is false', () => {
                mockStore.viewBookingStore.isBookingOutOfSync = false;

                render(<SeatsAndBags {...mockProps} />);
                expect(screen.getByTestId('info-messages')).toBeInTheDocument();
                expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();

                expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
            });
        });

        describe('on Confirmation page', () => {
            beforeEach(() => {
                mockStore.layoutStore.isConfirmationPage = true;
                mockStore.layoutStore.isViewBookingPage = false;
                mockStore.layoutStore.isExtrasPage = false;
                mockUseLuxuryInternalFlight.mockReturnValue(true);
            });

            it('should render Luxury internal flight component with correct props', () => {
                render(<SeatsAndBags {...mockProps} />);

                expect(screen.getByTestId('seats-and-bags-luxury-internal-flight')).toBeInTheDocument();
                expect(mockSeatsAndBagsLuxuryInternalFlight).toHaveBeenCalledWith({
                    Subtitle: mockProps.fields.LuxuryInternalFlightTitling.fields.Subtitle,
                    Description: mockProps.fields.LuxuryInternalFlightTitling.fields.Description,
                    Icon: mockProps.fields.Icon,
                    LuxurySeriesSeatFlightsTitlePostBook: mockProps.fields.LuxurySeriesSeatFlightsTitlePostBook,
                    SeriesSeatFlightsPageTitle: mockProps.fields.SeriesSeatFlightsPageTitle,
                });

                expect(screen.queryByTestId('info-messages')).not.toBeInTheDocument();
                expect(screen.queryByTestId('seats-and-bags-container')).not.toBeInTheDocument();
            });

            it('should not render when isLuxuryInternalFlight is false', () => {
                mockUseLuxuryInternalFlight.mockReturnValue(false);

                render(<SeatsAndBags {...mockProps} />);

                expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();

                expect(screen.getByTestId('info-messages')).toBeInTheDocument();
                expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
            });
        });

        it('should NOT render Luxury internal flight component when its not Extras page nor View Booking nor Confirmation page', () => {
            mockStore.layoutStore.isExtrasPage = false;
            mockStore.layoutStore.isViewBookingPage = false;
            mockStore.layoutStore.isConfirmationPage = false;

            render(<SeatsAndBags {...mockProps} />);

            expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
            expect(screen.getByTestId('info-messages')).toBeInTheDocument();
            expect(screen.getByTestId('seats-and-bags-container')).toBeInTheDocument();
        });
    });

    describe('OutlineBannerContext', () => {
        it('should render 2 OutlineBanners with no theme when it is NOT luxury package', () => {
            mockStore.bookingStore.isLuxuryPackage = false;
            mockStore.viewBookingStore.isLuxuryPackage = false;

            render(<SeatsAndBags {...mockProps} />);
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(1, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.NoTheme },
            });
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(2, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.NoTheme },
            });
            expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
        });

        it('should render OutlineBanner with no theme when it is luxury package and it is NOT extra page', () => {
            mockStore.bookingStore.isLuxuryPackage = true;
            mockStore.layoutStore.isExtrasPage = false;

            render(<SeatsAndBags {...mockProps} />);
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(2, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.NoTheme },
            });
            expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
        });

        it('should render OutlineBanner with no theme when it is luxury package and it is NOT view booking page', () => {
            mockStore.viewBookingStore.isLuxuryPackage = true;
            mockStore.layoutStore.isViewBookingPage = false;

            render(<SeatsAndBags {...mockProps} />);
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(1, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.NoTheme },
            });
            expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
        });

        it('should render OutlineBanner with no theme when it is luxury package but premium seats are selected', () => {
            mockStore.bookingStore.isLuxuryPackage = true;
            mockStore.layoutStore.isExtrasPage = true;
            mockStore.seatMapStore.isPremiumSeatsSelected = true;

            render(<SeatsAndBags {...mockProps} />);
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(2, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.NoTheme },
            });
            expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
        });

        it('should render OutlineBanner with no theme when it is luxury package but premium seats are selected', () => {
            mockStore.viewBookingStore.isLuxuryPackage = true;
            mockStore.layoutStore.isViewBookingPage = true;
            mockStore.seatMapStore.isPremiumSeatsSelected = true;

            render(<SeatsAndBags {...mockProps} />);
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(1, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.NoTheme },
            });
            expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
        });

        it('should render OutlineBanner with LuxuryLightTheme when it is luxury package and it is extras page', () => {
            mockStore.bookingStore.isLuxuryPackage = true;
            mockStore.layoutStore.isExtrasPage = true;
            mockStore.seatMapStore.isPremiumSeatsSelected = false;

            render(<SeatsAndBags {...mockProps} />);
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(1, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.NoTheme },
            });
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(2, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.LuxuryTheme },
            });
            expect(screen.queryByTestId('seats-and-bags-luxury-internal-flight')).not.toBeInTheDocument();
        });

        it('should render OutlineBanner with LuxuryTheme when it is luxury package and it is view booking page', () => {
            mockStore.viewBookingStore.isLuxuryPackage = true;
            mockStore.layoutStore.isViewBookingPage = true;
            mockStore.seatMapStore.isPremiumSeatsSelected = false;

            render(<SeatsAndBags {...mockProps} />);
            expect(mockOutlineBannerContext).toHaveBeenNthCalledWith(1, {
                children: expect.anything(),
                value: { theme: OutlineBannerTheme.LuxuryTheme },
            });
            expect(mockOutlineBanner).toHaveBeenCalledWith({
                className: 'outlineBanner',
                children: expect.anything(),
            });
        });
    });
});
