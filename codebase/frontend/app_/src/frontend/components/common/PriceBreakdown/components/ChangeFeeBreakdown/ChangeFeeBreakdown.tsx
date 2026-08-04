import { FunctionComponent } from 'react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IFeePerPerson } from 'models/data/IAmendBookingFlights';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import styles from './ChangeFeeBreakdown.module.scss';

const ChangeFeeBreakdown: FunctionComponent<IFeePerPerson> = ({ feesPerPersonAmount, feesCount }) => {
    const { getPhrase, formatMoney, currency } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.marketStore.currency,
    }));

    const dictionaryLabel =
        feesCount > 1
            ? SitecoreDictionary.IframePromotingHolidaysLabelsPeoplePlural
            : SitecoreDictionary.IframePromotingHolidaysLabelsPeopleSingular;
    const label = `(${formatMoney(feesPerPersonAmount, {
        currency,
    })} x ${feesCount} ${getPhrase(dictionaryLabel)})`;

    return (
        <p data-tid='person-fee' className={styles.feePerson}>
            {label}
        </p>
    );
};

export default ChangeFeeBreakdown;
