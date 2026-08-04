import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getTimestamp } from 'frontend/utils/tracking/tracking.utils';
import { createProduct } from 'frontend/utils/tracking/trackOffer.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import Checkbox from 'frontend/components/common/Checkbox';
import { IOfferWithActionFields } from 'frontend/components/renderings/CompareDeals/stores/CompareStore';
import { useCompareStore } from 'frontend/components/renderings/CompareDeals/stores/createCompareLocalStore';
import styles from 'frontend/components/renderings/SearchResults/components/OfferCardNew/OfferCardNew.module.scss';

interface ICompareLabelProps {
    offer: IOfferWithActionFields;
}

const CompareCheckbox: FC<ICompareLabelProps> = ({ offer }) => {
    const { addToDataLayer, pageName, isCompareDealsEnabledOnSearchResultsPage, isSearchResultsPage } = useStore(
        (stores: TStores) => ({
            addToDataLayer: stores.trackingStore.addToDataLayer,
            pageName: stores.trackingStore.pageName,
            isCompareDealsEnabledOnSearchResultsPage: stores.layoutStore.isCompareDealsEnabledOnSearchResultsPage,
            isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        }),
    );

    const {
        activateCompareMode,
        updateComparisonList,
        isCompareModeEnabled,
        isOfferSelectedToCompare,
        compareDealsFields,
        hasMaxItemsToCompare,
    } = useCompareStore() || {};

    const isCompareDealsDisabledOnSearchResultsPage = !isCompareDealsEnabledOnSearchResultsPage && isSearchResultsPage;

    if (isCompareDealsDisabledOnSearchResultsPage || !isSearchResultsPage) {
        return null;
    }

    const isOfferInComparisonList = isOfferSelectedToCompare?.(offer);

    const onCompareClick = (): void => {
        if (!isCompareModeEnabled) {
            activateCompareMode();
        }

        updateComparisonList(offer);

        addToDataLayer({
            event: isOfferInComparisonList ? EventTypes.CompareRemoved : EventTypes.CompareAdded,
            dimension13: getTimestamp(),
            dimension136: `${pageName}`,
            products: [createProduct(offer)],
        });
    };

    return (
        <Checkbox
            large
            tick
            textLeft
            textBold
            checked={isOfferInComparisonList}
            onChange={onCompareClick}
            className={styles.compareLabel}
            disabled={hasMaxItemsToCompare && !isOfferInComparisonList}
            label={compareDealsFields?.CompareLabel?.value}
            rightAlign
            ariaLabel={offer?.hotel?.name}
            dataTid='compare-checkbox'
        />
    );
};

export default observer(CompareCheckbox);
