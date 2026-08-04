import { formatDateToQuery, getDaysDifference } from 'frontend/utils/date.utils';
import { getOfferAccomCode } from 'frontend/utils/shortlist.utils';
import { IOffer } from 'models/data/IOffer';

export interface IProduct extends IProductDimensions {
    id: string;
}

export interface IProductDimensions {
    dimension126: number | null;
    dimension18: string | null;
    dimension20: string | null;
    dimension35: string | null;
    dimension47: number | null;
}

export const PRODUCT_ITEM_PREFIX = 'ej:';

export const createProduct = (offer: IOffer): IProduct => ({
    id: `${PRODUCT_ITEM_PREFIX}${getOfferAccomCode(offer)}`,
    ...getProductDimensions(offer),
});

export const getProductDimensions = (offer: IOffer): IProductDimensions => {
    const [outboundRoute] = offer.transport?.routes || [];

    return {
        dimension35: formatDateToQuery(outboundRoute?.depDate) || null,
        dimension47: offer.accom?.stay || null,
        dimension126: outboundRoute?.depDate ? getDaysDifference(new Date(outboundRoute.depDate), new Date()) : null,
        dimension18: outboundRoute?.depItemName || null,
        dimension20: outboundRoute?.arrItemName || null,
    };
};
