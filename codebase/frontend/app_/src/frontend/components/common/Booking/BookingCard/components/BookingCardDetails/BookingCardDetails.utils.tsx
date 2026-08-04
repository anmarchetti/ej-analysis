import { useLuxuryInternalFlight } from 'frontend/hooks/useLuxuryInternalFlight';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDaysDifference } from 'frontend/utils/date.utils';
import { getGuestsAmountByType } from 'frontend/utils/luggage.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IRoute } from 'models/data/IRoute';
import { ITransfer } from 'models/data/ITransfer';
import { NUMBER_OF_ROUTES } from 'models/enum/RouteDirection';
import { getCommonData } from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';
import { IHolidayFlightDetailsProps } from 'frontend/components/common/HolidayFlightDetails';

type TBookingDetails = Omit<IHolidayFlightDetailsProps, 'getPhrase' | 'isScreenMedium' | 'isShortlistPage'>;

interface IPreparedBookingData {
    details: TBookingDetails;
    isCanceled: boolean;
    isFlightDetailsDisplayed: boolean;
}

export const usePreparedBookingDetailsData = (booking: IBookingInfo): IPreparedBookingData => {
    const { largeCabinBagCode } = useStore(({ layoutStore }: TStores) => ({
        largeCabinBagCode: layoutStore.largeCabinBagCode,
    }));

    const isLuxuryInternalFlight = useLuxuryInternalFlight();

    const { package: bookingPackage, transfers } = booking;
    const { offer, isCanceled, routeDep } = getCommonData(booking);
    const { hotel, endDate, startDate } = offer;
    const routeArr = bookingPackage.transport?.routes[1] as Nullable<IRoute>;
    const guestsAmountByType = getGuestsAmountByType(booking, booking.package.accom);

    const holdLuggageNumber = booking.extraLuggageInfo.items.reduce(
        (sum, item) => (item.itemCode !== largeCabinBagCode ? sum + item.quantity : sum),
        0,
    );
    const holdLuggageNumberPerRoute = holdLuggageNumber / NUMBER_OF_ROUTES + guestsAmountByType.infants;

    const luggageCount = isLuxuryInternalFlight
        ? guestsAmountByType.adults + guestsAmountByType.children + guestsAmountByType.infants
        : holdLuggageNumberPerRoute;

    return {
        isCanceled,
        isFlightDetailsDisplayed: !!(routeDep && routeArr),
        details: {
            night: getDaysDifference(new Date(endDate), new Date(startDate)),
            routeDep,
            routeArr,
            luggageCount,
            transfer: transfers?.[0] as Nullable<ITransfer>,
            packageIcons: hotel.theme?.packageIcons,
        },
    };
};
