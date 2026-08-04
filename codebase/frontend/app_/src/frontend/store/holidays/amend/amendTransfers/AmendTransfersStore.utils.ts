import { ITransfer, ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';

export const getTransferTypePrice = (type: TransferType, transfers: ITransferWithAmendmentCharges[]): number =>
    transfers.find(item => item.transfer.type === type)?.amendmentCharges || 0;

export const getUpgradeTransferPrice = (
    currentTransfer?: ITransfer,
    amendTransfers: ITransferWithAmendmentCharges[] = [],
): number => {
    if (!currentTransfer) {
        return 0;
    }

    if (currentTransfer.type === TransferType.NoTransfer) {
        return (
            getTransferTypePrice(TransferType.Shared, amendTransfers) ||
            getTransferTypePrice(TransferType.Private, amendTransfers)
        );
    }

    if (currentTransfer.type === TransferType.Shared) {
        return getTransferTypePrice(TransferType.Private, amendTransfers);
    }

    return 0;
};
