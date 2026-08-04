import { webApiUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';

import { GuestsService } from './guests.service';

const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('GuestsService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('getCountries', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await GuestsService.getCountries();

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.countries(), undefined);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await GuestsService.getCountries();
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('getDialingCodes', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await GuestsService.getDialingCodes();

            expect(mockAxiosGet).toHaveBeenCalledWith(webApiUrls.dialingCodes(), undefined);
        });

        it('should return result', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const result = await GuestsService.getDialingCodes();

            expect(result).toBe('result');
        });

        it('should return modified data result', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: [{ code: 'code1' }, { code: 'code2' }] });
            const result = await GuestsService.getDialingCodes();

            expect(result).toStrictEqual([{ code: 'code1' }, { code: 'code2' }]);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await GuestsService.getDialingCodes();
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });
});
