import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IAmendHotelRoomAndBoardOffer } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IBoardType, IRoomType } from 'models/data/IHotel';
import { IOffer, IUnit } from 'models/data/IOffer';

enum TypeOfSelection {
    Room = 'roomType',
    Board = 'boardType',
}

const getTypeFromOffer = <T extends IRoomType | IBoardType>(
    type: TypeOfSelection,
    offer: IOffer | IAmendHotelOffer,
): Nullable<T> => (offer?.accom?.unit[0]?.[type] as T) || null;

export const getRoomTypeFromOffer = (offer: IOffer | IAmendHotelOffer): Nullable<IRoomType> =>
    getTypeFromOffer<IRoomType>(TypeOfSelection.Room, offer);
export const getBoardTypeFromOffer = (offer: IOffer | IAmendHotelOffer): Nullable<IBoardType> =>
    getTypeFromOffer<IBoardType>(TypeOfSelection.Board, offer);

export const findChosenOffer = (room: IUnit, allOffers: IAmendHotelRoomAndBoardOffer[]): IAmendHotelOffer | undefined =>
    allOffers.find(
        offer =>
            getRoomTypeFromOffer(offer.amendHotelOffer)?.code === room.roomType.code &&
            getBoardTypeFromOffer(offer.amendHotelOffer)?.code === room.boardType.code,
    )?.amendHotelOffer;

export const checkOfferForCompliance = (
    compareType: TypeOfSelection,
    newOption: IAmendHotelOffer,
    chosenOffer: IAmendHotelOffer,
): boolean => getTypeFromOffer(compareType, newOption)?.code === getTypeFromOffer(compareType, chosenOffer)?.code;

export const checkRoomOfferForCompliance = checkOfferForCompliance.bind(null, TypeOfSelection.Room);
export const checkBoardOfferForCompliance = checkOfferForCompliance.bind(null, TypeOfSelection.Board);

export const checkIsTheSameOffer = (newOption: IAmendHotelOffer, chosenOffer: IAmendHotelOffer): boolean =>
    checkRoomOfferForCompliance(newOption, chosenOffer) && checkBoardOfferForCompliance(newOption, chosenOffer);

const altType = (type: TypeOfSelection): TypeOfSelection =>
    type === TypeOfSelection.Board ? TypeOfSelection.Room : TypeOfSelection.Board;

const constructAltOffers = (
    complienceOption: TypeOfSelection,
    offers: IAmendHotelRoomAndBoardOffer[],
    chosenOffer: IAmendHotelOffer,
): IUnit[] => {
    const allOffers = offers.map(offer => offer.amendHotelOffer);

    const allIncompatibleOptionsByType: Record<string, IAmendHotelOffer[]> = {};
    const compatibleOptions: IAmendHotelOffer[] = [];
    const alternationOptions: IAmendHotelOffer[] = [];

    allOffers.forEach(offer => {
        if (!offer.amendmentChargesInfo) return;

        const isCompatible = checkOfferForCompliance(altType(complienceOption), offer, chosenOffer);
        const key = getTypeFromOffer(complienceOption, offer)?.code;

        if (isCompatible) {
            compatibleOptions.push(offer);

            return;
        }

        if (key) {
            allIncompatibleOptionsByType[key] = allIncompatibleOptionsByType[key] ?? [];
            allIncompatibleOptionsByType[key].push(offer);
        }
    });

    Object.entries(allIncompatibleOptionsByType).forEach(([key, sameTypeOffers]) => {
        const hasSelectedTypeOrCopatible = [...compatibleOptions, chosenOffer].some(
            offer => getTypeFromOffer(complienceOption, offer)?.code === key,
        );

        if (hasSelectedTypeOrCopatible) {
            delete allIncompatibleOptionsByType[key];
        } else {
            sameTypeOffers.sort(
                (a, b) => a.amendmentChargesInfo.amendmentCharges - b.amendmentChargesInfo.amendmentCharges,
            );
        }
    });

    Object.values(allIncompatibleOptionsByType).forEach(option => {
        alternationOptions.push(option[0]);
    });

    return [...compatibleOptions, ...alternationOptions].map(offer => ({
        ...offer.accom?.unit[0],
        price: offer.amendmentChargesInfo.amendmentCharges,
    }));
};

export const constructAltRoomsFromOffers = constructAltOffers.bind(null, TypeOfSelection.Room);
export const constructAltBoardsFromOffers = constructAltOffers.bind(null, TypeOfSelection.Board);
