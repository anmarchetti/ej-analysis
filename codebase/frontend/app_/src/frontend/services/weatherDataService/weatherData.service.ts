import { webApiUrls } from 'code/endpoints';
import { logger } from 'frontend/services/logging';
import AxiosRequest from 'frontend/utils/request';
import { IWeatherData } from 'models/data/IBookingInfo';

export class WeatherDataService {
    async getWeather(code: string, cookie?: string): Promise<IWeatherData | null> {
        try {
            const response = await AxiosRequest.get(
                webApiUrls.weather(code),
                cookie
                    ? {
                          headers: { Cookie: cookie },
                      }
                    : undefined,
                true,
            );

            return response.data;
        } catch (e) {
            logger.error({
                e,
                message: 'Failed to get weather data',
            });

            return null;
        }
    }
}

const weatherDataService = new WeatherDataService();

export default weatherDataService;
