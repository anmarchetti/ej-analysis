import React, { FC, useMemo } from 'react';

import useStore from 'frontend/hooks/useStore';
import { FacilitiesDesignVariant } from 'models/enum/FacilitiesDesignVariant';

import FacilitiesLists from './FacilitiesLists/FacilitiesLists';
import FacilitiesTabs from './FacilitiesTabs/FacilitiesTabs';
import { IFacilitiesProps } from './types';

export const Facilities: FC<IFacilitiesProps> = ({
    facilityGroups,
    rendering,
    isShowEcoFacilityPlaceholder,
    shouldShowTitle,
    titleDictionaryKey,
    isPrintPreview,
}) => {
    const { isHotelFacilitiesTabsDesignEnabled, filterFacilitiesByDesignVariant, isPostBookingPages } = useStore(
        stores => ({
            isHotelFacilitiesTabsDesignEnabled: stores.layoutStore.isHotelFacilitiesTabsDesignEnabled,
            filterFacilitiesByDesignVariant: stores.layoutStore.filterFacilitiesByDesignVariant,
            isPostBookingPages: stores.layoutStore.isPostBookingPages,
        }),
    );

    const filteredGroups = useMemo(
        () =>
            filterFacilitiesByDesignVariant(
                facilityGroups || [],
                isHotelFacilitiesTabsDesignEnabled ? FacilitiesDesignVariant.Tabs : FacilitiesDesignVariant.List,
                isShowEcoFacilityPlaceholder,
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isHotelFacilitiesTabsDesignEnabled, facilityGroups, isShowEcoFacilityPlaceholder],
    );

    if (!filteredGroups.length) {
        return null;
    }

    // Render Tabs (New) Design
    if (isHotelFacilitiesTabsDesignEnabled && !isPrintPreview) {
        return (
            <>
                <FacilitiesTabs
                    facilityGroups={filteredGroups}
                    rendering={rendering}
                    isShowEcoFacilityPlaceholder={isShowEcoFacilityPlaceholder}
                    shouldShowTitle={shouldShowTitle}
                    titleDictionaryKey={titleDictionaryKey}
                    hideOnPrint={isPostBookingPages}
                />
                {isPostBookingPages && (
                    <FacilitiesLists facilityGroups={filteredGroups} rendering={rendering} showOnPrintOnly={true} />
                )}
            </>
        );
    }

    // Render Lists (Old) Design
    return <FacilitiesLists facilityGroups={filteredGroups} rendering={rendering} />;
};

export default Facilities;
