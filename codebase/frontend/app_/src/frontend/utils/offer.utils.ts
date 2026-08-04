import { ONE_HUNDRED } from 'code/commonNumbers';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IBoardType, IRoom, IRoomType, IThemePackageIcon } from 'models/data/IHotel';
import { IAltAccommodation, IOffer, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { ISpecificOffer } from 'models/data/ISpecificOffer';
import { ITransfer } from 'models/data/ITransfer';
import { IPriceTooltipSetting } from 'models/data/PriceTooltip';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import { HotelContractType } from 'models/enum/tracking/HotelContractType';
import { TransferType } from 'models/enum/transfer/TransferType';

import { getAmendmentRoundedPrice } from './amendBooking.utils';
import { isMatchingLuggageIcon } from './luggage.utils';

export const getTotalDiscount = (offer: IOffer | IOfferWithoutAltBoards): number => {
    const units = offer.accom?.unit && !!offer.accom.unit.length && offer.accom.unit;

    if (!units) {
        return 0;
    }

    return units.reduce((total, unit) => total + (unit.discount ? unit.discount : 0), 0);
};

export const getTotalDiscountPPExcludingInfants = (offer: IOffer | IOfferWithoutAltBoards): number => {
    const totalDiscount = getTotalDiscount(offer);
    const guestsAmount = getTotalNumberOfPayingGuests(offer.accom.unit);

    return ((totalDiscount / guestsAmount) * ONE_HUNDRED) / ONE_HUNDRED;
};

export const getIsShowGreatDealPill = (offer: Nullable<IOffer | IOfferWithoutAltBoards>): boolean =>
    (offer?.hotel?.isGreatDeal && !offer.accom?.unit?.some(unit => unit.discount)) || false;

export const checkRoomsOnFreeForKids = (rooms: Array<IUnit | IRoom>): boolean => rooms.some(room => room.isFreeForKids);

export const isFreeForKids = (offer: IOffer | IOfferWithoutAltBoards): boolean => {
    if (!offer.accom?.unit?.length) {
        return false;
    }

    return checkRoomsOnFreeForKids(offer.accom.unit);
};

/**
 * This function checks if index is in range of indexes. Indexes are 1-based (not zero like array)
 * @example
 * isIndexInRange(1, 1, 10, 2) // true
 * isIndexInRange(2, 1, 10, 2) // true
 * isIndexInRange(3, 1, 10, 2) // true
 * isIndexInRange(4, 1, 10, 2) // false
 * isIndexInRange(10, 1, 10, 2) // true
 * isIndexInRange(9, 1, 10, 2) // true
 * isIndexInRange(8, 1, 10, 2) // false
 * isIndexInRange(1, 10, 10, 2) // true
 * @param index index to check
 * @param currentIndex current active index
 * @param total total number of items
 * @param rangeOffset offset to build range
 */
// eslint-disable-next-line no-magic-numbers
export const isIndexInRange = (index: number, currentIndex: number, total: number, rangeOffset = 2): boolean =>
    (index <= currentIndex + rangeOffset && index >= currentIndex - rangeOffset) ||
    (currentIndex - rangeOffset <= 0 && index >= currentIndex - rangeOffset + total && index <= total) ||
    (currentIndex + rangeOffset >= total && index <= currentIndex + rangeOffset - total);

/*
 *
 * @param destinationCodesQuery - string with destination codes query
 * destinationCodesQuery=cty1|cty1
 * destinationCodesQuery=cty1|cty1,cty2|cty2|cty2
 * destinationCodesQuery=cty1|cty1,cty2|cty2|cty2,cty3
 * Where,
 * Cty1 = Country
 * Cty2 = Regions
 * Cty3 = Resort
 * should return Country + Regions or Country
 *
 */
export const getParentDestination = (destinationCodesQuery: string): string => {
    if (destinationCodesQuery?.length) {
        const destinationCodesArray = destinationCodesQuery.split(',');
        const countries = destinationCodesArray[0];
        const regions = destinationCodesArray.length > 1 ? destinationCodesArray[1] : '';
        // eslint-disable-next-line no-magic-numbers
        const resorts = destinationCodesArray.length > 2 ? destinationCodesArray[2] : '';

        return resorts.length > 0 ? `${countries},${regions}` : countries;
    }

    return '';
};

/**
 * Returns result of isPricePPShown only for single room offers
 * @param offer
 * @returns
 */
export const isRoomPricePPShown = (offer: Nullable<IOffer | IOfferWithoutAltBoards | IAlternativeOffer>): boolean =>
    !!offer && offer.accom.unit.length === 1 && isPricePPShown(offer);

/** Show pricePP if it doesn't equal total price */
export const isPricePPShown = (offer: Nullable<IOffer | IOfferWithoutAltBoards | IAlternativeOffer>): boolean =>
    !!offer && offer.price !== offer.pricePP;

/**
 * Get tooltip content for the offer
 * @param settings price tooltip settings
 * @param offer selected offer info
 */
export const getPricePill = (
    settings: Nullable<IPriceTooltipSetting[]>,
    offer: Nullable<IOffer | IOfferWithoutAltBoards>,
): string => {
    if (!settings?.length || !offer) {
        return '';
    }

    const guests = offer.accom?.unit?.reduce((res, val) => val.occupation.adults + val.occupation.children + res, 0);
    const setting = settings.find(x => {
        if (offer.price === offer.pricePP && offer.pricePP === 0) {
            return x.noOffer;
        }

        const minGuests = x.minNumberOfGuests ? guests && x.minNumberOfGuests <= guests : true;
        const maxGuests = x.maxNumberOfGuests ? guests && x.maxNumberOfGuests >= guests : true;
        const noOffer = x.noOffer ? !offer.accom && offer.price : true;

        return minGuests && maxGuests && noOffer;
    });

    return setting?.content || '';
};

/**
 * Returns true when when contract will change for remaining rooms
 * @param requireMoreRoomAlteration
 * @param isMultipleRoomSelected
 * @param isDrawerConfirmationRequired
 * @returns
 */
export const isAlterationExtendedInfoVisible = (
    requireMoreRoomAlteration: boolean,
    isMultipleRoomSelected: boolean,
    isDrawerConfirmationRequired: boolean,
): boolean => requireMoreRoomAlteration && isMultipleRoomSelected && isDrawerConfirmationRequired;

/**
 * Returns true when when offer for free child place becomes false
 */
export const getIsKidsInfoVisible = (currentRoom: IUnit, newRoom: IUnit): boolean =>
    !!currentRoom.isFreeForKids && !newRoom.isFreeForKids;

/**
 * Returns first offer from the offers list
 * @param offers
 * @returns
 */
export const getFirstOffer = (offers: Nullable<ISpecificOffer>): IOfferWithoutAltBoards | undefined => {
    const { offers: offersArr = [] } = offers || {};

    return offersArr[0];
};

/**
 * Returns swapped offer accom parameters to get offer from another contract
 * @param altAccommodations
 * @param accomCode
 * @param packageId
 * @param newAccomCode
 * @returns
 */
export const swapAccommodationParams = (
    altAccommodations: IAltAccommodation[],
    accomCode: string,
    packageId: string,
    newAccomCode: string,
): IAltAccommodation[] =>
    altAccommodations.map(el => {
        if (el.accomCode === newAccomCode) {
            return { accomCode, packageId }; // swap with previously selected contract
        }

        return el;
    });

/**
 * If contract changes - swap accommodations:
 * `accommodationId - packageId`s (contract)
 * of current & alternative rooms
 */
export const swapOfferAccommodations = <T extends IOfferWithoutAltBoards>(
    offer: Nullable<T>,
    altAccommodations: IAltAccommodation[],
    accommodationId?: string,
    packageId?: string,
): Nullable<T> => {
    const offerAccom = offer?.accom;

    if (
        !accommodationId ||
        !packageId ||
        !offer ||
        !offerAccom ||
        offerAccom.id === accommodationId ||
        offerAccom.packageId === packageId
    ) {
        return offer;
    }

    return {
        ...offer,
        altAcc: swapAccommodationParams(altAccommodations, offerAccom.id, offerAccom.packageId, accommodationId),
        accom: { ...offer.accom, id: accommodationId, packageId },
    };
};

/**
 * Returns an array with rooms for query in which one element is replaced by another from the parameters by index
 * @param rooms
 * @param idx
 * @param newRoomCode
 * @returns
 */
export const replaceRoomCodeInOfferRoomsAllocation = (
    rooms: IQueryRoom[],
    idx: number,
    newRoomCode: string,
): IQueryRoom[] => {
    if (idx < 0 || idx >= rooms.length) {
        return rooms;
    }

    const res = [...rooms];

    res[idx] = { ...res[idx], roomCode: newRoomCode };

    return res;
};

/**
 * Returns a room name or empty string
 * @param room
 * @returns {string}
 */
export const getRoomName = (room: IRoomType): string => {
    if (!room) {
        return '';
    }

    return typeof room.title === 'string' ? room.title : room.title?.value || '';
};

/**
 * If hotel id starts with "X" then it's a "Bed Bank_Hotel Beds",
 * else if hotel id starts with "Z" then it's a "Travel Gate",
 * else it's a "Direct"
 * @param isExternalHotel
 * @param accomId
 * @returns
 */
export const getHotelContractType = (isExternalHotel: boolean, accomId?: string): HotelContractType | undefined => {
    if (!isExternalHotel) {
        return HotelContractType.Direct;
    }

    if (accomId?.substring(0, 1) === 'Z') {
        return HotelContractType.TravelGate;
    }

    // WP-422 - if hbg code is 6 digits or fewer >> atcom code will start with 'X9'
    // if hbg code is 7 digits >> atcom code will start with only 'X'
    if (accomId?.substring(0, 1) === 'X') {
        return HotelContractType.BedBankHotelBeds;
    }

    return undefined;
};

/**
 * Returns direct hotel accom code
 * else returns a first accom code
 * @param accomCodes
 * @returns
 */
export const getDefaultContractCode = (accomCodes: string[]): string =>
    accomCodes.find(code => !getHotelContractType(true, code)) || accomCodes[0];

/**
 * Returns unit that would be set for the offer if board is selected
 * @param offerUnits
 * @param newBoard
 * @param altRooms
 * @returns
 */
export const getNewOfferUnitsByBoard = (offerUnits: IUnit[], newBoard: IBoardType, altRooms: IUnit[]): IUnit[] =>
    offerUnits.map(unit => {
        const alterationCode = newBoard?.roomAlterations?.[unit.code];
        const alternativeRoom = !!alterationCode && altRooms.find(el => el.code === alterationCode);
        const boardFields = { board: newBoard.code, boardType: { ...newBoard } };

        const newUnitCode = newBoard.unitCodes?.[unit.code];

        if (newUnitCode) {
            unit.code = newUnitCode;
        }

        if (alternativeRoom) {
            return { ...alternativeRoom, ...boardFields };
        }

        return { ...unit, ...boardFields };
    });

export const getAvailabilityFromOffer = (offer: Nullable<IOffer>): number => offer?.accom?.unit?.[0]?.avail || 0;

export const getExtraLuggageIcon = (
    packageIcons: IThemePackageIcon[],
    matchingLuggageIcon?: IThemePackageIcon,
    bagName?: string,
): IThemePackageIcon | undefined => {
    if (bagName) {
        const customBag = packageIcons.find(icon => icon.key === PackageIconTypes.Bags);

        if (customBag) {
            return { ...customBag, name: bagName };
        }

        return undefined;
    }

    if (matchingLuggageIcon) {
        return matchingLuggageIcon;
    }

    return undefined;
};

export const filterPackageIcons = (
    packageIcons: IThemePackageIcon[],
    transfer: Nullable<ITransfer>,
    extraLuggage: Nullable<IExtraLuggageInfo>,
    bagName?: string,
    showUnderSeatBagIcon = false,
): IThemePackageIcon[] => {
    const hasTransfer = transfer && !transfer.isHidden;

    const isPrivateTransfer = hasTransfer && transfer?.type === TransferType.Private;
    const isSharedTransfer = hasTransfer && transfer?.type === TransferType.Shared;

    const { mainIcons, transferIcons, extraLuggageIcons, freeLuggageIcons } = packageIcons.reduce<{
        extraLuggageIcons: IThemePackageIcon[];
        freeLuggageIcons: IThemePackageIcon[];
        mainIcons: IThemePackageIcon[];
        transferIcons: IThemePackageIcon[];
    }>(
        (acc, icon) => {
            if (!icon.iconUrl) return acc;

            switch (icon.key) {
                case PackageIconTypes.PrivateTransfer:
                    if (isPrivateTransfer) {
                        acc.transferIcons.push(icon);
                    }

                    break;

                case PackageIconTypes.SharedTransfer:
                    if (isSharedTransfer) {
                        acc.transferIcons.push(icon);
                    }

                    break;

                // Insert extraLuggageIcon if extraLuggage exists
                case PackageIconTypes.Bags:
                    if (isMatchingLuggageIcon(extraLuggage, icon) || bagName) {
                        const matchingExtraLuggageIcon = getExtraLuggageIcon(packageIcons, icon, bagName);

                        if (matchingExtraLuggageIcon) {
                            acc.extraLuggageIcons = [matchingExtraLuggageIcon];
                        }
                    }

                    break;

                case PackageIconTypes.UnderSeatBag:
                    /* Don't show underSeatBag icon till livePrice is loaded
                     * INS-1774: Always insert the free underSeatBagIcon if not isLuxury package(!bagName)
                     * as it should be shown whenever livePrice is loaded (i.e., when extraLuggage is not undefined).
                     * If showUnderSeatBagIcon is true, render the under seat bag icon even if it's a luxury package,
                     * as per INS-1723
                     */
                    if ((extraLuggage !== undefined && !bagName) || showUnderSeatBagIcon) {
                        acc.freeLuggageIcons = [icon];
                    }

                    break;

                default:
                    acc.mainIcons.push(icon);
            }

            return acc;
        },
        {
            mainIcons: [],
            transferIcons: [],
            extraLuggageIcons: [],
            freeLuggageIcons: [],
        },
    );

    return [...mainIcons, ...extraLuggageIcons, ...freeLuggageIcons, ...transferIcons];
};

export const getNumberOfPayingGuests = (adults: number, children: number, isFreeForKids: boolean): number =>
    adults + (isFreeForKids ? children - 1 : children);

export const getTotalNumberOfPayingGuests = (list: IUnit[]): number =>
    list.reduce(
        (acc, { isFreeForKids = false, occupation: { adults, children } }) =>
            acc + getNumberOfPayingGuests(adults, children, isFreeForKids),
        0,
    );

export const getPriceDifferencePP = (price: number, units: IUnit[]): number => {
    const guests = getTotalNumberOfPayingGuests(units);

    return Math.round((price / guests) * ONE_HUNDRED) / ONE_HUNDRED;
};

export const getPriceDifferenceForBoard = ({
    isSelected,
    isPostBooking,
    offer,
    prevPrice,
    alternativeBoard,
}: {
    alternativeBoard: IBoardType;
    isPostBooking: boolean;
    isSelected: boolean;
    offer: IOfferWithoutAltBoards;
    prevPrice: number;
}): number => {
    let price: number;

    if (isSelected) {
        price = 0;
    } else if (!isPostBooking) {
        price = Math.ceil(getPriceDifferencePP((alternativeBoard.price ?? 0) - prevPrice, offer.accom.unit));
    } else {
        price = getAmendmentRoundedPrice(alternativeBoard?.price ?? 0);
    }

    return price;
};

export const containsLuxuryPromoCode = (codes?: OfferPromotionCodes[]): boolean =>
    !!codes?.find(item => item === OfferPromotionCodes.Luxury);

export const containsFAndHPromoCode = (codes?: OfferPromotionCodes[]): boolean =>
    !!codes?.find(item => item === OfferPromotionCodes.FlightAndHotel);
