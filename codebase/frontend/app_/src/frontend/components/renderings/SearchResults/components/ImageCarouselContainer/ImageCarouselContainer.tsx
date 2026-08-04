import React, { FC, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useCarouselTracking from 'frontend/hooks/useCarouselTracking/useCarouselTracking';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDiscount, getDiscountPerPerson } from 'frontend/utils/discount.utils';
import { incrementByCondition } from 'frontend/utils/numbers';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LikeBadge from 'frontend/components/common/LikeBadge';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import Pill from 'frontend/components/common/Pills/Pill/Pill';
import PromoBadge from 'frontend/components/common/PromoBadge';

import { getIsSuperDealShownStatus, getVideoData } from './ImageCarouselContainer.utils';

import styles from './ImageCarouselContainer.module.scss';

export interface IImageCarouselContainerProps {
    fallbackImage: string;
    offer: IOffer;
    isFullScreenEnabled?: boolean;
}

const ImageCarouselContainer: FC<IImageCarouselContainerProps> = ({
    offer,
    fallbackImage,
    isFullScreenEnabled = false,
}) => {
    const {
        getPhrase,
        isPromoPage,
        isSearchResultsPage,
        layout,
        isApplySpecialFilter,
        pageName,
        isPillVisible,
        isWeLovePillEnabled,
        currency,
        formatMoney,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isPromoPage: stores.layoutStore.isPromoPage,
        layout: stores.layoutStore.layout,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        isApplySpecialFilter: stores.layoutStore.isApplySpecialFilter,
        pageName: stores.layoutStore.pageName,
        isPillVisible: stores.layoutStore.isPillVisible,
        isWeLovePillEnabled: stores.layoutStore.isWeLovePillEnabled,
        currency: stores.marketStore.currency,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPerson);

    const [showPills, setShowPills] = useState(true);

    const { youtubeId, cloudinaryVideoSrc, videoPlaceholder } = getVideoData({
        isPromoPage,
        isSearchResultsPage,
        layout,
        offer,
    });
    const videoId = youtubeId || cloudinaryVideoSrc;
    const numberOfCarouselItems = incrementByCondition(offer?.hotel?.images?.length ?? 0, !!videoId);
    const isSuperDealShown =
        showPills &&
        getIsSuperDealShownStatus({
            isPromoPage,
            isPillVisible,
            isApplySpecialFilter,
            offer,
            pageName,
        });

    const {
        swipeHandlers,
        handleSlide,
        trackThumbnailClick,
        onCarouselSync,
        trackFullScreenClose,
        trackFullScreenOpen,
    } = useCarouselTracking({
        isVideo: !!videoId,
        numberOfItems: numberOfCarouselItems,
        hotelName: offer?.hotel?.name,
    });

    const { isSponsored, hotel, accom, promotion } = offer;

    const cardDescription = ((): string | undefined => {
        let description = offer.promotion?.cardDescription;

        if (!description) return description;

        if (promotion?.discountAmountPerBooking || promotion?.percentageDiscountPerBooking) {
            description = Tokenizer.replaceToken(
                description,
                Tokens.Discount,
                getDiscount(promotion, currency, formatMoney),
            );
        }

        if (promotion?.discountAmountPerPerson || promotion?.discountPercentagePerPerson) {
            description = Tokenizer.replaceToken(
                description,
                Tokens.DiscountPerPerson,
                getDiscountPerPerson(promotion, currency, formatMoney, labelBeforePrice, labelAfterPrice),
            );
        }

        return description;
    })();

    return (
        <div className='img-carousel-container' data-tid='hotel-card-images'>
            <OfferCardSlider
                images={hotel?.images}
                fallbackImage={fallbackImage}
                offer={offer}
                showIndex
                isFullScreenEnabled={isFullScreenEnabled}
                setShowPills={setShowPills}
                youtubeVideoId={youtubeId}
                cloudinaryVideoSrc={cloudinaryVideoSrc}
                videoPlaceholder={videoPlaceholder}
                trackingHandlers={{
                    trackFullScreenClose,
                    trackFullScreenOpen,
                    trackThumbnailClick,
                    swipeHandlers,
                    handleSlide,
                    onCarouselSync,
                }}
            />
            {showPills && (
                <>
                    {isSuperDealShown && (
                        <div className='hotel-super-deal' data-tid='hotel-super-deal'>
                            <span>{getPhrase(SitecoreDictionary.SearchResultsLabelsSuperDeal)}</span>
                        </div>
                    )}

                    {!accom.isExt && !isSponsored && isWeLovePillEnabled && (
                        <LikeBadge text={getPhrase(SitecoreDictionary.SearchResultsLabelsWeLove)} />
                    )}

                    <div className='hotel-card-img__pills'>
                        {isSponsored && (
                            <Pill
                                ellipsis
                                contentClass={classNames(styles.sponsorPill, styles.priority)}
                                title={getPhrase(SitecoreDictionary.SearchResultsLabelsSponsoredTitle)}
                                text={getPhrase(SitecoreDictionary.SearchResultsLabelsSponsoredDescription)}
                            />
                        )}
                    </div>

                    <PromoBadge text={cardDescription} />
                </>
            )}
        </div>
    );
};

export default observer(ImageCarouselContainer);
