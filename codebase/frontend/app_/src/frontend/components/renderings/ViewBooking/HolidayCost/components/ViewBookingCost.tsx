import React, { FunctionComponent, useState } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ICurrencyFormatOptions, TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getValidBalanceDueDate } from 'frontend/utils/viewBooking.utils';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import FormattedMoney from 'frontend/components/common/FormattedMoney/FormattedMoney';
import HeaderTextWithIcon from 'frontend/components/common/HeaderTextWIthIcon/HeaderTextWithIcon';
import SvgCashLined from 'frontend/components/icons-new/Cash';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';
import { gaClickShowPriceBreakdown } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';
import { ViewBookingAnchors } from 'frontend/components/renderings/ViewBooking/components/ViewBookingNavigation/ViewBookingNavigation';
import styles from 'frontend/components/renderings/ViewBooking/HolidayCost/HolidayCost.module.scss';

import PriceBreakdown from './PriceBreakdown';
import RemainingBalance from './RemainingBalance';

interface IViewBookingCostProps {
    departureDate: string;
    isLoggedInUserLead: boolean;
    payBalance: () => void;
    paymentInfo: IPaymentInfo;
    priceBreakdown: IPriceBreakdownItem[];
    rendering?: ComponentRendering;
    showRemainingBalance?: boolean;
    subtitleClassName?: string;
    titleClassName?: string;
}

const ViewBookingCost: FunctionComponent<IViewBookingCostProps> = ({
    departureDate,
    paymentInfo,
    priceBreakdown,
    rendering,
    payBalance,
    isLoggedInUserLead,
    showRemainingBalance,
    subtitleClassName,
    titleClassName,
}) => {
    const { getPhrase, formatMoney, daysBeforeDepartureToShowReminder, isFlightAndHotelPackage } = useStore(
        (stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            formatMoney: stores.marketStore.formatMoney,
            daysBeforeDepartureToShowReminder: stores.layoutStore.daysBeforeDepartureToShowReminder,
            isFlightAndHotelPackage:
                stores.viewBookingStore.isFlightAndHotelPackage || stores.bookingStore.isFlightAndHotelPackage,
        }),
    );

    const { totalPrice, pricePP, paymentHistory, balanceDueDate, allowPayBalanceDueDate, balanceDueAmount, currency } =
        paymentInfo;
    const validBalanceDueDate: string = getValidBalanceDueDate(
        balanceDueDate,
        departureDate,
        daysBeforeDepartureToShowReminder,
    );
    const currencyFormatOptions = {
        currency,
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    } as ICurrencyFormatOptions;

    const [isExpanded, setExpanded] = useState(false);

    const { pushTrackingEvent } = usePaymentTracking();

    // Don't show 'Holiday' price breakdown (it duplicates total cost info)
    const priceBreakdownToShow = (priceBreakdown || []).filter(el => el.code !== PriceBreakdownCode.Holiday);

    const handleToggle = (): void => {
        if (!isExpanded) pushTrackingEvent(gaClickShowPriceBreakdown(currency));

        setExpanded(!isExpanded);
    };

    const renderFullDetails = (
        <div
            className={styles.details}
            id='booking-cost-details'
            data-tid='view-booking-cost-details'
            hidden={!isExpanded}
        >
            <div className={styles.tableRow}>
                <span data-tid='breakdown-label-total'>
                    {getPhrase(
                        isFlightAndHotelPackage
                            ? SitecoreDictionary.BookingPaymentLabelsTotalBookingCost
                            : SitecoreDictionary.BookingPaymentLabelsTotalCost,
                    )}
                </span>
                <span className='price' data-cs-mask>
                    {formatMoney(totalPrice, currencyFormatOptions)}
                </span>
            </div>
            {!!pricePP && pricePP !== totalPrice && (
                <div className={styles.tableRow}>
                    <span data-tid='breakdown-label-pp'>
                        {getPhrase(SitecoreDictionary.BookingPaymentLabelsPerPerson)}
                    </span>
                    <span className='price' data-cs-mask>
                        {formatMoney(pricePP, currencyFormatOptions)}
                    </span>
                </div>
            )}
            {priceBreakdownToShow.length > 0 && (
                <PriceBreakdown priceBreakdown={priceBreakdownToShow} currency={currency} />
            )}
            {paymentHistory && paymentHistory.length > 0 && rendering && (
                <Placeholder
                    name={PlaceholderNames.CardPayments}
                    rendering={rendering}
                    paymentHistory={paymentHistory}
                    currency={currency}
                    isLoggedInUserLead={isLoggedInUserLead}
                />
            )}
        </div>
    );

    return (
        <div
            className={styles.viewBookingCost}
            id={ViewBookingAnchors.HolidayCost.anchorId}
            data-tid='view-booking-cost'
        >
            <HeaderTextWithIcon
                Icon={SvgCashLined}
                title={getPhrase(
                    isFlightAndHotelPackage
                        ? SitecoreDictionary.BookingPaymentLabelsBookingCost
                        : SitecoreDictionary.BookingPaymentLabelsHolidayCost,
                )}
                titleClassName={titleClassName}
            />
            <div className={styles.table}>
                <div className={styles.headContainer}>
                    <div className={styles.head}>
                        <h3 className={styles.headTitle}>
                            {getPhrase(SitecoreDictionary.BookingPaymentLabelsPaymentDetails)}
                        </h3>
                        <Button
                            isLink
                            onClick={handleToggle}
                            className={classNames(styles.toggle, 'no-print')}
                            aria-expanded={isExpanded}
                            aria-controls='booking-cost-details'
                            dataTid='view-booking-cost-toggle'
                        >
                            {getPhrase(
                                isExpanded
                                    ? SitecoreDictionary.PaymentButtonsHideDetails
                                    : SitecoreDictionary.PaymentButtonsViewDetails,
                            )}
                            {isExpanded ? <SvgChevronUp /> : <SvgChevronDown />}
                        </Button>
                    </div>
                    {isFlightAndHotelPackage && (
                        <div className={styles.vat}>
                            {getPhrase(SitecoreDictionary.FlightPlusHotelPaymentReceiptPaymentBreakdown)}
                        </div>
                    )}
                </div>

                {renderFullDetails}
            </div>
            <div className={styles.total} data-tid='view-booking-cost-total-block'>
                <div>{getPhrase(SitecoreDictionary.BookingPaymentLabelsTotal)}</div>
                <div>
                    <span className='price-big' data-cs-mask data-tid='view-booking-cost-total-price'>
                        <FormattedMoney
                            amount={totalPrice}
                            className='price-big__subtext'
                            options={{ currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger }}
                        />
                    </span>
                </div>
            </div>
            {showRemainingBalance && (
                <RemainingBalance
                    balanceDueDate={validBalanceDueDate}
                    allowPayBalanceDueDate={allowPayBalanceDueDate}
                    departureDate={departureDate}
                    balanceDueAmount={balanceDueAmount}
                    payBalance={payBalance}
                    currency={currency}
                    subtitleClassName={subtitleClassName}
                />
            )}
        </div>
    );
};

export default observer(ViewBookingCost);
