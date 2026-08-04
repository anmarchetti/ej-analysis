import { AxiosError, CancelToken, CancelTokenSource, isCancel } from 'axios';

import { webApiUrls } from 'code/endpoints';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData } from 'models/data/ApiErrorData';
import { DestinationTypeBit } from 'models/enum/DestinationType';

import logger from './logging/logger.service';
import offersService from './offers.service';

jest.mock('code/endpoints');
const mockHotelInfoUrl = jest.spyOn(webApiUrls, 'hotelInfo').mockReturnValue('url');
jest.spyOn(webApiUrls, 'searchDestinations').mockReturnValue('mock-destinations-url');
jest.spyOn(webApiUrls, 'searchDestinationsByQueryAndTypes').mockReturnValue('mock-url');
jest.spyOn(webApiUrls, 'getAvailableOrigins').mockReturnValue('mock-origins-url');
const mockCheapestMonth = jest.spyOn(webApiUrls, 'getCheapestMonths').mockReturnValue('mock-cheapest-month-url');

jest.mock('frontend/utils/request');

jest.mock('./logging/logger.service', () => ({
    __esModule: true,
    default: {
        error: jest.fn(),
    },
}));

jest.mock('axios', () => ({
    ...jest.requireActual('axios'),
    isCancel: jest.fn(),
}));

const mockedData = jest.fn();
const mockAxiosRequestGet = (AxiosRequest.get as jest.Mock).mockReturnValue({ data: mockedData });
window.errorTracking = jest.fn();

const mockOriginsData = {
    origins: ['LHR', 'LGW', 'STN', 'LTN'],
};
const mockCachedRequest = jest.fn().mockResolvedValue(mockOriginsData);

const mockedDate = new Date();

describe('offers.service', () => {
    describe('fetchOffer', () => {
        it('should pass correct parameters', async () => {
            await offersService.fetchOffer(
                mockedDate,
                0,
                '7',
                'SEN,LGW,STN,LTN',
                [
                    {
                        adults: 2,
                        children: 0,
                        infants: 0,
                        childrenAges: [],
                        roomCode: 'TW01',
                    },
                ],
                'ESTF0044',
                'E2269a7354e288ff2461d2e45cf570a2b',
                'E091007bf44f67e40398432741234c172',
                '2151514782/2/1836/7',
                'HB',
                'W2MS007018SS',
                'ALL',
                true,
                false,
                [{ accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' }],
                [
                    {
                        seats: [
                            {
                                paxIndex: 1,
                                seatNumber: '2E',
                            },
                            {
                                paxIndex: 2,
                                seatNumber: '3F',
                            },
                        ],
                        sectorId: '1',
                    },
                    {
                        seats: [
                            {
                                paxIndex: 1,
                                seatNumber: '4D',
                            },
                            {
                                paxIndex: 2,
                                seatNumber: '5B',
                            },
                        ],
                        sectorId: '2',
                    },
                ],
                { LUG: 3 },
                { LUG: 2 },
                { BIKE: 4 },
                { BIKE: 3 },
                'lux',
                500,
                '1|2|3',
                '4|5|6',
                'ABC',
            );

            expect(webApiUrls.searchHotel).toHaveBeenCalledWith(
                formatDateToQuery(mockedDate),
                0,
                '7',
                'SEN,LGW,STN,LTN',
                [{ adults: 2, children: 0, childrenAges: [], infants: 0, roomCode: 'TW01' }],
                'ESTF0044',
                'E2269a7354e288ff2461d2e45cf570a2b',
                'E091007bf44f67e40398432741234c172',
                '2151514782/2/1836/7',
                'HB',
                'W2MS007018SS',
                'ALL',
                true,
                false,
                [{ accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' }],
                [
                    {
                        seats: [
                            { paxIndex: 1, seatNumber: '2E' },
                            { paxIndex: 2, seatNumber: '3F' },
                        ],
                        sectorId: '1',
                    },
                    {
                        seats: [
                            { paxIndex: 1, seatNumber: '4D' },
                            { paxIndex: 2, seatNumber: '5B' },
                        ],
                        sectorId: '2',
                    },
                ],
                {
                    BIKE: 4,
                    LUG: 3,
                },
                {
                    BIKE: 3,
                    LUG: 2,
                },
                'lux',
                500,
                '1|2|3',
                '4|5|6',
                'ABC',
                undefined,
            );
        });

        it('should pass ecp to searchHotel when provided', async () => {
            await offersService.fetchOffer(
                mockedDate,
                0,
                '7',
                'SEN,LGW,STN,LTN',
                [{ adults: 2, children: 0, infants: 0, childrenAges: [], roomCode: 'TW01' }],
                'ESTF0044',
                'E2269a7354e288ff2461d2e45cf570a2b',
                'E091007bf44f67e40398432741234c172',
                '2151514782/2/1836/7',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                {},
                {},
                {},
                {},
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'fph',
            );

            expect(webApiUrls.searchHotel).toHaveBeenCalledWith(
                formatDateToQuery(mockedDate),
                0,
                '7',
                'SEN,LGW,STN,LTN',
                [{ adults: 2, children: 0, childrenAges: [], infants: 0, roomCode: 'TW01' }],
                'ESTF0044',
                'E2269a7354e288ff2461d2e45cf570a2b',
                'E091007bf44f67e40398432741234c172',
                '2151514782/2/1836/7',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                {},
                {},
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'fph',
            );
        });

        it('should have correct response', async () => {
            const response = await offersService.fetchOffer(
                mockedDate,
                0,
                '7',
                'SEN,LGW,STN,LTN',
                [
                    {
                        adults: 2,
                        children: 0,
                        infants: 0,
                        childrenAges: [],
                        roomCode: 'TW01',
                    },
                ],
                'ESTF0044',
                'E2269a7354e288ff2461d2e45cf570a2b',
                'E091007bf44f67e40398432741234c172',
                '2151514782/2/1836/7',
                'HB',
                'W2MS007018SS',
                'ALL',
                true,
                false,
                undefined,
                [
                    {
                        seats: [
                            {
                                paxIndex: 1,
                                seatNumber: '2E',
                            },
                            {
                                paxIndex: 2,
                                seatNumber: '3F',
                            },
                        ],
                        sectorId: '1',
                    },
                    {
                        seats: [
                            {
                                paxIndex: 1,
                                seatNumber: '4D',
                            },
                            {
                                paxIndex: 2,
                                seatNumber: '5B',
                            },
                        ],
                        sectorId: '2',
                    },
                ],
                {},
                {},
                {},
                {},
                'lux',
                500,
                '1|2|3',
                '4|5|6',
            );

            expect(response).toBe(mockedData);
        });
    });

    describe('fetchRecommendedOffers', () => {
        it('should pass correct parameters when pass only required params', async () => {
            await offersService.fetchRecommendedOffers(mockedDate, 0, ['7'], 'SEN,LGW,STN,LTN', 'ALL', true, [
                {
                    adults: 2,
                    children: 0,
                    infants: 0,
                    childrenAges: [],
                    roomCode: 'TW01',
                },
            ]);

            expect(webApiUrls.recommended).toHaveBeenCalledWith(
                formatDateToQuery(mockedDate),
                0,
                ['7'],
                'SEN,LGW,STN,LTN',
                'ALL',
                true,
                [{ adults: 2, children: 0, childrenAges: [], infants: 0, roomCode: 'TW01' }],
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            );
        });

        it('should pass correct parameters with all params passed', async () => {
            const mockedEDate = new Date('2024-07-01T00:00:00');

            await offersService.fetchRecommendedOffers(
                mockedDate,
                0,
                ['7'],
                'SEN,LGW,STN,LTN',
                'ALL',
                true,
                [
                    {
                        adults: 2,
                        children: 0,
                        infants: 0,
                        childrenAges: [],
                        roomCode: 'TW01',
                    },
                ],
                'pageName',
                'offers',
                true,
                'placementId',
                'atcomCode',
                mockedEDate,
                { token: {} as CancelToken, cancel: jest.fn() },
                true,
                'promoPageId',
                ['dest1'],
            );

            expect(webApiUrls.recommended).toHaveBeenCalledWith(
                formatDateToQuery(mockedDate),
                0,
                ['7'],
                'SEN,LGW,STN,LTN',
                'ALL',
                true,
                [{ adults: 2, children: 0, childrenAges: [], infants: 0, roomCode: 'TW01' }],
                'pageName',
                'offers',
                true,
                'placementId',
                'atcomCode',
                formatDateToQuery(mockedEDate),
                true,
                'promoPageId',
                ['dest1'],
            );
        });
    });

    describe('fetchRecommendedOffersBrowse', () => {
        it('should pass correct parameters when pass only required params', async () => {
            await offersService.fetchRecommendedOffersBrowse(
                ['SEN', 'LGW', 'STN', 'LTN'],
                true,
                'placementId',
                'pageName',
            );

            expect(webApiUrls.recommendedBrowse).toHaveBeenCalledWith(
                ['SEN', 'LGW', 'STN', 'LTN'],
                true,
                'placementId',
                'pageName',
                undefined,
                undefined,
            );
        });
    });

    describe('fetchGenericRecommendedOffers', () => {
        it('should pass correct parameters when pass only required params', async () => {
            await offersService.fetchGenericRecommendedOffers('placementId', 'pageName');

            expect(webApiUrls.recommendedGeneric).toHaveBeenCalledWith(
                'placementId',
                'pageName',
                true,
                false,
                undefined,
            );
        });
    });

    describe('loadHotelInfo', () => {
        it('should return data successfully when only code argument is passed', async () => {
            const code = 'code';

            const response = await offersService.loadHotelInfo(code);

            expect(response).toEqual(mockedData);
            expect(mockHotelInfoUrl).toHaveBeenCalledWith(code, undefined, undefined);
            expect(mockAxiosRequestGet).toHaveBeenCalledWith('url', undefined);
        });

        it('should return data successfully when all arguments are passed', async () => {
            const code = 'code';
            const board = 'board';
            const room = 'room';
            const cookie = 'cookie';

            const response = await offersService.loadHotelInfo(code, board, room, cookie);

            expect(response).toEqual(mockedData);
            expect(mockHotelInfoUrl).toHaveBeenCalledWith(code, board, room);
            expect(mockAxiosRequestGet).toHaveBeenCalledWith('url', {
                headers: { Cookie: cookie },
            });
        });

        it('should throw an error', async () => {
            const error = new ApiError({
                response: {
                    data: {
                        code: 'error code',
                        error: 'some message',
                    },
                },
            } as AxiosError<IApiErrorData>);
            mockAxiosRequestGet.mockRejectedValueOnce(error);

            await expect(offersService.loadHotelInfo('code')).rejects.toThrow(error);
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    e: error,
                }),
            );
        });
    });

    describe('getHotelPointsOfInterest', () => {
        it('should pass correct parameters', async () => {
            const params = { categories: 'test', lat: 10, lon: 20, resortId: '123', airport: 'test', theme: 'B' };
            webApiUrls.hotelPointsOfInterest = jest.fn().mockReturnValue('mock-url');

            await offersService.getHotelPointsOfInterest(params);

            expect(webApiUrls.hotelPointsOfInterest).toHaveBeenCalledWith(params);
            expect(AxiosRequest.get).toHaveBeenCalledWith('mock-url');
        });

        it('should throw an error', async () => {
            const error = new ApiError({
                response: {
                    data: {
                        code: 'error code',
                        error: 'some message',
                    },
                },
            } as AxiosError<IApiErrorData>);
            mockAxiosRequestGet.mockRejectedValueOnce(error);

            await expect(
                offersService.getHotelPointsOfInterest({
                    categories: 'test',
                    lat: 10,
                    lon: 20,
                    resortId: '123',
                }),
            ).rejects.toThrow(error);

            expect(logger.error).toHaveBeenCalledWith({ e: error });
        });
    });

    describe('searchDestinationsByQueryAndTypes', () => {
        it('should pass correct parameters when only required params are provided', async () => {
            const query = 'paris';
            const types: DestinationTypeBit[] = [1, 2];

            await offersService.searchDestinationsByQueryAndTypes(query, types);

            expect(webApiUrls.searchDestinationsByQueryAndTypes).toHaveBeenCalledWith(query, types);
            expect(AxiosRequest.get).toHaveBeenCalledWith('mock-url', {
                cancelToken: undefined,
            });
        });

        it('should pass correct parameters when all params are provided', async () => {
            const query = 'london';
            const types: DestinationTypeBit[] = [1, 4];
            const mockCancelSource = {
                token: {} as CancelToken,
                cancel: jest.fn(),
            } as CancelTokenSource;

            await offersService.searchDestinationsByQueryAndTypes(query, types, mockCancelSource);

            expect(webApiUrls.searchDestinationsByQueryAndTypes).toHaveBeenCalledWith(query, types);
            expect(AxiosRequest.get).toHaveBeenCalledWith('mock-url', {
                cancelToken: mockCancelSource.token,
            });
        });

        it('should return the expected response', async () => {
            const response = await offersService.searchDestinationsByQueryAndTypes('test', [1]);

            expect(response).toBe(mockedData);
        });

        it('should handle errors correctly', async () => {
            const error = new ApiError({
                response: {
                    data: {
                        code: 'error code',
                        error: 'some message',
                    },
                },
            } as AxiosError<IApiErrorData>);
            mockAxiosRequestGet.mockRejectedValueOnce(error);

            await expect(offersService.searchDestinationsByQueryAndTypes('test', [1])).rejects.toThrow(error);
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    e: error,
                }),
            );
        });

        it('should not log cancel errors', async () => {
            const cancelError = new Error('Request canceled');
            (isCancel as any).mockReturnValueOnce(true);
            mockAxiosRequestGet.mockRejectedValueOnce(cancelError);

            await expect(offersService.searchDestinationsByQueryAndTypes('test', [1])).rejects.toThrow(cancelError);
            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe('searchDestinations', () => {
        it('should pass correct parameters when all required params are provided', async () => {
            const query = 'beach';
            const from = 'LHR';
            const startDate = '2023-07-01';
            const endDate = '2023-07-14';
            const flexDays = 3;

            await offersService.searchDestinations(query, from, startDate, endDate, flexDays);

            expect(webApiUrls.searchDestinations).toHaveBeenCalledWith(
                query,
                from,
                startDate,
                endDate,
                flexDays,
                undefined,
            );
            expect(AxiosRequest.get).toHaveBeenCalledWith('mock-destinations-url', {
                cancelToken: undefined,
            });
        });

        it('should pass correct parameters when all params are provided', async () => {
            const query = 'mountain';
            const from = 'LGW';
            const startDate = '2023-08-01';
            const endDate = '2023-08-14';
            const flexDays = 2;
            const duration = 7;
            const mockCancelSource = {
                token: {} as CancelToken,
                cancel: jest.fn(),
            } as CancelTokenSource;

            await offersService.searchDestinations(
                query,
                from,
                startDate,
                endDate,
                flexDays,
                duration,
                mockCancelSource,
            );

            expect(webApiUrls.searchDestinations).toHaveBeenCalledWith(
                query,
                from,
                startDate,
                endDate,
                flexDays,
                duration,
            );
            expect(AxiosRequest.get).toHaveBeenCalledWith('mock-destinations-url', {
                cancelToken: mockCancelSource.token,
            });
        });

        it('should pass correct parameters when cancel token is provided', async () => {
            const query = 'mountain';
            const from = 'LGW';
            const startDate = '2023-08-01';
            const endDate = '2023-08-14';
            const flexDays = 2;
            const mockCancelSource = {
                token: {} as CancelToken,
                cancel: jest.fn(),
            } as CancelTokenSource;

            await offersService.searchDestinations(
                query,
                from,
                startDate,
                endDate,
                flexDays,
                undefined,
                mockCancelSource,
            );

            expect(webApiUrls.searchDestinations).toHaveBeenCalledWith(
                query,
                from,
                startDate,
                endDate,
                flexDays,
                undefined,
            );
            expect(AxiosRequest.get).toHaveBeenCalledWith('mock-destinations-url', {
                cancelToken: mockCancelSource.token,
            });
        });

        it('should return the expected response', async () => {
            const response = await offersService.searchDestinations('test', 'LHR', '2023-07-01', '2023-07-14', 3);

            expect(response).toBe(mockedData);
        });

        it('should handle errors correctly', async () => {
            const error = new ApiError({
                response: {
                    data: {
                        code: 'error code',
                        error: 'some message',
                    },
                },
            } as AxiosError<IApiErrorData>);
            mockAxiosRequestGet.mockRejectedValueOnce(error);

            await expect(
                offersService.searchDestinations('test', 'LHR', '2023-07-01', '2023-07-14', 3),
            ).rejects.toThrow(error);

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    e: error,
                }),
            );
        });

        it('should not log cancel errors', async () => {
            const cancelError = new Error('Request canceled');
            (isCancel as any).mockReturnValueOnce(true);
            mockAxiosRequestGet.mockRejectedValueOnce(cancelError);

            await expect(
                offersService.searchDestinations('test', 'LHR', '2023-07-01', '2023-07-14', 3),
            ).rejects.toThrow(cancelError);

            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should not log non-Error objects', async () => {
            const nonError = 'not an error object';
            mockAxiosRequestGet.mockRejectedValueOnce(nonError);

            await expect(offersService.searchDestinations('test', 'LHR', '2023-07-01', '2023-07-14', 3)).rejects.toBe(
                nonError,
            );

            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe('getAvailableDestinations', () => {
        it('should pass correct parameters when only required params are provided', async () => {
            const from = 'TTT';
            const startDate = '2023-07-01';
            const endDate = '2023-07-14';
            const flexDays = 3;

            await offersService.getAvailableDestinations(from, startDate, endDate, flexDays);

            expect(webApiUrls.getAvailableDestinations).toHaveBeenCalledWith(
                from,
                startDate,
                endDate,
                flexDays,
                undefined,
            );
        });

        it('should pass correct parameters when all params are provided', async () => {
            const from = 'YYY';
            const startDate = '2023-07-01';
            const endDate = '2023-07-14';
            const flexDays = 3;
            const duration = 7;

            await offersService.getAvailableDestinations(from, startDate, endDate, flexDays, duration);

            expect(webApiUrls.getAvailableDestinations).toHaveBeenCalledWith(
                from,
                startDate,
                endDate,
                flexDays,
                duration,
            );
        });
    });

    describe('getAvailableOrigins', () => {
        beforeEach(() => {
            (offersService as any).cachedAvailableOriginsReq = {
                getRequest: mockCachedRequest,
            };
        });

        it('should pass correct parameters when only required params are provided', async () => {
            const to = 'GRCF0044';
            const startDate = '2023-07-01';
            const endDate = '2023-07-14';
            const flexDays = 3;

            await offersService.getAvailableOrigins(to, startDate, endDate, flexDays);

            expect(webApiUrls.getAvailableOrigins).toHaveBeenCalledWith(
                to,
                startDate,
                endDate,
                flexDays,
                undefined,
                undefined,
            );
            expect(mockCachedRequest).toHaveBeenCalledWith('mock-origins-url');
        });

        it('should pass correct parameters when all params are provided', async () => {
            const to = 'GRCF0044';
            const startDate = '2023-07-01';
            const endDate = '2023-07-14';
            const flexDays = 3;
            const promoPageId = 'PROMO123';
            const duration = 7;

            await offersService.getAvailableOrigins(to, startDate, endDate, flexDays, promoPageId, duration);

            expect(webApiUrls.getAvailableOrigins).toHaveBeenCalledWith(
                to,
                startDate,
                endDate,
                flexDays,
                promoPageId,
                duration,
            );
            expect(mockCachedRequest).toHaveBeenCalledWith('mock-origins-url');
        });

        it('should return the cached request result', async () => {
            const result = await offersService.getAvailableOrigins('GRCF0044', '2023-07-01', '2023-07-14', 3);

            expect(result).toBe(mockOriginsData);
        });

        it('should handle errors correctly', async () => {
            const error = new ApiError({
                response: {
                    data: {
                        code: 'error code',
                        error: 'some message',
                    },
                },
            } as AxiosError<IApiErrorData>);
            mockCachedRequest.mockRejectedValueOnce(error);

            await expect(offersService.getAvailableOrigins('GRCF0044', '2023-07-01', '2023-07-14', 3)).rejects.toThrow(
                error,
            );

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    e: error,
                }),
            );
        });

        it('should not log cancel errors', async () => {
            const cancelError = new Error('Request canceled');
            (isCancel as any).mockReturnValueOnce(true);
            mockCachedRequest.mockRejectedValueOnce(cancelError);

            await expect(offersService.getAvailableOrigins('GRCF0044', '2023-07-01', '2023-07-14', 3)).rejects.toThrow(
                cancelError,
            );

            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe('getAvailableMonths', () => {
        it('should pass correct parameters', async () => {
            const from = 'LLL';
            const to = 'TTT';
            const duration = 7;
            await offersService.getAvailableMonths(duration, from, to);

            expect(webApiUrls.getAvailableMonths).toHaveBeenCalledWith(duration, from, to);
        });

        it('should throw an error', async () => {
            const error = new ApiError({
                response: {
                    data: {
                        code: 'error code',
                        error: 'some message',
                    },
                },
            } as AxiosError<IApiErrorData>);
            mockAxiosRequestGet.mockRejectedValueOnce(error);

            await expect(offersService.getAvailableMonths(7, '', '')).rejects.toThrow(error);
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    e: error,
                }),
            );
        });
    });

    describe('fetchCheapestMonthList', () => {
        it('should pass correct parameters', async () => {
            const airportCode = 'LGW';
            const destinationQuery = 'destinationQuery';

            const result = await offersService.fetchCheapestMonthList(airportCode, destinationQuery);

            expect(mockCheapestMonth).toHaveBeenCalledWith(airportCode, destinationQuery);
            expect(mockAxiosRequestGet).toHaveBeenCalledWith('mock-cheapest-month-url');
            expect(result).toStrictEqual(mockedData);
        });

        it('should throw an error', async () => {
            const error = new ApiError({
                response: {
                    data: {
                        code: 'error code',
                        error: 'some message',
                    },
                },
            } as AxiosError<IApiErrorData>);
            mockAxiosRequestGet.mockRejectedValueOnce(error);

            try {
                await offersService.fetchCheapestMonthList('LGW', 'destinationQuery');
            } catch (e) {}

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    e: error,
                }),
            );
        });
    });
});
