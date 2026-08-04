export const PURCHASED_STATUS = 'PURCHASED';
export const CANCELLED_STATUS = 'CANCELLED';

export enum IdentityRules {
    BrowserId = 'browser_id',
}

export enum OrderCheckoutPayment {
    Credit = 'Credit',
    Card = 'Card',
    PartialCredit = 'Card|Credit',
    ApplePay = 'ApplePay',
    PartialApplePayCredit = 'ApplePay|Credit',
}

export enum SitecoreChannel {
    Desktop = 'WEB',
    Mobile = 'MOBILE_WEB',
    Tablet = 'TABLET_WEB',
}
