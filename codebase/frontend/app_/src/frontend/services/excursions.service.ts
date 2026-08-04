import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { IExcursionResponse } from 'models/data/IExcursions';

import { logger } from './logging';

class ExcursionsService {
    public getExcursionsForDestination = async (
        destination: string,
        marketCode: string,
        startDate?: string,
        endDate?: string,
    ): Promise<IExcursionResponse> => {
        try {
            const result = await AxiosRequest.get(
                webApiUrls.excursionsForDestination(destination, marketCode, startDate, endDate),
            );

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };
}

export default new ExcursionsService();
