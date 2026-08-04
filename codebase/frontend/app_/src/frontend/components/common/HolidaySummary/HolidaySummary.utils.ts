import { ComponentType } from 'react';

import { stringToTitleCase } from 'frontend/utils/string.utils';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgAdults from 'frontend/components/icons-new/Adults';
import SvgChild from 'frontend/components/icons-new/Child';
import SvgPramInfantFilled from 'frontend/components/icons-new/PramInfantFilled';

export enum SummaryInfo {
    Flight = 'Flight',
    LuggageAndTransfer = 'LuggageAndTransfer',
    AccommodationAndBoard = 'AccommodationAndBoard',
    PassengerDetails = 'PassengerDetails',
    FreeKids = 'FreeKids',
    AirportParking = 'AirportParking',
}

const accommodationIcons = {
    [GuestType.Adult]: SvgAdults,
    [GuestType.Child]: SvgChild,
    [GuestType.Infant]: SvgPramInfantFilled,
};

export const getAccommodationMeta = (
    guestsCount: Record<GuestType, number>,
    getPhrase: (phrase: string) => string,
): { Icon: ComponentType<React.SVGProps<SVGSVGElement>>; label: string }[] =>
    Object.entries(guestsCount).reduce((acc, [guestType, count]) => {
        if (count === 0) {
            return acc;
        }

        const dictionaryLabel = (() => {
            switch (guestType) {
                case GuestType.Adult:
                    return count > 1 ? SitecoreDictionary.GlobalsLabelsAdults : SitecoreDictionary.GlobalsLabelsAdult;
                case GuestType.Child:
                    return count > 1 ? SitecoreDictionary.GlobalsLabelsChildren : SitecoreDictionary.GlobalsLabelsChild;
                case GuestType.Infant:
                    return count > 1 ? SitecoreDictionary.GlobalsLabelsInfants : SitecoreDictionary.GlobalsLabelsInfant;
                default:
                    return '';
            }
        })();

        if (!dictionaryLabel) {
            return acc;
        }

        return [
            ...acc,
            {
                Icon: accommodationIcons[guestType],
                label: `${count} x ${stringToTitleCase(getPhrase(dictionaryLabel))}`,
            },
        ];
    }, []);

export const createDataTid = (suffix: string, prefix?: string): string => (prefix ? `${prefix}-${suffix}` : suffix);
