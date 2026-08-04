import { webApiUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';

import ShortlistService from './shortlist.service';

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
        post: mockAxiosPost,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('ShortlistService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('fetchShortlistOffers', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const take = 1;
            const page = 2;
            const token = { token: 'token' } as any;
            await ShortlistService.fetchShortlistOffers(take, page, token);

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.getShortlistOffers(take, page), {
                cancelToken: token.token,
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await ShortlistService.fetchShortlistOffers(1, 2);
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('deleteShortlistedItems', () => {
        it('should call axios post with correct data', async () => {
            const ids = ['id1', 'id2'];
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            await ShortlistService.deleteShortlistedItems(ids);

            expect(mockAxiosPost).toHaveBeenCalledWith(webApiUrls.deleteShortlistedItems(ids), {}, undefined);
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await ShortlistService.deleteShortlistedItems(['id1', 'id2']);
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('addOfferToShortlist', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            await ShortlistService.addOfferToShortlist({} as any);

            expect(mockAxiosPost).toHaveBeenCalledWith(webApiUrls.addOfferToShortlist(), {}, undefined);
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await ShortlistService.addOfferToShortlist({} as any);
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('addHotelToShortlist', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            const giataCode = 'giataCode';
            const iTheme = 'iTheme';
            await ShortlistService.addHotelToShortlist(giataCode, iTheme);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.addHotelToShortlist(),
                { giataCode, iTheme },
                undefined,
            );
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await ShortlistService.addHotelToShortlist('accommodationId', 'iTheme');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('getHotelShortlistStatus', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const giataCode = 'giataCode';
            await ShortlistService.getHotelShortlistStatus(giataCode);

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.getHotelShortlistStatus(giataCode), {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await ShortlistService.getHotelShortlistStatus('giataCode');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('getShortlistStatus', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await ShortlistService.getShortlistStatus();

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.getShortlistStatus(), {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await ShortlistService.getShortlistStatus();
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });
});
