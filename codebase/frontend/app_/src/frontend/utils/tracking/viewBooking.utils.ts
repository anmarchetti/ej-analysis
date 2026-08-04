import { IBookingInfo, IChatbotDataLayerPayload } from 'models/data/IBookingInfo';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

export enum TravelDocsTypes {
    PrintIcon = 'Print Icon',
    PrintButton = 'Print Button',
    DownloadIcon = 'Download Icon',
    DownloadButton = 'Download Button',
    DownloadReceipt = 'Download Receipt',
}

export enum ViewBookingTrackingEvents {
    Health = 'Health & Entry Requirements',
    TravelDocs = 'Travel Docs',
    DestinationLinks = 'Destination Link',
    CancelBooking = 'Cancel Booking',
    CancelBookingModal = 'Cancel Booking Modal',
    ReadOnlyAccess = 'Read Only Access',
    Help = 'Help FAQ',
    ViewBooking = 'View Booking',
}

export const getDefaultViewBookingEventParams = (
    additionalParams: Record<string, string> = {},
): Record<string, string> => ({
    eventCategory: EventCategories.Holidays,
    eventAction: EventActions.ViewBooking,
    eventType: EventTypes.Interaction,
    ...additionalParams,
});

export const getChatbotViewBookingEventParams = ({
    guests,
    package: bookingPackage,
    bookingReference,
}: IBookingInfo): IChatbotDataLayerPayload => {
    const guest = guests?.find(guest => guest.isLead) || guests?.[0];
    const routes = bookingPackage.transport?.routes || [];
    const depDate = routes[0]?.depDate;

    return {
        bookingGuestLastName: guest?.lastName || '',
        bookingDepDate: depDate || '',
        bookingReference,
    };
};
