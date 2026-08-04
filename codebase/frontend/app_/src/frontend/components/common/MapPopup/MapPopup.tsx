import { FC } from 'react';
import { observer } from 'mobx-react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LeftHandFilters from 'frontend/components/common/LeftHandFilter';
import LoadingAnimation from 'frontend/components/common/LoadingAnimation/LoadingAnimation';
import MapComponent from 'frontend/components/common/MapComponent/MapComponent';
import MobileFilterModal from 'frontend/components/common/MobileFilterModal/MobileFilterModal';
import { Popup } from 'frontend/components/common/Popup';
import SvgCross from 'frontend/components/icons-new/Cross';
import SvgFilterLined from 'frontend/components/icons-new/FilterLined';

import useMapPopup, { IMapPopupProps } from './MapPopup.utils';

import styles from './MapPopup.module.scss';

const MapPopup: FC<IMapPopupProps> = props => {
    const {
        onClose,
        onOpen,
        getPhrase,
        map: mapProps,
        leftHandFilters: leftHandFiltersProps,
        amount,
        mobileFilterModal: { isMobileFilterModalShown, ...mobileFilterModalProps },
        isMobile,
        isLoading,
    } = useMapPopup(props);

    return (
        <Popup
            withPortal
            containerClass={styles.container}
            bodyClass={styles.body}
            dialogClass={styles.dialog}
            contentClass={styles.content}
        >
            {/* filters modal for mobile only */}
            {isMobileFilterModalShown && <MobileFilterModal {...mobileFilterModalProps} />}

            <div className={styles.contentWrapper}>
                <div className={styles.leftColumn}>{!isMobile && <LeftHandFilters {...leftHandFiltersProps} />}</div>

                <div className={styles.rightColumn}>
                    {isLoading && (
                        <div>
                            <div className={styles.loaderWrapper} data-tid='map-popup-loader-overlay' />
                            <LoadingAnimation className={styles.animationWrapper} isCentered />
                        </div>
                    )}

                    {isMobile && (
                        <button data-tid='filters-button' className={styles.filtersBtn} onClick={onOpen}>
                            <span>{getPhrase(SitecoreDictionary.SearchPodFiltersTitlesFilters)}</span>

                            <div className={styles.filterIcon}>
                                <SvgFilterLined />

                                {!!amount && (
                                    <div className={styles.amount} data-tid='map-popup-amount'>
                                        {amount}
                                    </div>
                                )}
                            </div>
                        </button>
                    )}

                    <button data-tid='close-button' className={styles.closeBtn} onClick={onClose}>
                        <span>{getPhrase(SitecoreDictionary.DestinationsButtonsExitMap)}</span>
                        <SvgCross className={styles.closeIcon} />
                    </button>

                    <MapComponent {...mapProps} />
                </div>
            </div>
        </Popup>
    );
};

export default observer(MapPopup);
