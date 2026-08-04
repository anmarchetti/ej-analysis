/**
 * Browser global variables
 */
declare const APP_STATE: any;
declare const BASEPATH: any;
declare const ENV: any;
declare const _cc: any;

/**
 * WEBPACK ENV
 */
declare const _ENVIRONMENT_: 'headless' | 'sitecore';

/**
 * ENV VARIABLES
 */

interface ISitecorePersonalized {
    clientKey: string;
    targetURL: string;
    pointOfSale: string;
    cookieDomain: string;
    includeUTMParameters: boolean;
    cookieExpiryDays: number;
}

interface IENVPUBLIC {
    APP_NAME: string;
    CMS_MEDIA: string;
    CMS_LAYOUT: string;
    CMS_LAYOUTS_SYSTEM: string;
    CMS_API: string;
    CMS_TRACK_API: string;
    PUBLIC_URL: string;
    WEBAPI_URL: string;
    USER_MANAGEMENT_API_URL: string;
    PAYMENT_ORIGIN: string;
    DESTINATION_GUID_SERVICE_URL: string;
    FLIGHT_PLUS_HOTEL_BASE_URL: string;
    ENV_DEV: boolean;
    PAYMENT_ALLOWED_HOST: string;
    FRONT_LOGGING_LEVEL: string;
    ENABLE_BD4_LOGGING: boolean;
    GOOGLE_MAPS_API_KEY: string;
    GOOGLE_MAPS_ID: string;
    GOOGLE_TAG_MANAGER: string;
    GOOGLE_TAG_MANAGER_IFRAME: string;
    GOOGLE_TAG_MANAGER_URL: string;
    GOOGLE_RECAPTCHA_SITE_KEY: string;
    ENSIGHTEN_CODE: Record<string, string> | string;
    SITECORE_PERSONALIZE: ISitecorePersonalized;

    APPD_AGENT_CONFIG_SCRIPT: string;
    APPD_SCRIPT_URL: string;

    SPLUNK_ENVIRONMENT_NAME: string;
    SPLUNK_RUM_ENABLED: boolean;
    SPLUNK_RUM_SESSION_RECORDER_ENABLED: boolean;
    SPLUNK_RUM_ACCESS_TOKEN: string;
    SPLUNK_RUM_APP_NAME: string;
    SPLUNK_RUM_APP_VERSION: string;
    SPLUNK_RUM_TRACER_SAMPLING_RATIO: string;
    SPLUNK_RUM_RECORDER_SAMPLING_RATIO: string;

    PAYMENT_DEVICE_COLLECTOR_URL: string;
    PAYMENT_DEVICE_SITE_KEY: string;
    VAPID_PUBLIC_KEY: string;
    NOTIFICATIONS_URL: string;
    PUSH_ID: string;
    THREEDS2_FINGERPRINT_TIMEOUT_MLS: number;

    SEAT_MAP_WIDGET_URL: string;

    CHATBOT_API_FILE: string;
    CHATBOT_CSS_FILE: string;
    NEXT_IMAGE_ENABLED: boolean;

    FEEFO_API: string;

    REDHATSSO_ISSUER: string;
    REDHATSSO_CLIENTID: string;
    DEEPLINK_AIRPORTS_MAPPING: Record<string, string>;

    PAYMENT_TRACKING_URL: string;

    GA_MEASUREMENT_ID: string;
    GA_TRACKING_API_SECRET: string;

    CIAM_API_URL: string;
    CIAM_JS: string;
    CIAM_B2B_STREAM: number | null;

    B2B_AMENDMENTS_ENABLED: boolean;
    MANAGE_MY_HOLIDAY_ENABLED: boolean;
    AMEND_TRANSFER_FLOW_ENABLED: boolean;
    AMEND_ROOM_AND_BOARD_FLOW_ENABLED: boolean;
    AMEND_MULTI_ROOM_AND_BOARD_FLOW_ENABLED: boolean;
    AMEND_FLIGHT_FLOW_ENABLED: boolean;
    AMEND_DATE_FLOW_ENABLED: boolean;
    AMEND_HOTEL_FLOW_ENABLED: boolean;
    AMEND_NAME_FLOW_ENABLED: boolean;
    AMEND_SEAT_FLOW_ENABLED: boolean;
    OPTIMIZELY_SDK_KEY: string;
    FPH_URL_SIGNING_KEY: string;
}

interface IENVPRIVATE {
    SITECORE_URL: string;
    SITECORE_API_KEY: string;
    SITECORE_API_EDIT_URL: string;
    SITECORE_API_EDIT_DATA_CACHE_DIRECTORY: string;
    ENABLE_SITECORE_CACHE: boolean;
    ENABLE_RENDER_CACHE: boolean;
    CACHE_SHORT_EXPIRE_SECONDS: number;
    CACHE_LONG_EXPIRE_SECONDS: number;
    SITECORE_PERSONALIZED_SETTINGS_CACHE_MAX_ENTRIES?: number;
    ORIGINAL_WEBAPI_URL: string;
    REDHATSSO_CLIENT_SECRET: string;
    ENABLE_WINSTON_FILE_LOGGING: boolean;
}

interface IENVALL extends IENVPUBLIC, IENVPRIVATE {}

/**
 * Under this variable webpack stores default requrie function
 */
declare const __non_webpack_require__: (module: string) => any;

/**
 * Represends any object.
 */
interface AnyObject {
    [key: string]: any;
}

/**
 * Represents any class.
 */
interface AnyClass<T = {}> {
    new (...params: any[]): T;
}

/**
 * Nullable type. Value of this type can be undefined.
 */
type Nullable<T> = T | undefined | null;

type TStyles = Record<string, string>;

type Primitive = bigint | boolean | null | number | string | symbol | undefined;

type PlainObject = Record<string, Primitive>;

/**
 * TypeScript don't recommend use Object or {} as a type.
 * It's more safety to use Record<string, unknown>
 */
type RecordObject = Record<string, unknown>;

/**
 * dataLayer object for tag manager
 */

declare let dataLayer: any;
interface Window {
    errorTracking: any;
    showNetworkIssuesPopup: any;
    hideNetworkIssuesPopup: any;
    _cc: any;
    safari: any;
    MSInputMethodContext: any;
    SeatsMapWidget: any;
    Engage: any;
    ApplePaySession: {
        canMakePayments: () => boolean;
    };
}

interface Navigator {
    msSaveOrOpenBlob?: any;
}

/**
 * IFrame flag
 */

declare let IS_IFRAME: boolean;

/**
 * No analytics flag
 */

declare let NO_ANALYTICS: boolean;

/**
 * Ensighten global variable
 */
declare const Bootstrapper: any;

/**
 * ReCAPTCHA global variable
 */
declare const grecaptcha: ReCaptcha;
interface ReCaptcha {
    ready: (cb: () => any) => void;
    execute: (siteKey: string, { action: string }) => Promise<string>;
}

declare interface PromiseConstructor {
    allSettled<T>(promises: Array<Promise<T>>): Promise<Array<{ status: 'fulfilled' | 'rejected'; value?: T }>>;
}

interface ShareData {
    files?: File[];
    text?: string;
    title?: string;
    url?: string;
}

interface Navigator {
    share(data?: ShareData): Promise<void>;
    userAgentData: {
        /** Experimental! Checks if browser is mobile */
        mobile: boolean;
    };
}

type THTMLElementEvent<T extends HTMLElement> = Event & {
    target: T;
};

declare namespace JSX {
    interface IntrinsicElements {
        'apple-pay-button': JSX.HTMLAttributes<HTMLElement>;
    }
}
