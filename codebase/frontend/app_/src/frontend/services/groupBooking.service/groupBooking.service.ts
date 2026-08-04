import { webApiUrls } from 'code/endpoints';
import { logger } from 'frontend/services/logging';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { IGroupBookingInfo } from 'frontend/components/renderings/TradePortalGroupBooking/data/models';
class GroupBookingService {
    saveGroupBookingInformation = async (groupBookingInfo: IGroupBookingInfo) => {
        try {
            await AxiosRequest.post(webApiUrls.tradeGroupBooking(), groupBookingInfo);
        } catch (e) {
            const error = new ApiError(e);
            logger.error({
                e,
                message: 'Failed to save group booking',
            });

            throw error;
        }
    };
}

export default new GroupBookingService();
