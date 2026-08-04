import { AxiosError } from 'axios';

import { logger } from 'frontend/services/logging';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData } from 'models/data/ApiErrorData';
import { IWeatherData } from 'models/data/IBookingInfo';

import weatherDataService from './weatherData.service';

jest.mock('frontend/services/logging');

jest.mock('code/endpoints', () => ({
    webApiUrls: {
        weather: jest.fn().mockReturnValue('url'),
    },
}));

const mockAxiosRequestGet = jest.spyOn<any, 'get'>(AxiosRequest, 'get').mockImplementation(jest.fn());

describe('weatherData.service', () => {
    it('should return weather data', async () => {
        const expectedWeatherData: IWeatherData = {
            averageTemp: [1],
            rainyDays: [1],
            region: 'code',
        };
        mockAxiosRequestGet.mockResolvedValueOnce({
            data: expectedWeatherData,
        });

        const response = await weatherDataService.getWeather('code');

        expect(mockAxiosRequestGet).toHaveBeenCalledWith('url', undefined, true);
        expect(response).toEqual(expectedWeatherData);
    });

    it('should return null when error occurred', async () => {
        const error = new ApiError({
            response: {
                data: {
                    code: 'error code',
                    error: 'some message',
                },
            },
        } as AxiosError<IApiErrorData>);
        mockAxiosRequestGet.mockRejectedValueOnce(error);

        const response = await weatherDataService.getWeather('code');

        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                e: error,
                message: 'Failed to get weather data',
            }),
        );
        expect(response).toBeNull();
    });

    it('should pass config object to get method when cookie argument is passed', async () => {
        const cookie = 'cookie';
        await weatherDataService.getWeather('code', cookie);

        expect(mockAxiosRequestGet).toHaveBeenCalledWith(
            'url',
            {
                headers: { Cookie: cookie },
            },
            true,
        );
    });
});
