import { useMemo, useState } from 'react';
import { toJS } from 'mobx';

import { ITransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';

const prepareTransfersData = (
    transfers: ITransfer[] = [],
    isChildrenExist?: boolean,
    isFreeKids?: boolean,
): ITransfer[] => {
    const tempTransfers = transfers.slice();

    if (isChildrenExist && isFreeKids) {
        const removeIndex = tempTransfers.findIndex(el => el.type === TransferType.NoTransfer);
        tempTransfers.splice(removeIndex, 1);
    }

    return tempTransfers.sort((a, b) => a.price - b.price).map(el => el);
};

// Get all the transfers and currently selected transfer code
const useTransfers = (
    selectedTransfers: Nullable<ITransfer[]>,
    alternativeTransfers: ITransfer[],
    passengersQuantity: number,
    isChildrenExist?: boolean,
    isFreeKids?: boolean,
): [ITransfer[], string | undefined] => {
    const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined);

    const selectedTransfer = useMemo<Nullable<ITransfer>>(() => {
        const transfer = selectedTransfers?.length ? selectedTransfers[0] : null;
        const altTransfer = transfer
            ? alternativeTransfers.find(el => el.code === transfer.code)
            : alternativeTransfers.find(el => el.type === TransferType.NoTransfer);
        const parsedAltTransfer = toJS(altTransfer);

        if (parsedAltTransfer) {
            parsedAltTransfer.pricePP = parsedAltTransfer.price / (passengersQuantity || 1);
            parsedAltTransfer.smallSeSurcharge = transfer?.smallSeSurcharge;
            parsedAltTransfer.largeSeSurcharge = transfer?.largeSeSurcharge;
        }

        return parsedAltTransfer;
    }, [selectedTransfers, alternativeTransfers, passengersQuantity]);

    const transfers = useMemo<ITransfer[]>(() => {
        const price = selectedTransfer ? selectedTransfer.price : 0;
        const pricePP = selectedTransfer ? selectedTransfer.pricePP : 0;

        let sorted = prepareTransfersData(alternativeTransfers, isChildrenExist, isFreeKids);

        if (selectedTransfer) {
            let index = selectedIndex;

            if (index === undefined) {
                index = sorted.findIndex(item => item.code === selectedTransfer?.code);
                setSelectedIndex(index);
            }

            sorted = sorted.splice(index, 1).concat(sorted);
        }

        return [
            ...sorted.filter(transfer => transfer.type !== TransferType.NoTransfer),
            ...sorted.filter(transfer => transfer.type === TransferType.NoTransfer),
        ].map(el => ({
            ...el,
            price: el.price - price,
            pricePP: el.price / (passengersQuantity || 1) - pricePP,
            smallSeSurcharge: selectedTransfer?.smallSeSurcharge,
            largeSeSurcharge: selectedTransfer?.largeSeSurcharge,
        }));
    }, [selectedTransfer, alternativeTransfers, passengersQuantity]);

    return [transfers, selectedTransfer?.code];
};

// Returns only one selected transfer
export const useSelectedTransfers = (
    selectedTransfers: Nullable<ITransfer[]>,
    alternativeTransfers: ITransfer[],
    passengersQuantity: number,
): ITransfer[] => {
    const [allTransfers, selectedTransferCode] = useTransfers(
        selectedTransfers,
        alternativeTransfers,
        passengersQuantity,
    );
    const transfer = allTransfers.find(el => el.code === selectedTransferCode);

    return transfer ? [transfer] : [];
};

export default useTransfers;
