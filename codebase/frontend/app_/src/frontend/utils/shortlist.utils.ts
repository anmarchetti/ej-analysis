import { IOffer } from 'models/data/IOffer';
import { ShortlistType } from 'models/enum/ShortlistType';

// Shortlist offer has shortListId
export const isShortlistOffer = (offer: IOffer): boolean => !!offer.shortlist?.id;

// Shortlist offer is not available anymore, if its price is 0
export const isShortlistOfferUnavailable = (offer: IOffer): boolean => isShortlistOffer(offer) && offer.price === 0;

export const isShortlistedOfferUnavailableForBooking = (offer: IOffer): boolean =>
    isShortlistOfferUnavailable(offer) || offer.shortlist?.type === ShortlistType.Hotel;

export const getOfferAccomCode = (offer: Nullable<IOffer>): string | undefined => {
    if (offer) {
        return offer.accom?.id || offer.accom?.code || offer.hotel?.giataCode;
    }

    return undefined;
};
