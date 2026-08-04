import logger from './logging/logger.service';
import reviewsService from './reviews.service';

const mockAxiosGet = jest.fn(
    () =>
        new Promise(() => ({
            then: jest.fn(),
            catch: jest.fn(),
        })),
);

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));
jest.mock('./logging/logger.service');

describe('reviews.service', () => {
    describe('fetchReviews', () => {
        it('should fetch reviews', async () => {
            const WEB_API_BASE_URI = 'http://test/api/v1.0';
            const hotelId = 1;
            const expectedResult = {
                data: 'test',
            };

            mockAxiosGet.mockImplementationOnce(() => Promise.resolve(expectedResult));
            const result = await reviewsService.fetchReviews(hotelId);

            expect(mockAxiosGet).toHaveBeenCalledWith(`${WEB_API_BASE_URI}/hotel/reviews/${hotelId}`, undefined);
            expect(result).toEqual(expectedResult.data);
        });

        it('should log fetch reviews error', async () => {
            const error = 'test';

            mockAxiosGet.mockImplementationOnce(() => Promise.reject(error));
            try {
                await reviewsService.fetchReviews(1);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith({
                    e: error,
                });
            }
        });
    });

    describe('fetchFeefoReviews', () => {
        const count = 10;
        const rating = ['4'];

        it('should fetch feefo reviews', async () => {
            const WEB_API_BASE_URI = 'http://test/api/v1.0';
            const expectedResult = {
                data: 'test',
            };

            mockAxiosGet.mockImplementationOnce(() => Promise.resolve(expectedResult));
            const result = await reviewsService.fetchFeefoReviews(count, rating);

            expect(mockAxiosGet).toHaveBeenCalledWith(
                `${WEB_API_BASE_URI}/reviews?count=${count}&rating[0]=4`,
                undefined,
            );
            expect(result).toEqual(expectedResult.data);
        });

        it('should log fetch feefo reviews error', async () => {
            const error = 'test';

            mockAxiosGet.mockImplementationOnce(() => Promise.reject(error));
            try {
                await reviewsService.fetchFeefoReviews(count, rating);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith({
                    e: error,
                });
            }
        });
    });
});
