import React, { FC, useState } from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { calculatePriceBreakdown } from 'frontend/utils/priceBreakdown.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import { IFeesPopupFields } from 'frontend/components/renderings/FeesPopup/FeesPopup';
import { FEES_GENERIC_EVENT_PARAMS } from 'frontend/components/renderings/Payment/components/BookingDetails/BookingDetails';
import { ViewBookingAnchors } from 'frontend/components/renderings/ViewBooking/components/ViewBookingNavigation/ViewBookingNavigation';
import PriceBreakdown from 'frontend/components/renderings/ViewBooking/HolidayCost/components/PriceBreakdown';

import styles from './TradePortalViewBookingCost.module.scss';

type TTradePortalViewBookingCostProps = ISitecoreComponent<IFeesPopupFields> & {
    containerClassName?: string;
    titleClassName?: string;
};

const DynamicFeesPopupComponent = dynamic(() => import('frontend/components/renderings/FeesPopup/FeesPopup'));

const TradePortalViewBookingCost: FC<TTradePortalViewBookingCostProps> = ({
    fields,
    titleClassName,
    containerClassName,
}) => {
    const {
        getPhrase,
        booking,
        trackEventWithParams,
        totalAccomodationDiscount,
        formatMoney,
        formatMoneyToIntegerAndDecimal,
    } = useStore((stores: ITradePortalStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        totalAccomodationDiscount: stores.bookingStore.totalAccomodationDiscount,
        booking: stores.layoutStore.isConfirmationPage ? stores.bookingStore.booking : stores.viewBookingStore.booking,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        formatMoney: stores.marketStore.formatMoney,
        formatMoneyToIntegerAndDecimal: stores.marketStore.formatMoneyToIntegerAndDecimal,
    }));
    const [isTradeAgentFeePopupShown, setIsTradeAgentFeePopupShown] = useState(false);

    if (!fields || !booking) {
        return null;
    }

    const { FeesAndTaxesLabel } = fields;
    const { priceBreakdown, extraPriceBreakdown, tradeAgentPriceBreakdown, paymentInfo } = booking;
    const { totalPrice, pricePP, currency } = paymentInfo;

    // slicing the array in order not to get Holiday sorted
    const priceBreakdownValue = extraPriceBreakdown
        ? [...extraPriceBreakdown.slice(0, 1), ...calculatePriceBreakdown(extraPriceBreakdown.slice(1))]
        : [...priceBreakdown.slice(0, 1), ...calculatePriceBreakdown(priceBreakdown.slice(1))];

    const currencyFormatOptions = {
        currency,
        minimumFractionDigits: 2,
    };

    const [totalInteger, totalFractional] = formatMoneyToIntegerAndDecimal(totalPrice, currencyFormatOptions);

    const toggleTradeAgentFeePopup = (): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            FEES_GENERIC_EVENT_PARAMS(!isTradeAgentFeePopupShown),
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
        setIsTradeAgentFeePopupShown(!isTradeAgentFeePopupShown);
    };

    return (
        <div
            className={classNames(styles.tradePortalViewBookingCost, containerClassName)}
            id={ViewBookingAnchors.HolidayCost.anchorId}
            data-tid='trade-portal-view-booking-cost'
        >
            <h2 className={classNames(styles.title, titleClassName)} data-tid='trade-portal-view-booking-cost-title'>
                {getPhrase(SitecoreDictionary.BookingPaymentLabelsHolidayCost)}
            </h2>
            <div className={styles.table}>
                <div className={styles.details} id='booking-cost-details'>
                    {!!priceBreakdownValue && priceBreakdownValue.length > 0 && (
                        <PriceBreakdown
                            priceBreakdown={priceBreakdownValue}
                            currency={currency}
                            rowClassName={styles.tableRow}
                        />
                    )}
                </div>
            </div>
            <div className={styles.totalBlock}>
                <div className={styles.total}>
                    <div>{getPhrase(SitecoreDictionary.BookingPaymentLabelsTotal)}</div>
                    <div>
                        <span className='price-big'>
                            {totalInteger}
                            {totalFractional && <span className='price-big__subtext'>{totalFractional}</span>}
                        </span>
                    </div>
                </div>
                {!!FeesAndTaxesLabel?.value && (
                    <div className='fees-popup-link no-print'>
                        <Button isText onClick={toggleTradeAgentFeePopup}>
                            {FeesAndTaxesLabel.value}
                        </Button>
                    </div>
                )}
            </div>
            {isTradeAgentFeePopupShown && (
                <DynamicFeesPopupComponent
                    onClose={toggleTradeAgentFeePopup}
                    paymentInfo={paymentInfo}
                    fields={fields}
                    tradeAgentPriceBreakdown={tradeAgentPriceBreakdown}
                    priceBreakdown={priceBreakdown}
                    totalAccomodationDiscount={totalAccomodationDiscount}
                />
            )}
            {!!pricePP && pricePP !== totalPrice && (
                <div className={styles.details}>
                    <div className={styles.tableRow}>
                        <span data-tid='breakdown-label-pp'>
                            {getPhrase(SitecoreDictionary.BookingPaymentLabelsPerPerson)}
                        </span>
                        <span className='price'>{formatMoney(pricePP, currencyFormatOptions)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradePortalViewBookingCost;
