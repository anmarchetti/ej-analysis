import { parseRoomCode } from 'frontend/utils/url.utils';
import { IRoomVariant } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IUnit } from 'models/data/IOffer';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';

export const amendRoomAndBoardDisableErrors = [
    AmendBookingStatus.AmendRoomAndBoardDisabledByAtcom,
    AmendBookingStatus.AmendRoomAndBoardDisabledOnSite,
    AmendBookingStatus.AmendRoomAndBoardDisabledByTimeBound,
    AmendBookingStatus.AmendRoomAndBoardDisabledByHavingMultipleRooms,
    AmendBookingStatus.AmendRoomAndBoardDisabledByFlightsDisruption,
    AmendBookingStatus.AmendRoomAndBoardDisabledByChangeCountLimit,
];

export const areRoomVariantsEqual = (
    roomVariant1: IRoomVariant | IUnit,
    roomVariant2: Nullable<IRoomVariant | IUnit>,
): boolean => {
    const room1 = (roomVariant1 as IRoomVariant).units?.[0] || roomVariant1;
    const room2 = (roomVariant2 as IRoomVariant)?.units?.[0] || roomVariant2;
    const id1 = `${parseRoomCode(room1.code)}-${room1.board}`;
    const id2 = `${parseRoomCode(room2.code)}-${room2.board}`;

    return id1 === id2;
};

export const filterNewRoomVariants = (variants: IRoomVariant[], selectedVariant: IRoomVariant): IRoomVariant[] =>
    variants.filter(variant => !areRoomVariantsEqual(variant, selectedVariant));

export const findChosenRoomVariant = (
    roomVariants: IRoomVariant[],
    chosenVariant: Nullable<IRoomVariant>,
): Nullable<IRoomVariant> => roomVariants.find(variant => areRoomVariantsEqual(variant, chosenVariant));
