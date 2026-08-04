import { Guid } from 'guid-typescript';

import { mockGuests, mockOutboundFlight } from 'frontend/__mocks__';
import { mockBooking as genericMockBooking } from 'frontend/__mocks__/booking';
import { IAssistedTravelRequest } from 'models/data/assistedTravelRequest';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { RouteDirection } from 'models/enum/RouteDirection';
import { BookingTypeForFeedback } from 'models/enum/tracking/BookingType';
import { ViewBookingPageStates } from 'models/enum/ViewBookingPageStates';

import { deepClone } from './array.utils';
import * as passengerUtils from './passenger.utils';
import {
    callChatBot,
    getBookingDestination,
    getBookingDestinationForTracking,
    getBookingPayload,
    getBookingPdfFileName,
    getBookingRoute,
    getBookingType,
    getCheckInLink,
    getDaysBeforeDeparture,
    getLeadGuestLastName,
    getPdfLinks,
    getPdfRequestBody,
    getTotalBookingRefund,
    getValidBalanceDueDate,
    getViewBookingRedirectLink,
    isFlightDeparted,
    matchGuestsToAssistedTravelRequest,
} from './viewBooking.utils';

const mockViewBookingLinks = {
    preTravel: '/pre-travel',
    inDestination: '/in-destination',
    viewBooking: '/view-booking',
    postTravel: '/post-travel',
    cancelled: '/cancelled',
};

let mockBooking;

describe('viewBooking.utils', () => {
    beforeEach(() => {
        mockBooking = deepClone(genericMockBooking);
    });

    describe('getBookingPayload', () => {
        it('should return correct data', () => {
            const result = getBookingPayload(mockBooking);

            expect(result).toStrictEqual({
                bookingReference: 'bookingReference',
                date: '2023-05-11',
                lastName: 'Brown',
                discountCode: 'discountCode',
                package: {
                    accom: { code: 'accom-code', endDate: '2029-07-19', isExt: false, startDate: '2029-06-19' },
                    location: { city: 'Barcelona', country: 'Spain', region: 'package-region' },
                    transport: {
                        routes: [
                            {
                                arrDate: '2023-05-11T16:25:00+00:00',
                                arrLocation: 'Costa Teguise',
                                arrName: 'Lanzarote',
                                arrItemName: 'Lanzarote',
                                arrPt: 'ACE',
                                bkgCls: 'Z',
                                car: 'EZY',
                                depDate: '2023-05-11T12:10:00+00:00',
                                depLocation: 'London',
                                depName: 'London Gatwick',
                                depItemName: 'London Gatwick',
                                depPt: 'LGW',
                                direction: 'outbound',
                                extRefId: 'K6578ZK',
                                fltNo: '6453',
                                id: '170430/3978',
                                isExt: true,
                                paxs: [{ paxId: '1' }, { paxId: '2' }],
                            },
                            {
                                arrDate: '2023-05-19T00:45:00+00:00',
                                arrLocation: 'London',
                                arrName: 'London Gatwick',
                                arrItemName: 'London Gatwick',
                                arrPt: 'LGW',
                                bkgCls: 'Z',
                                car: 'EZY',
                                depDate: '2023-05-18T20:40:00+00:00',
                                depLocation: 'Costa Teguise',
                                depName: 'Lanzarote',
                                depItemName: 'Lanzarote',
                                depPt: 'ACE',
                                direction: 'inbound',
                                extRefId: 'K6578ZK',
                                fltNo: '6572',
                                id: '170430/2978',
                                isExt: true,
                                paxs: [{ paxId: '1' }, { paxId: '2' }],
                            },
                        ],
                    },
                },
                paymentInfo: {
                    agentComission: 1,
                    allowPayBalanceDueDate: '2025-01-12',
                    allowPayOutstandingBalanceDays: 10,
                    balanceDueAmount: 1,
                    balanceDueDate: mockBooking.paymentInfo.balanceDueDate,
                    commissionIncludingVat: 1,
                    currency: 'GBP',
                    depositDueDate: 'deposite',
                    depositPrice: 300,
                    paymentHistory: [],
                    pricePP: 1,
                    totalPrice: 10,
                },
                promoCollections: undefined,
            });
        });
    });

    describe('getBookingRoute', () => {
        it('should return inbound route', () => {
            const result = getBookingRoute(mockBooking, RouteDirection.Inbound);

            expect(result).toStrictEqual({
                arrDate: '2023-05-19T00:45:00+00:00',
                arrLocation: 'London',
                arrName: 'London Gatwick',
                arrItemName: 'London Gatwick',
                arrPt: 'LGW',
                bkgCls: 'Z',
                car: 'EZY',
                depDate: '2023-05-18T20:40:00+00:00',
                depLocation: 'Costa Teguise',
                depName: 'Lanzarote',
                depItemName: 'Lanzarote',
                depPt: 'ACE',
                direction: 'inbound',
                extRefId: 'K6578ZK',
                fltNo: '6572',
                id: '170430/2978',
                isExt: true,
                paxs: [
                    {
                        paxId: '1',
                    },
                    {
                        paxId: '2',
                    },
                ],
            });
        });

        it('should return null when no inbound route provided', () => {
            mockBooking.package.transport.routes = [mockOutboundFlight];
            const result = getBookingRoute(mockBooking, RouteDirection.Inbound);

            expect(result).toStrictEqual(null);
        });
    });

    describe('getPdfLinks', () => {
        it('should return link for booking travel document', () => {
            const result = getPdfLinks(mockBooking, 'booking');

            expect(result).toStrictEqual('http://test/api/v1.0/booking/confirmation');
        });

        it('should return link for payment receipt travel document', () => {
            const result = getPdfLinks(mockBooking, 'paymentReceipt');

            expect(result).toStrictEqual(
                'http://test/api/v1.0/booking/payment-receipt?bookingReference=bookingReference&lastName=Brown&date=2023-05-11',
            );
        });

        it('should return empty string when no last name is provided', () => {
            mockBooking.guests[1].isLead = false;
            const result = getPdfLinks(mockBooking, 'booking');

            expect(result).toStrictEqual('');
        });

        it('should return empty string when no date is provided', () => {
            mockBooking.package.transport.routes[0].depDate = undefined;
            const result = getPdfLinks(mockBooking, 'booking');

            expect(result).toStrictEqual('');
        });

        it('should return empty string when no booking reference is provided', () => {
            mockBooking.bookingReference = '';
            const result = getPdfLinks(mockBooking, 'booking');

            expect(result).toStrictEqual('');
        });

        it('should return empty string when no booking is provided', () => {
            const result = getPdfLinks(null as any, 'booking');

            expect(result).toStrictEqual('');
        });
    });

    describe('getPdfRequestBody', () => {
        it('should return the confirmation request body', () => {
            const result = getPdfRequestBody(mockBooking);

            expect(result).toStrictEqual({
                bookingReference: 'bookingReference',
                lastName: 'Brown',
                date: '2023-05-11',
            });
        });

        it('should return undefined when no last name is provided', () => {
            mockBooking.guests[1].isLead = false;
            const result = getPdfRequestBody(mockBooking);

            expect(result).toBeUndefined();
        });

        it('should return undefined when no date is provided', () => {
            mockBooking.package.transport.routes[0].depDate = undefined;
            const result = getPdfRequestBody(mockBooking);

            expect(result).toBeUndefined();
        });

        it('should return undefined when no booking reference is provided', () => {
            mockBooking.bookingReference = '';
            const result = getPdfRequestBody(mockBooking);

            expect(result).toBeUndefined();
        });

        it('should return undefined when no booking is provided', () => {
            const result = getPdfRequestBody(null as any);

            expect(result).toBeUndefined();
        });
    });

    describe('getBookingPdfFileName', () => {
        it('should return pdf file name', () => {
            jest.spyOn(Guid, 'create').mockReturnValueOnce('1234' as any);
            const result = getBookingPdfFileName();

            expect(result).toStrictEqual('1234.pdf');
        });
    });

    describe('getTotalBookingRefund', () => {
        it('should return credit when is credit only', () => {
            const result = getTotalBookingRefund(true, { credit: { credit: 10 } } as any);

            expect(result).toStrictEqual(10);
        });

        it('should return 0 when is credit only and credit NOT provided', () => {
            const result = getTotalBookingRefund(true, { credit: { credit: null } } as any);

            expect(result).toStrictEqual(0);
        });

        it('should return credit and cash sum when is NOT credit only', () => {
            const result = getTotalBookingRefund(false, { refund: { credit: 10, cash: 100 } } as any);

            expect(result).toStrictEqual(110);
        });

        it('should return 0 when is credit only and credit and cash NOT provided', () => {
            const result = getTotalBookingRefund(false, { refund: { credit: null, cash: null } } as any);

            expect(result).toStrictEqual(0);
        });

        it('should return 0 if no refund', () => {
            const result = getTotalBookingRefund(false);

            expect(result).toStrictEqual(0);
        });
    });

    describe('getBookingDestination', () => {
        it('should return booking destination', () => {
            const result = getBookingDestination(mockBooking);

            expect(result).toStrictEqual('Tenerife,Spain');
        });

        it('should return only country when region NOT provided', () => {
            mockBooking.package.accom.hotel.location.name = '';

            if (!!mockBooking.hotel?.location) {
                mockBooking.hotel.location.name = '';
            }

            const result = getBookingDestination(mockBooking);

            expect(result).toStrictEqual('Spain');
        });

        it('should return empty string when region and country NOT provided', () => {
            mockBooking.package.accom.hotel.location.name = '';

            if (!!mockBooking.hotel?.location) {
                mockBooking.hotel.location.name = '';
            }

            mockBooking.package.accom.hotel.country.name = '';

            if (!!mockBooking.hotel?.country) {
                mockBooking.hotel.country.name = '';
            }

            const result = getBookingDestination(mockBooking);

            expect(result).toStrictEqual('');
        });
    });

    describe('getCheckInLink', () => {
        it('should return checkInLink', () => {
            const checkInLink = getCheckInLink(
                mockBooking,
                jest.fn(p => p),
            );

            expect(checkInLink).toStrictEqual('CheckInLink');
        });

        it('should return null for checkInLink when booking reference NOT provided', () => {
            mockBooking.bookingReference = null;
            const checkInLink = getCheckInLink(
                mockBooking,
                jest.fn(p => p),
            );

            expect(checkInLink).toStrictEqual(null);
        });

        it('should return null for checkInLink when lead guest does NOT exist', () => {
            mockBooking.guests[1].isLead = false;
            const checkInLink = getCheckInLink(
                mockBooking,
                jest.fn(p => p),
            );

            expect(checkInLink).toStrictEqual(null);
        });
    });

    describe('getValidBalanceDueDate', () => {
        it('should return date from arguments when it is not equal to 01.01.0001', () => {
            expect(getValidBalanceDueDate('2022-10-19', '2023-10-19', 28)).toBe('2022-10-19');
        });

        it('should return date from arguments when it is equal to 01.01.0001', () => {
            expect(getValidBalanceDueDate('0001-01-01T00:00:00+00:00', '2023-10-19', 28)).toBe(
                '2023-09-21T00:00:00.000Z',
            );
        });
    });

    describe('getLeadGuestLastName', () => {
        it('should return correct last name', () => {
            const result = getLeadGuestLastName(mockBooking);

            expect(result).toEqual('Brown');
        });

        it('should return empty for empty guests list', () => {
            mockBooking.guests = [];
            const result = getLeadGuestLastName(mockBooking);

            expect(result).toEqual('');
        });

        it('should return empty for guests list without a lead', () => {
            mockBooking.guests = mockBooking.guests.map((g: IGuestPassenger) => {
                g.isLead = false;

                return g;
            });
            const result = getLeadGuestLastName(mockBooking);

            expect(result).toEqual('');
        });
    });

    describe('isFlightDeparted', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2025, 10, 10));
        });

        it('should return true if flight has departed', () => {
            mockBooking.package.transport.routes[0].depDate = '2020-01-01T10:00:00+00:00';
            const result = isFlightDeparted(mockBooking);
            expect(result).toBe(true);
        });

        it('should return false if flight has not departed', () => {
            mockBooking.package.transport.routes[0].depDate = '2025-11-10T10:00:00+00:00';
            const result = isFlightDeparted(mockBooking);
            expect(result).toBe(false);
        });
    });

    describe('getViewBookingRedirectLink', () => {
        it('should return preTravel link when pageName is PreTravel', () => {
            const result = getViewBookingRedirectLink(ViewBookingPageStates.PreTravel, mockViewBookingLinks);
            expect(result).toBe(mockViewBookingLinks.preTravel);
        });

        it('should return inDestination link when pageName is InDestination', () => {
            const result = getViewBookingRedirectLink(ViewBookingPageStates.InDestination, mockViewBookingLinks);
            expect(result).toBe(mockViewBookingLinks.inDestination);
        });

        it('should return viewBooking link when pageName is ViewBooking', () => {
            const result = getViewBookingRedirectLink(ViewBookingPageStates.ViewBooking, mockViewBookingLinks);
            expect(result).toBe(mockViewBookingLinks.viewBooking);
        });

        it('should return postTravel link when pageName is PostTravel', () => {
            const result = getViewBookingRedirectLink(ViewBookingPageStates.PostTravel, mockViewBookingLinks);
            expect(result).toBe(mockViewBookingLinks.postTravel);
        });

        it('should return viewBooking link when pageName is unknown', () => {
            const result = getViewBookingRedirectLink(ViewBookingPageStates.Unknown, mockViewBookingLinks);
            expect(result).toBe(mockViewBookingLinks.viewBooking);
        });
    });

    describe('getDaysBeforeDeparture', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2024, 4, 15));
        });

        it('should return correct days before departure', () => {
            mockBooking.package.transport.routes[0].depDate = '2024-06-20T10:00:00+00:00';
            const result = getDaysBeforeDeparture(mockBooking);
            expect(result).toBe(36);
        });

        it('should return undefined when no departure date', () => {
            mockBooking.package.transport.routes[0].depDate = undefined;
            const result = getDaysBeforeDeparture(mockBooking);
            expect(result).toBe(undefined);
        });
    });

    describe('matchGuestsToAssistedTravelRequest', () => {
        it('should return empty array when no guests', () => {
            const result = matchGuestsToAssistedTravelRequest([], {} as any, jest.fn());

            expect(result).toStrictEqual([]);
        });

        it('should match guests to assisted travel request and return correct data', () => {
            const guests: IGuestPassenger[] = [
                {
                    ...mockGuests[0],
                    firstName: 'Ann',
                    lastName: 'Brown',
                },
                {
                    ...mockGuests[1],
                    firstName: 'John',
                    lastName: 'Smith',
                },
            ];
            const mockAssistedTravelRequest: IAssistedTravelRequest = {
                passengers: [
                    {
                        assistanceTypes: ['assistanceType1', 'assistanceType2'],
                        hasRequest: true,
                        passengerName: 'Ann Brown',
                        questionsAndAnswers: [
                            {
                                question: 'Question 1',
                                answer: 'Answer 1',
                                questionCode: 'AT-001',
                            },
                        ],
                        requestedAt: '2024-05-10',
                    },
                ],
                bookingReference: 'bookingReference',
                caseId: 'caseId',
            };
            jest.spyOn(passengerUtils, 'getFullPassengerName')
                .mockReturnValueOnce('Miss Ann Brown')
                .mockReturnValueOnce('Mr John Smith');
            const result = matchGuestsToAssistedTravelRequest(guests, mockAssistedTravelRequest, jest.fn());

            expect(result).toStrictEqual([
                {
                    passenger: guests[0],
                    passengerName: 'Miss Ann Brown',
                    requestedAt: '10 May 2024',
                },
                {
                    passenger: guests[1],
                    passengerName: 'Mr John Smith',
                    requestedAt: '',
                },
            ]);
        });
    });

    describe('callChatBot', () => {
        beforeEach(() => {
            const chatbotDiv = document.createElement('div');
            chatbotDiv.id = 'chatbotContainer';
            const chatbotElement = document.createElement('div');
            chatbotElement.id = 'gct-chatbot';

            const shadowRoot = {
                getElementById: jest.fn().mockReturnValue(chatbotDiv),
            };
            Object.defineProperty(chatbotElement, 'shadowRoot', {
                get: () => shadowRoot,
            });

            jest.spyOn(document, 'getElementById').mockReturnValue(chatbotElement);
        });

        const mockToggleChatbot = jest.fn();
        window['toggleChatbot'] = mockToggleChatbot;

        const mockEventTarget = document.createElement('a');
        mockEventTarget.id = 'live-chat-btn';
        const mockEvent = {
            target: mockEventTarget,
            preventDefault: jest.fn(),
        } as unknown as MouseEvent;

        it('should open chat bot', async () => {
            jest.spyOn(window, 'getComputedStyle').mockReturnValue({
                display: 'none',
            } as unknown as CSSStyleDeclaration);

            callChatBot(mockEvent);

            expect(mockToggleChatbot).toHaveBeenCalled();
        });

        it('should keep chatbot opened when chatbot is already visible', async () => {
            jest.spyOn(window, 'getComputedStyle').mockReturnValue({
                display: 'block',
            } as unknown as CSSStyleDeclaration);

            callChatBot(mockEvent);

            expect(mockToggleChatbot).not.toHaveBeenCalled();
        });

        it('should NOT call any chat bot related function when it is NOT injected on the page', async () => {
            const chatbotElement = document.createElement('div');
            chatbotElement.id = 'gct-chatbot';

            Object.defineProperty(chatbotElement, 'shadowRoot', {
                get: () => undefined,
            });

            jest.spyOn(document, 'getElementById').mockReturnValue(chatbotElement);

            callChatBot(mockEvent);

            expect(mockToggleChatbot).not.toHaveBeenCalled();
        });
    });

    describe('getBookingDestinationForTracking', () => {
        it('should return "generic" when booking is null', () => {
            const result = getBookingDestinationForTracking(null);

            expect(result).toBe('generic');
        });

        it('should return formatted destination string with country, region and resort', () => {
            const result = getBookingDestinationForTracking(mockBooking);

            expect(result).toBe('spain-tenerife-playa-paraiso');
        });

        it('should return only country and region when resort is not provided', () => {
            mockBooking.package.accom.hotel.resort.name = '';
            mockBooking.hotel.resort.name = '';

            const result = getBookingDestinationForTracking(mockBooking);

            expect(result).toBe('spain-tenerife');
        });

        it('should replace spaces with dashes and return lowercase', () => {
            mockBooking.package.accom.hotel.country.name = 'Canary Islands';
            mockBooking.package.accom.hotel.location.name = '';
            mockBooking.package.accom.hotel.resort.name = '';
            mockBooking.hotel.country.name = '';
            mockBooking.hotel.location.name = '';
            mockBooking.hotel.resort.name = '';

            const result = getBookingDestinationForTracking(mockBooking);

            expect(result).toBe('canary-islands');
        });

        it('should fall back to booking.hotel when accom hotel is not provided', () => {
            mockBooking.package.accom.hotel = null;

            const result = getBookingDestinationForTracking(mockBooking);

            expect(result).toBe('united-states-united-states-resort-example');
        });

        it('should return "generic" when all location fields are empty', () => {
            mockBooking.package.accom.hotel.country.name = '';
            mockBooking.package.accom.hotel.location.name = '';
            mockBooking.package.accom.hotel.resort.name = '';
            mockBooking.hotel.country.name = '';
            mockBooking.hotel.location.name = '';
            mockBooking.hotel.resort.name = '';

            const result = getBookingDestinationForTracking(mockBooking);

            expect(result).toBe('generic');
        });
    });

    describe('getBookingType', () => {
        it('should return "trade" when booking type is ExternalAgency', () => {
            mockBooking.isExternalAgency = true;
            const result = getBookingType(mockBooking);

            expect(result).toBe(BookingTypeForFeedback.ExternalAgency);
        });

        it('should return "flight plus hotel" when booking type is FlightAndHotel', () => {
            mockBooking.promoCollections = ['fph'];
            const result = getBookingType(mockBooking);

            expect(result).toBe(BookingTypeForFeedback.FlightAndHotel);
        });

        it('should return "luxury" when booking type is Luxury', () => {
            mockBooking.promoCollections = ['lux'];
            const result = getBookingType(mockBooking);

            expect(result).toBe(BookingTypeForFeedback.Luxury);
        });

        it('should return "standard" when booking type is HolidaysBooking', () => {
            const result = getBookingType(mockBooking);

            expect(result).toBe(BookingTypeForFeedback.HolidaysBooking);
        });
    });
});
