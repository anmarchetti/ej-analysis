import React, { FC, useMemo } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getActualPrice } from 'frontend/utils/livePrice.utils';
import { isShortlistOfferUnavailable as getIsShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Checkbox from 'frontend/components/common/Checkbox';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import OfferPriceButton from 'frontend/components/common/OfferPriceButton/OfferPriceButton';
import { useCompareStore } from 'frontend/components/renderings/CompareDeals/stores/createCompareLocalStore';
import OfferCardPrices from 'frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPrices';
import { IShortlistsSitecoreFields } from 'frontend/components/renderings/Shortlists/interfaces';

import OfferPricePills from './OfferPricePills';

import styles from './OfferPrice.module.scss';

export interface IOfferPriceProps {
    isShortlistHotelType: boolean;
    link: string;
    offer: IOffer;
    onClickViewHoliday: () => void;
    ShortlistFields?: IShortlistsSitecoreFields;
    hidePills?: boolean;
    isLuxury?: boolean;
    livePrice?: Nullable<ILivePrice>;
}

const OfferPrice: FC<IOfferPriceProps> = ({
    offer,
    livePrice,
    link,
    isShortlistHotelType,
    hidePills,
    onClickViewHoliday,
    isLuxury,
    ShortlistFields,
}) => {
    const { getPhrase, isShortlistPage, isPriceVisibleSitecoreSetting, isOfferFromAnotherMarket } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isShortlistPage: stores.layoutStore.isShortlistPage,
            isPriceVisibleSitecoreSetting: isHolidayStore(stores) || stores.layoutStore.isPricesHidden,
            isOfferFromAnotherMarket: isHolidayStore(stores)
                ? stores.shortlistStore.isOfferFromAnotherMarket
                : () => false,
        }),
    );

    const {
        isOfferSelectedToCompare,
        updateComparisonList,
        hasMaxItemsToCompare,
        isCompareModeEnabled,
        compareDealsFields,
    } = useCompareStore() || {};

    const { price } = getActualPrice(livePrice, offer);
    const isShortlistOfferUnavailable = useMemo(() => getIsShortlistOfferUnavailable(offer), [offer]);

    const isPriceVisible = useMemo(
        () =>
            isPriceVisibleSitecoreSetting &&
            !(isShortlistPage && isShortlistOfferUnavailable && (isOfferFromAnotherMarket(offer) || price === 0)),
        // we need to check actualPrice that's used in OfferCardPrices component to avoid displaying 0.
        // it reproduces when we use livePrices from /price endpoint, some offers don't have them.
        // isShortlistOfferUnavailable checks only price that's equal to 0 for all offers from /shortlist api response
        // isOfferFromAnotherMarket is falsy for old items that doesn't have marketCode and language fields
        [
            isPriceVisibleSitecoreSetting,
            isShortlistPage,
            offer,
            isShortlistOfferUnavailable,
            isOfferFromAnotherMarket,
            price,
        ],
    );

    const isCompareModeOnShortlistPage = isShortlistPage && isCompareModeEnabled;
    const isOfferSelectedInShortlistComparison = isOfferSelectedToCompare?.(offer);

    const isCompareShortlistWarningShown = isCompareModeOnShortlistPage && (isShortlistHotelType || !isPriceVisible);
    const isPriceWarningShown = !isCompareModeOnShortlistPage && !isPriceVisible;
    const shouldShowError = isCompareShortlistWarningShown || isPriceWarningShown;

    const getErrorProps = () => {
        if (isCompareShortlistWarningShown) {
            return {
                description: ShortlistFields?.CompareWarningDescription?.value,
                message: ShortlistFields?.CompareWarningTitle?.value,
                dataTid: `compare-warning-message`,
            };
        }

        return {
            description: getPhrase(
                isShortlistHotelType
                    ? SitecoreDictionary.ShortlistErrorsShortlistedHotelPickDates
                    : SitecoreDictionary.ShortlistErrorsPickNewDates,
            ),
            message: getPhrase(
                isShortlistHotelType
                    ? SitecoreDictionary.ShortlistErrorsShortlistedHotelMessage
                    : SitecoreDictionary.ShortlistErrorsHolidayExpired,
            ),
            dataTid: `shortlist-warning-message`,
        };
    };

    return (
        <>
            {isPriceVisible && (
                <div className='hotel-price'>
                    {!hidePills && <OfferPricePills offer={offer} isEcoCertifiedPill />}

                    <OfferCardPrices offer={offer} livePrice={livePrice} />
                </div>
            )}

            {shouldShowError && (
                <ErrorMessage {...getErrorProps()} IfIsNotificationOrange errorMessageClass='pick-new-dates__message' />
            )}

            <div className='hotel-card--view-btn'>
                {!isCompareModeOnShortlistPage && (
                    <OfferPriceButton
                        link={link}
                        offer={offer}
                        onClick={onClickViewHoliday}
                        isLivePrice={!!livePrice}
                        className={isLuxury ? 'btn--black' : undefined}
                    />
                )}

                {isCompareModeOnShortlistPage && (
                    <Checkbox
                        large
                        tick
                        textLeft
                        textBold
                        checked={isOfferSelectedInShortlistComparison}
                        onChange={() => {
                            updateComparisonList({
                                ...offer,
                                livePrice: livePrice || undefined,
                                onClickViewHoliday: onClickViewHoliday,
                                link: link,
                            });
                        }}
                        className={styles.compareLabel}
                        disabled={hasMaxItemsToCompare && !isOfferSelectedInShortlistComparison}
                        label={compareDealsFields?.CompareLabel?.value}
                        rightAlign
                        ariaLabel={offer?.hotel?.name}
                    />
                )}
            </div>
        </>
    );
};

export default observer(OfferPrice);
