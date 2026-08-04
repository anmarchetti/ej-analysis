import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import styles from 'frontend/components/common/PriceBreakdown/PriceBreakdown.module.scss';
import { DATA_TID_PREFIX as DATA_TID } from 'frontend/components/common/PriceBreakdown/PriceBreakdown.utils';

const PriceBreakdownShimmer: FunctionComponent = () => {
    const isMoreThenMobileViewport = useMoreThenMobileViewport();

    if (!isMoreThenMobileViewport) return null;

    return (
        <section
            className={classNames(styles.desktopBreakdown, 'price-breakdown')}
            data-tid={`${DATA_TID}-desktop-shimmer`}
        >
            <div className={styles.title} data-tid={`${DATA_TID}-title-shimmer`}>
                <div className={classNames('placeholder-shimmer', styles.row)} />
            </div>
            <div className={styles.priceBreakdownDetails} data-tid={`${DATA_TID}-details-shimmer`}>
                <div className={classNames('placeholder-shimmer', styles.row)} />
                <div className={classNames('placeholder-shimmer', styles.row)} />
            </div>
            <div className={styles.breakdownSummary} data-tid={`${DATA_TID}-summary-shimmer`}>
                <div className={classNames('placeholder-shimmer', styles.row)} />
            </div>
        </section>
    );
};

export default observer(PriceBreakdownShimmer);
