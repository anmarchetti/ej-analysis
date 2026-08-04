import { FC, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { cmsUrls } from 'code/endpoints';
import useCarouselTracking from 'frontend/hooks/useCarouselTracking/useCarouselTracking';
import { useLuggageTextFromOfferAndFields } from 'frontend/hooks/useLuggageTextFromOfferAndFields';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { addDays, formatDateL10n, parseDateL10n } from 'frontend/utils/date.utils';
import { getFreeNightsIncludedInOffer } from 'frontend/utils/freeNights.utils';
import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { getLuggageAmount } from 'frontend/utils/luggage.utils';
import { incrementByCondition } from 'frontend/utils/numbers';
import { containsLuxuryPromoCode, getTotalDiscount, isFreeForKids, isPricePPShown } from 'frontend/utils/offer.utils';
import { buildRoomAllocationFromOfferUnitParams } from 'frontend/utils/url.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { ILuggageInformationFields } from 'models/data/IRecommendedHotels';
import { QueryParamName } from 'models/enum/QueryParamName';
import { RecommendedType } from 'models/enum/RecommendedType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import AccordionButton from 'frontend/components/common/AccordionButton';
import HolidayFlightDetails from 'frontend/components/common/HolidayFlightDetails';
import LikeBadge from 'frontend/components/common/LikeBadge';
import Link from 'frontend/components/common/Link';
import LuxuryBadge from 'frontend/components/common/LuxuryBadge/LuxuryBadge';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import DiscountPercentagePill from 'frontend/components/common/Pills/DiscountPercentagePill/DiscountPercentagePill';
import FreeForeKidsPill from 'frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill';
import FreeNightsIncludedPill from 'frontend/components/common/Pills/FreeNightsIncludedPill/FreeNightsIncludedPill';
import HotelDiscountPill from 'frontend/components/common/Pills/HotelDiscountPill/HotelDiscountPill';
import Pill from 'frontend/components/common/Pills/Pill/Pill';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';
import PromoBadge from 'frontend/components/common/PromoBadge';
import StarRating from 'frontend/components/common/StarRating';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';
import ShortlistButton from 'frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton';

import { getCardDescription } from './CarouselOfferCard.utils';
import CarouselOfferPrice from './CarouselOfferPrice';
import HotelDeposit from './HotelDeposit';
import OfferKeySellingPoints from './OfferKeySellingPoints';

import styles from './CarouselOfferCard.module.scss';

const VIDEO_INDEX = 1;

export interface ICarouselOfferCardProps {
    fallbackImage: string;
    offer: IOffer;
    offerIndex: number;
    onSelect: (offer: IOffer, url: string) => void;
    displaySponsoredLabel?: boolean;
    fields?: ILuggageInformationFields;
    isGrid?: boolean;
    isParentOffer?: boolean;
    livePrice?: ILivePrice;
    onImageSliderArrowClick?: () => void;
    openLinkInNewTab?: string | boolean;
    recommendedType?: string;
}

export const CarouselOfferCard: FC<ICarouselOfferCardProps> = ({
    fallbackImage,
    offer,
    offerIndex,
    onSelect,
    displaySponsoredLabel,
    isParentOffer,
    livePrice,
    fields,
    onImageSliderArrowClick,
    openLinkInNewTab,
    recommendedType,
    isGrid,
}) => {
    const {
        buildBD4HotelParams,
        buildHotelDetailsQuery,
        buildQuery,
        clearAncillaries,
        currentPath,
        currency,
        emptyAncillariesParams,
        formatMoney,
        getPhrase,
        hotelDetailsBrowseUrl,
        hotelDetailsUrl,
        hotelsBefore,
        isApplySpecialFilter,
        isPillVisible,
        isPromoPage,
        isWeLovePillEnabled,
        pageName,
        isDiscountPercentagePillEnabled,
        isShortlistEnabled,
        isPricesHidden,
    } = useStore((stores: TStores) => ({
        buildBD4HotelParams: stores.queryParamStore.buildBD4HotelParam,
        buildHotelDetailsQuery: stores.queryParamStore.buildHotelDetailsQuery,
        buildQuery: stores.queryParamStore.buildQuery,
        clearAncillaries: stores.bookingStore.clearAncillaries,
        currentPath: stores.layoutStore.currentPath,
        currency: stores.marketStore.currency,
        emptyAncillariesParams: stores.queryParamStore.emptyAncillariesParams,
        formatMoney: stores.marketStore.formatMoney,
        getPhrase: stores.layoutStore.getPhrase,
        hotelDetailsBrowseUrl: stores.routerStore.hotelDetailsBrowseUrl,
        hotelDetailsUrl: stores.routerStore.hotelDetailsUrl,
        hotelsBefore: (stores.searchStore.page - 1) * (stores.searchStore.take || 0),
        isApplySpecialFilter: stores.layoutStore.isApplySpecialFilter,
        isPillVisible: stores.layoutStore.isPillVisible,
        isPromoPage: stores.layoutStore.isPromoPage,
        isWeLovePillEnabled: stores.layoutStore.isWeLovePillEnabled,
        pageName: stores.layoutStore.pageName,
        isDiscountPercentagePillEnabled: stores.layoutStore.isDiscountPercentagePillEnabled,
        isShortlistEnabled: !isTradeStore(stores) && stores.shortlistStore.isShortlistEnabled,
        isPricesHidden: isTradeStore(stores) && stores.layoutStore.isPricesHidden,
    }));

    const [isExpanded, toggleExpand] = useState(false);
    const [isCalloutHovered, setIsCalloutHovered] = useState<boolean>(false);

    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPerson);

    const youtubeId = offer?.hotel?.youtubeVideoId ?? '';
    const cloudinaryVideoSrc = offer.hotel?.cloudinaryVideoSrc ?? '';
    const videoPlaceholder = (offer?.hotel?.videoPlaceholder && cmsUrls.media(offer.hotel.videoPlaceholder)) ?? '';

    const videoId = youtubeId || cloudinaryVideoSrc;

    const numberOfCarouselItems = incrementByCondition(offer?.hotel?.images?.length ?? 0, !!videoId);

    const { swipeHandlers, handleSlide } = useCarouselTracking({
        isVideo: !!videoId,
        videoIndex: VIDEO_INDEX,
        numberOfItems: numberOfCarouselItems,
        hotelName: offer?.hotel?.name,
        isRecommender: true,
    });

    const handleCalloutHoverState = (isHovered: boolean) => {
        setIsCalloutHovered(isHovered);
    };

    const getBd4AnalyticsParams = () => {
        const position = recommendedType ? offerIndex + 1 : hotelsBefore + offerIndex + 1;

        return buildBD4HotelParams(position, recommendedType ? QueryParamName.EjReco : QueryParamName.EjSort);
    };

    const getHotelLink = (): string => {
        const bd4AnalyticsParams = getBd4AnalyticsParams();

        // Move to hotel browse if it's generic recommended card
        if (recommendedType === RecommendedType.Generic) {
            return hotelDetailsBrowseUrl(offer.hotel, buildQuery(bd4AnalyticsParams));
        }

        const transfer = offer.transfers?.length > 0 ? offer.transfers[0].code : '';
        const startDate = parseDateL10n(offer.date, DATE_FORMATS.query) as Date;
        const endDate = addDays(offer.stay, startDate);

        /** Add offer detail to the url params. */
        const additionalParams = {
            [QueryParamName.Transfer]: transfer,
            [QueryParamName.DefaultTransfer]: transfer,
            [QueryParamName.From]: formatDateL10n(startDate),
            [QueryParamName.To]: formatDateL10n(endDate),
            ...emptyAncillariesParams,
        };

        if (isPromoPage) {
            additionalParams[QueryParamName.Origin] = [offer.transport.routes[0].depPt];
            additionalParams[QueryParamName.Promo] = currentPath || '';
        }

        if (recommendedType === RecommendedType.Browse) {
            additionalParams[QueryParamName.Destination] = offer.hotel?.country.code;
            additionalParams[QueryParamName.Geog] = offer.hotel?.country.code;
            additionalParams[QueryParamName.Origin] = [offer.transport.routes[0].depPt];
            additionalParams[QueryParamName.Rooms] = buildRoomAllocationFromOfferUnitParams(
                offer && offer.accom && offer.accom.unit,
            );
        }

        const query = buildHotelDetailsQuery(offer, { ...additionalParams, ...bd4AnalyticsParams });

        return hotelDetailsUrl(offer.hotel, query) || '';
    };

    const hotelLink = getHotelLink();
    const hotelLinkWithoutQueryParams = hotelDetailsBrowseUrl(offer.hotel);

    const onClickSelect = (e: React.MouseEvent, link: string): void => {
        if (
            e.ctrlKey ||
            e.shiftKey ||
            e.metaKey || // apple
            (e.button && e.button == 1) // middle click, >IE9 + everyone else
        ) {
            return;
        }

        clearAncillaries();
        onSelect(offer, link);
    };

    const isShowSuperDeal = () => {
        /** Does not show supper deals on recommendation card */
        if (recommendedType) {
            return false;
        }

        /**
         * if we on promo page and this page setup in HideSuperDeals sitecore settings
         * we need don't show super deals label
         */
        if (isPromoPage && isApplySpecialFilter(SiteSettings.HideSuperDeals, pageName)) {
            return false;
        }

        /**
         * Show label if offer has distressed flights
         * and offer country isn't listed in sitecore settings with hidden SuperDeals Label
         */
        if (offer.hasDistressedFlights) {
            const countryCode = offer.hotel?.country?.code;

            return !countryCode || isPillVisible(SiteSettings.SuperDealsLabel, countryCode);
        }

        return false;
    };

    const { isSponsored, hotel, accom: { isExt } = {} as any } = offer;
    const [routeDep, routeArr] = offer.transport.routes;

    const starRating = hotel?.starRating ? Number.parseInt(hotel.starRating.substring(-1, 1)) : null;
    const luggageCount = getLuggageAmount(offer);
    const isRecommendedOffer = !!recommendedType;
    const showSponsoredPill = isSponsored && displaySponsoredLabel;

    const isFreeForeKidsPillEnabled = isFreeForKids(offer);
    const isHotelDepositPillEnabled = !isPricesHidden && !!offer.deposit && offer.deposit > 0;
    const isHotelDiscountPillEnabled = !isPricesHidden && !!getTotalDiscount(offer) && getTotalDiscount(offer) > 0;
    const includedFreeNights = getFreeNightsIncludedInOffer(offer);
    const isFreeNightsPillEnabled = !isPricesHidden && !!includedFreeNights;
    const isDiscountPercentageEnabled = offer.discountPercentage && isDiscountPercentagePillEnabled;

    const isAnyPillsEnabled =
        isFreeForeKidsPillEnabled ||
        isHotelDepositPillEnabled ||
        isHotelDiscountPillEnabled ||
        isFreeNightsPillEnabled ||
        isDiscountPercentageEnabled;

    const isLuxury =
        containsLuxuryPromoCode(offer?.promoCollections) ||
        containsLuxuryPromoCode(offer?.hotel?.promoCollections) ||
        containsLuxuryPromoCode(offer?.livePrice?.promoCollections) ||
        containsLuxuryPromoCode(livePrice?.promoCollections);
    const luggageText = useLuggageTextFromOfferAndFields(offer, fields);

    const cardDescription = getCardDescription({
        promotion: offer.promotion,
        currency,
        formatMoney,
        labelBeforePrice,
        labelAfterPrice,
    });

    return (
        <div
            className={classNames(
                styles.card,
                isSponsored && styles.sponsored,
                isGrid && styles.gridCard,
                'carousel-offer-card',
            )}
            data-source={isExt ? 'external' : 'contract'}
            data-tid='hotel-card'
        >
            <div className={classNames(styles.hotelCard, styles.row)}>
                <div className={styles.imageBox}>
                    <div className={'img-carousel-container'} data-tid='hotel-card-images'>
                        {isLuxury && <LuxuryBadge wrapperClassName={styles.luxuryBadgeWrapper} />}

                        <OfferCardSlider
                            images={offer.hotel?.images}
                            fallbackImage={fallbackImage}
                            showIndex
                            onArrowClick={onImageSliderArrowClick}
                            trackingHandlers={{
                                swipeHandlers,
                                handleSlide,
                            }}
                            youtubeVideoId={youtubeId}
                            cloudinaryVideoSrc={cloudinaryVideoSrc}
                            videoPlaceholder={videoPlaceholder}
                            videoIndex={VIDEO_INDEX}
                        />

                        {isShowSuperDeal() && (
                            <div className='hotel-super-deal'>
                                <span>{getPhrase(SitecoreDictionary.SearchResultsLabelsSuperDeal)}</span>
                            </div>
                        )}

                        {!isExt && !isSponsored && isWeLovePillEnabled && (
                            <LikeBadge text={getPhrase(SitecoreDictionary.SearchResultsLabelsWeLove)} />
                        )}

                        <div
                            className={classNames(
                                'hotel-card-img__pills',
                                showSponsoredPill && styles.sponsoredPillsContainer,
                            )}
                        >
                            {showSponsoredPill && (
                                <Pill
                                    ellipsis
                                    contentClass={styles.sponsorPill}
                                    title={getPhrase(SitecoreDictionary.SearchResultsLabelsSponsoredTitle)}
                                    text={getPhrase(SitecoreDictionary.SearchResultsLabelsSponsoredDescription)}
                                    dataTid='sponsored-pill'
                                />
                            )}
                        </div>

                        <PromoBadge text={cardDescription} />
                    </div>
                </div>

                <div className={styles.textBox}>
                    <div className={styles.head}>
                        <div className={styles.headInfo}>
                            {!!hotel?.name && (
                                <h3 className={styles.title}>
                                    <Link href={hotelLinkWithoutQueryParams} legacyBehavior>
                                        <a
                                            onClick={(e): void => onClickSelect(e, hotelLinkWithoutQueryParams)}
                                            data-tid='hotel-link'
                                        >
                                            {hotel.name}
                                        </a>
                                    </Link>
                                </h3>
                            )}
                            {isShortlistEnabled && <ShortlistButton offer={offer} />}
                        </div>

                        {hotel && <div className={classNames(styles.location)}>{getHotelLocation(hotel)}</div>}
                        <div className={classNames(styles.rating)}>
                            <StarRating rating={starRating} />
                            {hotel && !!hotel.numberOfReviews && !!hotel.rating && (
                                <TripadvisorInfo rating={hotel.rating} reviews={hotel.numberOfReviews} />
                            )}
                        </div>
                    </div>

                    {isAnyPillsEnabled && (
                        <div className={styles.pills}>
                            {isFreeForeKidsPillEnabled && (
                                <FreeForeKidsPill
                                    countryCode={offer?.hotel?.country?.code}
                                    tooltipMessage={getPhrase(
                                        SitecoreDictionary.HolidayCardPromotionPillTooltipsFreeForKids,
                                    )}
                                />
                            )}
                            {isHotelDepositPillEnabled && (
                                <HotelDeposit
                                    countryCode={offer?.hotel?.country?.code || ''}
                                    offer={offer}
                                    tooltipMessage={getPhrase(
                                        isPricePPShown(offer)
                                            ? SitecoreDictionary.HolidayCardPromotionPillTooltipsHotelDeposit
                                            : SitecoreDictionary.HolidayCardPromotionPillTooltipsHotelDepositOneGuest,
                                    )}
                                />
                            )}
                            {isHotelDiscountPillEnabled && (
                                <HotelDiscountPill
                                    amount={getTotalDiscount(offer)}
                                    countryCode={offer?.hotel?.country?.code ?? ''}
                                    currency={offer.currency?.code}
                                    tooltipMessage={getPhrase(
                                        SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount,
                                    )}
                                />
                            )}
                            <DiscountPercentagePill
                                discountPercentage={offer.discountPercentage}
                                icon={<IconInfoCircle />}
                                pillSize={PillSizeVariants.Small}
                            />
                            {isFreeNightsPillEnabled && <FreeNightsIncludedPill nights={includedFreeNights} />}
                        </div>
                    )}

                    <div className={styles.details}>
                        <div className={styles.wrapper}>
                            <AccordionButton
                                className={styles.detailsTitle}
                                //The direction of the arrow in the collapsed and expanded states differs from the default arrow direction
                                isExpanded={!isExpanded}
                                buttonContent={getPhrase(SitecoreDictionary.HolidayCardLabelsWhatIsIncluded)}
                                onClick={(): void => toggleExpand(!isExpanded)}
                                ariaLabel={getPhrase(SitecoreDictionary.HolidayCardLabelsWhatIsIncluded)}
                            />

                            <div
                                className={classNames(styles.detailsInfo, {
                                    [styles.isExpanded]: isExpanded,
                                    [styles.disabledOverflow]: isCalloutHovered,
                                })}
                            >
                                {hotel && offer.accom.unit && offer.accom.unit.length > 0 && (
                                    <OfferKeySellingPoints
                                        holidayTheme={offer.accom.theme}
                                        holidayType={offer.accom.type}
                                        closestFacility={hotel.closestFacility}
                                        roomTypes={offer.accom.unit[0].roomType}
                                        boardTypes={offer.accom.unit[0].boardType}
                                        isParentOffer={isParentOffer}
                                        isRecommendedOffer={isRecommendedOffer}
                                        handleCalloutHoverState={handleCalloutHoverState}
                                    />
                                )}

                                <HolidayFlightDetails
                                    night={offer.stay || offer?.accom?.stay}
                                    routeDep={routeDep}
                                    routeArr={routeArr}
                                    luggageCount={luggageCount}
                                    transfer={offer.transfers?.length ? offer.transfers[0] : null}
                                    packageIcons={
                                        offer?.accom?.theme?.packageIcons || offer?.hotel?.theme?.packageIcons
                                    }
                                    isParentOffer={isParentOffer}
                                    isRecommendedOffer={isRecommendedOffer}
                                    offer={offer}
                                    luggageText={luggageText}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.priceBox}>
                        <CarouselOfferPrice
                            livePrice={livePrice}
                            link={hotelLink}
                            onClickViewHoliday={(e): void => onClickSelect(e, hotelLink)}
                            offer={offer}
                            isRecommendedCarousel={isRecommendedOffer}
                            openLinkInNewTab={openLinkInNewTab}
                            isPricesHidden={isPricesHidden}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default observer(CarouselOfferCard);
