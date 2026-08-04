import { IFacilityGroup, ISitecoreFacilityGroup } from 'models/data/IHotel';
import { VirtualFacilityGroupCode } from 'models/enum/VirtualFacilityGroupCode';

import { normalizeGUID } from './string.utils';

export const getFacilityErratas = (facilities: IFacilityGroup[] | undefined): string[] => {
    if (!facilities?.length) {
        return [];
    }

    return facilities.reduce((res, groupFacility) => {
        const facilities = groupFacility.items.filter(item => item.isErrataInfo).map(item => item.name);

        if (facilities.length > 0) {
            res.push(...facilities);
        }

        return res;
    }, [] as string[]);
};

/** Convert ISitecoreFacilityGroup to IFacilityGroup */
export const convertSitecoreItemsToFacilityGroups = (groups: ISitecoreFacilityGroup[]): IFacilityGroup[] =>
    groups.map(group => ({
        ...group,
        id: normalizeGUID(group.id || ''),

        items: group.items.map(item => ({
            ...item,
            id: normalizeGUID(item.id || ''),
            code: item.facilityCode,
        })),
    }));

/**
 * Filtering logic:
 * - Non-eco facilities: Filters out Overview group unless it has a description
 * - Eco facilities: Returns all groups unchanged
 */
export const filterOutOverviewGroup = (
    facilityGroupsSorted: IFacilityGroup[],
    isEcoFacility: boolean,
): IFacilityGroup[] => {
    if (!isEcoFacility) {
        return facilityGroupsSorted.filter(
            group =>
                group.code !== VirtualFacilityGroupCode.Overview ||
                (group.code === VirtualFacilityGroupCode.Overview && group.description),
        );
    }

    return facilityGroupsSorted;
};

/**
 * Determines if facility items list should be rendered.
 * - Overview group never renders facility items list
 * - "Food & Drink" and "Family facilities" groups can have hardcoded facilities in RichText description field.
 *   In this case, only show description and don't render the facilities list.
 */
export const shouldRenderFacilityItems = (facilityGroup: IFacilityGroup): boolean => {
    if (!facilityGroup.items?.length) {
        return false;
    }

    if (facilityGroup.code === VirtualFacilityGroupCode.Overview) {
        return false;
    }

    const isSpecialGroup =
        facilityGroup.code === VirtualFacilityGroupCode.FoodAndDrink ||
        facilityGroup.code === VirtualFacilityGroupCode.FamilyFacility;

    // Special groups with descriptions have hardcoded facilities in the description
    return !isSpecialGroup || !facilityGroup.description;
};
