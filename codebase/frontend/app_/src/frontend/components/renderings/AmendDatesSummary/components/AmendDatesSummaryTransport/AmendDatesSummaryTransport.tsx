import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';
import sanitize from 'sanitize-html';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AmendUpsellMessage from 'frontend/components/common/Amend/AmendUpsellMessage/AmendUpsellMessage';
import AmendSummaryAccordion from 'frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion';
import EditButton from 'frontend/components/common/AmendSummary/EditButton/EditButton';
import TransferDuration from 'frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration';

import styles from './AmendDatesSummaryTransport.module.scss';

interface IAmendDatesSummaryTransportProps {
    title: ISitecoreField<string>;
}

const AmendDatesSummaryTransport: FunctionComponent<IAmendDatesSummaryTransportProps> = ({ title }) => {
    const {
        handleChangeTransfer,
        bookingTransfer,
        offerTransfer,
        transferOffers,
        isLoading,
        isAmendPriceEnabledOnViewBookingPage,
        upgradePrice,
        getPhrase,
        setIsUnavailableTransferPopupShown,
    } = useStore((stores: IHolidaysStores) => ({
        bookingTransfer: stores.amendDatesStore.booking?.transfers[0],
        offerTransfer: stores.amendDatesStore.offer?.transfers[0],
        handleChangeTransfer: stores.amendDatesStore.transfer.handleChangeTransfer,
        transferOffers: stores.amendDatesStore.transfer.transferOffers,
        isLoading: stores.amendDatesStore.transfer.isLoading,
        isAmendPriceEnabledOnViewBookingPage: stores.amendTransfersStore.isAmendPriceEnabledOnViewBookingPage,
        setIsUnavailableTransferPopupShown: stores.amendTransfersStore.setIsUnavailableTransferPopupShown,
        upgradePrice: stores.amendDatesStore.transfer.upgradePrice,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const onChangeTransferClick = () => {
        if (!transferOffers.length) {
            setIsUnavailableTransferPopupShown(true);

            return;
        }

        return handleChangeTransfer();
    };

    if (!offerTransfer) {
        return null;
    }

    const isTransfersTheSame = bookingTransfer?.type === offerTransfer?.type;
    const isUpsellMessageShown = !isLoading && isAmendPriceEnabledOnViewBookingPage && upgradePrice > 0;
    const transferIcon = offerTransfer.iconUrl || '';

    return (
        <AmendSummaryAccordion
            dataTid='amend-summary-transfer'
            icon={{ value: { src: transferIcon } }}
            title={title.value}
            className={styles.amendSummaryTransport}
        >
            <div className={styles.transport}>
                <h4 className={styles.title}>{offerTransfer.name}</h4>
                <TransferDuration duration={offerTransfer.transferInfo?.duration || 0} className={styles.duration} />
                {!!offerTransfer.content && (
                    <p
                        className={styles.description}
                        dangerouslySetInnerHTML={{ __html: sanitize(offerTransfer.content) }}
                    />
                )}
                {!isTransfersTheSame && (
                    <p data-tid='previous-transfer' className={styles.prevTransfer}>
                        {bookingTransfer?.name}
                    </p>
                )}
            </div>

            <div className='holiday-summary-item__btn-amend no-print'>
                <EditButton
                    dataTid='amend-dates-transfer-edit-button'
                    onClick={onChangeTransferClick}
                    isPlaceholderShimmer={isLoading}
                    isCapitalize
                >
                    {getPhrase(SitecoreDictionary.GlobalsLabelsChangeSingular)}
                </EditButton>
                {isUpsellMessageShown && (
                    <AmendUpsellMessage
                        price={upgradePrice}
                        priceLabel={SitecoreDictionary.ViewBookingLabelsUpgradeTransfer}
                    />
                )}
            </div>
        </AmendSummaryAccordion>
    );
};

export default observer(AmendDatesSummaryTransport);
