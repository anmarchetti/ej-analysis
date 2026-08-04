import { ICustomParams } from 'models/data/tracking/IEventWithParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';

export interface IPageMeta {
    pageCategory: string;
    pageLoadLayoutId: string;
    pageName: string; // page title with locale f.e. booking page | EN
    pageTitle: string; // page title without locale
}

export interface IUrgencyMessagingDimensions {
    dimension55: string; // room_type
    dimension89: string; // urgency_message
}

export interface IFilterActionDimensions {
    dimension158: string; // filter action
    dimension159: string; // filter category
    dimension160: string; // filter name
    dimension108?: string; // filter action for map view
}

interface IShortlistsDimensions {
    dimension95?: number | string; //shortlists_per_user
}

interface IViewBookingPageDimensions {
    dimension98?: number; // balance_remaining
    dimension99?: number; // percentage_balance_remaining
    id?: string; // booking reference id
    revenue?: number;
}

interface IExtrasPageDimension {
    dimension101?: string; // availability_check
}

export interface IBd4Dimensions {
    dimension143?: string; // "pToken" value from bd4sort API response
    dimension144?: string; // bd4message_bd4api
    dimension145?: string; // bd4message_message
    dimension146?: any; // "tracking" object from bd4sort API response
}

export interface IPageLoadObject
    extends IShortlistsDimensions,
        IViewBookingPageDimensions,
        IExtrasPageDimension,
        IBd4Dimensions {
    atcomGrouping: null | string;
    atcomPromoCode: null | string;
    currencyCode: string;
    dimension1: string; // user_id
    dimension10: string; // referral_page_name
    dimension11: string; // referral_page_category
    dimension12: string; // test_variant
    dimension13: string; // timestamp
    dimension2: string; // business_channel
    dimension3: string; // business_type
    dimension4: string; // environment
    dimension5: string; // site_version
    dimension6: string; // page_language;
    dimension7: string; // page_url;
    dimension8: string; // screen_orientation
    dimension88: string; // default media on HD page (image / video)
    dimension9: string; // responsive_pagebreak_view
    dimension92: string; // logged_in_status
    pageCategory: string;
    pageName: string;
    pageReferral: string;
    pageTitle: string;
    placeholders: null | string;
    channel?: string;
    customParams?: ICustomParams;
    // days_to_departure_bucket - post-booking only
    dimension126?: string;
    // Sitecore Personalized required parameter
    event?: EventTypes;
    hotelId?: string; // hotel id for smartseer tracking
}
