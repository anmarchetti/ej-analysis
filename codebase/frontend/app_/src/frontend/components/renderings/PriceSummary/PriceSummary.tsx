import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import dynamic from 'next/dynamic';

import { ICurrencyFormatOptions } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { logger } from 'frontend/services/logging';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { isBookingFlow } from 'frontend/utils/buildSitecorePath';
import { getFreeNightsIncludedInOffer } from 'frontend/utils/freeNights.utils';
import { getIsShowGreatDealPill, getTotalDiscount, isFreeForKids, isPricePPShown } from 'frontend/utils/offer.utils';
import { getTouristTaxSummaryData } from 'frontend/utils/touristTax.ui.utils';
import { getIsTouristTaxDisplayed, getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FlightPlusHotelDiscountPrice from 'frontend/components/common/FlightPlusHotelDiscountPrice';
import DiscountedBoardPercentagePill from 'frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPercentagePill';
import DiscountPercentagePill from 'frontend/components/common/Pills/DiscountPercentagePill/DiscountPercentagePill';
import FreeBoardUpgradePill from 'frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill';
import FreeForKidsPill from 'frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill';
import FreeNightsIncludedPill from 'frontend/components/common/Pills/FreeNightsIncludedPill/FreeNightsIncludedPill';
import GreatDealPill from 'frontend/components/common/Pills/GreatDealPill/GreatDealPill';
import HotelDiscountPill from 'frontend/components/common/Pills/HotelDiscountPill/HotelDiscountPill';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';
import useOptimizelyExperiment from 'frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment';
import NoSelectedSeatsPopup from 'frontend/components/cro/NoSelectedSeatsPopup/NoSelectedSeatsPopup';
import { experimentConfigs } from 'frontend/components/cro/NoSelectedSeatsPopup/testConfig';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import { IFeesPopupFields } from 'frontend/components/renderings/FeesPopup/FeesPopup';
import { FEES_GENERIC_EVENT_PARAMS } from 'frontend/components/renderings/Payment/components/BookingDetails/BookingDetails';
import {
    createFphData,
    getExtrasFromPriceBreakdown,
    getPriceBreakdown,
} from 'frontend/components/renderings/Payment/Payment.utils';
import { ExportButton } from 'frontend/components/renderings/PriceSummary/components/ExportButton';
import HolidaySummaryContent from 'frontend/components/renderings/PriceSummary/components/HolidaySummaryContent';
import { SubmitButton } from 'frontend/components/renderings/PriceSummary/components/SubmitButton';
import MerchandisedBanner from 'frontend/components/renderings/PromocodeInput/components/MerchandisedBanner/MerchandisedBanner';
import HotelDeposit from 'frontend/components/renderings/SearchResults/components/HotelDeposit';

import { IPriceSummaryRendering } from './data/models';

import styles from './PriceSummary.module.scss';

const DynamicFeesPopupComponent = dynamic(() => import('frontend/components/renderings/FeesPopup/FeesPopup'));

export interface IPriceSummaryFields extends IFeesPopupFields {
    Title: ISitecoreField<string>;
}

export interface IPriceSummaryProps {
    isPrintPreview: boolean;
    fields?: IPriceSummaryFields;
    rendering?: IPriceSummaryRendering;
}

const PriceSummary: FunctionComponent<IPriceSummaryProps> = ({ fields, rendering, isPrintPreview }) => {
    const experimentAB = useOptimizelyExperiment(experimentConfigs);
    const isABTest = experimentAB?.activeVariantId && experimentAB.config?.variantA === experimentAB.activeVariantId;

    const totalCostHighlightExperiment = useExperiment(ExperimentTestIds.SummaryBarTotalCostHighlight);
    const isHolidayPackageCostHighlighted = totalCostHighlightExperiment?.testVariant === ExperimentVariants.VariantB;

    const [isTradeAgentFeePopupShown, setIsTradeAgentFeePopupShown] = useState(false);
    const [isNoSelectedSeatsPopupOpened, setIsNoSelectedSeatsPopupOpened] = useState(false);

    const {
        offer,
        packageInfo,
        totalPrice,
        totalPriceWithTouristTax,
        totalPricePPWithTouristTax,
        isPackageValid,
        specialRequests,
        getPhrase,
        redirectToGuestsDetailsPage,
        trackExtrasSpecialRequests,
        haveOutboundSelectedSeats,
        haveInboundSelectedSeats,
        priceBreakdown,
        tradeAgentPriceBreakdown,
        totalAccomodationDiscount,
        isTradePortal,
        isPriceVisible,
        trackEventWithParams,
        formatMoney,
        booking,
        isEnabledToBookSeats,
        merchandisedPromotion,
        isTouristTaxEnabled,
        isFlightAndHotelPackage,
        flightPlusHotelDiscount,
    } = useStore((stores: TStores) => ({
        offer: stores.bookingStore.selectedOffer,
        packageInfo: stores.bookingStore.packageInfo,
        totalPrice: stores.bookingStore.totalPrice,
        totalPriceWithTouristTax: stores.bookingStore.totalPriceWithTouristTax,
        totalPricePPWithTouristTax: stores.bookingStore.totalPricePPWithTouristTax,
        isPackageValid: stores.bookingStore.isPackageValid,
        specialRequests: stores.queryParamStore.specialRequests,
        getPhrase: stores.layoutStore.getPhrase,
        redirectToGuestsDetailsPage: stores.routerStore.redirectToGuestDetails,
        trackExtrasSpecialRequests: stores.trackingStore.trackExtrasSpecialRequests,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        haveOutboundSelectedSeats: stores.seatMapStore.haveOutboundSelectedSeats,
        haveInboundSelectedSeats: stores.seatMapStore.haveInboundSelectedSeats,
        priceBreakdown: stores.bookingStore.priceBreakdown,
        tradeAgentPriceBreakdown: isTradeStore(stores) ? stores.bookingStore.tradeAgentPriceBreakdown : undefined,
        totalAccomodationDiscount: isTradeStore(stores) ? stores.bookingStore.totalAccomodationDiscount : undefined,
        isTradePortal: stores.layoutStore.isTradePortal,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        formatMoney: stores.marketStore.formatMoney,
        booking: stores.bookingStore.booking,
        isEnabledToBookSeats: stores.seatMapStore.isEnabledToBookSeats,
        merchandisedPromotion: stores.bookingStore.merchandisedPromotion,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        isFlightAndHotelPackage: isHolidayStore(stores) && stores.bookingStore.isFlightAndHotelPackage,
        flightPlusHotelDiscount: stores.bookingStore.flightPlusHotelDiscount,
    }));

    useEffect(() => {
        setTimeout(() => {
            scrollTo(0, -1);
        }, 0);
    }, []);

    const fphData = useMemo(
        () => createFphData(getPhrase, isFlightAndHotelPackage, flightPlusHotelDiscount),
        [getPhrase, isFlightAndHotelPackage, flightPlusHotelDiscount],
    );

    const currencyOptions: ICurrencyFormatOptions = {
        currency: packageInfo?.paymentInfo?.currency,
        maximumFractionDigits: 0,
    };

    const toggleTradeAgentFeePopup = (): void => {
        setIsTradeAgentFeePopupShown(!isTradeAgentFeePopupShown);

        trackEventWithParams(
            EventTypes.GenericEvent,
            FEES_GENERIC_EVENT_PARAMS(isTradeAgentFeePopupShown),
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
    };

    const goNextStep = async (): Promise<void> => {
        const isBookingFlowProcess = isBookingFlow(location.search) && isEnabledToBookSeats;
        const isBookingOutOfSync = !!booking?.seatSelection?.some(flight => !flight.isSeatReservationPossible);
        const isAvailableBookSeats = isBookingFlowProcess && !isBookingOutOfSync;
        const showNoSelectedSeatsPopup =
            isAvailableBookSeats && isABTest && (!haveOutboundSelectedSeats || !haveInboundSelectedSeats);

        if (showNoSelectedSeatsPopup) {
            setIsNoSelectedSeatsPopupOpened(true);

            return;
        }

        await continueBookingFunnel();
    };

    const continueBookingFunnel = async (): Promise<void> => {
        if (offer) {
            logger.info(`Booking session for package ${offer.accom.packageId} was created`);
        }

        redirectToGuestsDetailsPage();

        trackExtrasSpecialRequests(specialRequests);
    };

    const countryCode = offer?.hotel ? offer.hotel.country.code : '';
    const discount = offer && getTotalDiscount(offer);
    const isFreeChildPlaceInOffer = offer && isFreeForKids(offer);
    const kidsGoFree = isFreeChildPlaceInOffer && <FreeForKidsPill key='kidsGoFree' countryCode={countryCode} />;
    const includedFreeNights = getFreeNightsIncludedInOffer(offer);
    const isHideDownloadButton =
        rendering?.placeholders?.[PlaceholderNames.ExportHolidayDetails]?.[0]?.fields?.HideDownloadButton?.value;
    const isExportButtonVisible = !isPrintPreview && !isHideDownloadButton;

    if (!isPackageValid || !packageInfo) {
        return null;
    }

    if (!isPriceVisible) {
        return (
            <div className='holiday-summary' data-tid='holiday-summary'>
                {isExportButtonVisible && <ExportButton rendering={rendering} />}
                <SubmitButton onClick={goNextStep} text={getPhrase(SitecoreDictionary.GlobalsButtonsContinue)} />
            </div>
        );
    }

    const isShowGreatDealPill = getIsShowGreatDealPill(offer);
    const { extraPriceBreakdown } = packageInfo;
    const titleField = fields?.Title || { value: getPhrase(SitecoreDictionary.BookingPaymentLabelsHolidayCost) };

    const merchandisedFields = rendering?.placeholders[PlaceholderNames.PromocodeInput]?.[0]?.fields;
    const shouldShowMerchandisedBanner =
        merchandisedFields && merchandisedPromotion?.title && merchandisedPromotion.displayOnExtrasPage;

    const { touristTax, taxesAndFees } = getTouristTaxFieldsFromOffer(offer);

    const { label: touristTaxLabel, trigger: touristTaxTrigger } = getTouristTaxSummaryData({
        price: touristTax,
    });

    const isTouristTaxDisplayed = getIsTouristTaxDisplayed({ isTouristTaxEnabled, touristTax });
    const boardDiscountPercentage = offer?.accom.unit[0]?.boardDiscountPercentage;

    const priceBreakdownList = getPriceBreakdown(
        undefined,
        extraPriceBreakdown,
        priceBreakdown,
        isTouristTaxDisplayed,
        fphData,
    );

    return (
        <div
            className={classNames('holiday-summary', { [styles.fphSummary]: fphData.isFph })}
            data-tid='holiday-summary'
        >
            <div
                data-tid='holiday-summary-header'
                className={classNames(styles.header, shouldShowMerchandisedBanner && styles.withOutline)}
            >
                <div
                    className={classNames(styles.inputColumn, { [styles.fphInputColumn]: fphData.isFph })}
                    data-tid='price-summary-input-column'
                >
                    <Text field={titleField} tag='h2' className={styles.title} data-tid='price-summary-title' />
                    {!isPrintPreview && rendering && (
                        <Placeholder name={PlaceholderNames.PromocodeInput} rendering={rendering} />
                    )}
                </div>
                {shouldShowMerchandisedBanner && (
                    <MerchandisedBanner className={styles.bannerColumn} fields={merchandisedFields} />
                )}
            </div>
            <div
                className={classNames('holiday-summary_content', {
                    [styles.packageCostHighlightedWrapper]: isHolidayPackageCostHighlighted,
                })}
            >
                {priceBreakdownList
                    ?.slice()
                    .sort((a, b) => b.amount - a.amount)
                    .map((breakdownItem, idx) => (
                        <HolidaySummaryContent
                            breakdownItem={breakdownItem}
                            idx={idx}
                            isLastItem={false}
                            isSubcategory={false}
                            key={breakdownItem.code}
                            isHolidayPackageCostHighlighted={isHolidayPackageCostHighlighted}
                        />
                    ))}

                <FlightPlusHotelDiscountPrice
                    isFph={fphData.isFph}
                    discount={fphData.discount}
                    wrapperClassName={classNames(styles.category, styles.fphDiscount)}
                    priceClassName={styles.price}
                    formattedDiscount={formatMoney(fphData.discount, currencyOptions)}
                />

                {isTouristTaxDisplayed && (
                    <>
                        <div
                            className={classNames(styles.category, styles.packageCost, {
                                [styles.noBorder]: !priceBreakdownList?.length,
                                [styles.includeSpaceOnTop]: !priceBreakdownList?.length,
                                [styles.fphPackageCost]: fphData.isFph,
                            })}
                            data-tid='price-summary-package-cost'
                        >
                            <RichTextDictionary
                                tag='p'
                                dictionaryKey={
                                    fphData.isFph
                                        ? SitecoreDictionary.FlightPlusHotelPricesPackageCost
                                        : SitecoreDictionary.TouristTaxLabelsHolidayPackageCost
                                }
                            />
                            <div className={styles.price}>{formatMoney(totalPrice, currencyOptions)}</div>
                        </div>
                        <div
                            className={classNames(styles.category, styles.localTax)}
                            data-tid='price-summary-local-tax'
                        >
                            {touristTaxLabel}
                            {isPrintPreview ? (
                                <div className={styles.price}>{touristTaxTrigger}</div>
                            ) : (
                                <TouristTaxPriceTooltip touristTax={touristTax} taxesAndFees={taxesAndFees}>
                                    {touristTaxTrigger}
                                </TouristTaxPriceTooltip>
                            )}
                        </div>
                    </>
                )}

                <div className={classNames(styles.category, styles.total)} data-tid='price-summary-total-price'>
                    <span className={styles.description}>
                        {getPhrase(SitecoreDictionary.PriceSummaryLabelsTotalPrice)}
                    </span>
                    <span className={styles.totalPrice} data-tid='total-price' data-cs-mask>
                        {formatMoney(totalPriceWithTouristTax, currencyOptions)}
                    </span>
                </div>
                {isTradePortal && !!fields?.FeesAndTaxesLabel && (
                    <div className={styles.totalFees}>
                        <div className='fees-popup-link no-print' data-tid='fees-popup-link'>
                            <Button isText onClick={toggleTradeAgentFeePopup} data-tid='fees-popup-button'>
                                {fields.FeesAndTaxesLabel.value}
                            </Button>
                        </div>
                    </div>
                )}
                {isTradeAgentFeePopupShown && (
                    <DynamicFeesPopupComponent
                        onClose={toggleTradeAgentFeePopup}
                        paymentInfo={packageInfo.paymentInfo}
                        fields={fields}
                        tradeAgentPriceBreakdown={tradeAgentPriceBreakdown}
                        priceBreakdown={priceBreakdown}
                        totalAccomodationDiscount={totalAccomodationDiscount}
                        extras={getExtrasFromPriceBreakdown(priceBreakdownList)}
                    />
                )}
                {isPricePPShown(offer) && !fphData.isFph && (
                    <div
                        className={classNames(styles.category, styles.pricePP, {
                            [styles.noBorder]: !isHolidayPackageCostHighlighted,
                        })}
                    >
                        <span className={styles.description}>
                            {getPhrase(SitecoreDictionary.PriceSummaryLabelsPricePerPerson)}
                        </span>
                        <span className={styles.price} data-tid='price-pp' data-cs-mask>
                            {formatMoney(totalPricePPWithTouristTax, currencyOptions)}
                        </span>
                    </div>
                )}
                {isExportButtonVisible && <ExportButton rendering={rendering} />}
            </div>
            <div className={classNames(styles.pillsWrapper, 'holiday-summary__pills')}>
                {!!discount && (
                    <HotelDiscountPill
                        amount={discount}
                        countryCode={countryCode}
                        currency={offer?.currency?.code}
                        tooltipMessage={getPhrase(SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount)}
                        className='holiday-summary__price-pill-tooltip'
                    />
                )}
                <DiscountPercentagePill
                    discountPercentage={offer?.discountPercentage}
                    icon={<IconInfoCircle />}
                    pillSize={PillSizeVariants.Regular}
                />
                {offer && !!offer.deposit && offer.deposit > 0 && (
                    <HotelDeposit countryCode={countryCode} offer={offer} />
                )}
                {kidsGoFree}
                {includedFreeNights > 0 && <FreeNightsIncludedPill nights={includedFreeNights} />}
                {isShowGreatDealPill && <GreatDealPill hideTooltip />}
                <FreeBoardUpgradePill
                    isFreeBoardUpgrade={!!offer?.accom.unit.find(element => element?.isFreeBoardUpgrade)}
                    pillSize={PillSizeVariants.Regular}
                />
                <DiscountedBoardPercentagePill medium percent={boardDiscountPercentage} />
            </div>
            <SubmitButton onClick={goNextStep} text={getPhrase(SitecoreDictionary.GlobalsButtonsContinue)} />
            {isABTest && isNoSelectedSeatsPopupOpened && (
                <NoSelectedSeatsPopup
                    onClose={(): void => setIsNoSelectedSeatsPopupOpened(false)}
                    continueBookingFunnel={continueBookingFunnel}
                />
            )}
        </div>
    );
};

export default observer(PriceSummary);
