import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { generateExtraLuggageFullInfo, getDefaultBagsOneDirection, getGuestAmount } from 'frontend/utils/luggage.utils';
import LuggageInfo from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import { IAmendDatesSummaryFields } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary';

import styles from './AmendDatesSummarySeatsBags.module.scss';

interface IAmendDatesSummarySeatsBagsProps {
    fields: IAmendDatesSummaryFields;
    title?: string;
}

const AmendDatesSummarySeatsBags = ({ title, fields }: IAmendDatesSummarySeatsBagsProps) => {
    const { offer, sportEquipmentCategoryCodes, holdLuggageCategoryCodes, extraLuggageItems } = useStore(
        ({ amendDatesStore, layoutStore }: IHolidaysStores) => ({
            getPhrase: layoutStore.getPhrase,
            booking: amendDatesStore.booking,
            offer: amendDatesStore.offerWithPrices?.offer,
            extraLuggageItems: amendDatesStore.offer?.extraLuggageInfo?.items,
            sportEquipmentCategoryCodes: layoutStore.sportEquipmentCategoryCodes,
            holdLuggageCategoryCodes: layoutStore.holdLuggageCategoryCodes,
            largeCabinBagCode: layoutStore.largeCabinBagCode,
        }),
    );

    const guestsAmountByType = getGuestAmount(offer);

    const extraLuggageFullInfo = generateExtraLuggageFullInfo(
        extraLuggageItems ?? [],
        sportEquipmentCategoryCodes,
        holdLuggageCategoryCodes,
    );
    const defaultBagsOneDirection = getDefaultBagsOneDirection(extraLuggageItems);

    return (
        <div className={styles.bags}>
            <h4 className={styles.title}>{title}</h4>
            <LuggageInfo
                fields={fields}
                infantsNumber={guestsAmountByType.infants}
                guestWithHoldLuggage={guestsAmountByType.adults + guestsAmountByType.children}
                titleClassName={styles.title}
                defaultBagsOneDirection={defaultBagsOneDirection}
                extraLuggageFullInfo={extraLuggageFullInfo}
                hideTitle
            />
        </div>
    );
};

export default observer(AmendDatesSummarySeatsBags);
