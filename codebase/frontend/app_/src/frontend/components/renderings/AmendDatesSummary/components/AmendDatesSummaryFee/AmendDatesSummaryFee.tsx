import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';

import styles from './AmendDatesSummaryFee.module.scss';

interface IAmendDatesSummaryCostProps {
    feeLabel: string;
    additionalCost?: {
        label: string;
        price: number;
    };
}

const AmendDatesSummaryFee = ({ feeLabel }: IAmendDatesSummaryCostProps) => {
    const { changeDatesFee, formatMoney } = useStore((stores: IHolidaysStores) => ({
        changeDatesFee: stores.amendDatesStore.offerPrices?.amendmentDatesFees,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const feeText = `+ ${Tokenizer.replaceToken(feeLabel, Tokens.Amount, formatMoney(changeDatesFee || 0))}`;

    if (!changeDatesFee) {
        return null;
    }

    return (
        <div className={`${styles.cost} summary-fee`} data-tid='amend-dates-summary-fee'>
            <span className={styles.fee}>{feeText}</span>
        </div>
    );
};

export default observer(AmendDatesSummaryFee);
