import React from 'react';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import AmendHotelFilters from 'frontend/components/renderings/AmendHotel/components/AmendHotelFilters/AmendHotelFilters';

import styles from './AmendHotelsFiltersWrap.module.scss';

const AmendHotelsFiltersWrap: React.FC = () => {
    const { getPhrase, toggleFilterMobileDrawer, isMobileDrawerOpen } = useStore((store: IHolidaysStores) => ({
        getPhrase: store.layoutStore.getPhrase,
        toggleFilterMobileDrawer: store.amendHotelStore.filters.toggleFilterMobileDrawer,
        isMobileDrawerOpen: store.amendHotelStore.filters.isMobileDrawerOpen,
    }));
    const isMobile = useMobileViewport();

    return (
        <div className='leftHandFilters'>
            {isMobile ? (
                <Drawer isBodyScrollLocked open={isMobileDrawerOpen}>
                    <AmendHotelFilters />
                    <div className={styles.footer}>
                        <Button isTransparent onClick={toggleFilterMobileDrawer}>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                        </Button>
                        <Button onClick={toggleFilterMobileDrawer} color='primary'>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                        </Button>
                    </div>
                </Drawer>
            ) : (
                <AmendHotelFilters />
            )}
        </div>
    );
};

export default observer(AmendHotelsFiltersWrap);
