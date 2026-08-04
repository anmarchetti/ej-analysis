import { getLangByCMSLang } from 'code/cmsLang';
import { buildHotelDetailsUrl, getHotelLocation } from 'frontend/utils/getHotelLocation';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ITheme, IThemeType } from 'models/data/IHotel';
import { getCommonData } from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';

import { IBookingHead } from './BookingCardHead';

interface IPreparedBookingData extends IBookingHead {
    hotelLang: string | undefined;
    hotelName: string;
    hotelPath: string;
    hotelTheme: Nullable<ITheme>;
    hotelType: Nullable<IThemeType>;
    isEcoCertifiedPillDisplayed: boolean;
    isTAInfoDisplayed: boolean;
    starRating: Nullable<number>;
    taRating: Nullable<number>;
    title: string;
    tooltip: string;
    hotelLocation?: string;
}

export const usePreparedBookingHeadData = (
    booking: IBookingInfo,
    isEcoCertifiedEnabledOnBookingListPage: boolean,
): IPreparedBookingData => {
    const { hotel: bookingHotel, hotel: { ecoFacility } = {} } = booking;
    const {
        offer: { hotel: offerHotel },
    } = getCommonData(booking);
    const taRating = offerHotel.rating ? parseFloat(offerHotel.rating + '') : null;
    const numberOfReviews = offerHotel.numberOfReviews;

    return {
        hotelPath: buildHotelDetailsUrl(bookingHotel),
        hotelLang: bookingHotel?.languageOfHotel ? getLangByCMSLang(bookingHotel.languageOfHotel) : undefined,
        hotelName: bookingHotel?.name ?? offerHotel?.name ?? '',
        hotelType: offerHotel.type,
        hotelTheme: offerHotel.theme,
        hotelLocation: getHotelLocation(offerHotel),
        // eslint-disable-next-line no-magic-numbers
        starRating: offerHotel.starRating ? parseInt(offerHotel.starRating.substring(-1, 1)) : null,
        isTAInfoDisplayed: !!(taRating && numberOfReviews),
        taRating: offerHotel.rating ? parseFloat(offerHotel.rating + '') : null,
        numberOfReviews: offerHotel.numberOfReviews,
        isEcoCertifiedPillDisplayed: Boolean(
            ecoFacility?.name && ecoFacility?.tooltip && isEcoCertifiedEnabledOnBookingListPage,
        ),
        title: ecoFacility?.name || '',
        tooltip: ecoFacility?.tooltip || '',
    };
};
