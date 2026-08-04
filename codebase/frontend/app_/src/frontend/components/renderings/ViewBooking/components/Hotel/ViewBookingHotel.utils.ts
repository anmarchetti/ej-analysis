import { getHotelLocationHrefs } from 'frontend/utils/getHotelLocation';
import { IPreBookingInfo } from 'models/data/IBookingInfo';

export const getHotelMeta = (booking: IPreBookingInfo) => {
    const accom = booking.package?.accom || null;
    const hotelName = accom?.hotel?.name ?? booking.hotel?.name;
    const hotelImages = booking.hotel?.images ?? accom?.hotel?.images;
    const hotelLocationLinks = getHotelLocationHrefs(booking.hotel);
    const starRating = accom?.hotel?.starRating ? parseInt(accom.hotel.starRating, 10) : null;
    const taRating = accom?.hotel?.rating;
    const numberOfReviews = accom?.hotel?.numberOfReviews;

    return {
        hotelName,
        hotelImages,
        hotelLocationLinks,
        starRating,
        taRating,
        numberOfReviews,
        accom,
    };
};
