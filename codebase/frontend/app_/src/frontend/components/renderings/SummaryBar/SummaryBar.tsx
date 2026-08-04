import React, { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import styles from 'frontend/components/renderings/SummaryBar/SummaryBar.module.scss';

import SummaryDetails from './SummaryDetails/SummaryDetails';
import { useSummaryBarPosition } from './useSummaryBarPosition/useSummaryBarPosition';
import { ISummaryBarSitecoreFields } from './SummaryBar.interfaces';

export const SummaryBar: FunctionComponent<ISitecoreComponent<ISummaryBarSitecoreFields>> = ({ fields }) => {
    const { isSummaryBarEnabled, isSummaryBarHidden, isExtrasPage, isScreenLessLarge, offer } = useStore(
        (stores: IHolidaysStores) => ({
            isSummaryBarEnabled: stores.layoutStore.isSummaryBarEnabled,
            isSummaryBarHidden: stores.layoutStore.isSummaryBarHidden,
            isExtrasPage: stores.layoutStore.isExtrasPage,
            isScreenLessLarge: stores.appStore.isScreenLessLarge,
            offer: stores.bookingStore.selectedOffer,
        }),
    );

    const shouldHide = !fields || !isSummaryBarEnabled || isScreenLessLarge || !offer;
    const { containerRef, topOffset } = useSummaryBarPosition(!shouldHide);

    if (shouldHide) return null;

    return (
        <div
            className={classNames(styles.stickyContainer, { [styles.isHidden]: isSummaryBarHidden })}
            data-tid='summary-bar'
        >
            <Text field={fields.SummaryBarTitle} tag='h2' className={styles.title} data-tid='summary-bar-title' />
            <div
                ref={containerRef}
                style={{ top: `${topOffset}px` }}
                data-tid='summary-bar-positioned-container'
                className={classNames(styles.positionedContainer, { [styles.summaryBarContainerExtras]: isExtrasPage })}
            >
                <div className={styles.summaryBarContainer} data-tid='summary-bar-card'>
                    <SummaryDetails {...fields} />
                </div>
            </div>
        </div>
    );
};

export default observer(SummaryBar);
