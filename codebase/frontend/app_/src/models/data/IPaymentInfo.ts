import { CurrencyCode } from 'code/currency';

export interface IPaymentInfo {
    agentComission: number;
    allowPayBalanceDueDate: string;
    allowPayOutstandingBalanceDays: number;
    balanceDueAmount: number;
    balanceDueDate: string;
    commissionIncludingVat: number;
    currency: CurrencyCode;
    depositDueDate: string;
    depositPrice: number;
    paymentHistory: IPaymentHistoryItem[];
    pricePP: number;
    totalPrice: number;
}

export interface IPaymentHistoryItem {
    amount: number;
    card: {
        code: string;
        number: string;
    };
    paymentDate: string;
    /** whether payment was made by credit */
    isCredit?: boolean;
}

export interface IPaymentTrackingData {
    business_channel: string;
    business_type: string;
    content_group: string;
    environment: string;
    logged_in_status: string;
    page_category: string;
    page_title: string;
    platform_language: string;
    referral_page_category: string;
    referral_page_name: string;
    responsive_page_break_view: string;
    screen_orientation: string;
    site_version: string;
    test_variant: string;
    currency?: CurrencyCode;
}

export interface IFullPaymentTrackingData extends IPaymentTrackingData, IPaymentGAParams {
    consent_config: string;
    page_location: string;
    page_referral_url: string;
    page_url: string;
    session_id: string;
    timestamp: number;
    user_agent: string;
}

export interface IPaymentGAParams {
    event_action?: string;
    event_category?: string;
    event_currency?: CurrencyCode;
    event_label?: string;
    event_value?: string | number;
    generic_value_1?: string | boolean;
    generic_value_2?: string;
    generic_value_3?: string;
}

export interface IPaymentTrackingEvent {
    name: string;
    params?: IFullPaymentTrackingData;
}

export enum PaymentTrackingEventType {
    PageView = 'page_view',
    PageGenericEvent = 'generic_event',
}
