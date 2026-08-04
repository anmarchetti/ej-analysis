import { checkForEqualTransports } from 'frontend/utils/route.utils';
import { IAmendDatesResponseItem } from 'models/data/bookingAmendment/AmendDates';
import { IOffer } from 'models/data/IOffer';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';

export const amendDatesDisableErrors = [
    AmendBookingStatus.ChangeDateDisabledByTimeBound,
    AmendBookingStatus.ChangeDateDisabledBySitecore,
    AmendBookingStatus.ChangeDateDisabledBySitecoreForDCHotels,
    AmendBookingStatus.ChangeDateDisabledByChangeCountLimit,
    AmendBookingStatus.ChangeDateDisabledByAtcom,
    // AmendBookingStatus.changeDateDisabledByFlightDisruption shouldn't be included as a different processing is expected
];

export const getRoomDetailsForAmendDates = booking =>
    booking?.package.accom.rooms.map(({ occupation, code }) => ({
        adults: occupation.adults,
        children: occupation.children,
        infants: occupation.infants,
        childrenAges: occupation.childAges,
        roomCode: code,
    }));

export const getAmendmentItemsFromAlternativeOffers = (
    offers: IOffer[],
    amendmentItems: IAmendDatesResponseItem[],
): IAmendDatesResponseItem[] => {
    if (!offers?.length || !amendmentItems?.length) return [];

    const amendmentItemsFromOffers = offers.reduce((acc, offer) => {
        const foundItem = amendmentItems.find(amendmentItem =>
            checkForEqualTransports(offer.transport, amendmentItem.offer.transport),
        );

        if (foundItem) {
            acc.push(foundItem);
        }

        return acc;
    }, [] as IAmendDatesResponseItem[]);

    return amendmentItemsFromOffers;
};

export const clearSeatSelectionFromOffer = (
    amendDatesOffer: Nullable<IAmendDatesResponseItem>,
): IAmendDatesResponseItem =>
    ({
        ...amendDatesOffer,
        offer: {
            ...amendDatesOffer?.offer,
            seatSelection: [],
        } as IOffer,
    } as IAmendDatesResponseItem);
