import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { AxiosError } from 'axios';

import { cmsUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData } from 'models/data/ApiErrorData';
import { IHotelImage } from 'models/data/IHotelImage';
import { ISortItems } from 'models/data/sort/ISortItems';

import { logger } from './logging';

/** Sitecore specific edpoints, used on Experience editor */
class SitecoreService {
    public getItemDetails = async (itemId: string, fields?: string, lang: string = 'en') => {
        try {
            return await AxiosRequest.get(cmsUrls.itemDetails(itemId, fields, lang), undefined, true);
        } catch (e) {
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public getItemChildren = async (
        itemId: string,
        fields?: string,
        includeStandardTemplateFields?: boolean,
        lang: string = 'en',
    ) => {
        try {
            return await AxiosRequest.get(cmsUrls.itemChildren(itemId, fields, includeStandardTemplateFields, lang));
        } catch (e) {
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public createItem = async (parentPath: string, body: any, lang: string = 'en') => {
        try {
            return await AxiosRequest.post(cmsUrls.createItem(parentPath, lang), body);
        } catch (e) {
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public deleteItem = async (itemId: string, lang: string = 'en') => {
        try {
            return await AxiosRequest.delete(cmsUrls.deleteItem(itemId, lang));
        } catch (e) {
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public editItem = async (itemId: string, body: any, lang: string = 'en') => {
        try {
            return await AxiosRequest.patch(cmsUrls.itemDetails(itemId, '', lang), body);
        } catch (e) {
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public getVirtualFacilityGroupIdByFacilityId = async (itemId: string, lang: string = 'en') => {
        try {
            return await AxiosRequest.get(cmsUrls.getVirtualFacilityGroupIdByFacilityId(itemId, lang));
        } catch (e) {
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public sortItems = async (body: ISortItems, lang: string = 'en') => {
        try {
            return await AxiosRequest.post(cmsUrls.sortItems(lang), body);
        } catch (e) {
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public deleteItems = async (itemIds: string[], lang: string = 'en') => {
        try {
            return await AxiosRequest.post(cmsUrls.deleteItems(lang), itemIds);
        } catch (e) {
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public getHotelImage = async (hotelCode: string, resortCode: string): Promise<string | null> => {
        const hotelImageResponse = await AxiosRequest.get(cmsUrls.getHotelImage(hotelCode)).catch(() => null);

        if (hotelImageResponse) {
            const hotelImageData = hotelImageResponse?.data as IHotelImage;
            const smallImage = hotelImageData?.Small?.trim();

            if (smallImage) {
                return smallImage;
            }
        }

        const resortImageResponse = await AxiosRequest.get(cmsUrls.getDestinationImage(resortCode)).catch(() => null);

        if (resortImageResponse) {
            const resortImagePath =
                resortImageResponse?.data && typeof resortImageResponse.data === 'string'
                    ? resortImageResponse.data.trim()
                    : null;

            if (resortImagePath) {
                return resortImagePath;
            }
        }

        return null;
    };

    /**
     *
     * @param path - page path
     * @param lang - page language
     * @param placeholders - placeholder path strings, eg. `['body/component-wrapper-inner-{d88a0fbf-35f5-46fc-b5ed-9419c0a46da1}-0']`
     */
    public getPlaceholdersLayout = async (path: string, placeholders: string[], lang: string = 'en') => {
        try {
            const result = await AxiosRequest.get(cmsUrls.placeholdersLayout(path, placeholders, lang));

            return result.data as { [key: string]: ComponentRendering[] };
        } catch (e) {
            logger.error({ e: e as any });
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };

    public sendPersonalizeOrderData = async (orderData: Record<string, any>) => {
        try {
            return await AxiosRequest.post(cmsUrls.sendPersonalizeOrderData(), orderData);
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e as AxiosError<IApiErrorData>);
        }
    };
}

export default new SitecoreService();
