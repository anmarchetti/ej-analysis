import { CurrencyCode } from 'code/currency';
import { IShortlistViewProduct } from 'frontend/utils/tracking/shortlist.utils';
import { ILateRoomCheckout } from 'models/data/IExtras';
import { IPoorEvent } from 'models/data/IPoorEvent';
import { TSeatTogetherCheckbox } from 'models/data/ISeatMapWidgetTrackingEvent';
import { BookingType } from 'models/enum/tracking/BookingType';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import {
    IAirportParkingProduct,
    IAmendTransferProduct,
    IFeesProduct,
    IFlightProduct,
    IParkingProduct,
    ISecondaryHolidayProduct,
    ITransferProduct,
    TProduct,
} from './IProduct';

export interface IEcommerceObject {
    dimension136: string;
    // pageName field, page title with locale f.e. booking page | EN
    ecommerce: TEnhancedEcommerce;
    event: EventTypes;
    pageTitle: string;
    dimension188?: TSeatTogetherCheckbox;
    dimension66?: string;
    // seat together checkbox general value
    // page title without locale
    enhancedConversion?: string | null;
    flightReference?: string;
    pageReferral?: string;
    paymentMethod?: string;
}

export interface IShortlistEcommerceObject extends IPoorEvent {
    ecommerce: {
        detail: {
            impressions: IShortlistViewProduct[];
        };
    };
}

interface IAncillariesProduct {
    product: Nullable<ITransferProduct | ILateRoomCheckout>;
}

export interface IBookingFlowTypeObject {
    bookingType: BookingType;
    event: EventTypes;
}

export interface IAncillariesEcommerceObject extends IPoorEvent {
    ecommerce:
        | TEcommerceAmendTransport
        | { impressions: IParkingProduct[] }
        | {
              add?: IAncillariesProduct | { products: IParkingProduct[] } | { products: IAirportParkingProduct[] };
              click?: {
                  actionField: {
                      action: string;
                      list: string;
                  };
                  products: object[];
              };
              currency?: CurrencyCode;
              currencyCode?: CurrencyCode;
              remove?: IAncillariesProduct | { products: IParkingProduct[] } | { products: IAirportParkingProduct[] };
          };
    greenPromo: string;
    dimension173?: string | null;
}

export type TEnhancedEcommerce = IEcommerceDetail | IEcommercePurchase | TEcommerceProduct | IEcommerceImpression;

export interface IEcommerceDetail {
    detail: {
        products: any[];
    };
    impressions?: any[];
}

export interface IEcommerceImpression {
    impressions?: any[];
}

export interface IEcommercePurchase {
    purchase: {
        actionField: {
            coupon: string;
            event: EventTypes;
            id: string;
            metric3: number; // amount_paid_using_credit
            revenue: number;
            timestamp: string;
        };
        products: TProduct[];
    };
}

export type TEcommerceProduct = {
    [key: string]: {
        actionField: {
            list: string;
        };
        products: TProduct[];
    };
};

export type TEcommerceAmendTransportProduct = (IAmendTransferProduct[] | IFlightProduct[]) | IFeesProduct[];

type TEcommerceAmendTypes = 'click' | 'purchase' | 'detail' | 'currencyCode';

export type TEcommerceAmendTransport = {
    [key in TEcommerceAmendTypes]?:
        | {
              actionField: {
                  action?: TEcommerceAmendTypes;
                  coupon?: string;
                  event?: EventTypes;
                  id?: string;
                  list?: string;
                  metric3?: number;
                  revenue?: number;
                  timestamp?: string;
              };
              products: TEcommerceAmendTransportProduct;
          }
        | string;
};

export interface IEcommerceDetailsObject {
    dimension136: string;
    dimension173: string;
    ecommerce: {
        currencyCode: CurrencyCode;
        detail: {
            actionField: {
                list: string;
            };
            products: Nullable<TProduct | ISecondaryHolidayProduct>[];
        };
    };
    event: EventTypes;
    metric6: number;
}

export interface ISearchCriteria {
    anywhere_selected: string;
    currencyCode: CurrencyCode;
    days_to_departure: string;
    departure_date: string;
    departure_date_flexibility: string;
    departure_season: string;
    event: EventTypes;
    holidaySearchSelections: IHolidaySearchSelection[];
    multiple_departure_airports_number: number;
    multiple_destinations_number: number;
    number_of_nights: number;
    pageName: string;
    pageReferral: string;
    pagination_first_page_results: number;
    pax_config: string;
    return_date: string;
    return_season: string;
    rooms_number: number;
    search_results_number: number;
    sort_by: string;
}

export interface IHolidaySearchSelection {
    item_category: string;
    item_category2: string | null;
    item_category3: string | null;
    item_category4: string | null;
    item_category5: string | null;
    item_generic_1: string | null;
    item_id: string;
    item_name: string;
    item_variant: string | null;
    price: number;
    quantity: number;
}
