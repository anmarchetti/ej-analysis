import React, { useEffect } from 'react';

import useStore from 'frontend/hooks/useStore';
import { convertSitecoreItemsToFacilityGroups } from 'frontend/utils/facilities.utils';
import { ISitecoreVirtualFacilities } from 'models/data/IHotel';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import Facilities from './components/Facilities';
import FacilitiesEditMode from './components/FacilitiesEditMode/FacilitiesEditMode';

interface IVirtualHotelFacilitiesProps extends ISitecoreComponent<ISitecoreVirtualFacilities> {
    isShowEcoFacilityPlaceholder?: boolean;
}

export const VirtualHotelFacilities = ({
    fields,
    rendering,
    isShowEcoFacilityPlaceholder,
}: IVirtualHotelFacilitiesProps) => {
    const { isEditMode, trackHotelBrowseEcommerce } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
        trackHotelBrowseEcommerce: stores.trackingStore.trackHotelBrowseEcommerce,
    }));

    useEffect(() => {
        // Track Hotel on switching between different Hotel Browse pages
        if (!isEditMode && fields?.facilitiesFolderId) {
            trackHotelBrowseEcommerce();
        }
    }, [isEditMode, fields?.facilitiesFolderId]);

    if (isEditMode) {
        return fields ? <FacilitiesEditMode fields={fields} /> : null;
    }

    return (
        <Facilities
            facilityGroups={convertSitecoreItemsToFacilityGroups(fields?.virtualFacilityGroups || [])}
            rendering={rendering}
            isShowEcoFacilityPlaceholder={isShowEcoFacilityPlaceholder}
        />
    );
};

export default VirtualHotelFacilities;
