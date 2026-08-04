import settings from 'code/settings';
import {
    getAdultsCountPhrase,
    getChildrenCountPhrase,
    getInfantsCountPhrase,
} from 'frontend/utils/search/search.utils';
import { GuestType } from 'models/enum/GuestType';
import { GuestInfo, IGuestInfoFields } from 'models/GuestInfo';
import { DEFAULT_AGE } from 'models/RoomAllocation';

/**
 * Checks if there is maximum 1 child per 1 adult
 * @param infantsQuantity
 * @param adultsQuantity
 */
export const isInfantsPerAdultQuantityReached = (infantsQuantity: number, adultsQuantity: number): boolean =>
    infantsQuantity === adultsQuantity;

/**
 * Checks if number of infants per adult is valid;
 * @param infantsQuantity
 * @param adultsQuantity
 */
export const isInfantsPerAdultQuantityValid = (infantsQuantity: number, adultsQuantity: number): boolean =>
    infantsQuantity <= adultsQuantity;

export function createAdultDetails(
    age: number = DEFAULT_AGE,
    isLead: boolean = false,
    isTradePortal: boolean = false,
): GuestInfo {
    const fields = {
        type: GuestType.Adult,
        firstName: '',
        lastName: '',
        age: age,
        notBornYet: false,
    } as IGuestInfoFields;

    if (isLead) {
        if (isTradePortal) {
            fields.email = '';
        } else {
            fields.address = '';
            fields.city = '';
            fields.postCode = '';
        }
    }

    return new GuestInfo(fields, isLead);
}

export function createChildDetails(age: number = 0): GuestInfo {
    return new GuestInfo({
        type: GuestType.Child,
        firstName: '',
        lastName: '',
        age: age,
        notBornYet: false,
    });
}

export function createInfantDetails(age: number = 1): GuestInfo {
    return new GuestInfo({
        type: GuestType.Infant,
        firstName: '',
        lastName: '',
        age: age,
        notBornYet: false,
    });
}

/**
 * Validate children ages in the room.
 * Returning type should be fixed and changed to boolean. Also we should get rid of extra !! before this func call
 * @param children
 * @returns
 */
export const validateChildrenAgesInRoom = (children: GuestInfo[]): GuestInfo | boolean | undefined => {
    if (children.length) {
        return children.find(child => {
            const isInclude = settings.RoomAllocation.ChildAges.includes(child.age);

            return !isInclude;
        });
    }

    return false;
};

/**
 * create object with numbers of guests by category
 * @param getPhrase
 * @param children
 * @param adults
 * @param infants
 */
export const getNumberOfGuestsByCategory = (
    getPhrase: (key) => string,
    adults: number = 0,
    children: number = 0,
    infants: number = 0,
): string => {
    const result: string[] = [];
    adults && result.push(getAdultsCountPhrase(adults, getPhrase));
    children && result.push(getChildrenCountPhrase(children, getPhrase));
    infants && result.push(getInfantsCountPhrase(infants, getPhrase));

    return result.join(', ');
};
