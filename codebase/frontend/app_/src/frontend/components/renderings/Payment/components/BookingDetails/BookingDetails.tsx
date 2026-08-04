import React, { FC, useMemo, useState } from 'react';
import classNames from 'classnames';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import dynamic from 'next/dynamic';

import { ICurrencyFormatOptions, SignDisplay, TrailingZeroDisplay } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal/create-stores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getFreeNightsIncludedInOffer } from 'frontend/utils/freeNights.utils';
import { getGuestsAmountByType, getRoomTypes, getVisitorsAmount } from 'frontend/utils/luggage.utils';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTouristTaxFieldsFromOffer, getTouristTaxPrice, INVALID_TAX_VALUE } from 'frontend/utils/touristTax.utils';
import { IExtraPriceBreakdown, IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { IEventParams } from 'models/data/tracking/IEventWithParams';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import Button from 'frontend/components/common/Button';
import FlightPlusHotelDiscountPrice from 'frontend/components/common/FlightPlusHotelDiscountPrice';
import FormattedMoney from 'frontend/components/common/FormattedMoney/FormattedMoney';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import FreeNightsIncludedPill from 'frontend/components/common/Pills/FreeNightsIncludedPill/FreeNightsIncludedPill';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';
import BookingDetailsCollapsed from 'frontend/components/renderings/Payment/components/BookingDetailsCollapsed/BookingDetailsCollapsed';
import BookingDetailsExpanded from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/BookingDetailsExpanded';
import { gaClickViewDetailsParams } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import {
    createFphData,
    getExtrasFromPriceBreakdown,
    getPaymentHistory,
    getPriceBreakdown,
} from 'frontend/components/renderings/Payment/Payment.utils';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';
import { ITradePortalConfirmBookingDetailsFields } from 'frontend/components/renderings/TradePortalConfirmBookingDetails/interfaces';

import { IBookingDetailsProps, TBookingDetailsFields } from './interfaces';

import styles from './BookingDetails.module.scss';

const DynamicFeesPopupComponent = dynamic(() => import('frontend/components/renderings/FeesPopup/FeesPopup'));

export const FEES_GENERIC_EVENT_PARAMS = (isOpen: boolean): IEventParams => ({
    eventAction: EventActions.FullPriceBreakdown,
    eventCategory: EventCategories.Booking,
    eventLabel: isOpen ? 'Fees and taxes information (Agent only) clicked' : 'Close clicked',
    eventType: EventTypes.Interaction,
    eventValue: 'null',
});

const BookingDetails: FC<IBookingDetailsProps> = ({
    booking,
    disableTouristTax,
    className,
    hideTotalWhenCollapsed,
    fields,
    isPayRemaining,
    totalPriceLabel,
    alwaysShowPriceBreakdownWithPromo,
    promoCode,
}) => {
    const {
        getPhrase,
        isTradePortal,
        offer,
        bookingTransfer,
        paymentInfo,
        priceBreakdown,
        tradeAgentPriceBreakdown,
        totalAccomodationDiscount,
        trackEventWithParams,
        formatMoney,
        extraPriceBreakdown,
        isLuxuryPackage,
        isTouristTaxEnabled,
        isHolidayPackageCostHighlighted,
        flightPlusHotelDiscount,
        isFlightAndHotelPackage,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isTradePortal: stores.layoutStore.isTradePortal,
        offer: stores.bookingStore.selectedOffer,
        bookingTransfer: stores.bookingStore.transfer,
        paymentInfo: stores.bookingStore.paymentInfo,
        priceBreakdown: stores.bookingStore.priceBreakdown,
        tradeAgentPriceBreakdown: isTradeStore(stores) ? stores.bookingStore.tradeAgentPriceBreakdown : undefined,
        totalAccomodationDiscount: isTradeStore(stores) ? stores.bookingStore.totalAccomodationDiscount : undefined,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        formatMoney: stores.marketStore.formatMoney,
        extraPriceBreakdown: stores.bookingStore.packageInfo?.extraPriceBreakdown,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        isHolidayPackageCostHighlighted: stores.layoutStore.isHolidayPackageCostHighlighted,
        flightPlusHotelDiscount: stores.bookingStore.flightPlusHotelDiscount,
        isFlightAndHotelPackage: isHolidayStore(stores) && stores.bookingStore.isFlightAndHotelPackage,
    }));

    const [areDetailsShown, setAreDetailsShown] = useState(isTradePortal);
    const [isTradeAgentFeePopupShown, setIsTradeAgentFeePopupShown] = useState(false);
    const { touristTax, taxesAndFees } = getTouristTaxFieldsFromOffer(offer);
    const isTouristTaxContentShown = isTouristTaxEnabled && !disableTouristTax && touristTax !== INVALID_TAX_VALUE;
    const taxValue = getTouristTaxPrice(touristTax);
    const touristTaxTrigger = formatMoney(taxValue, { maximumFractionDigits: 0 });

    const { pushTrackingEvent } = usePaymentTracking();
    const fphData = useMemo(
        () => createFphData(getPhrase, isFlightAndHotelPackage, flightPlusHotelDiscount),
        [getPhrase, isFlightAndHotelPackage, flightPlusHotelDiscount],
    );

    const priceBreakdownValue = useMemo(() => {
        const breakdownValue = getPriceBreakdown(
            booking,
            extraPriceBreakdown,
            priceBreakdown,
            isTouristTaxContentShown,
            fphData,
        );

        const sortedPriceBreakdownValue = breakdownValue
            ?.flatMap((el: IExtraPriceBreakdown) => {
                if (el.subcategories && (Array.isArray(el.subcategories) || typeof el.subcategories === 'object')) {
                    return toJS(el.subcategories);
                }

                return [el];
            })
            .slice()
            // this sort allows us to put negative amount(such as discounts) in the end of displayable array
            .sort((a, b) => {
                if (a.amount < 0) return 1;

                if (b.amount < 0) return -1;

                return 0;
            });

        return areDetailsShown ? sortedPriceBreakdownValue : breakdownValue?.slice(0, 1);
    }, [extraPriceBreakdown, areDetailsShown, booking, priceBreakdown, isTouristTaxContentShown, fphData]);

    if (!offer && !booking) {
        return null;
    }

    const isBooking = !!booking;
    const accom = booking?.package.accom ?? offer?.accom;
    const transport = booking?.package.transport ?? offer?.transport;
    const seatSelection = booking?.seatSelection;
    const hotel = booking?.hotel ?? offer?.hotel;
    const parking = booking?.airportParking ?? offer?.airportParking;
    const transfer = booking?.transfers?.[0] ?? bookingTransfer;
    const paymentInfoValue = booking?.paymentInfo ?? paymentInfo;
    const currencyFormatOptions = {
        currency: paymentInfoValue?.currency,
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        signDisplay: SignDisplay.AUTO,
    } as ICurrencyFormatOptions;
    const board = isBooking
        ? booking.package?.accom?.rooms.map(x => x.boardType).filter(x => !!x)[0]
        : offer?.accom?.unit?.[0]?.boardType;

    const rooms = getRoomTypes(isBooking, accom);

    const guestsAmountByType = getGuestsAmountByType(booking, accom);
    const guestsAmount = getVisitorsAmount(guestsAmountByType);
    const paymentHistory = getPaymentHistory(isBooking, isPayRemaining, booking?.paymentInfo?.paymentHistory);

    const totalPriceLabelValue =
        totalPriceLabel ??
        getPhrase(
            isPayRemaining
                ? SitecoreDictionary.PaymentLabelsRemainingBalance
                : SitecoreDictionary.PaymentLabelsTotalPrice,
        );

    const getTotalPrice = (): number => {
        if (!paymentInfoValue) return 0;

        if (isBooking && isPayRemaining) return paymentInfoValue.balanceDueAmount;

        return paymentInfoValue.totalPrice;
    };
    const totalPrice = getTotalPrice();
    const totalPriceWithTax = isTouristTaxContentShown ? totalPrice + getTouristTaxPrice(taxValue) : totalPrice;

    const showPriceBreakdownWithPromo = alwaysShowPriceBreakdownWithPromo
        ? (priceBreakdownValue || []).some(price => price.code === PriceBreakdownCode.Promotions)
        : false;

    const includedFreeNights = getFreeNightsIncludedInOffer(offer);

    const isLuxuryPromo = isBooking ? containsLuxuryPromoCode(booking.promoCollections) : isLuxuryPackage;

    const toggleDetails = (): void => {
        setAreDetailsShown(prev => !prev);

        if (!areDetailsShown) {
            pushTrackingEvent(gaClickViewDetailsParams);
        }
    };

    const toggleTradeAgentFeePopup = (): void => {
        setIsTradeAgentFeePopupShown(prev => !prev);
        trackEventWithParams(
            EventTypes.GenericEvent,
            FEES_GENERIC_EVENT_PARAMS(isTradeAgentFeePopupShown),
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
    };

    const getPriceItemClassName = (price: IPriceBreakdownItem): string =>
        classNames('price-value', styles.priceBreakdown, price && price.amount < 0 && styles.priceValueLarge);

    const renderPriceBreakdown = (price: IPriceBreakdownItem, idx: number): JSX.Element => {
        const formattedPrice = formatMoney(price.amount ?? 0, currencyFormatOptions);

        return (
            <div key={idx} className={styles.listItem} data-tid='breakdown-item'>
                <span className={styles.priceBreakdownLabel} data-tid='breakdown-description'>
                    {price.name}
                    {price.code === PriceBreakdownCode.Promotions && promoCode && `: ${promoCode}`}
                </span>
                <span className={getPriceItemClassName(price)} data-tid='breakdown-price' data-cs-mask>
                    {price.code === PriceBreakdownCode.Kids
                        ? getPhrase(SitecoreDictionary.BoardTypesButtonsIncluded)
                        : formattedPrice}
                </span>
            </div>
        );
    };

    const renderPaymentHistory = (history: any, idx: number): JSX.Element => (
        <div key={idx} className={styles.listItem}>
            <span>
                {Tokenizer.replaceToken(
                    getPhrase(SitecoreDictionary.PaymentLabelsPaymentOn),
                    Tokens.Date,
                    formatDateL10n(history.paymentDate, DATE_FORMATS.dateWithAbbrMonthName),
                )}
            </span>
            <span className='price-value' data-cs-mask>
                - {formatMoney(history.amount, currencyFormatOptions)}
            </span>
        </div>
    );

    // type guard for fees popup
    const hasFeesPopup = (fields?: TBookingDetailsFields): fields is ITradePortalConfirmBookingDetailsFields =>
        !!fields && isTradePortal;

    const content = (
        <>
            <BookingDetailsExpanded
                rooms={rooms}
                transport={transport}
                seatSelection={seatSelection}
                hotel={hotel}
                isShown={areDetailsShown}
                onToggle={toggleDetails}
                transfer={transfer}
                board={board}
                fields={fields}
                lateRoomCheckout={offer?.lateRoomCheckout}
                guestsAmountByType={guestsAmountByType}
                extraLuggageItems={booking?.extraLuggageInfo?.items || offer?.extraLuggageInfo?.items || []}
                airportParking={parking}
                isLuxuryPackage={isLuxuryPromo}
            />
            {!isTradePortal && (
                <BookingDetailsCollapsed
                    transport={transport}
                    board={board}
                    hotel={hotel}
                    isShown={!areDetailsShown}
                    onToggle={toggleDetails}
                    transfer={transfer}
                    guestsAmount={guestsAmount}
                />
            )}

            {!(hideTotalWhenCollapsed && !areDetailsShown) && (
                <div
                    data-tid='booking-details-price-section'
                    className={classNames({ [styles.packageCostHighlightedWrapper]: isHolidayPackageCostHighlighted })}
                >
                    {!!priceBreakdownValue && (
                        <div className={styles.list}>
                            {showPriceBreakdownWithPromo
                                ? priceBreakdownValue.map((price, idx) => renderPriceBreakdown(price, idx))
                                : priceBreakdownValue.map((price, idx) =>
                                      price.code !== PriceBreakdownCode.Holiday &&
                                      price.code !== PriceBreakdownCode.FeesTaxes &&
                                      price.code !== PriceBreakdownCode.Promotions &&
                                      price.code !== PriceBreakdownCode.LateCheckout
                                          ? renderPriceBreakdown(price, idx)
                                          : areDetailsShown
                                          ? renderPriceBreakdown(price, idx)
                                          : null,
                                  )}

                            {areDetailsShown && (
                                <FlightPlusHotelDiscountPrice
                                    isFph={fphData.isFph}
                                    discount={fphData.discount}
                                    wrapperClassName={classNames(styles.listItem, styles.discountWrapper)}
                                    priceClassName={styles.discount}
                                    formattedDiscount={formatMoney(fphData.discount, currencyFormatOptions)}
                                />
                            )}

                            {areDetailsShown && includedFreeNights > 0 && (
                                <div className={styles.listItem}>
                                    <FreeNightsIncludedPill nights={includedFreeNights} />
                                </div>
                            )}
                        </div>
                    )}

                    {!!paymentHistory && !!booking && areDetailsShown && (
                        <div className={classNames(styles.list, styles.historyList)}>
                            <div className={styles.listItem}>
                                <span data-tid='breakdown-description'>
                                    {getPhrase(SitecoreDictionary.PaymentLabelsTotalPrice)}
                                </span>
                                <span className='price-value' data-cs-mask>
                                    {formatMoney(booking.paymentInfo.totalPrice, currencyFormatOptions)}
                                </span>
                            </div>
                            {paymentHistory.map((history, idx) => renderPaymentHistory(history, idx))}
                        </div>
                    )}

                    {paymentInfoValue && (
                        <>
                            {isTouristTaxContentShown && (
                                <>
                                    <div
                                        className={classNames(styles.taxBreakdownRow, styles.packageCost, {
                                            [styles.fullWidthSeparator]:
                                                !areDetailsShown || !priceBreakdownValue?.length,
                                        })}
                                        data-tid='booking-details-package-cost'
                                    >
                                        <RichTextDictionary
                                            className={classNames(styles.taxBreakdownLabel, styles.packageCostLabel, {
                                                [styles.fphPackageCost]: fphData.isFph,
                                            })}
                                            dictionaryKey={
                                                fphData.isFph
                                                    ? SitecoreDictionary.FlightPlusHotelPricesPackageCost
                                                    : SitecoreDictionary.TouristTaxLabelsHolidayPackageCost
                                            }
                                        />
                                        <div className={styles.taxValue}>{formatMoney(totalPrice)}</div>
                                    </div>
                                    <div className={styles.taxBreakdownRow} data-tid='booking-details-local-tax'>
                                        <RichTextDictionary
                                            className={styles.taxBreakdownLabel}
                                            dictionaryKey={SitecoreDictionary.TouristTaxLabelsLocalTaxes}
                                        />

                                        <div className={styles.taxPrice}>
                                            <TouristTaxPriceTooltip touristTax={touristTax} taxesAndFees={taxesAndFees}>
                                                <div className={styles.taxValue}>{touristTaxTrigger}</div>
                                            </TouristTaxPriceTooltip>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div
                                className={classNames(styles.paymentBookingTotal, {
                                    [styles.paymentBookingTotalOpened]: areDetailsShown,
                                })}
                                data-tid='booking-details-total-price'
                            >
                                <div>{totalPriceLabelValue}</div>
                                <div>
                                    <span data-tid='price-value-total' className={styles.bigPrice} data-cs-mask>
                                        <FormattedMoney
                                            amount={totalPriceWithTax}
                                            className='price-big__subtext'
                                            options={currencyFormatOptions}
                                        />
                                    </span>
                                </div>
                            </div>

                            {hasFeesPopup(fields) && fields.FeesAndTaxesLabel && (
                                <div
                                    className={classNames(
                                        'fees-popup-link no-print',
                                        areDetailsShown && styles.feesPopupLink,
                                    )}
                                >
                                    <Button isText onClick={toggleTradeAgentFeePopup}>
                                        {fields.FeesAndTaxesLabel.value}
                                    </Button>
                                </div>
                            )}

                            {hasFeesPopup(fields) && isTradeAgentFeePopupShown && (
                                <DynamicFeesPopupComponent
                                    onClose={toggleTradeAgentFeePopup}
                                    paymentInfo={paymentInfoValue}
                                    fields={fields}
                                    tradeAgentPriceBreakdown={tradeAgentPriceBreakdown}
                                    priceBreakdown={priceBreakdownValue}
                                    totalAccomodationDiscount={totalAccomodationDiscount}
                                    extras={getExtrasFromPriceBreakdown(extraPriceBreakdown)}
                                />
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );

    return isLuxuryPromo ? (
        <LuxuryWrapper label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}>{content}</LuxuryWrapper>
    ) : (
        <div className={classNames(styles.bookingDetails, areDetailsShown && styles.open, className)}>{content}</div>
    );
};

export default observer(BookingDetails);
