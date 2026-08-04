import React, { FC } from 'react';

import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './HotelCheckInPopup.module.scss';

export type THotelCheckInPopupProps = {
    onClose: () => void;
};

const HotelCheckInPopup: FC<THotelCheckInPopupProps> = ({ onClose }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMoreThenMobileViewport = useMoreThenMobileViewport();

    return (
        <FloatingPopup
            onClose={onClose}
            footerContent={
                <Button
                    onClick={onClose}
                    isOutlined
                    isFullWidth={!isMoreThenMobileViewport}
                    type='button'
                    aria-label={getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                    dataTid='hotel-check-in-popup-close-btn'
                    className={styles.closeBtn}
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            }
            id='hotel-check-in-popup'
            contentClass={styles.body}
        >
            <h4 className={styles.title} data-tid='hotel-check-in-popup-title'>
                {getPhrase(SitecoreDictionary.ViewBookingHotelCheckInPopupTitle)}
            </h4>
            <RichTextWithLinks
                dataId='hotel-check-in-popup-description'
                className={styles.description}
                field={{ value: getPhrase(SitecoreDictionary.ViewBookingHotelCheckInPopupDescription) }}
            />
        </FloatingPopup>
    );
};

export default HotelCheckInPopup;
