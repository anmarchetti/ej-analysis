import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { logger } from 'frontend/services/logging';
import { isHolidayStore } from 'frontend/store/holidays/create-stores';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

import styles from './SingleUsePromoCodePopup.module.scss';

interface ISingleUsePromoCodePopupFields {
    ButtonLabel: ISitecoreField<string>;
    CampaignId: ISitecoreField<string>;
    CopiedConfirmation: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    MobileTitle: ISitecoreField<string>;
    MotivationLabel: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

type TSingleUsePromoCodePopupProps = ISitecoreComponent<ISingleUsePromoCodePopupFields>;

export const SingleUsePromoCodePopup: FunctionComponent<TSingleUsePromoCodePopupProps> = ({ fields, rendering }) => {
    const { getSingleUsePromoCode, sendImpressionEvent, sendClickEvent } = useStore(stores => ({
        getSingleUsePromoCode: isHolidayStore(stores) && stores.userStore.getSingleUsePromoCode,
        sendImpressionEvent: stores.engageStore.sendImpressionEvent,
        sendClickEvent: stores.engageStore.sendClickEvent,
    }));

    const [promocode, setPromocode] = useState<string | null>(null);
    const isViewTrackedRef = useRef(false);

    useEffect(() => {
        const fetchPromoCode = async (): Promise<void> => {
            if (!getSingleUsePromoCode || !fields?.CampaignId?.value) return;

            const result = await getSingleUsePromoCode(fields.CampaignId.value);

            if (result) {
                setPromocode(result);
            }
        };

        fetchPromoCode();
    }, [getSingleUsePromoCode, fields?.CampaignId?.value]);

    useEffect(() => {
        if (!promocode || !fields?.CampaignId?.value || isViewTrackedRef.current) {
            return;
        }

        sendImpressionEvent(fields.CampaignId.value, rendering.uid, EventTypes.SingleUsePromoCodePopup);
        logger.info(`SingleUsePromoCodePopup viewed: ${promocode}`);
        isViewTrackedRef.current = true;
    }, [fields?.CampaignId?.value, rendering.uid, promocode, sendImpressionEvent]);

    const isMobile = useMobileViewport();

    if (!promocode || !fields?.CampaignId?.value) {
        return null;
    }

    const onCopyClick = async (): Promise<void> => {
        try {
            await copyToClipboard(promocode);
            sessionStorage.setItem(WebStorageKeys.IsUserPromoClosed, JSON.stringify(true));
            sendClickEvent(fields.CampaignId.value, rendering.uid, EventTypes.SingleUsePromoCodePopup, promocode);
            logger.info(`SingleUsePromoCodePopup copied: ${promocode}`);
        } catch (e) {
            logger.error(e);
        }
    };

    const { Title, MobileTitle, Description, MotivationLabel, ButtonLabel } = fields;
    const title = isMobile ? MobileTitle?.value : Title?.value;

    const onClose = (): void => {
        sessionStorage.setItem(WebStorageKeys.IsUserPromoClosed, JSON.stringify(true));
        setPromocode(null);

        logger.info(`SingleUsePromoCodePopup closed: ${promocode}`);
    };

    return (
        <Popup
            title={title}
            dialogClass={styles.dialog}
            contentClass={isMobile ? styles.content : `${styles.content} ${styles.nonModalContent}`}
            onClose={onClose}
            isCentered={false}
            isToastPopup={!isMobile}
            showCloseButton
            disableOutsideClick
            containerClass={isMobile ? undefined : styles.nonModalContainer}
            overlayClass={isMobile ? undefined : styles.nonModalOverlay}
        >
            <div className={styles.content}>
                <Text tag='div' className={styles.description} field={Description} />
                <Text tag='div' className={styles.motivation} field={MotivationLabel} />
                <div className={styles.controls}>
                    <div className={styles.code}>{promocode}</div>
                    <Button aria-label={ButtonLabel?.value} onClick={onCopyClick}>
                        <Text field={ButtonLabel} />
                    </Button>
                </div>
            </div>
        </Popup>
    );
};

export default observer(SingleUsePromoCodePopup);
