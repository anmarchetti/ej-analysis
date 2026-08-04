import { INestedObject } from '@sitecore/engage/types/lib/utils/flatten-object';

import { OrderCheckoutPayment, SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';

export interface IBaseOrder {
    orderedAt: string;
    referenceId: string;
    status: string;
    currencyCode?: string;
}

export interface IOrderItem extends IBaseOrder {
    name: string;
    price: number;
    productId: string;
    quantity: number;
    type: string;
    currencyCode?: string;
    extensions?: [];
}

export interface IOrder extends IBaseOrder {
    date: string;
    cardType?: string;
    orderItems?: IOrderItem[];
    paymentType?: OrderCheckoutPayment;
    price?: number;
}

export interface IOrderCheckoutEventData extends TEngageEventData {
    order: IOrder;
    pointOfSale: string;
}

export interface IOrderCancelEventData extends TEngageEventData {
    order: IOrder;
    pointOfSale: string;
}

export interface IEngageIdentifierData {
    id: string;
    provider: string;
}

export type TBaseAirport = {
    code: string;
    name: string;
};

export type TEngageEventData = {
    channel: SitecoreChannel;
    currency: string;
    language: string;
    page: string;
};

export type TEngageIdentifyEventData = TEngageEventData & {
    identifiers: IEngageIdentifierData[];
    pointOfSale: string;
};

export type TEngagePageViewEventData = TEngageEventData & {
    pageProfile?: INestedObject;
};

export type TSearchData = TEngageEventData & {
    departureDate: string;
    destinations: TBaseAirport[];
    flexibility: string;
    fromAirports: TBaseAirport[];
    numberOfNights: number;
    pax: { adults: number; children: number; childrenAges: number[]; infants: number };
    returnDate: string;
};

export type TSortParams = {
    EnableOrdering?: string;
    FriendlyId?: string;
};
