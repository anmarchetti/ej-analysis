import { AxiosRequestConfig, CancelTokenSource } from 'axios';

import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { IBalanceHistory } from 'models/data/IBalanceHistory';
import { IMyCreditInfo, IValidatedVoucher } from 'models/data/MyCreditInfo';

import { logger } from './logging';

class CreditManagementService {
    public loadBalanceHistory = async (): Promise<IBalanceHistory> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.getBalanceHistory(), undefined, true);

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public loadCreditBalance = async (
        cancelSource: CancelTokenSource,
        fromCache: boolean = false,
    ): Promise<IMyCreditInfo[]> => {
        try {
            const result = await AxiosRequest.get(
                webApiUrls.getCreditBalance(),
                {
                    headers: { AllowCache: fromCache ? 'true' : 'false' },
                    cancelToken: cancelSource ? cancelSource.token : cancelSource,
                } as AxiosRequestConfig,
                true,
            );

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public validateVoucherCode = async (voucherCode: string): Promise<IValidatedVoucher> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.validateVoucherCode(voucherCode));

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public redeemVoucher = async (voucherCode: string): Promise<IValidatedVoucher> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.redeemVoucher(voucherCode));

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };
}

export default new CreditManagementService();
