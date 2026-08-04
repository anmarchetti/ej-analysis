import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { generateExtraLuggageFullInfo, getDefaultBagsOneDirection, IGuestsAmount } from 'frontend/utils/luggage.utils';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import LuggageInfo, { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import styles from 'frontend/components/common/HolidaySummary/HolidaySummary.module.scss';
import SVGHoldBagFilled from 'frontend/components/icons-new/HoldBagFilled';

export interface IHolidaySummaryBagsProps {
    dataTid: string;
    guestsAmountByType: IGuestsAmount;
    luggageInfo: IExtraLuggageInfo;
    fields?: ILuggageInfoFields;
}

export const HolidaySummaryBags: FC<IHolidaySummaryBagsProps> = ({
    luggageInfo,
    fields,
    dataTid,
    guestsAmountByType,
}) => {
    const { sportEquipmentCategoryCodes, holdLuggageCategoryCodes } = useStore(({ layoutStore }: TStores) => ({
        sportEquipmentCategoryCodes: layoutStore.sportEquipmentCategoryCodes,
        holdLuggageCategoryCodes: layoutStore.holdLuggageCategoryCodes,
    }));

    const extraLuggageFullInfo = generateExtraLuggageFullInfo(
        luggageInfo.items,
        sportEquipmentCategoryCodes,
        holdLuggageCategoryCodes,
    );
    const defaultBagsOneDirection = getDefaultBagsOneDirection(luggageInfo.items);

    return (
        <div className={styles.block} data-tid={dataTid}>
            <SVGHoldBagFilled className={styles.icon} />
            <div className={styles.content}>
                <LuggageInfo
                    fields={fields}
                    guestWithHoldLuggage={guestsAmountByType.adults + guestsAmountByType.children}
                    infantsNumber={guestsAmountByType.infants}
                    titleClassName={styles.title}
                    defaultBagsOneDirection={defaultBagsOneDirection}
                    extraLuggageFullInfo={extraLuggageFullInfo}
                />
            </div>
        </div>
    );
};

export default observer(HolidaySummaryBags);
