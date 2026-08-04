import React, { FC, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import settings from 'code/settings';
import { useIsMounted } from 'frontend/hooks/useIsMounted';
import useStore from 'frontend/hooks/useStore';
import { scrollToElement, unLockBodyScroll } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { IFacilitiesProps } from 'frontend/components/renderings/HotelDetails/HotelFacilities/components/types';

import FacilitiesTabsList from './FacilitiesTabsList';
import FacilitiesTabsPanels from './FacilitiesTabsPanels';

import styles from './FacilitiesTabs.module.scss';

export const FacilitiesTabs: FC<IFacilitiesProps> = ({
    facilityGroups,
    rendering,
    isShowEcoFacilityPlaceholder,
    shouldShowTitle = true,
    titleDictionaryKey = SitecoreDictionary.HotelInfoLabelsFacilitiesAndAmenities,
    hideOnPrint,
}) => {
    const { isScreenMedium, getPhrase, setIsBodyScrollLocked } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        getPhrase: stores.layoutStore.getPhrase,
        setIsBodyScrollLocked: stores.layoutStore.setIsBodyScrollLocked,
    }));

    const viewRef = useRef<HTMLDivElement | null>(null);
    const isMounted = useIsMounted();
    const [activeTabIndex, setActiveTabIndex] = useState<number>(() => (isScreenMedium ? 0 : -1));

    const closeDrawer = (): void => {
        setActiveTabIndex(-1);

        // Scroll to the top of the block after body scroll is unlocked
        setTimeout(() => {
            if (viewRef.current) {
                const stickyBarEl = document.querySelector('.search-bar-wr__sticky-box') as HTMLElement | null;
                scrollToElement(viewRef.current, (stickyBarEl?.offsetHeight || 0) + 20);
            }
        }, settings.Animation.BodyScrollLockedDelay);
    };

    useEffect(() => {
        setActiveTabIndex(isScreenMedium ? 0 : -1);

        // Unlock body scroll if the window resizes
        setIsBodyScrollLocked(false);
        unLockBodyScroll();
    }, [isScreenMedium]);

    return (
        <div
            ref={viewRef}
            className={classNames(styles.facilitiesTabs, { [styles.noPrint]: hideOnPrint })}
            data-tid='facilities-tabs'
        >
            {shouldShowTitle && <h2 className={styles.title}>{getPhrase(titleDictionaryKey)}</h2>}

            <div className={classNames(styles.tabs, 'facilities-tabs')}>
                <FacilitiesTabsList
                    facilityGroups={facilityGroups}
                    activeTabIndex={activeTabIndex}
                    setActiveTabIndex={setActiveTabIndex}
                />

                {isScreenMedium || !isMounted ? (
                    <FacilitiesTabsPanels
                        facilityGroups={facilityGroups}
                        activeTabIndex={activeTabIndex}
                        rendering={rendering}
                        isShowEcoFacilityPlaceholder={isShowEcoFacilityPlaceholder}
                    />
                ) : (
                    <Drawer open={activeTabIndex !== -1}>
                        <FacilitiesTabsPanels
                            facilityGroups={facilityGroups}
                            activeTabIndex={activeTabIndex}
                            rendering={rendering}
                            isShowEcoFacilityPlaceholder={isShowEcoFacilityPlaceholder}
                        />

                        <div className='drawer__actions'>
                            <Button isText onClick={closeDrawer}>
                                {getPhrase(SitecoreDictionary.GlobalsButtonsBack)}
                            </Button>
                        </div>
                    </Drawer>
                )}
            </div>
        </div>
    );
};

export default observer(FacilitiesTabs);
