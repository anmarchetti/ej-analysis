import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import styles from './ComparePriceTouristTax.module.scss';

export interface IComparePriceTouristTaxProps {
    isPriceGraphView?: boolean;
    label?: string;
}

export const ComparePriceTouristTax: FC<IComparePriceTouristTaxProps> = ({ label, isPriceGraphView }) => {
    const { isTouristTaxEnabled } = useStore(stores => ({
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));

    if (!isTouristTaxEnabled || !label) {
        return null;
    }

    return (
        <div
            data-tid='compare-price-tourist-tax-wrapper'
            className={classNames(styles.wrapper, {
                [styles.graphWrapper]: isPriceGraphView,
            })}
        >
            <TouristTaxGenericTooltip triggerClassName={styles.trigger}>{label}</TouristTaxGenericTooltip>
        </div>
    );
};

export default observer(ComparePriceTouristTax);
