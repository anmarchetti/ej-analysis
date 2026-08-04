import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';

import { IApplePayMerchantSession } from './interfaces';

class ApplePayService {
    public validateMerchant = async (validationURL: string): Promise<IApplePayMerchantSession> => {
        try {
            return (
                await AxiosRequest.post(webApiUrls.validateMerchant(), {
                    validationUrl: validationURL,
                    requestDomain: window.location.hostname,
                })
            ).data;
        } catch (e) {
            throw new ApiError(e);
        }
    };
}

const applePayService = new ApplePayService();
export default applePayService;
