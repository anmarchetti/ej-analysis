import { IOffer } from 'models/data/IOffer';

export const getHotelLinkWithPrice = (offer: IOffer, hotelLink: string): string => {
    if (!hotelLink) {
        return '';
    }

    const url = new URL(hotelLink, window.location.origin);

    if (offer.price) {
        url.searchParams.set('searchPrice', offer.price.toString());
    }

    return url.pathname + url.search;
};
