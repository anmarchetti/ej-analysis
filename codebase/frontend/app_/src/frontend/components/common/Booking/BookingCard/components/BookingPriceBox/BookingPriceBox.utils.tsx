import { isFlightDeparted } from 'frontend/utils/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { getCommonData } from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';
import { IPillsBlockProps } from 'frontend/components/renderings/ViewBookings/components/PillsBlock/PillsBlock';

type TPills = Omit<IPillsBlockProps, 'children'>;

export interface IPreparedPriceBoxData {
    isCancelWarningDisplayed: boolean;
    isNullable: boolean;
    pills: TPills;
}

export const usePreparedBookingPriceBoxData = (booking: IBookingInfo, isUpcoming: boolean): IPreparedPriceBoxData => {
    const { isCanceled, routeDep } = getCommonData(booking);
    const { paymentInfo, isExternalAgency, currency, isDestinationRulesApplied = false } = booking;

    return {
        isNullable: isCanceled && !isUpcoming,
        pills: {
            departureDate: routeDep?.depDate ?? null,
            dueDate: paymentInfo.balanceDueDate,
            remainingBalance: paymentInfo.balanceDueAmount as number,
            isExternalAgency: isExternalAgency,
            currency: currency?.code,
        },
        isCancelWarningDisplayed: isDestinationRulesApplied && isUpcoming && !isFlightDeparted(booking),
    };
};
