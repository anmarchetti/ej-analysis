import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import usePrivateTransferDurationDiff from 'frontend/hooks/usePrivateTransferDurationDiff';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isFreeForKids } from 'frontend/utils/offer.utils';
import { isTransferHidden } from 'frontend/utils/transfer.utils';
import { ITransfer } from 'models/data/ITransfer';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AncillariesHeader from 'frontend/components/common/Ancillaries/components/AncillariesHeader/AncillariesHeader';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import SEAccommodationFailPopup from 'frontend/components/renderings/Transfer/components/HoldLuggageCancelPopup/SEAccommodationFailPopup';
import TransferDurationPromo from 'frontend/components/renderings/Transfer/components/TransferDurationPromo/TransferDurationPromo';
import TransferItem from 'frontend/components/renderings/Transfer/components/TransferItem/TransferItem';

import useTransfers from './hooks/useTransfers';

import styles from './Transfer.module.scss';

export interface ISEAccommodationFailPopupFields {
    CancelButtonLabel: ISitecoreField<string>;
    ConfirmButtonLabel: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export interface ITransferFields {
    IncludedForFreeText: ISitecoreField<string>;
    LargeSERemoveTransferPopup: ISitecoreCompositeField<ISEAccommodationFailPopupFields>;
    MultipleSharedFeesDescription: ISitecoreField<string>;
    NoTransferCTADescription: ISitecoreField<string>;
    PrivateCTADescription: ISitecoreField<string>;
    PrivateFeesDescription: ISitecoreField<string>;
    PrivateFeesTitle: ISitecoreField<string>;
    SERemoveTransferPopup: ISitecoreCompositeField<ISEAccommodationFailPopupFields>;
    SharedCTADescription: ISitecoreField<string>;
    SharedFeesDescriptionPriceHidden: ISitecoreField<string>;
    SharedFeesTitle: ISitecoreField<string>;
    SingleSharedFeesDescription: ISitecoreField<string>;
    TransferNotAccommodatingSEPopup: ISitecoreCompositeField<ISEAccommodationFailPopupFields>;
    TransferRemoveLargeSEPopup: ISitecoreCompositeField<ISEAccommodationFailPopupFields>;
    TransferRemoveSEPopup: ISitecoreCompositeField<ISEAccommodationFailPopupFields>;
    UpgradeForFree: ISitecoreField<string>;
    UpgradeForText: ISitecoreField<string>;
}

export const Transfer: FunctionComponent<ISitecoreComponent<ITransferFields>> = ({ fields }) => {
    const {
        offer,
        alternativeTransfers,
        selectedTransfers,
        transfer,
        adultsQuantity,
        isPrivateTransferPromoEnabled,
        privateTransferPromoMinDiffTime,
        changeTransfer,
        getPhrase,
        showSEAccommodationPopupIfNeeded,
        childrenQuantity,
    } = useStore(({ bookingStore, searchStore, layoutStore }: TStores) => ({
        alternativeTransfers: bookingStore.alternativeTransfers,
        selectedTransfers: bookingStore.transfers,
        transfer: bookingStore.transfer,
        adultsQuantity: searchStore.searchWho.adultsQuantity,
        isPrivateTransferPromoEnabled: layoutStore.isPrivateTransferPromoEnabled,
        privateTransferPromoMinDiffTime: layoutStore.privateTransferPromoMinDiffTime,
        changeTransfer: bookingStore.changeTransfer,
        getPhrase: layoutStore.getPhrase,
        showSEAccommodationPopupIfNeeded: bookingStore.showSEAccommodationPopupIfNeeded,
        childrenQuantity: searchStore.searchWho.childrenQuantity,
        offer: bookingStore.selectedOffer,
    }));

    const passengersQuantity = adultsQuantity + childrenQuantity; // TO DO investigate why infantsQuantity is missed
    const [transfers, selectedTransferCode] = useTransfers(
        selectedTransfers,
        alternativeTransfers,
        passengersQuantity,
        childrenQuantity > 0,
        !!offer && isFreeForKids(offer),
    );
    const privateDiffDuration = usePrivateTransferDurationDiff(alternativeTransfers);

    const showDurationPromo = (transfer: ITransfer): boolean =>
        transfer.type == TransferType.Private &&
        isPrivateTransferPromoEnabled &&
        privateDiffDuration >= privateTransferPromoMinDiffTime;

    const onSelectClick = async (el: ITransfer): Promise<void> => {
        await changeTransfer(el);
        showSEAccommodationPopupIfNeeded(true, transfer);
    };

    return (
        <section className={classNames(styles.section, 'step step__with-triangle-start')} data-tid='transfers'>
            <div id={ScrollAnchorId.Transfer} aria-hidden='true' data-tid='transfer-scroll-anchor' />
            <AncillariesHeader title={{ value: getPhrase(SitecoreDictionary.TransferLabelsTitleTransferSingular) }} />

            <div className={styles.transferList}>
                {(transfers || []).map((el, id) => (
                    <TransferItem
                        fields={fields}
                        transfer={el}
                        key={el.code}
                        isDefault={id === 0}
                        isSelected={
                            isTransferHidden(alternativeTransfers) ? id === 0 : el.code === selectedTransferCode
                        }
                        onSelect={(): Promise<void> => onSelectClick(el)}
                        promo={showDurationPromo(el) ? <TransferDurationPromo timeDiff={privateDiffDuration} /> : null}
                    />
                ))}
            </div>

            {isTransferHidden(transfers) && (
                <ErrorMessage
                    message={getPhrase(SitecoreDictionary.TransferLabelsNoOtherTransferOptions)}
                    description={getPhrase(SitecoreDictionary.TransferLabelsNoOtherTransferDescription)}
                    icon={<IconInfoCircle />}
                    IsNotification
                    errorMessageClass={styles.errorMessage}
                />
            )}
            <SEAccommodationFailPopup fields={fields} />
        </section>
    );
};

export default observer(Transfer);
