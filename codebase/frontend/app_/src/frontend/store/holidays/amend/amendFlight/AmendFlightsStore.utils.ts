import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';

export const checkForOrderIncorrect = (altFlights: IAmendTransport[], sortType: AlternativeFlightsSortBy) =>
    !!altFlights.find(({ amendmentCharges }, i, arr) => {
        const nextPrice = arr[i + 1]?.amendmentCharges;

        if (!amendmentCharges || !nextPrice) {
            return false;
        }

        return sortType === AlternativeFlightsSortBy.PriceLowToHigh
            ? nextPrice < amendmentCharges
            : nextPrice > amendmentCharges;
    });
