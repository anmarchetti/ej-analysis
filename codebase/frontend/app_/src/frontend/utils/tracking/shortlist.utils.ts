import { ENGLISH, TCmsLang } from 'code/cmsLang';
import { DATE_FORMATS } from 'code/dates';
import { isExpired } from 'frontend/utils/date.utils';
import { isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { IOffer } from 'models/data/IOffer';
import { OfferStatus } from 'models/enum/Offer';
import { ShortlistType } from 'models/enum/ShortlistType';
import { EventCategories } from 'models/enum/tracking/GenericEventParams';

import { getProductDimensions, IProductDimensions } from './trackOffer.utils';

export interface IShortlistViewProduct extends IProductDimensions {
    category: EventCategories;
    id: string | null;
    list: string;
    name: string | undefined;
    product_status: string;
    shortlist_added_location: TCmsLang | undefined;
}

export const createShortlistViewProduct = (offer: IOffer): IShortlistViewProduct => ({
    id: offer.accom?.id || null,
    name: offer.hotel?.name,
    category: EventCategories.Shortlist,
    list: 'Shortlist',
    product_status: getShortlistOfferStatus(offer),
    shortlist_added_location: offer.shortlist?.language || ENGLISH,
    ...getProductDimensions(offer),
});

export const getShortlistOfferStatus = (offer: IOffer): OfferStatus => {
    if (offer.shortlist?.type === ShortlistType.Hotel) {
        return OfferStatus.Hotel;
    }

    if (isExpired(offer.date, DATE_FORMATS.dateWithTime)) {
        return OfferStatus.Expired;
    }

    if (isShortlistOfferUnavailable(offer)) {
        return OfferStatus.Unavailable;
    }

    return OfferStatus.Active;
};
