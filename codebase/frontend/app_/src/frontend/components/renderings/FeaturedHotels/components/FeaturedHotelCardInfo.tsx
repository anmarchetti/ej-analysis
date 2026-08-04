import React, { FC, useRef } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getDiscount, getDiscountPerPerson } from 'frontend/utils/discount.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IFeaturedHotelsWithPrice } from 'models/data/IFeaturedHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PromoBadge from 'frontend/components/common/PromoBadge';
import { StarRating } from 'frontend/components/common/StarRating';
import LivePrice from 'frontend/components/renderings/LivePrice/LivePrice';

export interface IFeaturedHotelCardInfoProps {
    hasLivePrice: Nullable<boolean>;
    hotel: IFeaturedHotelsWithPrice;
    displayNumberOfNights?: boolean;
    infoBlockHeight?: number;
}

const FeaturedHotelCardInfo: FC<IFeaturedHotelCardInfoProps> = props => {
    const { hotel, displayNumberOfNights, hasLivePrice } = props;
    const component = useRef<HTMLDivElement>();
    const { getPhrase, currency, formatMoney, isPricesHidden } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        currency: stores.marketStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        isPricesHidden: isTradeStore(stores) && stores.layoutStore.isPricesHidden,
    }));

    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPerson);

    if (!hotel) {
        return null;
    }

    const numberOfNights = hotel.livePrice?.searchCriteria?.duration;

    const numberOfNightsLabel =
        displayNumberOfNights &&
        numberOfNights &&
        Tokenizer.replaceToken(
            getPhrase(
                numberOfNights > 1
                    ? SitecoreDictionary.GlobalsLabelsNumberOfNights
                    : SitecoreDictionary.GlobalsLabelsNumberOfNight,
            ),
            Tokens.Count,
            numberOfNights.toString(),
        );

    const isHotelPriceShown = hotel.livePrice && hotel.isPriceValid;

    const renderBookFrom = (
        <div className='featured-hotel-card__book-from-title'>
            {(!!numberOfNightsLabel || !!hotel.BookFromTitle) && (
                <span className='text' data-tid='number-of-nights'>
                    {numberOfNightsLabel}
                    <span className='from'>{getPhrase(SitecoreDictionary.GlobalsLabelsFrom).toLowerCase()}</span>
                    {!!numberOfNightsLabel && !!hotel.BookFromTitle ? ' ' : ''}
                    {hotel.BookFromTitle}
                </span>
            )}
            {hasLivePrice && !isPricesHidden && !displayNumberOfNights && (
                <div data-tid='from-label' className='text'>
                    <span className='from'>{getPhrase(SitecoreDictionary.GlobalsLabelsFrom).toLowerCase()}</span>
                </div>
            )}
        </div>
    );

    const cardDescription = ((): string | undefined => {
        let description = hotel.livePrice?.promotion?.cardDescription;

        if (!description) return description;

        if (
            hotel.livePrice?.promotion?.discountAmountPerBooking ||
            hotel.livePrice?.promotion?.percentageDiscountPerBooking
        ) {
            description = Tokenizer.replaceToken(
                description,
                Tokens.Discount,
                getDiscount(hotel.livePrice.promotion, currency, formatMoney),
            );
        }

        if (
            hotel.livePrice?.promotion?.discountAmountPerPerson ||
            hotel.livePrice?.promotion?.discountPercentagePerPerson
        ) {
            description = Tokenizer.replaceToken(
                description,
                Tokens.DiscountPerPerson,
                getDiscountPerPerson(
                    hotel.livePrice.promotion,
                    currency,
                    formatMoney,
                    labelBeforePrice,
                    labelAfterPrice,
                ),
            );
        }

        return description;
    })();

    return (
        <div
            className='featured-hotel-card__info'
            ref={component as any}
            style={{ minHeight: `${props.infoBlockHeight}px` }}
        >
            {!!cardDescription && (
                <div className='featured-hotel-card__promotion'>
                    <PromoBadge text={cardDescription} />
                </div>
            )}
            {!!hotel.Name && (
                <h3 className='featured-hotel-card__title' data-tid='title'>
                    {hotel.Name}
                </h3>
            )}
            <div className='featured-hotel-card__details'>
                <div className='featured-hotel-card__destination-wrapper'>
                    {hotel.StarRating && <StarRating rating={parseFloat(hotel.StarRating)} />}
                    {hotel.Region && hotel.Country && (
                        <span className='featured-hotel-card__destination' data-tid='destination'>
                            {hotel.Region}, {hotel.Country}
                        </span>
                    )}
                </div>
                {isHotelPriceShown && (
                    <div>
                        {renderBookFrom}
                        {hasLivePrice && !isPricesHidden && <LivePrice livePrice={hotel.livePrice} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default observer(FeaturedHotelCardInfo);
