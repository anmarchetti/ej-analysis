import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import Button from 'frontend/components/common/Button';
import HoldLuggageInfoLabel from 'frontend/components/renderings/HoldLuggagePopup/components/HoldLuggageInfoLabel/HoldLuggageInfoLabel';
import { IHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/HoldLuggagePopup';

import styles from './HoldLuggagePopupActions.module.scss';

export type THoldLuggagePopupActionsProps = Pick<
    IHoldLuggagePopupFields,
    'NoLuggageAddedButton' | 'NoLuggageAddedLabel' | 'LuggageAddedLabel' | 'LuggageAddedButton'
>;

export const HoldLuggagePopupActions: FC<THoldLuggagePopupActionsProps> = ({
    NoLuggageAddedButton,
    NoLuggageAddedLabel,
    LuggageAddedLabel,
    LuggageAddedButton,
}) => {
    const {
        isScreenMedium,
        isEnoughTimeForAddSETransfer,
        transfer,
        getPhrase,
        setIsSERemoveTransfer,
        confirmExtraLuggage,
        selectedLuggage,
        selectedSportEquipment,
        selectedTotalNumber,
        selectedSportEquipmentNumber,
        setHoldLuggagePopupOpened,
        clearHoldLuggage,
        hasLuggageSelectionChanged,
    } = useStore((stores: TStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        isEnoughTimeForAddSETransfer: stores.bookingStore.isEnoughTimeForAddSETransfer,
        transfer: stores.bookingStore.transfer,
        getPhrase: stores.layoutStore.getPhrase,
        setIsSERemoveTransfer: stores.bookingStore.setIsSERemoveTransfer,
        confirmExtraLuggage: stores.bookingStore.extraLuggage.confirmExtraLuggage,
        selectedLuggage: stores.bookingStore.holdLuggage.selectedLuggage,
        selectedSportEquipment: stores.bookingStore.holdLuggage.selectedSportEquipment,
        selectedTotalNumber: stores.bookingStore.holdLuggage.selectedTotalNumber,
        selectedSportEquipmentNumber: stores.bookingStore.holdLuggage.selectedSportEquipmentNumber,
        setHoldLuggagePopupOpened: stores.bookingStore.holdLuggage.setHoldLuggagePopupOpened,
        clearHoldLuggage: stores.bookingStore.holdLuggage.clearHoldLuggage,
        hasLuggageSelectionChanged: stores.bookingStore.holdLuggage.hasLuggageSelectionChanged,
    }));

    const getButtonText = () => {
        if (selectedTotalNumber === 0) {
            return NoLuggageAddedButton;
        }

        if (isScreenMedium) {
            return LuggageAddedButton;
        }

        return { value: getPhrase(SitecoreDictionary.GlobalsButtonsContinue) };
    };

    const onConfirm = () => {
        setHoldLuggagePopupOpened(false);

        if (!hasLuggageSelectionChanged) {
            return;
        }

        if (
            selectedSportEquipmentNumber &&
            transfer?.type !== TransferType.NoTransfer &&
            !isEnoughTimeForAddSETransfer
        ) {
            setIsSERemoveTransfer(true);

            return;
        }

        confirmExtraLuggage(selectedLuggage, selectedSportEquipment, clearHoldLuggage);
    };

    return (
        <div data-tid='hold-luggage-popup-actions' className={styles.confirmWrapper}>
            <HoldLuggageInfoLabel NoLuggageAddedLabel={NoLuggageAddedLabel} LuggageAddedLabel={LuggageAddedLabel} />
            <Button
                isOutlined
                className={classNames(styles.btn, selectedTotalNumber && styles.confirmBtn)}
                onClick={onConfirm}
                data-tid='hold-luggage-confirm'
            >
                <Text tag='span' field={getButtonText()} />
            </Button>
        </div>
    );
};

export default observer(HoldLuggagePopupActions);
