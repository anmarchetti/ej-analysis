import { IRoom, IUnitOccupation } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const getDurationLabel = (getPhrase: (key: string) => string, duration: number = 0): string => {
    if (!duration) {
        return '';
    }

    return `${duration} ${
        duration !== 1
            ? getPhrase(SitecoreDictionary.GlobalsLabelsNightsPlural)
            : getPhrase(SitecoreDictionary.GlobalsLabelsNightSingular)
    }`;
};

export const getAccommodationGuestsCount = (units?: (IUnit | IRoom)[]): Record<GuestType, number> => {
    const accumulate = { [GuestType.Adult]: 0, [GuestType.Child]: 0, [GuestType.Infant]: 0 };

    return (units || []).reduce(
        (acc, { occupation }) => ({
            ...acc,
            [GuestType.Adult]: acc[GuestType.Adult] + occupation.adults,
            [GuestType.Child]: acc[GuestType.Child] + occupation.children,
            [GuestType.Infant]: acc[GuestType.Infant] + occupation.infants,
        }),
        accumulate,
    );
};

export const getGuestsAmountInRoom = (occupation: IUnitOccupation): number =>
    occupation.adults + occupation.children + occupation.infants;
