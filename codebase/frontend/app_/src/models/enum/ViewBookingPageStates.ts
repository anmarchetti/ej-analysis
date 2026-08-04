export enum ViewBookingPageStates {
    ViewBooking = 'viewBooking',
    PreTravel = 'preTravel',
    InDestination = 'inDestination',
    PostTravel = 'postTravel',
    Unknown = 'unknown',
    Cancelled = 'cancelled',
}

export type TViewBookingRedirectsPaths = {
    cancelled: string;
    inDestination: string;
    postTravel: string;
    preTravel: string;
    viewBooking: string;
};
