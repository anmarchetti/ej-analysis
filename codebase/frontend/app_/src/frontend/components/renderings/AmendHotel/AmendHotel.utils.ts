import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IBookingInfo, IBookingPackage } from 'models/data/IBookingInfo';
import { IBoardType, IHotel, IRoomType } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ITransfer } from 'models/data/ITransfer';

export const getHotelOffer = (offer: IAmendHotelOffer, booking: IBookingInfo): Nullable<IOffer> => {
    if (offer.amendmentChargesInfo?.fullAmendmentCharges === undefined) return null;

    if (!booking.package?.transport) return null;

    if (!booking.package?.accom?.startDate) return null;

    if (!offer.accom?.id) return null;

    const hotelOffer: IOffer = {
        altBoards: [],
        date: booking.package.accom.startDate,
        hasDistressedFlights: false,
        id: offer.accom.id,
        price: offer.amendmentChargesInfo.fullAmendmentCharges,
        pricePP: 0,
        stay: offer.accom.stay,
        transport: booking.package.transport,
        touristTax: 0,
        touristTaxPP: 0,
        hasDiscountedBoardUpgrade: false,
        priceExcludingTouristTax: offer.amendmentChargesInfo.fullAmendmentCharges,
        pricePPExcludingTouristTax: 0,
        ...offer,
        taxesAndFees: undefined,
    };

    return hotelOffer;
};

/**
 * Retrieves hotel change information based on the provided booking and amendOffer.
 * If the amendOffer is provided, it will return data from the amendOffer.
 * If the amendOffer is not provided, it will fall back to the booking information.
 *
 * @param booking - The booking information.
 * @param amendOffer - The amend hotel offer.
 * @returns An object containing the hotel change information.
 */
export const getHotelChangeInfo = (
    booking: IBookingInfo,
    amendOffer?: IAmendHotelOffer,
): {
    boardType: IBoardType;
    endDate: string;
    hasSelectedNewHotel: boolean;
    hotel: IHotel | undefined;
    location: IBookingPackage['location'];
    roomType: IRoomType;
    routes: IRoute[];
    startDate: string;
    transfer: ITransfer;
} => {
    const bookingPackage = booking.package;
    const transfer = amendOffer?.transfers?.[0] ?? booking.transfers?.[0];
    const { startDate, endDate } = bookingPackage.accom;
    const { roomType, boardType } = amendOffer?.accom?.unit[0] ?? bookingPackage.accom.rooms[0];
    const hotel = amendOffer?.hotel ?? booking.hotel;
    const location =
        !!amendOffer && !!hotel
            ? { city: hotel.resort.name, country: hotel.country.code, region: hotel.location.name }
            : bookingPackage?.location;
    const { routes } = bookingPackage.transport;
    const hasSelectedNewHotel = !!amendOffer;

    return {
        transfer,
        startDate,
        endDate,
        roomType,
        boardType,
        hotel,
        location,
        routes,
        hasSelectedNewHotel,
    };
};
