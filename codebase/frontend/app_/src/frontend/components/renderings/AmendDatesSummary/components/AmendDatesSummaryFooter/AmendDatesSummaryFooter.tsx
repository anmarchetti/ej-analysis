import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import datesStyles from 'frontend/components/renderings/AmendDates/components/StickySummaryFooter/StickySummaryFooter.module.scss';
import AmendDatesSummaryContinueBtn from 'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryContinueBtn/AmendDatesSummaryContinueBtn';

import styles from './AmendDatesSummaryFooter.module.scss';

interface IAmendDatesSummaryFooterProps {
    priceLabel: ISitecoreField<string>;
}

const AmendDatesSummaryFooter = ({ priceLabel }: IAmendDatesSummaryFooterProps) => {
    const { amendmentDatesCharges, formatMoney } = useStore(({ amendDatesStore, marketStore }: IHolidaysStores) => ({
        amendmentDatesCharges: amendDatesStore.offerPrices?.amendmentDatesCharges,
        formatMoney: marketStore.formatMoney,
    }));

    if (amendmentDatesCharges === undefined) {
        return null;
    }

    const price = formatMoney(getAmendmentRoundedPrice(amendmentDatesCharges), { maximumFractionDigits: 0 });

    return (
        <div
            className={classNames(datesStyles.stickySummaryFooter, 'summary-footer')}
            data-tid='date-change-summary-footer'
        >
            <div className={styles.content}>
                <span>{priceLabel?.value}</span>
                <span className={styles.price}>{price}</span>
            </div>
            <AmendDatesSummaryContinueBtn />
        </div>
    );
};

export default observer(AmendDatesSummaryFooter);
