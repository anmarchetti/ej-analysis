import React, { FC } from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';

import { IFacilityGroup } from 'models/data/IHotel';

import FacilitiesTabPanel from './FacilitiesTabPanel';

import styles from './FacilitiesTabs.module.scss';

interface IFacilitiesTabPanelsProps {
    activeTabIndex: number | undefined;
    facilityGroups: IFacilityGroup[];
    isShowEcoFacilityPlaceholder?: boolean;
    rendering?: ComponentRendering;
}

export const FacilitiesTabsPanels: FC<IFacilitiesTabPanelsProps> = ({
    facilityGroups,
    activeTabIndex,
    rendering,
    isShowEcoFacilityPlaceholder,
}) => (
    <div className={styles.panels}>
        {facilityGroups.map((group, i) => (
            <FacilitiesTabPanel
                key={group.id}
                facilityGroup={group}
                isActive={activeTabIndex === i}
                rendering={rendering}
                isShowEcoFacilityPlaceholder={isShowEcoFacilityPlaceholder}
            />
        ))}
    </div>
);

export default FacilitiesTabsPanels;
