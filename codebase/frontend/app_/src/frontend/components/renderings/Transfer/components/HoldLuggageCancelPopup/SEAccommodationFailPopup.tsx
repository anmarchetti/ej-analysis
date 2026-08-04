import { FunctionComponent, useEffect } from 'react';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import useSEAccommodationFail from 'frontend/components/renderings/Transfer/hooks/useSEAccommodationFail';
import { ITransferFields } from 'frontend/components/renderings/Transfer/Transfer';

import styles from './SEAccommodationFailPopup.module.scss';

export interface ISEAccommodationFailPopupProps {
    fields?: ITransferFields;
}

export const SEAccommodationFailPopup: FunctionComponent<ISEAccommodationFailPopupProps> = ({ fields }) => {
    const {
        isTransferRemoveSE,
        isSERemoveTransfer,
        trackTransferAndSportsEquipmentChange,
        selectedLuggage,
        selectedSportEquipment,
        clearHoldLuggage,
        setSportEquipment,
    } = useStore(({ bookingStore, trackingStore }: TStores) => ({
        isTransferRemoveSE: bookingStore.isTransferRemoveSE,
        isSERemoveTransfer: bookingStore.isSERemoveTransfer,
        trackTransferAndSportsEquipmentChange: trackingStore.trackTransferAndSportsEquipmentChange,
        selectedLuggage: bookingStore.holdLuggage.selectedLuggage,
        selectedSportEquipment: bookingStore.holdLuggage.selectedSportEquipment,
        clearHoldLuggage: bookingStore.holdLuggage.clearHoldLuggage,
        setSportEquipment: bookingStore.holdLuggage.setSportEquipment,
    }));

    const popupData = useSEAccommodationFail(
        selectedLuggage,
        selectedSportEquipment,
        clearHoldLuggage,
        setSportEquipment,
        fields,
    );

    useEffect(() => {
        if (isTransferRemoveSE || isSERemoveTransfer) {
            trackTransferAndSportsEquipmentChange(isTransferRemoveSE);
        }
    }, [isTransferRemoveSE, isSERemoveTransfer, trackTransferAndSportsEquipmentChange]);

    if (!popupData) {
        return null;
    }

    const [popupFields, onContinueClick, onCancelClick] = popupData;
    const { Title, Description, CancelButtonLabel, ConfirmButtonLabel } = popupFields;

    return (
        <Popup
            containerClass={styles.popupContainer}
            dialogClass={styles.popupDialog}
            bodyClass={styles.popupBody}
            contentClass={styles.contentClass}
        >
            <Text field={Title} tag='h4' className={styles.title} />
            <RichText field={Description} className={styles.content} />
            <Button
                dataTid='se-accommodation-fail-cancel-cta'
                onClick={onCancelClick}
                isOutlined
                className={styles.button}
            >
                <Text field={CancelButtonLabel} />
            </Button>
            <Button dataTid='se-accommodation-fail-continue-cta' onClick={onContinueClick} className={styles.button}>
                <Text field={ConfirmButtonLabel} />
            </Button>
        </Popup>
    );
};

export default observer(SEAccommodationFailPopup);
