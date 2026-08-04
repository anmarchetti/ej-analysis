import ComparePricesCalendarService from './comparePricesCalendar.service';

const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
    }),
    isCancel: () => jest.fn(),
}));

describe('ComparePricesCalendarService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('getMapsSitecoreInfo', () => {
        it('should call axios get with correct details', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await ComparePricesCalendarService.loadAlternativeOffers(
                new Date('2023-06-23'),
                new Date('2023-07-23'),
                new Date('2023-08-23'),
                1,
                2,
                'departure',
                [],
                'accommodation1',
                'board',
                [],
                [],
                true,
            );

            expect(mockAxiosGet).toHaveBeenCalledWith(
                'http://test/api/v1.0/search/price-graph/month?startDate=2023-06-23&start=2023-07-23&end=2023-08-23&flexibleDays=1&duration=2&departure=departure&accommodationIds=accommodation1&boardType=board&isCheapestRoom=true',
                undefined,
            );
        });
    });
});
