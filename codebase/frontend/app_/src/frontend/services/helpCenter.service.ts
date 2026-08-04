import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';

import { logger } from './logging';

class HelpCenterService {
    saveFeedback = async (
        question: string,
        icon: number,
        comment: string,
        localTime: string,
        bookingMarketCode: string,
        bookingType: string,
    ): Promise<void> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.saveFeedback(), {
                question,
                icon,
                comment,
                localTime,
                marketCode: bookingMarketCode,
                bookingType,
            });

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    saveQuestionFeedback = async (
        question: string,
        questionHeader: string,
        wasUseful: boolean,
        text: string,
        localTime: string,
    ) => {
        try {
            const result = await AxiosRequest.post(webApiUrls.saveFaqFeedback(), {
                question,
                questionHeader,
                wasUseful,
                text,
                localTime,
            });

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    sendContactForm = async (formData: FormData, captcha?: string) => {
        try {
            formData.append('captcha', captcha || '');

            return await AxiosRequest.post(webApiUrls.contactUs(), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };
}

export default new HelpCenterService();
