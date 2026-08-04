import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isLoadedStatus, isLoadingStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AmendUpsellMessage from 'frontend/components/common/Amend/AmendUpsellMessage/AmendUpsellMessage';
import Button from 'frontend/components/common/Button';

interface ITransferItemAmendButtonProps {
    onAmendTransfersClick?: (e) => void;
}

function TransferItemAmendButton({ onAmendTransfersClick }: ITransferItemAmendButtonProps) {
    const { getPhrase, isAmendPriceEnabledOnViewBookingPage, upgradePrice, transferStatus, isDisabled } = useStore(
        (stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isAmendPriceEnabledOnViewBookingPage: stores.amendTransfersStore.isAmendPriceEnabledOnViewBookingPage,
            upgradePrice: stores.amendTransfersStore.upgradePrice,
            transferStatus: stores.amendTransfersStore.transferStatus,
            isDisabled: stores.amendTransfersStore.isAmendCTADisabled,
        }),
    );

    const shouldShowButtonPriceLabel =
        isLoadedStatus(transferStatus) && isAmendPriceEnabledOnViewBookingPage && upgradePrice > 0;

    return (
        <div className='holiday-summary-item__btn-amend no-print align-items-md-end'>
            <Button
                isSmall
                isOutlined
                onClick={onAmendTransfersClick}
                isPlaceholderShimmer={isLoadingStatus(transferStatus)}
                disabled={isDisabled}
            >
                {getPhrase(SitecoreDictionary.ViewBookingButtonsAmendTransfers)}
            </Button>
            {shouldShowButtonPriceLabel && (
                <AmendUpsellMessage
                    price={upgradePrice}
                    priceLabel={SitecoreDictionary.ViewBookingLabelsUpgradeTransfer}
                />
            )}
        </div>
    );
}

export default observer(TransferItemAmendButton);
