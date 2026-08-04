import { getDaysDifferenceRoundedFloor } from 'frontend/utils/date.utils';
import { SitePath } from 'models/enum/SitePath';

const DAYS_BEFORE_DEPARTURE_THRESHOLD = 3;
const DAYS_UNTIL_DEPARTURE_BADGE_THRESHOLD = 30;

/**
 * Get the appropriate route based on days until departure
 * @param daysUntilDeparture Number of days until departure
 * @param bookingReference The booking reference (unused for now, will be used when routing to specific booking)
 * @returns The route path to navigate to
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUpcomingBookingRoute = (daysUntilDeparture: number, bookingReference?: string): string => {
    if (daysUntilDeparture === 0) {
        return SitePath.InDestination;
    }

    if (daysUntilDeparture > 0 && daysUntilDeparture < DAYS_BEFORE_DEPARTURE_THRESHOLD) {
        return SitePath.PreTravel;
    }

    // When routing to specific booking is implemented, use bookingReference
    return SitePath.ViewBooking;
};

export const getDaysUntilDeparture = (departureDatetimeLocal?: string | null): number | null => {
    if (!departureDatetimeLocal) {
        return null;
    }

    const departureDate = new Date(departureDatetimeLocal);

    if (Number.isNaN(departureDate.getTime())) {
        return null;
    }

    return getDaysDifferenceRoundedFloor(departureDate, new Date());
};

export const shouldShowDaysUntilDepartureBadge = (daysUntilDeparture: number | null): boolean =>
    typeof daysUntilDeparture === 'number' &&
    daysUntilDeparture >= 0 &&
    daysUntilDeparture < DAYS_UNTIL_DEPARTURE_BADGE_THRESHOLD;
