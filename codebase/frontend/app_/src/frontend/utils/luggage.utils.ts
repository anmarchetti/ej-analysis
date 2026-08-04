import { addDays, isDateInRange } from 'frontend/utils/date.utils';
import { IBookingInfo, IPreBookingInfo } from 'models/data/IBookingInfo';
import {
    IExtraLuggageContent,
    IExtraLuggageInfo,
    IFlightExtras,
    ILargeSportEquipmentContent,
    ILuggageInfoItem,
} from 'models/data/IFlightExtras';
import { IHoldLuggageInfo, ISportEquipmentRestrictionSeasonFields } from 'models/data/IHoldLuggage';
import { IRoomType, IThemePackageIcon } from 'models/data/IHotel';
import { ILivePrice } from 'models/data/ILivePrice';
import { IAccomData, IOffer, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { GuestType } from 'models/enum/GuestType';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import { NUMBER_OF_ROUTES, OUTBOUND_ROUTE_ID } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { isShortlistedOfferUnavailableForBooking } from './shortlist.utils';

const SINGLE_ITEM = 1;

export interface ILuggageAmount {
    amount: number;
    type: string;
}

export interface IGuestsAmount {
    adults: number;
    children: number;
    infants: number;
}

export const getRoomTypes = (isBooking: boolean, accom?): IRoomType[] => {
    let units: IUnit[] | undefined;

    if (isBooking) {
        units = accom?.rooms;
    } else {
        units = accom?.unit;
    }

    return (units ?? []).filter(unit => !!unit.roomType).map(unit => unit.roomType);
};

export const getGuestsAmountByType = (booking: IBookingInfo | IPreBookingInfo | undefined, accom): IGuestsAmount => {
    let guests: IGuestsAmount;

    if (booking) {
        guests = {
            adults: booking.guests.filter(guest => guest.type === GuestType.Adult).length,
            children: booking.guests.filter(guest => guest.type === GuestType.Child).length,
            infants: booking.guests.filter(guest => guest.type === GuestType.Infant).length,
        };
    } else {
        guests = accom ? getGuestAmountFromAccom(accom) : { adults: 0, children: 0, infants: 0 };
    }

    return guests;
};

export const getVisitorsAmount = (guestsAmount: IGuestsAmount): number =>
    guestsAmount ? guestsAmount.adults + guestsAmount.children + guestsAmount.infants : 0;

export const getLuggageTypes = (luggage: Nullable<IExtraLuggageInfo>): ILuggageAmount[] => {
    if (!luggage) {
        return [];
    }

    return luggage.items.reduce((luggageTypes: ILuggageAmount[], item: ILuggageInfoItem): ILuggageAmount[] => {
        const index = luggageTypes.findIndex(luggage => luggage.type === item.itemCode);

        if (index >= 0) {
            luggageTypes[index].amount++;
        } else {
            luggageTypes.push({
                type: item.itemCode,
                amount: 1,
            });
        }

        return luggageTypes;
    }, []);
};

export const getGuestAmount = (offer: Nullable<IOffer | IOfferWithoutAltBoards>): IGuestsAmount =>
    getGuestAmountFromAccom(offer?.accom);

export const getGuestAmountFromAccom = (accom: Nullable<IAccomData<IUnit>>): IGuestsAmount => {
    const isUnit = accom?.unit;

    return {
        adults:
            isUnit && accom
                ? accom.unit.reduce((sum, current) => (current.occupation ? current.occupation.adults + sum : 0), 0)
                : 0,
        children:
            isUnit && accom
                ? accom.unit.reduce((sum, current) => (current.occupation ? current.occupation.children + sum : 0), 0)
                : 0,
        infants:
            isUnit && accom
                ? accom.unit.reduce((sum, current) => (current.occupation ? current.occupation.infants + sum : 0), 0)
                : 0,
    };
};

export const countGuest = (
    offer: Nullable<IOffer | IOfferWithoutAltBoards>,
    excludeInfants: boolean = false,
): number => {
    let total = 0;
    const guestsAmount = getGuestAmount(offer);

    if (guestsAmount) {
        total += guestsAmount.adults;
        total += guestsAmount.children;

        if (!excludeInfants) {
            total += guestsAmount.infants;
        }
    }

    return total;
};

export const checkIfExtrasCategoryExists = (extras: IFlightExtras[], categoryCodes: string[] | string): boolean => {
    if (!extras.length) {
        return false;
    }

    const codesArray = Array.isArray(categoryCodes) ? categoryCodes : [categoryCodes];

    let isPresented = true;

    for (let i = 0; i < extras.length; i++) {
        const route = extras[i];
        const found = route.flightExtraCategories.find(flightExtrasCategory =>
            codesArray.includes(flightExtrasCategory.categoryCode),
        );

        if (!found) {
            isPresented = false;
            break;
        }
    }

    return isPresented;
};

export const getLuggageAmount = (offer: IOffer): number => {
    const extraLuggage = offer.extraLuggageInfo?.items || [];
    const rooms = offer.accom?.unit || [];

    return extraLuggage.length
        ? extraLuggage.length / NUMBER_OF_ROUTES
        : rooms.reduce((amount, item) => amount + item.occupation.adults + item.occupation.children, 0);
};

export const getLuggageIcon = (
    packageIcons: IThemePackageIcon[],
    extraLuggageItems: ILuggageInfoItem[],
): IThemePackageIcon | undefined => {
    if (extraLuggageItems.length) {
        const icon = packageIcons.find(icon => icon.luggageCode === extraLuggageItems[0].itemCode);

        if (icon) {
            return icon;
        }

        return packageIcons.find(icon => icon.key === PackageIconTypes.Bags);
    }

    return packageIcons.find(icon => icon.key === PackageIconTypes.UnderSeatBag);
};

export const getHoldItemsLabel = (luggageAmount: number, getPhrase: (key: string) => string): string => {
    if (!luggageAmount) {
        return getPhrase(SitecoreDictionary.LuggageLabelsHoldBagsNone);
    }

    if (luggageAmount > SINGLE_ITEM) {
        return `${luggageAmount} ${getPhrase(SitecoreDictionary.BasketLabelsHoldBagsPlural)}`;
    }

    return `${SINGLE_ITEM} ${getPhrase(SitecoreDictionary.BasketLabelsHoldBagSingular)}`;
};

export const generateSmallSportEquipmentInfo = (
    extraLuggageItems: ILuggageInfoItem[],
    sportEquipmentCategoryCodes: string[],
    largeSportEquipmentCategoryCode: string,
): IHoldLuggageInfo => {
    const selected: IHoldLuggageInfo = {};

    extraLuggageItems.forEach(item => {
        const { itemCode, quantity, itemCategoryCode, isComplimentary } = item;

        if (isComplimentary) {
            return;
        }

        if (
            itemCategoryCode !== largeSportEquipmentCategoryCode &&
            sportEquipmentCategoryCodes.includes(itemCategoryCode)
        ) {
            // luggage duplicates per route
            selected[itemCode] = (selected[itemCode] || 0) + quantity / NUMBER_OF_ROUTES;
        }
    });

    return selected;
};

export const generateLargeSportEquipmentInfo = (
    extraLuggageItems: ILuggageInfoItem[],
    largeSportEquipmentCategoryCode: string,
): Record<string, ILargeSportEquipmentContent> => {
    const selectedSportEquipment: Record<string, ILargeSportEquipmentContent> = {};

    extraLuggageItems.forEach(item => {
        const { itemCode, quantity, itemCategoryCode, name, isComplimentary } = item;

        if (isComplimentary) {
            return;
        }

        if (itemCategoryCode === largeSportEquipmentCategoryCode) {
            // luggage duplicates per route
            selectedSportEquipment[itemCode] = {
                name,
                quantity: (selectedSportEquipment[itemCode]?.quantity || 0) + quantity / NUMBER_OF_ROUTES,
            };
        }
    });

    return selectedSportEquipment;
};

export const generateExtraLuggageFullInfo = (
    extraLuggageItems: ILuggageInfoItem[],
    sportEquipmentCategoryCodes: string[],
    holdLuggageCategoryCodes: string[],
): Record<string, IExtraLuggageContent>[] => {
    const selectedLuggage: Record<string, IExtraLuggageContent> = {};
    const selectedSportEquipment: Record<string, IExtraLuggageContent> = {};

    extraLuggageItems.forEach(item => {
        const { itemCode, quantity, itemCategoryCode, name, description, icon, isComplimentary } = item;

        if (isComplimentary) {
            return;
        }

        if (holdLuggageCategoryCodes.includes(itemCategoryCode)) {
            // luggage duplicates per route
            selectedLuggage[itemCode] = {
                name,
                description,
                icon,
                quantity: (selectedLuggage[itemCode]?.quantity || 0) + quantity / NUMBER_OF_ROUTES,
                uniqueId: itemCode,
            };
        } else if (sportEquipmentCategoryCodes.includes(itemCategoryCode)) {
            // luggage duplicates per route
            selectedSportEquipment[itemCode] = {
                name,
                description,
                icon,
                quantity: (selectedSportEquipment[itemCode]?.quantity || 0) + quantity / NUMBER_OF_ROUTES,
            };
        }
    });

    return [selectedLuggage, selectedSportEquipment];
};

export const getDefaultBagsOneDirection = (items: ILuggageInfoItem[] | undefined): ILuggageInfoItem[] =>
    items?.filter(item => item.isComplimentary && item.routeId === OUTBOUND_ROUTE_ID) || [];

export const getIsSportEquipmentAvailableSeason = (
    seasons: ISitecoreChildren<ISportEquipmentRestrictionSeasonFields>[] | undefined,
    travelDate: Nullable<Date>,
): boolean => {
    if (!travelDate || !seasons) {
        return true;
    }

    const isDateRestricted = seasons.some(({ fields }) => {
        const { StartDate, EndDate } = fields;

        if (StartDate.value && EndDate.value) {
            const start = new Date(StartDate.value);
            // we have to see on the end of last day of the season
            const end = addDays(1, new Date(EndDate.value));

            return isDateInRange(travelDate, start, end);
        }

        return false;
    });

    return !isDateRestricted;
};

export const isMatchingLuggageIcon = (extraLuggage: Nullable<IExtraLuggageInfo>, icon: IThemePackageIcon): boolean => {
    if (!extraLuggage) return false;

    return extraLuggage.items.some(item => item.itemCode === icon.luggageCode);
};

export const getExtraLuggageFromLivePriceAndOffer = (
    livePrice: Nullable<ILivePrice>,
    offer: IOffer,
): IExtraLuggageInfo | undefined => {
    if (!livePrice && isShortlistedOfferUnavailableForBooking(offer)) {
        return;
    }

    if (livePrice?.accomCode === offer.accom.code) {
        return livePrice.extraLuggageInfo;
    }

    return offer.extraLuggageInfo;
};
