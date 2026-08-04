import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { generateExtraLuggageFullInfo, getDefaultBagsOneDirection, IGuestsAmount } from 'frontend/utils/luggage.utils';
import { ILuggageInfoItem } from 'models/data/IFlightExtras';
import { ITransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';
import LuggageInfo from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import IconSuitcase from 'frontend/components/icons-new/HoldBagFilled';
import { TBookingDetailsFields } from 'frontend/components/renderings/Payment/components/BookingDetails/interfaces';
import TransferInfo from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/TransferInfo/TransferInfo';

import styles from './TransferAndBagsRow.module.scss';

export interface ITransferAndBagsRowProps {
    extraLuggageItems: ILuggageInfoItem[];
    guestsAmountByType: IGuestsAmount;
    transfer: Nullable<ITransfer>;
    fields?: TBookingDetailsFields;
}

export const TransferAndBagsRow: FC<ITransferAndBagsRowProps> = ({
    guestsAmountByType,
    transfer,
    fields,
    extraLuggageItems,
}) => {
    const { sportEquipmentCategoryCodes, holdLuggageCategoryCodes, largeCabinBagCode } = useStore(
        ({ layoutStore }: TStores) => ({
            sportEquipmentCategoryCodes: layoutStore.sportEquipmentCategoryCodes,
            holdLuggageCategoryCodes: layoutStore.holdLuggageCategoryCodes,
            largeCabinBagCode: layoutStore.largeCabinBagCode,
        }),
    );
    const extraLuggageFullInfo = generateExtraLuggageFullInfo(
        extraLuggageItems,
        sportEquipmentCategoryCodes,
        holdLuggageCategoryCodes,
    );
    const extraLuggageItemsNumber = extraLuggageItems.filter(
        item => !item.isComplimentary && item.itemCode !== largeCabinBagCode,
    ).length;
    const defaultBagsOneDirection = getDefaultBagsOneDirection(extraLuggageItems);
    const shouldShowTransfer = transfer && transfer.type !== TransferType.NoTransfer;
    const shouldShowBags = !!(guestsAmountByType.infants || defaultBagsOneDirection.length || extraLuggageItemsNumber);

    if (!shouldShowTransfer && !shouldShowBags) {
        return null;
    }

    return (
        <div className={styles.row}>
            {shouldShowBags && (
                <div className={styles.block}>
                    <IconSuitcase className={styles.icon} />
                    <LuggageInfo
                        fields={fields}
                        infantsNumber={guestsAmountByType.infants}
                        extraLuggageFullInfo={extraLuggageFullInfo}
                        defaultBagsOneDirection={defaultBagsOneDirection}
                        guestWithHoldLuggage={guestsAmountByType.adults + guestsAmountByType.children}
                    />
                </div>
            )}
            {shouldShowTransfer && <TransferInfo transfer={transfer} />}
        </div>
    );
};

export default observer(TransferAndBagsRow);
