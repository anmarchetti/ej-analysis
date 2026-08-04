import React, { FC, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getActualPrice } from 'frontend/utils/livePrice.utils';
import { isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import Link from 'frontend/components/common/Link';
import OfferCardPriceItem from 'frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPriceItem';

import styles from './CarouselOfferCard.module.scss';

export interface ICarouselOfferPriceProps {
    link: string;
    offer: IOffer;

    onClickViewHoliday: (e: React.MouseEvent) => void;
    isPricesHidden?: boolean;
    isRecommendedCarousel?: boolean;
    livePrice?: Nullable<ILivePrice>;
    openLinkInNewTab?: string | boolean;
}

export const CarouselOfferPrice: FC<ICarouselOfferPriceProps> = ({
    link,
    offer,
    openLinkInNewTab,
    livePrice,
    onClickViewHoliday,
    isRecommendedCarousel,
    isPricesHidden,
}) => {
    const { getPhrase, isShortlistPage, setNeedOpenWhenField, isSmartSeerCarouselCTANoFollowLinkEnabled } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isShortlistPage: stores.layoutStore.isShortlistPage,
            setNeedOpenWhenField: stores.searchStore.setNeedOpenWhenField,
            isSmartSeerCarouselCTANoFollowLinkEnabled: stores.layoutStore.isSmartSeerCarouselCTANoFollowLinkEnabled,
        }),
    );

    const viewHolidayButtonLabel = useMemo(() => {
        if (isShortlistPage) {
            return getPhrase(
                isShortlistOfferUnavailable(offer)
                    ? SitecoreDictionary.ShortlistButtonsCheckAvailability
                    : SitecoreDictionary.ShortlistButtonsViewHoliday,
            );
        }

        return getPhrase(SitecoreDictionary.SearchResultsButtonsViewHoliday);
    }, [isShortlistPage, offer, getPhrase]);

    const isPriceVisible = useMemo(
        () => !isPricesHidden && (!(isShortlistPage && isShortlistOfferUnavailable(offer)) || !!livePrice),
        [isPricesHidden, isShortlistPage, offer, livePrice],
    );

    const isOfferExpired = useMemo(
        () => isShortlistPage && isShortlistOfferUnavailable(offer) && !livePrice,
        [isShortlistPage, offer, livePrice],
    );

    const { price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax } = getActualPrice(livePrice, offer);

    const onSelectHoliday = useCallback(
        (e: React.MouseEvent) => {
            if (!isPriceVisible) {
                setNeedOpenWhenField(true);
            }

            onClickViewHoliday(e);
        },
        [isPriceVisible, onClickViewHoliday, setNeedOpenWhenField],
    );

    const enableNoFollow = isSmartSeerCarouselCTANoFollowLinkEnabled && isRecommendedCarousel;

    return (
        <>
            {isPriceVisible && (
                <OfferCardPriceItem
                    className={styles.price}
                    wrapperClassName={styles.offerCardPriceWrapper}
                    price={price}
                    pricePP={pricePP}
                    priceExcludingTouristTax={priceExcludingTouristTax}
                    pricePPExcludingTouristTax={pricePPExcludingTouristTax}
                    priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                    currency={offer.currency?.code}
                    isPricePP
                    taxTooltipTriggerClassName={styles.taxTooltipTrigger}
                    {...getTouristTaxFieldsFromOffer(offer)}
                />
            )}

            <div
                className={classNames(styles.viewButton, { [styles.priceHidden]: !isPriceVisible })}
                data-tid='view-holiday-button'
            >
                {isOfferExpired && (
                    <ErrorMessage
                        IfIsNotificationOrange
                        description={getPhrase(SitecoreDictionary.ShortlistErrorsPickNewDates)}
                        message={getPhrase(SitecoreDictionary.ShortlistErrorsHolidayExpired)}
                        errorMessageClass='pick-new-dates__message'
                    />
                )}

                <Link href={link} legacyBehavior>
                    <a
                        onClick={onSelectHoliday}
                        className='btn btn--large btn--wide'
                        rel={enableNoFollow ? 'nofollow' : undefined}
                        target={openLinkInNewTab ? '_blank' : '_self'}
                        data-tid='view-holiday-link'
                    >
                        {viewHolidayButtonLabel}
                    </a>
                </Link>
            </div>
        </>
    );
};

export default observer(CarouselOfferPrice);
