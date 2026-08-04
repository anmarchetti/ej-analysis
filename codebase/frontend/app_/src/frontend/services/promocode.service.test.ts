import { webApiUrls } from 'code/endpoints';

import { logger } from './logging';
import promocodeService from './promocode.service';

const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('PromocodeService', () => {
    beforeEach(() => {
        mockAxiosGet.mockReset();
    });

    describe('loadUserPromocode', () => {
        it('should call axios get with correct data and return promocode', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'PROMO123' });

            const result = await promocodeService.loadUserPromocode('campaign-id');

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.userVoucherCode('campaign-id'), {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
            expect(result).toBe('PROMO123');
        });

        it('should return null and log error when request fails with Error', async () => {
            const error = new Error('request failed');
            const loggerErrorSpy = jest.spyOn(logger, 'error').mockResolvedValueOnce();
            mockAxiosGet.mockRejectedValueOnce(error);

            const result = await promocodeService.loadUserPromocode('campaign-id');

            expect(result).toBeNull();
            expect(loggerErrorSpy).toHaveBeenCalledWith({ e: error });
        });

        it('should return null and not log when request fails with non-Error', async () => {
            const loggerErrorSpy = jest.spyOn(logger, 'error').mockResolvedValueOnce();
            mockAxiosGet.mockRejectedValueOnce({ response: { status: 500 } });

            const result = await promocodeService.loadUserPromocode('campaign-id');

            expect(result).toBeNull();
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });
    });
});
