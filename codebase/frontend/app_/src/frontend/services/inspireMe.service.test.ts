import { AxiosError } from 'axios';

import { webApiUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData } from 'models/data/ApiErrorData';
import { IGetQuizResultParams, IQuizResult } from 'models/data/IHolidayInspiration';

import InspireMeService from './inspireMe.service';

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

describe('InspireMeService', () => {
    describe('getQuizResult', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            const params: IGetQuizResultParams = {
                departure: 'LGW',
                weather: 'WWS',
                tags: 'TGPRTNR,VBLUX',
                flexibleDays: 0,
                dates: [
                    {
                        from: '2024-06-01',
                        to: '2024-06-30',
                    },
                ],
            };

            await InspireMeService.getQuizResult(params);

            expect(mockAxiosPost).toHaveBeenCalledWith(webApiUrls.getQuizResult(), params, undefined);
        });

        it('should throw error code', async () => {
            mockAxiosPost.mockRejectedValueOnce({ code: 'Code' });

            try {
                await InspireMeService.getQuizResult({} as IQuizResult);
            } catch (e) {
                expect(e).toBe('Code');
            }
        });
    });

    describe('getValidHolidayInspirationAnswers', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const departure = 'LGW';
            const weather = 'WWS';
            await InspireMeService.getValidHolidayInspirationAnswers({ departure, weather });

            expect(mockAxiosGet).toHaveBeenCalledWith(
                webApiUrls.validHolidayInspirationAnswers({ departure, weather }),
                undefined,
            );
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as AxiosError<IApiErrorData>));

            try {
                await InspireMeService.getValidHolidayInspirationAnswers({} as IQuizResult);
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });
});
