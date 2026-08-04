import React, { FC, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TEN } from 'code/commonNumbers';
import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { IFacility } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { VirtualFacilityGroupCode } from 'models/enum/VirtualFacilityGroupCode';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';
import IconChevronRight from 'frontend/components/icons/ChevronRight';
import { IFacilitiesProps } from 'frontend/components/renderings/HotelDetails/HotelFacilities/components/types';

import FacilitiesListGroup from './FacilitiesListGroup';

import styles from './FacilitiesLists.module.scss';

export const FacilitiesLists: FC<IFacilitiesProps> = ({ facilityGroups, showOnPrintOnly }) => {
    const { isScreenExtraSmall, getPhrase } = useStore(stores => ({
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const viewRef = useRef<HTMLDivElement | null>(null);

    const [needBreakDown, setNeedBreakDown] = useState(false);
    const [showOnlyFirstN, setShowOnlyFirstN] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const filteredFacilityGroups = facilityGroups.filter(group => group.code !== VirtualFacilityGroupCode.Overview);

    const closeDrawer = (): void => {
        setIsDrawerOpen(false);

        // Scroll to the top of the block after body scroll is unlocked
        setTimeout(() => {
            if (viewRef.current) {
                const stickyBarEl = document.querySelector('.search-bar-wr__sticky-box') as HTMLElement | null;
                scrollToElement(viewRef.current, (stickyBarEl?.offsetHeight || 0) + TEN);
            }
        }, settings.Animation.BodyScrollLockedDelay);
    };

    useEffect(() => {
        const needBreakDown = filteredFacilityGroups.some(
            g => (g.items || []).length > settings.HotelDetails.MaxFacilityNumberBeforeBreakdown,
        );
        setNeedBreakDown(needBreakDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={viewRef} className={classNames({ [styles.print]: showOnPrintOnly })} data-tid='facilities-lists'>
            <h2 className='hotel-facilities__title'>
                {getPhrase(SitecoreDictionary.HotelInfoLabelsFacilitiesAndAmenities)}
            </h2>

            {isScreenExtraSmall ? (
                <div>
                    <div className='hotel-facilities__lists hotel-facilities__lists--preview'>
                        <FacilitiesListGroup
                            facilities={filteredFacilityGroups
                                .reduce((a, c) => [...a, ...c.items], [] as IFacility[])
                                .slice(0, settings.HotelDetails.FacilitiesPreviewAmountOnMobile)}
                        />
                    </div>
                    <p className='hotel-facilities__disclaimer'>
                        {getPhrase(SitecoreDictionary.HotelInfoLabelsFacilitiesDisclaimer)}
                    </p>
                    <Button isText onClick={(): void => setIsDrawerOpen(true)}>
                        {getPhrase(SitecoreDictionary.HotelInfoLabelsFacilitiesShowAllOnMobile)}
                        <IconChevronRight />
                    </Button>

                    <Drawer open={isDrawerOpen}>
                        <div className='drawer__content'>
                            <h3 className='hotel-facilities__title'>
                                {getPhrase(SitecoreDictionary.HotelInfoLabelsFacilitiesDrawerHeading)}
                            </h3>
                            <div className='hotel-facilities__lists'>
                                {filteredFacilityGroups.map((group, idx) => (
                                    <FacilitiesListGroup
                                        key={group.id || idx}
                                        facilities={group.items || []}
                                        title={group.name}
                                        iconUrl={group.iconUrl}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className='drawer__actions'>
                            <Button isTransparent isFullWidth onClick={(): void => closeDrawer()} dataTid='close-btn'>
                                {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                            </Button>
                        </div>
                    </Drawer>
                </div>
            ) : (
                <div>
                    <div className='hotel-facilities__lists'>
                        {filteredFacilityGroups.map((group, idx) => (
                            <FacilitiesListGroup
                                key={group.id || idx}
                                facilities={group.items || []}
                                title={group.name}
                                iconUrl={group.iconUrl}
                                showOnlyFirstN={!showOnPrintOnly && showOnlyFirstN}
                            />
                        ))}
                    </div>
                    <div className='row'>
                        {!showOnPrintOnly && (
                            <div className='col-3 col-md-6 col-lg-7'>
                                {needBreakDown && (
                                    <ReadMoreButton
                                        isReadLess={!showOnlyFirstN}
                                        dataTid={showOnlyFirstN ? 'show-more-facilities' : 'show-less-facilities'}
                                        readLessText={getPhrase(SitecoreDictionary.HotelInfoLabelsShowLess)}
                                        readMoreText={getPhrase(SitecoreDictionary.HotelInfoLabelsShowMore)}
                                        onClick={(): void => setShowOnlyFirstN(!showOnlyFirstN)}
                                    />
                                )}
                            </div>
                        )}
                        <div className='col-9 col-md-6 col-lg-5'>
                            <p className='hotel-facilities__disclaimer'>
                                {getPhrase(SitecoreDictionary.HotelInfoLabelsFacilitiesDisclaimer)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default observer(FacilitiesLists);
