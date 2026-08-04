import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { ICountry } from 'models/data/ICountry';
import { IDialingCode } from 'models/data/IDialingCode';

import { logger } from './logging';

export class GuestsService {
    static getCountries = async (): Promise<ICountry[]> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.countries());

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw new ApiError(e);
        }
    };

    static getDialingCodes = async (): Promise<IDialingCode[]> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.dialingCodes());

            // convert all dialing codes to string as api server only accepts strings as dialing codes
            if (result.data && Array.isArray(result.data)) {
                result.data.forEach((c: IDialingCode) => {
                    if (c?.code) {
                        c.code += '';
                    }
                });
            }

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw new ApiError(e);
        }
    };
}
