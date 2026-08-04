import { CancelTokenSource } from 'axios';

import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { IShortlistOfferReqBody, IShortlistOffers, IShortlistStatus } from 'models/data/IShortlistOffers';

import { logger } from './logging';

class ShortlistService {
    public fetchShortlistOffers = async (
        take?: number,
        page?: number,
        cancelSource?: CancelTokenSource,
    ): Promise<IShortlistOffers> => {
        try {
            const url = webApiUrls.getShortlistOffers(take, page);

            const result = await AxiosRequest.get(
                url,
                { cancelToken: cancelSource ? cancelSource.token : cancelSource },
                true,
            );

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public deleteShortlistedItems = async (ids: string[]): Promise<IShortlistStatus> => {
        try {
            const url = webApiUrls.deleteShortlistedItems(ids);
            const result = await AxiosRequest.post(url, {});

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public addOfferToShortlist = async (offerInfo: IShortlistOfferReqBody): Promise<IShortlistStatus> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.addOfferToShortlist(), offerInfo);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public addHotelToShortlist = async (giataCode: string, iTheme: string): Promise<IShortlistStatus> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.addHotelToShortlist(), {
                giataCode,
                iTheme,
            });

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public getHotelShortlistStatus = async (giataCode: string): Promise<IShortlistStatus> => {
        try {
            const url = webApiUrls.getHotelShortlistStatus(giataCode);
            const result = await AxiosRequest.get(url, undefined, true);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public getShortlistStatus = async (): Promise<IShortlistStatus> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.getShortlistStatus(), undefined, true);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };
}

export default new ShortlistService();
