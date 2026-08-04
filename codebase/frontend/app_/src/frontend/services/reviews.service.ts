import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { ICustomersFeedbackResponse } from 'models/data/ICustomerFeedback';
import { IReviewsApiData } from 'models/data/IReviewsApiData';

import logger from './logging/logger.service';

class ReviewsService {
    public fetchReviews = async (hotelId: number): Promise<IReviewsApiData> => {
        try {
            const url = webApiUrls.getReviews(hotelId);
            const result = await AxiosRequest.get(url);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public fetchFeefoReviews = async (count: number, rating: string[]): Promise<ICustomersFeedbackResponse> => {
        try {
            const url = webApiUrls.getFeefoReviews(count, rating);
            const result = await AxiosRequest.get(url);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };
}

export default new ReviewsService();
