import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

import styles from './HoldLuggageCancelPopup.module.scss';

export interface IHoldLuggageCancelPopupProps {
    BackButtonCancelPopup: ISitecoreField<string>;
    ContinueButtonCancelPopup: ISitecoreField<string>;
    TextCancelPopup: ISitecoreField<string>;
    TitleCancelPopup: ISitecoreField<string>;
}

export const HoldLuggageCancelPopup = ({
    TitleCancelPopup,
    TextCancelPopup,
    BackButtonCancelPopup,
    ContinueButtonCancelPopup,
}: IHoldLuggageCancelPopupProps) => {
    const { clearUnconfirmedLuggage, setHoldLuggagePopupOpened, setCancelPopupOpened } = useStore(
        (stores: TStores) => ({
            clearUnconfirmedLuggage: stores.bookingStore.holdLuggage.clearUnconfirmedLuggage,
            setHoldLuggagePopupOpened: stores.bookingStore.holdLuggage.setHoldLuggagePopupOpened,
            setCancelPopupOpened: stores.bookingStore.holdLuggage.setCancelPopupOpened,
        }),
    );

    const onContinueClick = () => {
        setCancelPopupOpened(false);
    };

    const onCloseClick = () => {
        clearUnconfirmedLuggage();
        setHoldLuggagePopupOpened(false);
        setCancelPopupOpened(false);
    };

    return (
        <Popup
            containerClass={styles.cancelPopupContainer}
            dialogClass={styles.popupDialog}
            bodyClass={styles.popupBody}
            contentClass={styles.contentClass}
            isInnerPopup
        >
            <Text field={TitleCancelPopup} tag='h2' className={styles.title} />
            <Text field={TextCancelPopup} tag='p' className={styles.content} />
            <div className={styles.footer}>
                <Button dataTid='back-popup-close' onClick={onCloseClick} className={styles.backBtn}>
                    <Text field={BackButtonCancelPopup} />
                </Button>
                <Button dataTid='back-popup-continue' onClick={onContinueClick} className={styles.continueBtn}>
                    <Text field={ContinueButtonCancelPopup} />
                </Button>
            </div>
        </Popup>
    );
};
export default observer(HoldLuggageCancelPopup);
