import logger from './logging/logger.service';
import { HotelsService } from './hotels.service';

const mockAxiosGet = jest.fn(
    () =>
        new Promise(() => ({
            then: jest.fn(),
            catch: jest.fn(),
        })),
);
const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
        post: mockAxiosPost,
    }),
    isCancel: () => jest.fn(),
}));
jest.mock('./logging/logger.service');

const WEB_API_BASE_URI = 'http://test/api/v1.0';

describe('hotels.service', () => {
    describe('fetchDestinationHotels', () => {
        it('should get destination hotels', async () => {
            const code = 'test';
            const expectedResult = {
                data: 'test',
            };
            mockAxiosGet.mockResolvedValueOnce(expectedResult);
            const result = await HotelsService.fetchDestinationHotels(code);
            expect(mockAxiosGet).toHaveBeenCalledWith(
                `${WEB_API_BASE_URI}/hotel/summary/location?code=${code}`,
                undefined,
            );
            expect(result).toEqual(expectedResult.data);
        });

        it('should log get destination hotels error', async () => {
            const error = new Error('test');
            mockAxiosGet.mockResolvedValueOnce(error);
            try {
                await HotelsService.fetchDestinationHotels('test');
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith({
                    e: error,
                });
            }
        });
    });

    describe('fetchPolygonHotels', () => {
        const poly = {
            lt1: 'test',
            ln1: 'test',
            lt2: 'test',
            ln2: 'test',
        };

        it('should get polygon destination hotels', async () => {
            const expectedResult = {
                data: 'test',
            };
            mockAxiosPost.mockResolvedValueOnce(expectedResult);
            const result = await HotelsService.fetchPolygonHotels(poly);
            expect(mockAxiosPost).toHaveBeenCalledWith(
                `${WEB_API_BASE_URI}/hotel/summary/polygon`,
                {
                    topLeftAngle: {
                        latitude: +poly.lt1,
                        longitude: +poly.ln1,
                    },
                    bottomRightAngle: {
                        latitude: +poly.lt2,
                        longitude: +poly.ln2,
                    },
                },
                { signal: expect.any(AbortSignal) },
            );
            expect(result).toEqual(expectedResult.data);
        });

        it('should log get polygon destination hotels error', async () => {
            const error = new Error('test');
            mockAxiosPost.mockRejectedValueOnce(error);
            try {
                await HotelsService.fetchPolygonHotels(poly);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith({
                    e: error,
                });
            }
        });
    });
});
