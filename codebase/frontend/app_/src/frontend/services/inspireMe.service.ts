import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import {
    IAvailableAnswers,
    IGetQuizResultParams,
    IRecommendedInspireData,
    IValidateQuizAnswersParams,
} from 'models/data/IHolidayInspiration';

import { logger } from './logging';

class InspireMeService {
    public getQuizResult = async (params: IGetQuizResultParams): Promise<IRecommendedInspireData> => {
        try {
            const url = webApiUrls.getQuizResult();
            const result = await AxiosRequest.post(url, params);

            return result.data;
        } catch (e) {
            logger.error({ e: { name: 'Quiz results', message: 'Failed to get inspire me quiz results' } });
            throw e.code;
        }
    };

    public getValidHolidayInspirationAnswers = async (
        params: IValidateQuizAnswersParams,
    ): Promise<IAvailableAnswers> => {
        try {
            const url = webApiUrls.validHolidayInspirationAnswers(params);
            const response = await AxiosRequest.get(url);

            return response.data;
        } catch (e) {
            logger.error({
                e: { name: 'Quiz available answers', message: 'Failed to get inspire me quiz available answers' },
            });

            throw new ApiError(e);
        }
    };
}

const holidayInspirationDataService = new InspireMeService();

export default holidayInspirationDataService;
