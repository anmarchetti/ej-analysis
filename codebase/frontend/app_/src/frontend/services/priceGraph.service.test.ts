import PriceGraphService from './priceGraph.service';

const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('PriceGraphService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('loadAlternativeOffers', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await PriceGraphService.loadAlternativeOffers(
                new Date('2023-06-26'),
                new Date('2023-06-26'),
                1,
                2,
                'departure',
                [],
                'accommodationId',
                'boardType',
                [],
                [],
            );

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/search/price-graph?startDate=2023-06-26&initialDate=2023-06-26&flexibleDays=1&duration=2&departure=departure&accommodationIds=accommodationId&boardType=boardType',
                { cancelToken: undefined },
            );
        });
    });
});
