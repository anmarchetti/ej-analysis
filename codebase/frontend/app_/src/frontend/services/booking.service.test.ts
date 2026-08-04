import Axios from 'axios';

import { webApiUrls } from 'code/endpoints';
import {
    mockAmendDatesOfferWithPrice,
    mockAmendHotelOffer,
    mockBoardType,
    mockBooking,
    mockFlightsOffers,
    mockRoomAndBoardRoomVariant,
    mockTransfer,
} from 'frontend/__mocks__';
import { ApiError } from 'models/data/ApiError';
import { ISubmitDatesQuery } from 'models/data/bookingAmendment/AmendDates';
import { IBookingPaymentInfo, ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { ILeadPassenger } from 'models/data/ILeadPassenger';
import { IOffer } from 'models/data/IOffer';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import HttpsStatusCodes from 'models/enum/HttpStatusCodes';
import { RefundOption } from 'models/enum/RefundOptions';
import { RoomAllocation } from 'models/RoomAllocation';

import bookingService from './booking.service';
import { logger } from './logging';

const mockAxiosGet = jest.fn(
    () =>
        new Promise(() => ({
            then: jest.fn(),
            catch: jest.fn(),
        })),
);
const mockAxiosPost = jest.fn();
const mockAxiosIsCancel = jest.fn();
const mockAxiosPut = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        // @ts-ignore
        get: (...data) => mockAxiosGet(...data),
        post: (...data) => mockAxiosPost(...data),
        put: (...data) => mockAxiosPut(...data),
    }),
    isCancel: (...params) => mockAxiosIsCancel(...params),
    CancelToken: {
        source: () => ({ token: 'cancelToken' }),
    },
}));
jest.mock('./logging');
window.errorTracking = jest.fn();

describe('booking.service', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('getAmendHotelTransfers', () => {
        const cancelSource = Axios.CancelToken.source();

        it('should call post request and return data', async () => {
            mockAxiosPost.mockImplementationOnce(() => Promise.resolve({ data: 'data' }));

            const result = await bookingService.getAmendHotelTransfers(
                'booking-ref',
                mockAmendHotelOffer,
                cancelSource,
            );

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/amend-hotel/alternative-transfers',
                {
                    bookingRef: 'booking-ref',
                    amendHotelOffer: mockAmendHotelOffer,
                },
                {
                    cancelToken: cancelSource.token,
                },
            );
            expect(result).toBe('data');
        });

        it('should return an empty array if the call will be canceled', async () => {
            mockAxiosIsCancel.mockReturnValue(true);
            mockAxiosPost.mockImplementationOnce(() => Promise.reject(new Error('Test error')));

            const result = await bookingService.getAmendHotelTransfers(
                'booking-ref',
                mockAmendHotelOffer,
                cancelSource,
            );

            expect(result).toStrictEqual([]);

            mockAxiosIsCancel.mockReturnValue(false);
        });

        it('should throw ApiError if error request did an error', async () => {
            mockAxiosPost.mockImplementationOnce(() => Promise.reject(new Error('Test error')));

            try {
                await bookingService.getAmendHotelTransfers('booking-ref', mockAmendHotelOffer);
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
                expect(e.message).toBe('Test error');
            }
        });
    });

    describe('getHotelErrataMessages', () => {
        const params = { codes: ['code 1', 'code 2'], offerDate: '2023-01-12' };

        it('should return result from api', async () => {
            mockAxiosGet.mockImplementationOnce(() => Promise.resolve({ data: 'data' }));
            const result = await bookingService.getHotelErrataMessages(params);

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/errata/accom-errata?codes%5B0%5D=code%201&codes%5B1%5D=code%202&offerDate=2023-01-12',
                undefined,
            );
            expect(result).toBe('data');
        });

        it('Should catch an error and pass it further', async () => {
            mockAxiosGet.mockRejectedValueOnce(
                new ApiError({
                    response: {
                        data: {
                            code: 'test-code',
                            error: 'some message',
                        },
                    },
                } as any),
            );

            try {
                await bookingService.getHotelErrataMessages(params);
            } catch (e) {
                expect(e.response.data.code).toBe('test-code');
                expect(e.response.data.error).toBe('some message');
            }
        });
    });

    describe('getAmendDatesValidatedOffer', () => {
        it('should invoke post with params', async () => {
            await bookingService.getAmendDatesValidatedOffer(mockAmendDatesOfferWithPrice);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.amendDatesValidateOffer(),
                [mockAmendDatesOfferWithPrice],
                undefined,
            );
        });
    });

    describe('loadHotelHighlightsInfo', () => {
        it('should invoke get with params', async () => {
            await bookingService.loadHotelHighlightsInfo('hotel-code');

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.loadHotelHighlightsInfo('hotel-code'), undefined);
        });
    });

    describe('getAmendDatesBooking', () => {
        const apiParams: ISubmitDatesQuery = {
            accomId: 'accomId',
            boardType: mockBoardType.code,
            bookingRef: mockBooking.bookingReference,
            duration: 13,
            inboundDepTime: 'date1',
            outboundDepTime: 'date2',
            rooms: [{ adults: 2, children: 2, infants: 1, roomCode: 'roomCode', childrenAges: [10, 9] }],
            selectedDate: '2023-10-12',
            transferCode: mockTransfer.code,
        };

        it("It should be called with 'get' and include parameters and a cancellation token, then return the data", async () => {
            mockAxiosGet.mockResolvedValue({ data: 'data' });
            const result = await bookingService.getAmendDatesBooking(apiParams, 'cancelToken' as any);

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/amend-dates/summary?accomId=accomId&boardType=HB&bookingRef=bookingReference&duration=13&inboundDepTime=date1&outboundDepTime=date2&room[0].adults=2&room[0].children=2&room[0].infants=1&room[0].roomCode=roomCode&selectedDate=2023-10-12&transferCode=TRANSFER_CODE&childAges=10%2C9',
                {
                    cancelToken: 'cancelToken',
                },
            );
            expect(result).toBe('data');
        });

        it('It should catch an error and pass it as an AxiosError further', async () => {
            mockAxiosGet.mockRejectedValue(new Error('test'));

            try {
                await bookingService.getAmendDatesBooking(apiParams);
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
                expect(e.message).toBe('test');
            }
        });

        it('Catch axios cancel error and pass through original error', async () => {
            mockAxiosIsCancel.mockImplementation(() => true);
            mockAxiosGet.mockRejectedValue(new Error('test'));

            try {
                await bookingService.getAmendDatesBooking(apiParams);
            } catch (e) {
                expect(e instanceof ApiError).toBe(false);
                expect(e.message).toBe('test');
            }
        });
    });

    describe('commitBooking', () => {
        const mockCommitBookingRequestBody: ICommitBookingRequestBody = {
            browserInfo: {
                acceptHeader: 'application/json,text/plain,*/*',
                colourDepth: 24,
                javaEnabled: false,
                javaScriptEnabled: true,
                language: 'en-GB',
                screenHeight: 1080,
                screenWidth: 1920,
                timeZoneOffset: -60,
                userAgent: 'testUserAgent',
            },
            bookingReference: 'test-booking-reference',
            guests: [],
            leadPassenger: {} as ILeadPassenger,
            offer: {} as IOffer,
            paymentInfo: {} as IBookingPaymentInfo,
        };

        it('should commit booking', async () => {
            await bookingService.commitBooking(mockCommitBookingRequestBody, '');

            expect(mockAxiosPost).toHaveBeenCalledWith(
                `http://test/api/v1.0/booking/commit`,
                mockCommitBookingRequestBody,
                {
                    headers: { 'X-ejh-Idempotency-Key': '' },
                },
            );
        });

        it('should log commit booking error API-ERR-000002', async () => {
            mockAxiosPost.mockRejectedValueOnce(
                new ApiError({
                    response: {
                        data: {
                            code: 'ANY-ERR-AN_ERROR_CODE',
                            error: 'some message',
                        },
                    },
                    errorCode: 'ANY-ERR-AN_ERROR_CODE',
                } as any),
            );

            try {
                await bookingService.commitBooking(mockCommitBookingRequestBody, 'test-transaction-id');
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith(
                    expect.objectContaining({
                        e,
                        message:
                            'Failed to commitBooking with bookingReference test-booking-reference returned errorCode ANY-ERR-AN_ERROR_CODE',
                    }),
                    'test-transaction-id',
                );
            }
        });
    });

    describe('validatePackage', () => {
        it('should validate package', async () => {
            const holidayPackage = {
                offer: {
                    id: 1,
                },
            };

            await bookingService.validatePackage(holidayPackage);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                `http://test/api/v1.0/booking/validate-package`,
                holidayPackage,
                undefined,
            );
        });

        it('should log validate package error API-ERR-000002', async () => {
            mockAxiosPost.mockRejectedValueOnce(
                new ApiError({
                    response: {
                        data: {
                            code: 'API-ERR-000002',
                            message: 'some message',
                        },
                    },
                } as any),
            );

            try {
                await bookingService.validatePackage({});
            } catch (e) {
                expect(logger.error).toHaveBeenCalled();
            }
        });
    });

    describe('validatePromoCode', () => {
        it('should validate promo code', async () => {
            const holidayPackage = {
                offer: {
                    id: 1,
                },
            };

            await bookingService.validatePromoCode(holidayPackage);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                `http://test/api/v1.0/booking/validate-promo-code`,
                holidayPackage,
                undefined,
            );
        });

        it('should log validate promo code error API-ERR-000002', async () => {
            mockAxiosPost.mockRejectedValueOnce(
                new ApiError({
                    response: {
                        data: {
                            code: 'API-ERR-000002',
                            message: 'some message',
                        },
                    },
                } as any),
            );

            await expect(bookingService.validatePromoCode({})).rejects.toThrow();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should not log when validate promo code fails with non-Error rejection', async () => {
            const nonErrorRejection = { response: { data: { code: 'API-ERR-000002' } } };
            mockAxiosPost.mockRejectedValueOnce(nonErrorRejection);

            await expect(bookingService.validatePromoCode({})).rejects.toThrow();
            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe('loadAlternativeFlights', () => {
        it('should load alternative flight', async () => {
            const data = { id: 'test' } as any;
            const resultData = { data };
            const d = new Date('2019-08-02T14:26:15.268Z');
            mockAxiosGet.mockImplementationOnce(() => Promise.resolve(resultData));
            const rooms = [new RoomAllocation()];
            rooms[0].addAdult();
            rooms[0].addChild();
            rooms[0].addChild();
            rooms[0].children[0].age = 2;
            rooms[0].children[1].age = 2;
            rooms[0].addInfant();
            rooms[0].addInfant();
            rooms[0].addInfant();
            rooms[0].setRoomCode('test');
            const result = await bookingService.loadAlternativeFlights(
                d,
                3,
                '1',
                'dep',
                [],
                'accomID',
                'boardType',
                'outboundRouteId',
                'inboundRouteId',
                'transfer',
                true,
                'originalAirport',
            );

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/search/alternative-flights?startDate=2019-08-02&flexibleDays=3&duration=1&departure=dep&accommodationId=accomID&boardType=boardType&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&transfer=transfer&withHotels=true&originalAirport=originalAirport',
                undefined,
            );
            expect(result).toEqual(data);
        });

        it('should include ecp in url when in fph funnel', async () => {
            const data = { id: 'test' } as any;
            mockAxiosGet.mockImplementationOnce(() => Promise.resolve({ data }));
            const d = new Date('2019-08-02T14:26:15.268Z');

            await bookingService.loadAlternativeFlights(
                d,
                3,
                '1',
                'dep',
                [],
                'accomID',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'fph',
            );

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/search/alternative-flights?startDate=2019-08-02&flexibleDays=3&duration=1&departure=dep&accommodationId=accomID&ecp=fph',
                undefined,
            );
        });
    });

    describe('fetchOffersAlterations', () => {
        it('should fetch offer alterations', async () => {
            const currentDate = new Date('2019-08-02T14:26:15.268Z');
            const altBoards = [
                { accommodationId: 'ITSI0005', code: 'HB', packageId: '2208703740/2/2043/6', price: 666.66 },
                { accommodationId: 'ITSI0006', code: 'HB+', packageId: '2208703740/2/2044/6', price: 111.11 },
            ];
            const resultData = {
                data: {
                    rooms: [
                        [{ code: '1', roomType: { code: '1', content: 'lorem' } }],
                        [{ code: '2', roomType: { code: '2', content: 'lorem2' } }],
                    ],
                    altBoards,
                },
            };

            mockAxiosGet.mockImplementationOnce(() => Promise.resolve(resultData));

            const rooms = [new RoomAllocation()];

            rooms[0].addAdult();
            rooms[0].addAdult();

            const result = await bookingService.fetchOffersAlterations(
                currentDate,
                3,
                '1',
                'dep',
                [],
                'accomID',
                'outboundRouteId',
                'inboundRouteId',
                'packageId',
                '',
                false,
                [{ accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' }],
            );

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/search/offers-alterations?startDate=2019-08-02&flexibleDays=3&duration=1&departure=dep&accommodationId=accomID&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId&altAcc[0].accId=GRCF0044&altAcc[0].packId=2154857381/2/1950/21',
                undefined,
            );

            expect(result).toEqual({
                rooms: [
                    [{ code: '1', roomType: { code: '1', content: 'lorem' } }],
                    [{ code: '2', roomType: { code: '2', content: 'lorem2' } }],
                ],
                boards: altBoards,
            });
        });

        it('should include ecp in url when in fph funnel', async () => {
            const resultData = {
                data: { rooms: [], altBoards: [] },
            };
            mockAxiosGet.mockImplementationOnce(() => Promise.resolve(resultData));
            const d = new Date('2019-08-02T14:26:15.268Z');

            await bookingService.fetchOffersAlterations(
                d,
                3,
                '1',
                'dep',
                [],
                'accomID',
                'outboundRouteId',
                'inboundRouteId',
                'packageId',
                '',
                undefined,
                undefined,
                undefined,
                'fph',
            );

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/search/offers-alterations?startDate=2019-08-02&flexibleDays=3&duration=1&departure=dep&accommodationId=accomID&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId&ecp=fph',
                undefined,
            );
        });
    });

    describe('getAmendAlternativeFlightsWithLivePrice', () => {
        it('should request correct url', async () => {
            mockAxiosGet.mockResolvedValueOnce({});
            await bookingService.getAmendAlternativeFlightsWithLivePrice(mockBooking, mockFlightsOffers);

            const requestUrl = mockAxiosPost.mock.calls[0][0] as string;
            expect(requestUrl.includes('/amend/alternative-flights/validate')).toBeTruthy();
        });

        it('Should not call logger when fetch was canceled', async () => {
            mockAxiosIsCancel.mockImplementation(() => true);
            mockAxiosPost.mockRejectedValue(new Error('test'));

            try {
                await bookingService.getAmendAlternativeFlightsWithLivePrice(mockBooking, mockFlightsOffers);
            } catch (e) {
                expect(logger.error).not.toHaveBeenCalled();
            }
        });
    });

    describe('getAmendAlternativeFlights', () => {
        it('should request correct url', async () => {
            mockAxiosGet.mockResolvedValueOnce({});
            await bookingService.getAmendAlternativeFlights({
                package: {
                    accom: {
                        code: 'ESFU0045',
                        endDate: '2023-04-07',
                        id: '1',
                        isExt: false,
                        prom: 'EUBO',
                        startDate: '2023-04-02',
                        rooms: [
                            {
                                code: 'SW01',
                                price: 0,
                                pricePP: 0,
                                avail: 0,
                                isFreeForKids: false,
                                roomType: {
                                    code: 'SW01',
                                    title: 'Suite',
                                    description: '',
                                    content: '',
                                    stays: [],
                                },
                                board: 'HB',
                                boardType: {
                                    code: 'HB',
                                    title: 'Half Board',
                                    content: '<ul>\n    <li>Breakfast</li>\n    <li>Dinner</li>\n</ul>',
                                    description: 'Breakfast\r\nDinner',
                                },
                                occupation: {
                                    adults: 2,
                                    children: 0,
                                    infants: 0,
                                    paxIds: [1, 2],
                                    childAges: [],
                                },
                            },
                        ],
                    },
                    transport: {
                        routes: [
                            {
                                direction: 'outbound',
                                fltNo: 'EZY123',
                                depPt: 'LGW',
                            },
                            {
                                direction: 'inbound',
                                fltNo: 'EZY456',
                            },
                        ],
                    },
                },
                transfers: [
                    {
                        id: '4',
                        code: 'W2MS011592SS',
                    },
                ],
                discountCode: 'abcde',
                bookingReference: '123456789',
                prom: 'EUBO',
                paymentInfo: {
                    pricePP: 517.86,
                    totalPrice: 1035.72,
                },
            } as any);

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/alternative-flights?bookingReference=123456789',
                { cancelToken: undefined },
            );
        });
    });

    describe('getAmendSeats', () => {
        const mockedSeatSelection: ISelectedSeat[] = [
            {
                sectorId: '1',
                seats: [{ paxIndex: 1, seatNumber: '2W' }],
            },
        ];

        it('should send correct post request', async () => {
            const resultData = {
                data: {
                    newSeatSelection: mockedSeatSelection,
                    amendmentCharges: '123.21',
                },
            };
            mockAxiosPost.mockResolvedValueOnce(resultData);
            await bookingService.getAmendSeats('bookingReference', mockedSeatSelection, {} as any);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/seats',
                { bookingReference: 'bookingReference', seatSelection: mockedSeatSelection },
                { cancelToken: undefined },
            );
        });

        it('should return data', async () => {
            const resultData = {
                data: {
                    newSeatSelection: mockedSeatSelection,
                    amendmentCharges: '123.21',
                },
            };
            mockAxiosPost.mockResolvedValueOnce(resultData);
            const res = await bookingService.getAmendSeats('bookingReference', mockedSeatSelection, {} as any);

            expect(res).toEqual(resultData.data);
        });
    });

    describe('getAvailableAmendDates', () => {
        it('should return data', async () => {
            const resultData = {
                data: {
                    amendDates: [
                        {
                            date: 'date',
                            isAvailable: true,
                        },
                    ],
                    availableHoliday: false,
                },
            };
            const mockParams = {
                accommodationId: 'accommodationId',
                departure: 'departure',
                duration: 'duration',
                endDate: 'endDate',
                startDate: 'startDate',
            };
            mockAxiosGet.mockResolvedValueOnce(resultData);
            webApiUrls.amendDatesAvailability = jest.fn().mockReturnValue('url');

            const res = await bookingService.getAvailableAmendDates(mockParams as any);

            expect(mockAxiosGet).toHaveBeenCalledWith('url', undefined);
            expect(res).toEqual(resultData.data);
        });
    });

    describe('getAmendDatesFlightOptions', () => {
        it('should correctly form the url and make request', async () => {
            mockAxiosPost.mockImplementationOnce(() => Promise.resolve({ data: {} }));
            await bookingService.getAmendDatesFlightsOptions(mockAmendDatesOfferWithPrice);

            const expectedUrl = webApiUrls.amendDatesFlights();

            expect(mockAxiosPost).toHaveBeenCalledWith(expectedUrl, mockAmendDatesOfferWithPrice, undefined);
        });

        it('should throw error if response is not 200', async () => {
            mockAxiosPost.mockImplementationOnce(() =>
                Promise.reject({ response: { status: HttpsStatusCodes.InternalServerError } }),
            );

            try {
                await bookingService.getAmendDatesFlightsOptions(mockAmendDatesOfferWithPrice);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith({
                    e: {
                        response: {
                            status: HttpsStatusCodes.InternalServerError,
                        },
                    },
                });
            }
        });
    });

    describe('getAmendDatesValidatedFlights', () => {
        it('should correctly form the url and make request', async () => {
            mockAxiosPost.mockImplementationOnce(() => Promise.resolve({ data: {} }));
            await bookingService.getAmendDatesValidatedFlights([mockAmendDatesOfferWithPrice]);

            const expectedUrl = webApiUrls.amendDatesValidateOffer();

            expect(mockAxiosPost).toHaveBeenCalledWith(expectedUrl, [mockAmendDatesOfferWithPrice], {
                cancelToken: undefined,
            });
        });

        it('should throw error if response is not 200', async () => {
            mockAxiosPost.mockImplementationOnce(() =>
                Promise.reject({ response: { status: HttpsStatusCodes.InternalServerError } }),
            );

            try {
                await bookingService.getAmendDatesValidatedFlights([mockAmendDatesOfferWithPrice]);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith({
                    e: {
                        response: {
                            status: HttpsStatusCodes.InternalServerError,
                        },
                    },
                });
            }
        });

        it('Should not call logger when fetch was canceled', async () => {
            mockAxiosIsCancel.mockImplementation(() => true);
            mockAxiosPost.mockRejectedValue(new Error('test'));

            try {
                await bookingService.getAmendDatesValidatedFlights([mockAmendDatesOfferWithPrice]);
            } catch (e) {
                expect(logger.error).not.toHaveBeenCalled();
            }
        });
    });

    describe('fetchBookingExtras', () => {
        it('should send post request and return response data', async () => {
            const body = {
                offer: 'my offer',
            };
            const resultData = {
                data: [
                    {
                        routeId: '1',
                        flightNumber: '2333',
                        flightExtraCategories: [],
                    },
                ],
            };
            mockAxiosPost.mockImplementationOnce(() => Promise.resolve(resultData));
            const res = await bookingService.fetchBookingExtras(body);

            expect(mockAxiosPost).toHaveBeenCalledWith('http://test/api/v1.0/search/flight-extras', body, undefined);
            expect(res).toEqual(resultData.data);
        });
    });

    describe('getAlternativeAmendHotels', () => {
        it('throw Axios error', async () => {
            const error = new Error('Test error');
            mockAxiosPost.mockRejectedValueOnce(error);
            mockAxiosIsCancel.mockReturnValue(true);

            try {
                await bookingService.getAlternativeAmendHotels('bookingReference');
            } catch (e) {
                expect(e).toStrictEqual(error);
            }
        });

        it('should be called with default params for page number and page size', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'data' });
            const result = await bookingService.getAlternativeAmendHotels('bookingReference');

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/amend-hotel/hotel-list',
                {
                    bookingRef: 'bookingReference',
                    searchParameters: {
                        page: 1,
                        pageSize: 10,
                    },
                },
                { cancelToken: undefined },
            );
            expect(result).toStrictEqual('data');
        });

        it('should be called with passed params for page number and page size', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'data' });
            const result = await bookingService.getAlternativeAmendHotels('bookingReference', {}, 2, 20);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/amend-hotel/hotel-list',
                {
                    bookingRef: 'bookingReference',
                    searchParameters: {
                        page: 2,
                        pageSize: 20,
                    },
                },
                { cancelToken: undefined },
            );
            expect(result).toStrictEqual('data');
        });

        it('should pass filters to request in searchParameteres', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'data' });
            const result = await bookingService.getAlternativeAmendHotels('bookingReference', {
                isPricePP: false,
                priceFrom: 200,
                priceTo: 400,
                TripAdvisorRating: '4',
                boardType: 'HB',
                facilities: 'pool, wifi',
                starRating: '3',
                packageTheme: 'beach',
            });

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/amend-hotel/hotel-list',
                {
                    bookingRef: 'bookingReference',
                    searchParameters: {
                        page: 1,
                        pageSize: 10,
                        isPricePP: false,
                        priceFrom: 200,
                        priceTo: 400,
                        TripAdvisorRating: '4',
                        boardType: 'HB',
                        facilities: 'pool, wifi',
                        starRating: '3',
                        packageTheme: 'beach',
                    },
                },
                { cancelToken: undefined },
            );
            expect(result).toStrictEqual('data');
        });

        it('should throw error if response is not 200', async () => {
            mockAxiosPost.mockRejectedValueOnce({ response: { status: HttpsStatusCodes.InternalServerError } });

            try {
                await bookingService.getAlternativeAmendHotels('bookingReference');
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
            }
        });
    });

    describe('validateAlternativeAmendHotel', () => {
        it('should be called with booking reference and hotel offer', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'data' });
            const result = await bookingService.validateAlternativeAmendHotel('bookingReference', mockAmendHotelOffer);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/amend-hotel/validate',
                {
                    bookingRef: 'bookingReference',
                    amendHotelOffer: mockAmendHotelOffer,
                },
                undefined,
            );
            expect(result).toStrictEqual('data');
        });

        it('should throw error if response is not 200', async () => {
            mockAxiosPost.mockRejectedValueOnce({ response: { status: HttpsStatusCodes.InternalServerError } });

            try {
                await bookingService.validateAlternativeAmendHotel('bookingReference', mockAmendHotelOffer);
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
            }
        });
    });

    describe('getAmendRoomAndBoardVariants', () => {
        it('Should be called with appropriate params', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'data' });
            const result = await bookingService.getAmendRoomAndBoardVariants('bookingReference');

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/amend/amend-room-and-board/info?bookingReference=bookingReference',
                { cancelToken: undefined },
            );
            expect(result).toStrictEqual('data');
        });

        it('Should axios cancel token be called', async () => {
            mockAxiosIsCancel.mockImplementationOnce(() => true);
            mockAxiosGet.mockRejectedValueOnce(new Error('test'));

            try {
                await bookingService.getAmendRoomAndBoardVariants('bookingReference');
            } catch (e) {
                expect(mockAxiosIsCancel).toHaveBeenCalled();
                expect(e.message).toBe('test');
            }
        });

        it('Should an error be thrown', async () => {
            mockAxiosGet.mockRejectedValueOnce(new Error('test'));
            mockAxiosIsCancel.mockImplementation(() => false);

            try {
                await bookingService.getAmendRoomAndBoardVariants('bookingReference');
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
            }
        });
    });

    describe('amendRoomAndBoardValidateOffer', () => {
        it('Should call post request', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'data' });
            const cancelSource = Axios.CancelToken.source();
            const result = await bookingService.amendRoomAndBoardValidateOffer(
                mockRoomAndBoardRoomVariant,
                [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant],
                '12345',
                'promo',
                cancelSource.token,
            );

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.amendRoomAndBoardValidateOffer,
                {
                    selectedRoomVariant: mockRoomAndBoardRoomVariant,
                    roomVariants: [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant],
                    bookingRef: '12345',
                    discountCode: 'promo',
                },
                { cancelToken: cancelSource.token },
            );
            expect(result).toStrictEqual('data');
        });

        it('Should an error be thrown', async () => {
            mockAxiosPost.mockRejectedValueOnce(new Error('test'));

            try {
                await bookingService.amendRoomAndBoardValidateOffer(
                    mockRoomAndBoardRoomVariant,
                    [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant],
                    '12345',
                );
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
            }
        });

        it('Should axios cancel token be called', async () => {
            mockAxiosIsCancel.mockImplementationOnce(() => true);
            mockAxiosPost.mockRejectedValueOnce(new Error('test'));

            try {
                await bookingService.amendRoomAndBoardValidateOffer(
                    mockRoomAndBoardRoomVariant,
                    [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant],
                    '12345',
                );
            } catch (e) {
                expect(mockAxiosIsCancel).toHaveBeenCalled();
                expect(e.message).toBe('test');
            }
        });
    });

    describe('loadDestinationImage', () => {
        it('should return data', async () => {
            const mockUrl = 'url';
            const resultData = {
                data: 'data',
            };
            const locationCode = 'EWB';

            mockAxiosGet.mockResolvedValueOnce(resultData);
            webApiUrls.getDestinationLocationImage = jest.fn().mockReturnValue(mockUrl);

            const res = await bookingService.loadDestinationImage(locationCode);

            expect(webApiUrls.getDestinationLocationImage).toHaveBeenCalledWith(locationCode);
            expect(mockAxiosGet).toHaveBeenCalledWith(mockUrl, undefined);
            expect(res).toEqual(resultData.data);
        });

        it('Should an error be thrown', async () => {
            mockAxiosGet.mockRejectedValueOnce(new Error('test'));

            try {
                await bookingService.loadDestinationImage('EWB');
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
            }
        });

        it('Should axios cancel token be called', async () => {
            const errorMessage = 'test';
            mockAxiosIsCancel.mockImplementationOnce(() => true);
            mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage));

            try {
                await bookingService.loadDestinationImage('EWB');
            } catch (e) {
                expect(mockAxiosIsCancel).toHaveBeenCalled();
                expect(e.message).toBe(errorMessage);
            }
        });
    });

    describe('getAmendHotelRoomAndBoardVariants', () => {
        const bookingRef = '1234';
        const amendHotelOffer = mockAmendHotelOffer;

        it('should return data', async () => {
            const resultData = {
                data: 'data',
            };

            mockAxiosPost.mockResolvedValueOnce(resultData);

            const res = await bookingService.getAmendHotelRoomAndBoardVariants(
                bookingRef,
                amendHotelOffer,
                Axios.CancelToken.source().token,
            );
            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.amendHotelRoomAndBoardOffers,
                expect.objectContaining({
                    bookingRef,
                    amendHotelOffer,
                }),
                { cancelToken: 'cancelToken' },
            );
            expect(res).toEqual(resultData.data);
        });

        it('Should an error be thrown', async () => {
            mockAxiosPost.mockRejectedValueOnce(new Error('test'));

            try {
                await bookingService.getAmendHotelRoomAndBoardVariants(bookingRef, amendHotelOffer);
            } catch (e) {
                expect(mockAxiosIsCancel).toHaveBeenCalledWith(e);
                expect(e instanceof ApiError).toBe(true);
            }
        });
    });

    describe('getCancellationSummary', () => {
        it('Should be called with appropriate booking params', async () => {
            mockAxiosPost.mockImplementationOnce(() =>
                Promise.resolve({
                    data: 'data',
                }),
            );
            const result = await bookingService.getCancellationSummary('bookingReference', 'last name', 'date');

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/booking/cancellation/summary/customer',
                {
                    bookingReference: 'bookingReference',
                    lastName: 'last name',
                    date: 'date',
                },
                undefined,
            );
            expect(result).toStrictEqual('data');
        });

        it('should call right endpoint for trade portal', async () => {
            mockAxiosPost.mockImplementationOnce(() =>
                Promise.resolve({
                    data: 'data',
                }),
            );
            const result = await bookingService.getCancellationSummary('bookingReference', 'last name', 'date', true);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/booking/cancellation/summary/trade',
                {
                    bookingReference: 'bookingReference',
                    lastName: 'last name',
                    date: 'date',
                },
                undefined,
            );
            expect(result).toStrictEqual('data');
        });

        it('Should return an error when request was NOT successful', async () => {
            mockAxiosPost.mockRejectedValueOnce(
                new ApiError({
                    response: {
                        data: {
                            code: 'test-code',
                            error: 'some message',
                        },
                    },
                } as any),
            );

            try {
                await bookingService.getCancellationSummary('bookingReference', 'last name', 'date');
            } catch (e) {
                expect(e.response.data.code).toBe('test-code');
                expect(e.response.data.error).toBe('some message');
            }
        });
    });

    describe('cancelBooking', () => {
        it('Should be called with appropriate booking and refund params', async () => {
            mockAxiosPut.mockImplementationOnce(() =>
                Promise.resolve({
                    data: 'data',
                }),
            );
            const result = await bookingService.cancelBooking(
                RefundOption.Credit,
                123,
                'bookingReference',
                'last name',
                'date',
            );

            expect(mockAxiosPut).toHaveBeenCalledWith(
                'http://test/api/v1.0/booking/cancellation/customer',
                {
                    refundOption: RefundOption.Credit,
                    bookingBreakdownValidationHash: 123,
                    source: 'WEB',
                    bookingReference: 'bookingReference',
                    lastName: 'last name',
                    date: 'date',
                },
                undefined,
            );
            expect(result).toStrictEqual('data');
        });

        it('Should be called with appropriate booking, refund and agent params and isTradePortal flag', async () => {
            mockAxiosPut.mockImplementationOnce(() =>
                Promise.resolve({
                    data: 'data',
                }),
            );
            const result = await bookingService.cancelBooking(
                RefundOption.Credit,
                123,
                'bookingReference',
                'last name',
                'date',
                true,
                {
                    number: 'agent123',
                    name: 'agentName',
                    ref: 'agentRef',
                },
            );

            expect(mockAxiosPut).toHaveBeenCalledWith(
                'http://test/api/v1.0/booking/cancellation/trade',
                {
                    refundOption: RefundOption.Credit,
                    bookingBreakdownValidationHash: 123,
                    source: 'WEB',
                    bookingReference: 'bookingReference',
                    lastName: 'last name',
                    date: 'date',
                    supplierId: 'agent123',
                    cancellationName: 'agentName',
                },
                undefined,
            );
            expect(result).toStrictEqual('data');
        });

        it('Should return an error when request was NOT successful', async () => {
            mockAxiosPut.mockRejectedValueOnce(
                new ApiError({
                    response: {
                        data: {
                            code: 'test-code',
                            error: 'some message',
                        },
                    },
                } as any),
            );

            try {
                await bookingService.cancelBooking(RefundOption.Credit, 123, 'bookingReference', 'last name', 'date');
            } catch (e) {
                expect(e.response.data.code).toBe('test-code');
                expect(e.response.data.error).toBe('some message');
            }
        });
    });

    describe('getBookingTransfers', () => {
        it('should call post request with correct URL and body and return data', async () => {
            const mockTransfersData = { data: 'transfers data' };
            mockAxiosPost.mockResolvedValue(mockTransfersData);

            const result = await bookingService.getBookingTransfers('booking-ref', 'Smith', '2026-05-01');

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.getBookingTransfers(),
                {
                    bookingReference: 'booking-ref',
                    lastName: 'Smith',
                    date: '2026-05-01',
                },
                undefined,
            );
            expect(result).toBe(mockTransfersData);
        });

        it('should throw ApiError when request fails', async () => {
            const testError = new Error('Test error');
            mockAxiosPost.mockRejectedValue(testError);

            try {
                await bookingService.getBookingTransfers('booking-ref', 'Smith', '2026-05-01');
                fail('Expected an error to be thrown');
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
            }
        });
    });

    describe('fetchBookingsFromApollo', () => {
        const mockApolloBookingsData = {
            bookings: [
                {
                    bookingReference: 'REF001',
                    hotelCode: 'ESMJ0047',
                    hotelName: 'Test Hotel',
                    hotelLocation: 'Majorca, Spain',
                    holidayDateStartLocal: '2030-05-15T00:00:00Z',
                    holidayDateEndLocal: '2030-05-22T00:00:00Z',
                    holidayNightsCount: 7,
                    resortCode: 'ESBABA',
                },
            ],
        };

        it('should call get request and return bookings', async () => {
            mockAxiosGet.mockResolvedValue({ data: mockApolloBookingsData });

            const result = await bookingService.fetchBookingsFromApollo();

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.fetchBookingsFromApollo(), undefined);
            expect(result).toEqual({ data: mockApolloBookingsData });
        });

        it('should return empty bookings and log error when request fails', async () => {
            const testError = new Error('Network error');
            mockAxiosGet.mockRejectedValue(testError);

            const result = await bookingService.fetchBookingsFromApollo();

            expect(result).toEqual({ data: { bookings: [] } });
            expect(logger.error).toHaveBeenCalledWith({ e: testError });
        });
    });

    describe('requestAssistedTravel', () => {
        const bookingReference = 'booking-ref-123';
        const passengerName = 'John Doe';
        const questionsAndAnswers = [
            { question: 'Do you need a wheelchair?', answer: 'Yes', questionCode: 'AT-001' },
            { question: 'Do you need oxygen?', answer: 'No', questionCode: 'AT-002' },
        ];

        it('should call post with correct url and payload', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: undefined });

            await bookingService.requestAssistedTravel(bookingReference, passengerName, questionsAndAnswers);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                `http://test/api/v1.0/booking/${bookingReference}/assisted-travel`,
                {
                    passengers: [
                        {
                            passengerName,
                            questionsAndAnswers,
                        },
                    ],
                },
                undefined,
            );
        });

        it('should return response data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'response-data' });

            const result = await bookingService.requestAssistedTravel(
                bookingReference,
                passengerName,
                questionsAndAnswers,
            );

            expect(result).toBe('response-data');
        });

        it('should throw ApiError when request fails', async () => {
            mockAxiosPost.mockRejectedValueOnce(new Error('Test error'));

            try {
                await bookingService.requestAssistedTravel(bookingReference, passengerName, questionsAndAnswers);
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
                expect(e.message).toBe('Test error');
            }
        });
    });

    describe('getAssistedTravelRequests', () => {
        it('should call get with correct url', async () => {
            const mockResponseData = { data: 'requests-data' };
            mockAxiosGet.mockResolvedValueOnce(mockResponseData);

            const result = await bookingService.getAssistedTravelRequests('booking-ref-123');

            expect(mockAxiosGet).toHaveBeenCalledWith(
                `http://test/api/v1.0/booking/booking-ref-123/assisted-travel`,
                undefined,
            );
            expect(result).toBe('requests-data');
        });

        it('should throw ApiError when request fails', async () => {
            expect.assertions(2);
            mockAxiosGet.mockRejectedValueOnce(new Error('Test error'));

            try {
                await bookingService.getAssistedTravelRequests('booking-ref-123');
            } catch (e) {
                expect(e instanceof ApiError).toBe(true);
                expect(e.message).toBe('Test error');
            }
        });
    });
});
