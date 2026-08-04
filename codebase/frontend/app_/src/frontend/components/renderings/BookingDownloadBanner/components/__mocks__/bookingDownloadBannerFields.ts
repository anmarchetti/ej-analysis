import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { TBookingDownloadBannerFields } from 'frontend/components/renderings/BookingDownloadBanner/BookingDownloadBanner';

const bookingDownloadBannerFieldsMocks = (): TBookingDownloadBannerFields => ({
    FlightReferenceDescription: mockSitecoreField('Flight reference description'),
    FlightReferenceTitle: mockSitecoreField('Flight reference'),
    HolidayReferenceDescription: mockSitecoreField('Holiday reference description'),
    HolidayReferenceTitle: mockSitecoreField('Holiday reference'),
    ReferencesTitle: mockSitecoreField('References'),
    TravelDocumentsTitle: mockSitecoreField('Travel documents'),
    CopyButtonAriaLabel: mockSitecoreField('copy'),
});

export default bookingDownloadBannerFieldsMocks;
