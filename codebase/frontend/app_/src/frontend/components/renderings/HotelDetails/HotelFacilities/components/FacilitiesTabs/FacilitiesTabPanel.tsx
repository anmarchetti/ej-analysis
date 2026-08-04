import React, { FunctionComponent } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { shouldRenderFacilityItems } from 'frontend/utils/facilities.utils';
import { IFacilityGroup } from 'models/data/IHotel';
import { ImageSize } from 'models/enum/ImageSize';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { VirtualFacilityGroupCode } from 'models/enum/VirtualFacilityGroupCode';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import FacilityGroupItems from './FacilityGroupItems';

import styles from './FacilitiesTabPanel.module.scss';

interface IFacilitiesTabPanelProps {
    facilityGroup: IFacilityGroup;
    isActive: boolean;
    isShowEcoFacilityPlaceholder?: boolean;
    rendering?: ComponentRendering;
}

const FacilitiesTabPanel: FunctionComponent<IFacilitiesTabPanelProps> = ({
    facilityGroup,
    isActive,
    rendering,
    isShowEcoFacilityPlaceholder,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div
            className={classNames(styles.panel, !isActive && 'd-none')}
            role='tabpanel'
            id={`tabpanel-${facilityGroup.id}`}
            aria-labelledby={`tab-${facilityGroup.id}`}
        >
            <h3 className={styles.title}>{facilityGroup.title || facilityGroup.name}</h3>
            <div className={styles.body}>
                <div>
                    {!!facilityGroup.description && (
                        <RichTextWithLinks
                            className={styles.description}
                            field={{ value: facilityGroup.description }}
                        />
                    )}

                    {rendering &&
                        facilityGroup.code === VirtualFacilityGroupCode.Overview &&
                        isShowEcoFacilityPlaceholder && (
                            <Placeholder name={PlaceholderNames.EcoCertified} rendering={rendering} />
                        )}

                    {shouldRenderFacilityItems(facilityGroup) && (
                        <FacilityGroupItems
                            items={facilityGroup.items}
                            isMultiColumnList={
                                facilityGroup.items.length > settings.HotelDetails.MinNumberOfFacilitiesInColumn
                            }
                            isTopFacilitiesList={facilityGroup.code === VirtualFacilityGroupCode.Overview}
                        />
                    )}
                </div>

                <HotelImage
                    className={styles.image}
                    image={facilityGroup.image}
                    defaultSize={ImageSize.Medium}
                    notRenderEmptyImage
                />
            </div>
            <div className={styles.disclaimer}>{getPhrase(SitecoreDictionary.HotelInfoLabelsFacilitiesDisclaimer)}</div>
        </div>
    );
};

export default FacilitiesTabPanel;
