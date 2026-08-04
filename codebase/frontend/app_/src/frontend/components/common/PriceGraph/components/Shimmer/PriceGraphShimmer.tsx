/* eslint-disable no-magic-numbers */
import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';

import { BarSetShimmer } from './BarSetShimmer';

import styles from './PriceGraphShimmer.module.scss';

interface IPriceGraphShimmerProps {
    width?: string;
}

const PriceGraphShimmer: FC<IPriceGraphShimmerProps> = ({ width }) => {
    const { currency, isMobileView, formatMoney } = useStore(stores => ({
        currency: stores.priceGraphStore.currency,
        isMobileView: stores.priceGraphStore.isMobileView,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const currencyOptions = { currency, maximumFractionDigits: 0 };

    return (
        <div className={styles.shimmer} style={{ width }} data-tid='price-graph-shimmer'>
            {!isMobileView && (
                <div className={styles.axis}>
                    <div>{formatMoney(2000, currencyOptions)}</div>
                    <div>{formatMoney(1500, currencyOptions)}</div>
                    <div>{formatMoney(1000, currencyOptions)}</div>
                    <div>{formatMoney(500, currencyOptions)}</div>
                    <div>{formatMoney(0, currencyOptions)}</div>
                </div>
            )}
            <div className={styles.chart}>
                <BarSetShimmer />
                <BarSetShimmer />
                <BarSetShimmer className='d-none d-sm-flex' />
                <BarSetShimmer className='d-none d-md-flex' />
                <BarSetShimmer className='d-none d-lg-flex' />
            </div>
        </div>
    );
};

export default PriceGraphShimmer;
