import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import {
    getPopupContent,
    getPopupSubtitle,
} from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/SuccessfulAmendmentPopup.utils';

import styles from './SuccessfulAmendmentPopup.module.scss';

export interface ISuccessfulAmendmentPopupFields {
    DatesSubtitle: ISitecoreField<string>;
    DatesTitle: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    FlightSubtitle: ISitecoreField<string>;
    FlightTitle: ISitecoreField<string>;
    RoomAndBoardSubtitle: ISitecoreField<string>;
    RoomAndBoardTitle: ISitecoreField<string>;
    SeatsSubtitle: ISitecoreField<string>;
    SeatsTitle: ISitecoreField<string>;
    TransferSubtitle: ISitecoreField<string>;
    TransferTitle: ISitecoreField<string>;
}

type TSuccessfulAmendmentPopupProps = ISitecoreComponent<ISuccessfulAmendmentPopupFields>;

const SuccessfulAmendmentPopup = ({ fields }: TSuccessfulAmendmentPopupProps) => {
    const { getPhrase, setSuccessfulAmendmentStatus, trackSuccessfulAmendment, successfulAmendmentStatus, booking } =
        useStore((stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            booking: stores.viewBookingStore.booking,
            setSuccessfulAmendmentStatus: stores.viewBookingStore.setSuccessfulAmendmentStatus,
            successfulAmendmentStatus: stores.viewBookingStore.successfulAmendmentStatus,
            trackSuccessfulAmendment: stores.trackingStore.trackSuccessfulAmendment,
        }));

    useMount(trackSuccessfulAmendment);

    if (!successfulAmendmentStatus || !fields || !booking) {
        return null;
    }

    const onClose = () => setSuccessfulAmendmentStatus(null);

    const title = fields[successfulAmendmentStatus + 'Title'];
    const subtitle = getPopupSubtitle(fields, booking?.transfers[0]?.name, successfulAmendmentStatus);
    const confirmationMessage = Tokenizer.replaceToken(
        fields.Description?.value,
        Tokens.Email,
        `<strong>${booking?.leadPassenger?.email || ''}</strong>`,
    );

    return (
        <Popup
            containerClass={classNames(
                'view-booking',
                styles.popupWrap,
                styles[`${successfulAmendmentStatus.toLowerCase()}Styles`], //type class e.g. dateStyles
            )}
            showCloseButton
            isContentCentered
            onClose={onClose}
            id={`successful-amend-popup-${successfulAmendmentStatus}`}
        >
            <div className={styles.container}>
                {!!title && (
                    <RichTextWithLinks
                        className={styles.title}
                        dataId='successful-amendment-popup-title'
                        tag='h3'
                        field={title}
                    />
                )}

                {!!subtitle && (
                    <RichTextWithLinks
                        dataId='successful-amendment-popup-subtitle'
                        className={styles.subtitle}
                        field={subtitle}
                    />
                )}
                {getPopupContent(successfulAmendmentStatus)}
                {!!confirmationMessage && (
                    <div className={styles.messageContainer}>
                        <RichTextWithLinks
                            dataId='successful-amendment-popup-confirmation-message'
                            className={styles.confirmationMessage}
                            field={{ value: confirmationMessage }}
                        />
                    </div>
                )}
                <div className={styles.buttonWrap}>
                    <Button dataTid='successful-amendment-popup-close-button' isMedium onClick={onClose}>
                        {getPhrase(SitecoreDictionary.PaymentButtonsBackToBooking)}
                    </Button>
                </div>
            </div>
        </Popup>
    );
};

export default observer(SuccessfulAmendmentPopup);
