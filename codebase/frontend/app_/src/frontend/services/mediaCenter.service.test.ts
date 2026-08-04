import MediaCenterService from './mediaCenter.service';

const mockAxiosPost = jest.fn();
jest.mock('axios', () => ({
    create: () => ({
        post: mockAxiosPost,
    }),
    isCancel: () => jest.fn(),
}));
const WEB_API_BASE_URI = 'http://test/api/v1.0';

describe('mediaCenter.service', () => {
    it('should fetch Articles', async () => {
        const params = {
            take: 7,
            page: 2,
            topics: ['test'],
        };
        const expectedResult = {
            data: {
                topicsFilter: [],
            },
        };
        mockAxiosPost.mockImplementationOnce(() => Promise.resolve(expectedResult));
        const result = await MediaCenterService.fetchArticles(params);
        expect(mockAxiosPost).toHaveBeenCalledWith(`${WEB_API_BASE_URI}/mediacenter/search`, params, undefined);
        expect(result).toEqual(expectedResult.data);
    });
});
