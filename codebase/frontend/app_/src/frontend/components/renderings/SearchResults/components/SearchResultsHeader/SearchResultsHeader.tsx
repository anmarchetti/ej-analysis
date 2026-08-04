import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { CalloutOrientation } from 'models/enum/Callout';
import { DataStatus, isLoadedStatus, isLoadingStatus, isNotLoadedStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import OffersPriceViewToggle from 'frontend/components/common/OffersPriceViewToggle';
import OffersSort from 'frontend/components/renderings/SearchResults/components/OffersSort/OffersSort';

export interface ISearchResultsHeaderProps {
    hasOffers: boolean;
    status: DataStatus;
    totalOffers: number;
}

const SearchResultsHeader = ({ hasOffers, totalOffers, status }: ISearchResultsHeaderProps) => {
    const { getFormattedNumber, getPhrase, isScreenLessMedium } = useStore((stores: TStores) => ({
        getFormattedNumber: stores.marketStore.getFormattedNumber,
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
    }));

    const noOffers = isLoadedStatus(status) && !hasOffers;

    if (isNotLoadedStatus(status) || noOffers) {
        return null;
    }

    if (isLoadingStatus(status)) {
        return (
            <div className='hotel-search-results-header' data-tid='search-results-loading-skeleton-header'>
                <div
                    className='placeholder-search-header-item placeholder-shimmer'
                    data-tid='search-results-loading-skeleton-header-item'
                />
                <div
                    className='placeholder-search-header-item placeholder-shimmer'
                    data-tid='search-results-loading-skeleton-header-sort-item'
                />
            </div>
        );
    }

    const formattedTotalOffers = getFormattedNumber(totalOffers);

    return (
        <div className='hotel-search-results-header' data-tid='hotel-search-results-header'>
            <div className='results-count'>
                <p>
                    {`${formattedTotalOffers} ${
                        totalOffers > 1
                            ? getPhrase(SitecoreDictionary.SearchResultsLabelsResultHolidaysPlural)
                            : getPhrase(SitecoreDictionary.SearchResultsLabelsResultHolidaySingular)
                    }`}
                </p>
            </div>
            <div className='results-details'>
                <OffersPriceViewToggle />
                {!isScreenLessMedium && <OffersSort calloutOrientation={CalloutOrientation.Bottom} />}
            </div>
        </div>
    );
};

export default observer(SearchResultsHeader);
