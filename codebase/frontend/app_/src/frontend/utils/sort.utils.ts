import { getRoomName } from 'frontend/utils/offer.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IUnit } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { RouteDirection } from 'models/enum/RouteDirection';
import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';

import { getRoute } from './route.utils';

export function compare(_a: any, _b: any, key?: string): number {
    return sortBy(_a, _b, val => (key ? val[key] : val));
}

/**
 * Sort array type T by specific value
 * @param _a
 * @param _b
 * @param converter
 */
export function sortBy<T>(_a: T, _b: T, converter?: (val: T) => any, direction: 1 | -1 = 1): number {
    const a = converter ? converter(_a) : _a;
    const b = converter ? converter(_b) : _b;

    if (a < b) {
        return -direction;
    }

    if (a > b) {
        return direction;
    }

    return 0;
}

/**
 * Sort filter prices
 * @param arr array to sort
 */
export function sortPrice(arr: (number | null)[]): (number | null)[] {
    if (arr.every(x => !!x)) {
        return arr.sort((a, b) => (a || 0) - (b || 0));
    }

    return arr;
}

export function sortRoomsByName(leftRoom: IUnit, rightRoom: IUnit): number {
    const leftRoomTitle = getRoomName(leftRoom.roomType).toLocaleLowerCase() ?? '';
    const rightRoomTitle = getRoomName(rightRoom.roomType).toLocaleLowerCase() ?? '';

    if (leftRoomTitle < rightRoomTitle) {
        return -1;
    }

    if (leftRoomTitle > rightRoomTitle) {
        return 1;
    }

    return 0;
}

export function sortRoomsPriceLowHigh(leftRoom: IUnit, rightRoom: IUnit): number {
    if (leftRoom.price > rightRoom.price) {
        return 1;
    }

    if (leftRoom.price < rightRoom.price) {
        return -1;
    }

    // if price is equal => sort alphabetically
    return sortRoomsByName(leftRoom, rightRoom);
}

export function sortRoomsPriceHighLow(leftRoom: IUnit, rightRoom: IUnit): number {
    if (leftRoom.price > rightRoom.price) {
        return -1;
    }

    if (leftRoom.price < rightRoom.price) {
        return 1;
    }

    // if price is equal => sort alphabetically
    return sortRoomsByName(leftRoom, rightRoom);
}

export const getSelectValueFromSortOrder = (sortOrder: ISortOrderItem): ISelectOption => ({
    value: sortOrder?.fields?.Code?.value,
    label: sortOrder?.fields?.Title?.value,
});

export const sortFlights = (
    flights: IAlternativeOffer[],
    sortOption?: AlternativeFlightsSortBy,
): IAlternativeOffer[] => {
    switch (sortOption) {
        case AlternativeFlightsSortBy.PriceLowToHigh:
            return flights.sort((leftOffer, rightOffer) => compare(leftOffer, rightOffer, 'price'));

        case AlternativeFlightsSortBy.PriceHightToLow:
            return flights.sort((leftOffer, rightOffer) => compare(rightOffer, leftOffer, 'price'));

        case AlternativeFlightsSortBy.OutboundEarliestDeparture:
            return flights.sort((leftOffer, rightOffer) => {
                const leftOfferOutbound = getRoute(leftOffer, RouteDirection.Outbound);
                const rightOfferOutbound = getRoute(rightOffer, RouteDirection.Outbound);
                const leftOfferDate = new Date(leftOfferOutbound?.depDate ?? 0);
                const rightOfferDate = new Date(rightOfferOutbound?.depDate ?? 0);

                return compare(leftOfferDate, rightOfferDate);
            });

        case AlternativeFlightsSortBy.ReturningEarliestArrival:
            return flights.sort((leftOffer, rightOffer) => {
                const leftOfferInbound = getRoute(leftOffer, RouteDirection.Inbound);
                const rightOfferInbound = getRoute(rightOffer, RouteDirection.Inbound);
                const leftOfferDate = new Date(leftOfferInbound?.arrDate ?? 0);
                const rightOfferDate = new Date(rightOfferInbound?.arrDate ?? 0);

                return compare(leftOfferDate, rightOfferDate);
            });

        case AlternativeFlightsSortBy.NearestAirport:
            return flights.sort((previousOffer, currentOffer) =>
                sortBy(previousOffer, currentOffer, offer => offer.distanceToOriginalAirport ?? 0),
            );

        default:
            return flights;
    }
};

export const sortBoardsByPrice = (
    altBoards: (IBoardType | IAltBoard)[],
    notValidatedOfferPricePP: number,
): (IBoardType | IAltBoard)[] =>
    [...altBoards].sort((a: IAltBoard, b: IAltBoard): number => {
        const price_a = a.pricePP ?? a.price ?? notValidatedOfferPricePP;
        const price_b = b.pricePP ?? b.price ?? notValidatedOfferPricePP;

        return price_a - price_b || (a.title || '').localeCompare(b.title || '');
    });
