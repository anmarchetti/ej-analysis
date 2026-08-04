import { webApiUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';

import CreditManagementService from './creditManagement.service';

const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('CreditManagementService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('loadBalanceHistory', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await CreditManagementService.loadBalanceHistory();

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.getBalanceHistory(), {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await CreditManagementService.loadBalanceHistory();
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('loadCreditBalance', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await CreditManagementService.loadCreditBalance({ token: 'token' } as any, false);

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.getCreditBalance(), {
                cancelToken: 'token',
                headers: {
                    AllowCache: 'false',
                    'Cache-Control': 'no-cache, no-store',
                    Expires: '0',
                    Pragma: 'no-cache',
                },
            });
        });

        it('should call axios get without cancel token', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await CreditManagementService.loadCreditBalance({} as any, true);

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.getCreditBalance(), {
                cancelToken: undefined,
                headers: {
                    AllowCache: 'true',
                    'Cache-Control': 'no-cache, no-store',
                    Expires: '0',
                    Pragma: 'no-cache',
                },
            });
        });

        it('should call axios get with false allow cache', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await CreditManagementService.loadCreditBalance(null as any);

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.getCreditBalance(), {
                cancelToken: null,
                headers: {
                    AllowCache: 'false',
                    'Cache-Control': 'no-cache, no-store',
                    Expires: '0',
                    Pragma: 'no-cache',
                },
            });
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await CreditManagementService.loadCreditBalance({ token: 'token' } as any, false);
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('validateVoucherCode', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await CreditManagementService.validateVoucherCode('code');

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.validateVoucherCode('code'), undefined);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await CreditManagementService.validateVoucherCode('code');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('redeemVoucher', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await CreditManagementService.redeemVoucher('code');

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.redeemVoucher('code'), undefined);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await CreditManagementService.redeemVoucher('code');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });
});
