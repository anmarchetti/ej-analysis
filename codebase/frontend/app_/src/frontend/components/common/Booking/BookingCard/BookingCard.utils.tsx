import { IBookingAccom, IBookingInfo } from 'models/data/IBookingInfo';
import { IImage } from 'models/data/IHotel';
import { IRoute } from 'models/data/IRoute';
import { BookingStatus } from 'models/enum/BookingStatus';

interface ICommonData {
    isCanceled: boolean;
    offer: IBookingAccom;
    routeDep: Nullable<IRoute>;
}

export const getCommonData = (booking: IBookingInfo): ICommonData => ({
    offer: booking.package.accom,
    isCanceled: booking.bookingStatus === BookingStatus.Canceled,
    routeDep: booking.package.transport?.routes[0],
});

interface IPreparedBookingData {
    images: Nullable<IImage[]>;
}

export const usePreparedBookingData = (booking: IBookingInfo): IPreparedBookingData => {
    const { offer } = getCommonData(booking);

    return {
        images: (booking.hotel?.images ?? offer?.hotel?.images) as Nullable<IImage[]>,
    };
};
