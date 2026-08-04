import { useMemo } from 'react';

import { ITransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';

const transferDurationCheck = (duration: number | undefined): duration is number =>
    Boolean(duration && typeof duration === 'number' && duration > 0);

// Get the difference in duration between the private and shared transfer, in minutes
const usePrivateTransferDurationDiff = (alternativeTransfers: ITransfer[]): number =>
    useMemo<number>(() => {
        if (alternativeTransfers.length <= 1) return 0;

        let sharedDuration, privateDuration;

        alternativeTransfers.forEach(transfer => {
            if (transfer.type === TransferType.Shared) {
                sharedDuration = transfer.transferInfo?.duration;
            } else if (transfer.type === TransferType.Private) {
                privateDuration = transfer.transferInfo?.duration;
            }
        });

        if (transferDurationCheck(privateDuration) && transferDurationCheck(sharedDuration)) {
            return sharedDuration - privateDuration;
        }

        return 0;
    }, [alternativeTransfers]);

export default usePrivateTransferDurationDiff;
