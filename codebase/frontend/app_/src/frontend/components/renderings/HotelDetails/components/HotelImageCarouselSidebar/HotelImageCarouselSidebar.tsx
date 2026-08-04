import React, { FC, useEffect, useMemo } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getFreeNightsIncludedInOffer } from 'frontend/utils/freeNights.utils';
import { distanceInfo, distanceTextFromSitecore } from 'frontend/utils/getHotelLocation';
import { isDefined } from 'frontend/utils/object.utils';
import {
    getIsShowGreatDealPill,
    getPricePill,
    getTotalDiscount,
    isFreeForKids,
    isPricePPShown,
} from 'frontend/utils/offer.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import Button from 'frontend/components/common/Button';
import KeySellingBulletPoint from 'frontend/components/common/KeySellingBulletPoint/KeySellingBulletPoint';
import PackageIcons from 'frontend/components/common/PackageIcons/PackageIcons';
import DiscountedBoardPill from 'frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPill';
import DiscountPercentagePill from 'frontend/components/common/Pills/DiscountPercentagePill/DiscountPercentagePill';
import FreeBoardUpgradePill from 'frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill';
import FreeForKidsPill from 'frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill';
import FreeNightsIncludedPill from 'frontend/components/common/Pills/FreeNightsIncludedPill/FreeNightsIncludedPill';
import GreatDealPill from 'frontend/components/common/Pills/GreatDealPill/GreatDealPill';
import HotelDiscountPill from 'frontend/components/common/Pills/HotelDiscountPill/HotelDiscountPill';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import StartBookingButton from 'frontend/components/common/StartBookingButton';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import { TouristTaxPriceLabel } from 'frontend/components/common/TouristTaxPriceLabel/TouristTaxPriceLabel';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import HotelImageCarouselSidebarHead from 'frontend/components/renderings/HotelDetails/components/HotelImageCarouselSidebarHead';
import useIsLuxuryStatus from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarousel.utils';
import HotelDeposit from 'frontend/components/renderings/SearchResults/components/HotelDeposit';
import ShortlistManaging from 'frontend/components/renderings/SearchResults/components/ShortlistManaging';

import styles from './HotelImageCarouselSidebar.module.scss';

export interface IHotelImageSideBarParams {
    reviewsAnchor: string;
}

export interface IHotelImageCarouselSidebarProps {
    hotelInfo: Nullable<IHotel>;
    offer: Nullable<IOffer>;
    rendering: any;
    reviewsAnchor: string;
    accommodationCodes?: string[];
    duration?: number;
    isPreview?: boolean;
    selectedSeatsPrice?: number;
    selectedSeatsPricePP?: number;
}

const HotelImageCarouselSidebar: FC<IHotelImageCarouselSidebarProps> = ({
    hotelInfo,
    offer,
    rendering,
    reviewsAnchor,
    accommodationCodes,
    isPreview,
    selectedSeatsPrice,
    selectedSeatsPricePP,
    duration,
}) => {
    const {
        getPhrase,
        getSetting,
        validateSearchParameters,
        redirectToSearchResultsPage,
        setSelectedOfferIndex,
        isEditMode,
        isMaintenance,
        grabSearchValuesFromSearchStoreWithoutDestination,
        tooltipSettings,
        isPriceVisible,
        formatMoney,
        buildSearchQueryWithParams,
        extraLuggagePriceTotal,
        extraLuggagePricePP,
        addExtrasToPrice,
        getFormattedNumber,
        isHotelPreview,
        isHotelDetailsBrowsePage,
        isHotelDetailsBrowseStateLivePriceEnabled,
        grabSearchValuesFromSearchStore,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        validateSearchParameters: stores.searchStore.validateSearchParameters,
        redirectToSearchResultsPage: stores.routerStore.redirectToSearchResultsPage,
        setSelectedOfferIndex: stores.searchStore.setSelectedOfferIndex,
        isEditMode: stores.layoutStore.isEditMode,
        isMaintenance: stores.layoutStore.isMaintenance,
        grabSearchValuesFromSearchStoreWithoutDestination:
            stores.bookingStore.grabSearchValuesFromSearchStoreWithoutDestination,
        grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
        tooltipSettings: stores.layoutStore.tooltipSettings,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        formatMoney: stores.marketStore.formatMoney,
        buildSearchQueryWithParams: stores.queryParamStore.buildSearchQueryWithParams,
        extraLuggagePriceTotal: stores.bookingStore.extraLuggage.extraLuggagePriceTotal,
        extraLuggagePricePP: stores.bookingStore.extraLuggage.extraLuggagePricePP,
        addExtrasToPrice: stores.bookingStore.addExtrasToPrice,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
        isHotelPreview: stores.layoutStore.isHotelDetailsBrowsePagePreview,
        isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
        isHotelDetailsBrowseStateLivePriceEnabled: stores.layoutStore.isHotelDetailsBrowseStateLivePriceEnabled,
    }));

    useEffect(() => {
        setTimeout(() => {
            scrollTo(0, -1);
        }, 0);
    }, []);

    const discount = useMemo(() => !!offer && getTotalDiscount(offer), [offer]);
    const isShowGreatDealPill = useMemo(() => getIsShowGreatDealPill(offer), [offer]);
    const isShowFreeForKidsPill = useMemo(() => !!offer && isFreeForKids(offer), [offer]);
    const freeNightsIncludedToOffer = useMemo(() => getFreeNightsIncludedInOffer(offer), [offer]);
    const isDiscountedBoardPill = !!offer?.hasDiscountedBoardUpgrade && !offer?.hasFreeBoardUpdate;

    const hotelTheme = isPreview ? hotelInfo?.theme : offer?.accom?.theme;

    const distanceText = useMemo(
        () =>
            hotelTheme && hotelInfo?.closestFacility
                ? distanceInfo(
                      hotelInfo.closestFacility,
                      distanceTextFromSitecore(hotelInfo.closestFacility, getPhrase, hotelTheme),
                      isEditMode,
                      getFormattedNumber,
                  )
                : '',
        [hotelTheme, hotelInfo, isEditMode, getFormattedNumber, getPhrase],
    );

    const priceTooltip = useMemo(() => {
        const tooltipMessage = getPricePill(tooltipSettings, offer);

        return tooltipMessage ? (
            <Tooltip>
                <TooltipTrigger className={styles.tooltipTrigger} />
                <TooltipContent>
                    <div>{tooltipMessage}</div>
                </TooltipContent>
            </Tooltip>
        ) : undefined;
    }, [offer, tooltipSettings]);

    const isLuxury = useIsLuxuryStatus(offer?.promoCollections);

    if (!offer) {
        return null;
    }

    const currency = offer.currency?.code;
    const countryCode = offer.hotel ? offer.hotel.country?.code : '';

    const offerPriceToShow =
        offer.priceExcludingTouristTax + Math.ceil(selectedSeatsPrice ?? 0) + Math.ceil(extraLuggagePriceTotal);
    const offerPricePPToShow =
        offer.pricePPExcludingTouristTax + (selectedSeatsPricePP ?? 0) + Math.ceil(extraLuggagePricePP);
    const pricePPDefined = isPricePPShown(offer);
    const isCTAShown = !((isPreview && isMaintenance) || isHotelPreview);
    const isPriceShown = isPriceVisible && !isHotelPreview;

    const isLivePriceEnabledInBrowsePage = isHotelDetailsBrowsePage && isHotelDetailsBrowseStateLivePriceEnabled;
    const { touristTax, touristTaxPP, taxesAndFees } = getTouristTaxFieldsFromOffer(offer);

    const onSubmitSearchParameters = (): void => {
        const isValidated = validateSearchParameters();

        if (!isValidated) {
            let query = {};

            if (isPreview && accommodationCodes?.length) {
                query = {
                    [QueryParamName.SearchAccommodationId]: accommodationCodes.join(','),
                    [QueryParamName.Destination]: accommodationCodes.join(','),
                };
            }

            // update values for start search
            grabSearchValuesFromSearchStoreWithoutDestination();

            // Update search values for booking store
            grabSearchValuesFromSearchStore();

            setSelectedOfferIndex(-1);
            redirectToSearchResultsPage(buildSearchQueryWithParams(true, query));
        }
    };

    return (
        <div
            className={classNames('hotel-main-sidebar', { [styles.hotelPreviewSidebar]: isHotelPreview })}
            data-tid='hotel-main-sidebar'
        >
            <div className='card__box card__grey-box'>
                <HotelImageCarouselSidebarHead
                    offer={offer}
                    rendering={rendering}
                    hotelInfo={hotelInfo}
                    reviewsAnchor={reviewsAnchor}
                />
            </div>
            <div
                className={classNames('card__box card__box-content', {
                    [styles.kspBoxPreview]: isHotelPreview,
                })}
            >
                {hotelTheme?.packageIcons?.length && (
                    <PackageIcons
                        rendering={rendering}
                        packageIcons={hotelTheme.packageIcons}
                        transfer={offer?.transfers?.length ? offer.transfers[0] : null}
                        extraLuggage={offer?.extraLuggageInfo}
                        isLuxury={isLuxury}
                    />
                )}
                <div
                    className={classNames('hotel-card__ksps-list', {
                        [styles.kspListPreview]: isHotelPreview,
                    })}
                >
                    <ul className='list list--bullet'>
                        {hotelInfo && <KeySellingBulletPoint ksp={hotelInfo.ksp1} />}
                        {hotelInfo && <KeySellingBulletPoint ksp={hotelInfo.ksp2} />}

                        {hotelInfo?.closestFacility && isDefined(hotelInfo.closestFacility.distance) && (
                            <li data-tid='closest-facility-bullet-item'>{distanceText}</li>
                        )}
                    </ul>
                </div>
            </div>
            {(isCTAShown || isPriceShown) && (
                <div className='card__box'>
                    {isPriceShown && (
                        <div className={classNames(styles.hotelPrice, 'hotel-price')}>
                            {!isPreview && (
                                <div className='hotel-price__pills'>
                                    {isShowFreeForKidsPill && (
                                        <FreeForKidsPill
                                            countryCode={countryCode}
                                            tooltipMessage={getPhrase(
                                                SitecoreDictionary.HolidayCardPromotionPillTooltipsFreeForKids,
                                            )}
                                        />
                                    )}
                                    {!!offer.deposit && offer.deposit > 0 && (
                                        <HotelDeposit
                                            countryCode={countryCode}
                                            offer={offer}
                                            tooltipMessage={getPhrase(
                                                pricePPDefined
                                                    ? SitecoreDictionary.HolidayCardPromotionPillTooltipsHotelDeposit
                                                    : SitecoreDictionary.HolidayCardPromotionPillTooltipsHotelDepositOneGuest,
                                            )}
                                        />
                                    )}
                                    {!!discount && (
                                        <HotelDiscountPill
                                            amount={discount}
                                            countryCode={countryCode}
                                            currency={currency}
                                            tooltipMessage={getPhrase(
                                                SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount,
                                            )}
                                        />
                                    )}

                                    <DiscountPercentagePill
                                        discountPercentage={offer?.discountPercentage}
                                        icon={<IconInfoCircle />}
                                        pillSize={PillSizeVariants.Big}
                                    />

                                    <FreeNightsIncludedPill nights={freeNightsIncludedToOffer} />
                                    {isShowGreatDealPill && <GreatDealPill />}
                                    <FreeBoardUpgradePill
                                        pillSize={PillSizeVariants.Big}
                                        isFreeBoardUpgrade={!!offer?.hasFreeBoardUpdate}
                                    />
                                    {isDiscountedBoardPill && <DiscountedBoardPill large />}
                                </div>
                            )}
                            {isPreview && isShowGreatDealPill && (
                                <div className='hotel-price__pills'>
                                    <GreatDealPill />
                                </div>
                            )}
                            <div
                                data-tid='hotel-price-placeholder'
                                className={classNames(styles.priceWrapper, {
                                    [styles.hotelPricePlaceholder]: isLivePriceEnabledInBrowsePage,
                                })}
                            >
                                {offer.price > 0 && (
                                    <div className='hotel-price__main'>
                                        <PriceLabel
                                            dataTid='price-total'
                                            className='price-big total'
                                            tag='div'
                                            priceDictionary={
                                                pricePPDefined ? undefined : SitecoreDictionary.GlobalsPriceLabelsFrom
                                            }
                                            price={formatMoney(offerPriceToShow, {
                                                currency,
                                                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                            })}
                                            tooltip={pricePPDefined ? undefined : priceTooltip}
                                        />

                                        {pricePPDefined && (
                                            <PriceLabel
                                                dataTid='price-pp'
                                                className='price-big subprice'
                                                tag='div'
                                                priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                                                price={formatMoney(offerPricePPToShow, {
                                                    currency,
                                                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                                })}
                                                tooltip={priceTooltip}
                                                numberOfNights={duration}
                                            />
                                        )}
                                    </div>
                                )}

                                <div className={styles.touristTaxWrapper}>
                                    <TouristTaxPriceTooltip
                                        touristTax={touristTax}
                                        taxesAndFees={taxesAndFees}
                                        text={
                                            isHotelDetailsBrowsePage
                                                ? getPhrase(SitecoreDictionary.TouristTaxTooltipsGenericContent)
                                                : undefined
                                        }
                                    >
                                        {isHotelDetailsBrowsePage && offer.price > 0 && (
                                            <span
                                                data-tid='browse-page-tourist-tax-label'
                                                className={styles.browseTaxLabel}
                                            >
                                                {getPhrase(SitecoreDictionary.TouristTaxLabelsPriceIncludesTax)}
                                            </span>
                                        )}

                                        {!isHotelDetailsBrowsePage && (
                                            <TouristTaxPriceLabel
                                                touristTax={touristTax}
                                                touristTaxPP={touristTaxPP}
                                                isPricePP={false}
                                                price={addExtrasToPrice(offer.price)}
                                                pricePP={offer.pricePP}
                                            />
                                        )}
                                    </TouristTaxPriceTooltip>
                                </div>
                            </div>
                        </div>
                    )}

                    {!(isPreview && isMaintenance) && (
                        <div>
                            <StartBookingButton
                                render={onClick => (
                                    <Button
                                        id='book-button-sidebar'
                                        isLarge
                                        isFullWidth
                                        onClick={isPreview ? onSubmitSearchParameters : onClick}
                                        isBlackColor={isLuxury}
                                        className={styles.submitButton}
                                    >
                                        {isPreview
                                            ? getPhrase(SitecoreDictionary.HotelDetailsButtonsCheckAvailability)
                                            : getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                                    </Button>
                                )}
                            />
                            {getSetting(SiteSettings.ShowPriceGraph) && (
                                <Placeholder name={PlaceholderNames.PriceGraph} rendering={rendering} />
                            )}
                        </div>
                    )}
                </div>
            )}
            <ShortlistManaging />
        </div>
    );
};

export default observer(HotelImageCarouselSidebar);
