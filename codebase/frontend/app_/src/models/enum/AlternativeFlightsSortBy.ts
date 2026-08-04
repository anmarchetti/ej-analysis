import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';

export enum AlternativeFlightsSortBy {
    PriceLowToHigh = 'PRICEASC',
    PriceHightToLow = 'PRICEDESC',
    OutboundEarliestDeparture = 'OUTBOUND',
    ReturningEarliestArrival = 'INBOUND',
    NearestAirport = 'NEARAIR',
}

export type TAlternativeFlightsSortOrderItem = ISortOrderItem<AlternativeFlightsSortBy>;
