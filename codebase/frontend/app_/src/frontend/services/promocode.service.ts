import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';

import { logger } from './logging';

class PromocodeService {
    public loadUserPromocode = async (campaignId: string): Promise<string | null> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.userVoucherCode(campaignId), undefined, true);

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }
        }

        return null;
    };
}

const promocodeService = new PromocodeService();

export default promocodeService;
