import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import AmendTransferCard from 'frontend/components/renderings/AmendTransfers/components/AmendTransferCard';

import styles from './AmendPaymentTransferDetails.module.scss';

const AmendPaymentTransferDetails = () => {
    const { selectedTransfer, currency } = useStore((stores: IHolidaysStores) => ({
        selectedTransfer: stores.amendTransfersStore.selectedTransfer,
        currency: stores.amendTransfersStore.currency,
    }));

    if (!selectedTransfer) {
        return null;
    }

    const { transfer, amendmentCharges } = selectedTransfer;

    return (
        <div className={styles.container} data-tid='amend-payment-transfer-details'>
            <AmendTransferCard
                transfer={transfer}
                key={transfer.code}
                amendCharge={amendmentCharges}
                contentClassName={styles.cardContent}
                currency={currency}
                isPriceBlockHidden
                isPayment
            />
        </div>
    );
};

export default observer(AmendPaymentTransferDetails);
