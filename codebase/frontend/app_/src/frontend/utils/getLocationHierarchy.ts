import { ILocationHierarchy, ILocationItem } from 'models/data/ILocationHierarchy';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import { getRegionsCodesRelatedToVirtual, getResortsCodesRelatedToVirtual } from './search/search.utils';

/**
 * Builds location hierarchy by sitecore layout field "parents"
 */
export const getLocationHierarchy = (layout: ISitecoreLayout): Nullable<ILocationHierarchy> => {
    const { fields, templateId, name } = layout?.sitecore?.route || {};

    if (!fields || !templateId) return null;

    const currentLocation = {
        code: fields.Code?.value,
        name: fields.Name?.value,
        itemName: name,
    };
    const parentPages = layout?.sitecore.context?.parentPages || [];
    const parents: ILocationItem[] = layout?.sitecore.context?.parents || [];

    const getParentLocation = (index: number): ILocationItem | undefined => {
        const parent = parents[index];

        if (parent) {
            const url = parentPages.find(page => page.key === parent.name)?.value;

            return {
                code: parent.code,
                name: parent.name,
                itemName: parent.itemName,
                url,
            };
        }

        return undefined;
    };

    switch (templateId) {
        case SitecoreTemplateId.CountryBrowsePage:
            return {
                country: currentLocation,
            };
        case SitecoreTemplateId.RegionBrowsePage:
            return {
                country: getParentLocation(0),
                region: currentLocation,
            };
        case SitecoreTemplateId.RegionCityBrowsePage:
            return {
                country: getParentLocation(0),
                region: currentLocation,
            };
        case SitecoreTemplateId.VirtualRegionBrowsePage:
            return {
                country: getParentLocation(0),
                region: {
                    ...currentLocation,
                    relatedRegions: getRegionsCodesRelatedToVirtual(fields),
                },
            };
        case SitecoreTemplateId.VirtualResortBrowsePage:
            return {
                country: getParentLocation(1),
                region: getParentLocation(0),
                resort: {
                    ...currentLocation,
                    relatedResorts: getResortsCodesRelatedToVirtual(fields),
                },
            };
        case SitecoreTemplateId.ResortBrowsePage:
            return {
                country: getParentLocation(1),
                region: getParentLocation(0),
                resort: currentLocation,
            };
        case SitecoreTemplateId.HotelDetailsBrowse:
            return {
                country: getParentLocation(2),
                region: getParentLocation(1),
                resort: getParentLocation(0),
                hotel: currentLocation,
            };
    }

    return null;
};
