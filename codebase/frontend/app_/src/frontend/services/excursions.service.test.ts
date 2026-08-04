import { webApiUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';

import ExcursionsService from './excursions.service';

const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('ExcursionsService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('getExcursionsForDestination', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            await ExcursionsService.getExcursionsForDestination('destination', 'code', '2023-12-15', '2024-12-15');

            expect(mockAxiosGet).toHaveBeenCalledWith(
                webApiUrls.excursionsForDestination('destination', 'code', '2023-12-15', '2024-12-15'),
                undefined,
            );
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await ExcursionsService.getExcursionsForDestination('destination', '2023-12-15', '2024-12-15', 'code');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });
});
