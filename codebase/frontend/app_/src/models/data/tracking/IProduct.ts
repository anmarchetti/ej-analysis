import { CurrencyCode } from 'code/currency';
import { TSeatTogetherCheckbox } from 'models/data/ISeatMapWidgetTrackingEvent';
import { IBd4Dimensions } from 'models/data/tracking/IPageLoadObject';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ProductCategories, ProductIds, ProductNames } from 'models/enum/tracking/ProductCategories';

import { IAmendHotelTrackingPayload } from './AmendPayload';

export interface ISecondaryHolidayProduct {
    category: string;
    currencyCode: CurrencyCode;
    id: string;
    metric6: number;
    name: string;
    price: number;
    quantity: number;
}

export interface IBaseHolidayProduct {
    brand: string; // holiday sub-theme, ex. Luxury
    category: ProductCategories.BaseHoliday;
    coupon: string; // promocode
    currencyCode: CurrencyCode;
    dimension108: EventTypes;
    dimension13: string; // timestamp,
    dimension15: number; // basket_revenue,
    dimension19: string; // departure_airport_code
    dimension21: string; // destination_airport_code
    dimension23: string; // destination_country (EN)
    dimension24: string; // destination_country_id
    dimension25: string; // destination_region (EN)
    dimension26: string; // destination_region_id
    dimension27: string; // destination_resort (EN)
    dimension28: string; // destination_resort_id
    dimension35: string; // departure_date;
    dimension42: string; // return_date
    dimension47: number; // number_of_nights
    dimension49: number; // pax_count (adults + children)
    dimension51: number; // no_of_adults
    dimension52: number; // no_of_children
    dimension53: number; // no_of_infants
    dimension54: number; // no_of_rooms
    dimension56: string; // board_basis
    dimension57: number | string; // hotel_rating
    dimension58: number | string; // tripadvisor_hotel_rating
    dimension63: string; // promo_code
    dimension64: number; // promo_code_discount
    dimension65: string; // promo_type
    dimension71: string; // distressed_seats
    dimension73: string; // refundable_status
    dimension78: number; // free_child_places_count
    dimension79: string; // child_ages
    id: string; // offer.accom.id,
    name: string; // hotelName
    price: number; // pricePP
    quantity: number;
    variant: string; // holiday theme, ex. Beach
    dimension137?: string; // Seat Category for Return
    dimension16?: string; // cost increases/decreases
    dimension162?: string; // is "Anywhere" search
    dimension17?: string; // Seat Category for Departure
    dimension172?: number; // number of included free nights
    dimension18?: string; // departure_airport
    dimension183?: boolean; // eco-certified/sustainable hotel
    dimension186?: string; // giata_code
    dimension20?: string; // destination_airport
    dimension22?: string; // destination_search_level
    dimension29?: string; // multiple_departure_airports
    dimension30?: number; // no_multiple_departure_airports
    dimension31?: string; // multiple_destinations
    dimension32?: number; // no_multiple_destinations
    dimension33?: string; // departure_date_level
    dimension34?: string; // departure_date_flexibility;
    dimension36?: string; // departure_month,
    dimension37?: string; // departure_season
    dimension38?: string; // departure_flight_time
    dimension40?: number | string; // days_to_departure
    dimension41?: string; // return_date_level
    dimension43?: string; // return_month
    dimension44?: string; // return_season
    dimension45?: string; // return_flight_time
    dimension50?: string; // passenger_config
    dimension55?: string; // room_type
    dimension59?: number; // budget_min
    dimension60?: number; // budget_max
    dimension61?: number; // number_of_search_results
    dimension66?: string; // payment_method Booking Confirmation Dimension
    dimension67?: string; // level_of_payment Booking Confirmation Dimension
    dimension68?: number; // percentage_of_total_payment Booking Confirmation Dimension
    dimension69?: number; // amount_paid Booking Confirmation Dimension
    dimension74?: string; // price view type (ex. Per Person/Total)
    dimension75?: string; // sort_by
    dimension76?: string; // search_results_view
    dimension77?: string; // hotel_contract_type
    dimension81?: string; // hotel_details_facilities
    dimension82?: string; // holiday_offers_and_promos
    dimension83?: string; // departure_flight_number
    dimension84?: string; // return_flight_number
    dimension85?: string; // flight_route
    dimension89?: string; // urgency_message
    list?: string;
    metric3?: number; // amount_paid_using_credit Booking Confirmation Dimension
    position?: number;
    revenue?: number; // Booking Confirmation Dimension
}

export interface IDetailHolidayProduct extends IBd4Dimensions {
    currencyCode: string;
    dimension108: EventTypes;
    dimension13: string; // timestamp,
    dimension19: string; // departure_airport_code
    dimension21: string; // destination_airport_code
    dimension23: string; // destination_country
    dimension24: string; // destination_country_id
    dimension25: string; // destination_region
    dimension26: string; // destination_region_id
    dimension27: string; // destination_resort
    dimension28: string; // destination_resort_id
    dimension35: string; // departure_date;
    dimension42: string; //	return_date
    dimension47: number | string; // number_of_nights
    dimension49: number; //	pax_count (adults + children)
    dimension51: number; //	no_of_adults
    dimension52: number; //	no_of_children
    dimension53: number; //	no_of_infants
    dimension54: string | number; //	no_of_rooms
    dimension79: string; //	child_ages
    dimension162?: string; // is "Anywhere" search
    dimension18?: string; // departure_airport
    dimension20?: string; // destination_airport
    dimension22?: string; // destination_search_level
    dimension29?: string; // multiple_departure_airports
    dimension30?: number; // no_multiple_departure_airports
    dimension31?: string; // multiple_destinations
    dimension32?: number; // no_multiple_destinations
    dimension33?: string; // departure_date_level
    dimension34?: string; // departure_date_flexibility;
    dimension36?: string; // departure_month,
    dimension37?: string; // departure_season
    dimension40?: number | string; // days_to_departure
    dimension41?: string; // return_date_level
    dimension43?: string; // return_month
    dimension44?: string; // return_season
    dimension50?: string; // passenger_config
    dimension61?: number; // number_of_search_results
    dimension62?: number; // pagination_first_result
    dimension74?: string; // price view type (ex. Per Person/Total)
    dimension75?: string; // sort_by
    variant?: string; // holiday theme, ex. Beach
}

export interface IFlightProduct {
    brand: string; // holiday sub-theme, ex. Luxury
    category:
        | ProductCategories.FlightDeparture
        | ProductCategories.FlightReturn
        | ProductCategories.FlightOutboundPB
        | ProductCategories.FlightInboundPB;
    currencyCode: string;
    dimension108: EventTypes;
    dimension13: string; // timestamp,
    dimension15: number; // basket_revenue,
    dimension18: string; // departure_airport
    dimension19: string; // departure_airport_code
    dimension20: string; // destination_airport
    dimension21: string; // destination_airport_code
    dimension35: string; // departure_date;
    dimension36: string; // departure_month,
    dimension37: string; // departure_season
    dimension38: string; // departure_flight_time
    dimension40: number; // days_to_departure
    dimension71: string; // distressed_seats;
    dimension83: string; // departure_flight_number
    id: string; // flight No
    name: string; // {departure_airport_code}-{destination_airport_code}
    price: 0; // price for flights is always 0
    quantity: number;
    variant: string; // holiday theme, ex. Beach
    dimension137?: string; // Seat Category for Return
    dimension17?: string; // Seat Category for Departure
    dimension29?: string; // multiple_departure_airports
    dimension30?: number; // no_multiple_departure_airports
    dimension31?: string; // multiple_destinations
    dimension32?: number; // no_multiple_destinations
    dimension33?: string; // departure_date_level
    metric3?: number; // amount_paid_using_credit Booking Confirmation Dimension
    revenue?: number; // Booking Confirmation Dimension
}

export interface ISeatsProduct
    extends Omit<IBaseHolidayProduct, 'metric3' | 'list' | 'dimension162' | 'dimension172' | 'category'> {
    category: string;
    dimension181: string; // aircraft_type_name (e.g. AIRBUS A320NEO)
    dimension187?: TSeatTogetherCheckbox;
}

export interface IPromoCodeProduct {
    coupon: string; // promocode
    dimension63: string; // promo_code
    dimension64: number; // promo_code_discount
    dimension65: string; // promo_type
}

export interface IPromoPageDetailObject extends IBd4Dimensions {
    brand: string; // holiday sub-theme, ex. Luxury
    dimension108: EventTypes;
    dimension18: string; // departure_airport
    dimension19: string; // departure_airport_code
    dimension20: string; // destination_airport
    dimension21: string; // destination_airport_code
    dimension22: string; // destination_search_level
    dimension56: string; // board_basis
    dimension57: number | string; // hotel_rating
    dimension61: number; // number_of_search_results
    dimension62: number; // pagination_first_result
    dimension75: string; // sort_by
}

export interface IBagsProduct {
    brand: string;
    category: string;
    coupon: string;
    currencyCode: string;
    dimension108: EventTypes;
    dimension19: string; // departure_airport_code
    dimension21: string; // destination_airport_code
    dimension23: string;
    dimension25: string;
    dimension27: string;
    dimension35: string;
    dimension42: string;
    dimension54: number;
    dimension56: string;
    dimension57: number | string;
    dimension58: number | string;
    dimension64: number;
    dimension78: number;
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant: string;
    dimension16?: string;
    dimension17?: string;
    dimension172?: number;
    dimension181?: string; // aircraft_type_name (e.g. AIRBUS A320NEO)
    dimension182?: string; // initial flight number
    dimension183?: boolean;
    dimension37?: string;
    dimension38?: string;
    dimension44?: string;
    dimension45?: string;
    dimension50?: string;
    dimension55?: string;
    dimension77?: string; // hotel_contract_type
    dimension83?: string;
    dimension84?: string;
}

export interface ILateCheckoutProduct {
    brand: string; // holiday sub-theme, ex. Luxury
    category: ProductCategories.HotelExtras;
    currencyCode: string;
    dimension108: EventTypes;
    dimension15: number; // basket_revenue,
    dimension23: string; // destination_country
    dimension35: string; // departure_date;
    dimension47: number; //	number_of_nights
    id: string; // flight No
    name: string; // {departure_airport_code}-{destination_airport_code}
    price: number; // price
    quantity: number;
    variant: string; // holiday theme, ex. Beach
    dimension173?: string; // bookingReference only on post booking flow, empty string on booking flow
    dimension37?: string; // departure_season
    dimension38?: string; // departure_flight_time
    dimension50?: string; // passenger_config
    dimension85?: string; // flight_route
}

export interface ITransferProduct {
    brand: string; // holiday sub-theme, ex. Luxury
    category: ProductCategories.Transfers;
    currencyCode: string;
    dimension108: EventTypes;
    dimension15: number; // total package price,
    dimension23: string; // destination_country
    dimension35: string; // departure_date;
    id: string; // transfer id
    name: string; // transfer name
    price: number; // transfer price
    quantity: number;
    variant: string; // holiday theme, ex. Beach
    dimension173?: string; // bookingReference only on post booking flow, empty string on booking flow
    dimension37?: string; // departure_season
    dimension38?: string; // departure_flight_time
    dimension47?: number; // number_of_nights
    dimension50?: string; // passenger_config
    dimension85?: string; // flight_route
}

export interface IParkingProduct {
    brand: string;
    category: ProductCategories;
    dimension108: EventTypes;
    id: ProductCategories;
    name: string;
    price: number;
    quantity: number;
    variant: string;
}

export interface ILCBProduct {
    brand: string; // holiday sub-theme, ex. Luxury
    category: ProductCategories.LCBOutbound | ProductCategories.LCBInbound;
    currencyCode: CurrencyCode;
    dimension108: EventTypes;
    dimension35: string; // departure_date;

    id: ProductIds; // lcb id
    name: ProductNames; // lcb name
    price: number; // lcb price by route
    quantity: number;
    variant: string; // holiday theme, ex. Beach

    coupon?: string; // promocode
    dimension13?: string; // timestamp,
    dimension137?: string; // Seat Category for Return
    dimension15?: number; // total package price
    dimension17?: string; // Seat Category for Departure
    dimension173?: string | null; // bookingReference only on post booking flow, empty string on booking flow
    dimension18?: string; // departure_airport
    dimension19?: string; // departure_airport_code
    dimension20?: string; // destination_airport
    dimension21?: string; // destination_airport_code
    dimension23?: string; // destination_country (EN)
    dimension29?: string; // multiple_departure_airports
    dimension30?: number; // no_multiple_departure_airports
    dimension31?: string; // multiple_destinations
    dimension32?: number; // no_multiple_destinations
    dimension33?: string; // departure_date_level
    dimension36?: string; // departure_month,
    dimension37?: string; // departure_season
    dimension38?: string; // departure_flight_time
    dimension40?: number | string; // days_to_departure
    dimension47?: number; // number_of_nights
    dimension50?: string; // passenger_config
    dimension71?: string; // distressed_seats
    dimension83?: string; // departure_flight_number
    dimension85?: string; // flight_route -- departure_airport_code|destination_airport_code
    dimension89?: string; // urgency_message
}

export interface IAmendTransferProduct extends Omit<IBaseHolidayProduct, 'category'> {
    category: string;
    dimension108: EventTypes;
    id: string; // transfer name
    metric6: number; //refund price (If no = 0)
    name: string; // transfer name (same as id)
    price: number; //price of transfer
}

export interface IRoomAndBoardTrackingProduct {
    brand: string;
    category: string;
    coupon: string;
    currencyCode: string;
    dimension108: EventTypes;
    dimension13: string;
    dimension15: number;
    dimension19: string; // departure_airport_code
    dimension21: string; // destination_airport_code
    dimension23: string;
    dimension24: string;
    dimension25: string;
    dimension26: string;
    dimension27: string;
    dimension28: string;
    dimension35: string;
    dimension42: string;
    dimension47: number;
    dimension49: number;
    dimension51: number;
    dimension52: number;
    dimension53: number;
    dimension56: string;
    dimension63: string;
    dimension64: number;
    dimension65: string;
    dimension73: string;
    id: string;
    metric6: number;
    name: string;
    price: number;
    quantity: number;
    variant: string;
    dimension16?: string;
    dimension18?: string;
    dimension20?: string;
    dimension37?: string;
    dimension38?: string;
    dimension40?: number | string;
    dimension44?: string;
    dimension45?: string;
    dimension50?: string;
    dimension55?: string;
    dimension81?: string;
    dimension83?: string;
    dimension84?: string;
    dimension85?: string;
    metric3?: number;
    revenue?: number;
}

export interface IFeesProduct {
    category: string;
    dimension108: EventTypes;
    id: string;
    name: string;
    price: number; // Per Person Price
    quantity: number; // Number of Passengers
}

export type TProduct =
    | IBaseHolidayProduct
    | IFlightProduct
    | ILateCheckoutProduct
    | ISeatsProduct
    | IAmendTransferProduct
    | ITransferProduct
    | IBagsProduct
    | IRoomAndBoardTrackingProduct
    | ILCBProduct
    | IFeesProduct;

export interface IAmendPaymentTrackingPayload {
    initialData?: IAmendHotelTrackingPayload;
    secondaryProducts?: Record<string, Nullable<ISecondaryHolidayProduct>>;
}
export interface IAirportParkingProduct
    extends Omit<
        IBaseHolidayProduct,
        | 'dimension66'
        | 'dimension67'
        | 'dimension68'
        | 'dimension69'
        | 'dimension74'
        | 'dimension81'
        | 'dimension82'
        | 'dimension85'
        | 'revenue'
        | 'metric3'
        | 'list'
        | 'category'
    > {
    category: ProductCategories.ExternalExtras;
    item_generic_1: string;
    item_generic_2: string;
}
