export interface ICoreParams {
    businessChannel: string; // business_channel
    businessType: string; // business_type
    currencyCode: string;
    environment: string; // environment
    loggedInStatus: string; // logged_in_status
    pageCategory: string;
    pageLanguage: string; // page_language;
    pageName: string;
    pageReferral: string | null;
    pageUrl: string; // page_url;
    referralPageCategory: string | null; // referral_page_category
    referralPageName: string | null; // referral_page_name
    responsivePagebreakView: string; // responsive_pagebreak_view
    screenOrientation: string; // screen_orientation
    siteVersion: string; // site_version
    testVariant: string; // test_variant
    timestamp: string; // timestamp
    userId: string; // user_id
    ShortlistsPerUser?: number | string; //shortlists_per_user
}
