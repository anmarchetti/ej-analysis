import { FC } from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import Callout, { ICalloutProps } from 'frontend/components/common/Callout/Callout';
import AmendDatesSummaryFee from 'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryFee/AmendDatesSummaryFee';

import styles from './AmendBasketHeaderPrice.module.scss';

interface IAmendBasketHeaderPriceProps {
    additionalCostLabel: string;
    feeLabel: string;
    calloutProps?: ICalloutProps;
}

const AmendBasketHeaderPrice: FC<IAmendBasketHeaderPriceProps> = ({ feeLabel, additionalCostLabel, calloutProps }) => {
    const { amendmentDatesCharges, formatMoney } = useStore(({ amendDatesStore, marketStore }: IHolidaysStores) => ({
        amendmentDatesCharges: amendDatesStore.offerPrices?.amendmentDatesCharges,
        formatMoney: marketStore.formatMoney,
    }));

    const additionalPrice = formatMoney(amendmentDatesCharges ?? 0, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    });

    return (
        <div className={styles.price}>
            <div className={`${styles.prices} diagonal-cell__inner`}>
                {!!additionalPrice && (
                    <div className={styles.additional} data-tid='basket-additional-price'>
                        <span className={styles.additionalLabel}>{additionalCostLabel}</span>
                        <span className={styles.additionalPrice}>
                            {additionalPrice} {calloutProps && <Callout {...calloutProps} />}
                        </span>
                    </div>
                )}
                <AmendDatesSummaryFee feeLabel={feeLabel} />
            </div>
        </div>
    );
};

export default observer(AmendBasketHeaderPrice);
