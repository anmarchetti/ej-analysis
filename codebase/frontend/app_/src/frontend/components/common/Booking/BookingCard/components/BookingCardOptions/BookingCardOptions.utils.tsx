import { IBookingInfo } from 'models/data/IBookingInfo';
import { getCommonData } from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';
import { IOfferKeySellingPointsProps } from 'frontend/components/renderings/SearchResults/components/OfferKeySellingPoints';

// remove layout from OfferKeySellingPoints' props
type TBookingOptions = Omit<IOfferKeySellingPointsProps, 'layout' | 'getPhrase' | 'getFormattedNumber'>;

interface IPreparedBookingData {
    isCanceled: boolean;
    options: TBookingOptions;
}

export const usePreparedBookingOptionsData = (booking: IBookingInfo): IPreparedBookingData => {
    const {
        offer: { hotel: offerHotel, rooms },
        isCanceled,
    } = getCommonData(booking);
    const { hotel: bookingHotel } = booking;

    return {
        isCanceled,
        options: {
            holidayTheme: offerHotel.theme,
            closestFacility: offerHotel.closestFacility ?? bookingHotel?.closestFacilities,
            roomTypes: rooms[0]?.roomType ?? bookingHotel?.roomTypes?.[0],
            boardTypes: rooms[0]?.boardType ?? bookingHotel?.boardTypes?.[0],
        },
    };
};
