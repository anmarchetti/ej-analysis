import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ICurrencyFormatOptions, TrailingZeroDisplay } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IOffer } from 'models/data/IOffer';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TradeAgentPriceBreakdownCode } from 'models/enum/TradeAgentPriceBreakdownCode';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { Popup } from 'frontend/components/common/Popup';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

import { getTouristTaxInfo } from './FeesPopup.utils';

import styles from './FeesPopup.module.scss';

export interface IFeesPopupFields {
    AccommodationLabel: ISitecoreField<string>;
    BalanceLabel: ISitecoreField<string>;
    CommissionLabel: ISitecoreField<string>;
    DepositLabel: ISitecoreField<string>;
    FeesAndTaxesLabel: ISitecoreField<string>;
    PopupTitle: ISitecoreField<string>;
    TotalPriceLabel: ISitecoreField<string>;
    VATOnCommissionLabel: ISitecoreField<string>;
}

interface IFeesPopupProps {
    fields: IFeesPopupFields | undefined;
    onClose: () => void;
    paymentInfo: IPaymentInfo;
    priceBreakdown: Nullable<IPriceBreakdownItem[]>;
    totalAccomodationDiscount: number | undefined;
    tradeAgentPriceBreakdown: Nullable<IPriceBreakdownItem[]>;
    extras?: Nullable<IPriceBreakdownItem>;
}

export const FeesPopup = ({
    onClose,
    paymentInfo,
    fields,
    totalAccomodationDiscount,
    tradeAgentPriceBreakdown,
    priceBreakdown,
    extras,
}: IFeesPopupProps) => {
    const { formatMoney, selectedOffer, totalPriceWithTouristTax, isTouristTaxEnabled, isPostBookingPages } = useStore(
        stores => ({
            formatMoney: stores.marketStore.formatMoney,
            selectedOffer: stores.bookingStore.selectedOffer,
            totalPriceWithTouristTax: stores.bookingStore.totalPriceWithTouristTax,
            isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled && !stores.layoutStore.isPostBookingPages,
            isPostBookingPages: stores.layoutStore.isPostBookingPages,
        }),
    );

    if (!paymentInfo && !fields) {
        return null;
    }

    const currencyOptions: ICurrencyFormatOptions = {
        currency: paymentInfo?.currency,
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    };
    const flightTax = tradeAgentPriceBreakdown?.find(price => price.code === TradeAgentPriceBreakdownCode.FlightTax);
    const packagePrice = tradeAgentPriceBreakdown?.find(
        price => price.code === TradeAgentPriceBreakdownCode.PackagePrice,
    );
    const promotionsPrice = priceBreakdown?.find(price => price.code === PriceBreakdownCode.Promotions);

    const {
        AccommodationLabel,
        BalanceLabel,
        CommissionLabel,
        DepositLabel,
        PopupTitle,
        TotalPriceLabel,
        VATOnCommissionLabel,
    } = fields || {};

    const totalPrice = isPostBookingPages ? paymentInfo.totalPrice : totalPriceWithTouristTax;
    const { touristTax, isTouristTaxDisplayed } = getTouristTaxInfo({
        offer: selectedOffer as IOffer,
        isTouristTaxEnabled,
    });

    return (
        <Popup containerClass='fees-popup' showCloseButton onClose={onClose} title={PopupTitle?.value}>
            <div className='items'>
                {!!packagePrice?.name && !!packagePrice?.amount && (
                    <p className='item'>
                        {packagePrice.name}
                        <span data-tid='package-price'>{formatMoney(packagePrice.amount, currencyOptions)}</span>
                    </p>
                )}
                {!!extras?.name && !!extras?.amount && (
                    <p className='item' data-tid='extras-item'>
                        {extras.name}
                        <span>{formatMoney(extras.amount, currencyOptions)}</span>
                    </p>
                )}
                {AccommodationLabel && !!totalAccomodationDiscount && (
                    <p className='item'>
                        <Text field={AccommodationLabel} />
                        <span className='discount' data-tid='accom-discount'>
                            -{formatMoney(totalAccomodationDiscount, currencyOptions)}
                        </span>
                    </p>
                )}
                {!!promotionsPrice && (
                    <p className='item'>
                        {promotionsPrice.name}
                        <span className='discount' data-tid='promo-discount'>
                            {formatMoney(promotionsPrice.amount, currencyOptions)}
                        </span>
                    </p>
                )}
                {!!flightTax?.name && !!flightTax?.amount && (
                    <p className='item'>
                        {flightTax.name}
                        <span data-tid='flight-tax'>{formatMoney(flightTax.amount, currencyOptions)}</span>
                    </p>
                )}

                {isTouristTaxDisplayed && (
                    <p className='item'>
                        <RichTextDictionary
                            tag='p'
                            className={styles.touristTaxLabel}
                            dictionaryKey={SitecoreDictionary.TouristTaxLabelsLocalTaxes}
                        />

                        <span data-tid='tourist-tax'>{formatMoney(touristTax, currencyOptions)}</span>
                    </p>
                )}

                <div className='check'>
                    {CommissionLabel && paymentInfo.agentComission && (
                        <p className='item'>
                            <Text field={CommissionLabel} />
                            <span data-tid='agent-commission'>
                                {formatMoney(paymentInfo.agentComission, currencyOptions)}
                            </span>
                        </p>
                    )}
                    {VATOnCommissionLabel && paymentInfo.commissionIncludingVat && (
                        <p className='item'>
                            <Text field={VATOnCommissionLabel} />
                            <span data-tid='commission-incl-vat'>
                                {formatMoney(paymentInfo.commissionIncludingVat, currencyOptions)}
                            </span>
                        </p>
                    )}
                    {DepositLabel && paymentInfo.depositDueDate && (
                        <p className='item'>
                            <Text field={DepositLabel} />(
                            {formatDateL10n(paymentInfo.depositDueDate, DATE_FORMATS.dateWithAbbrMonthName)})
                            <span data-tid='deposit-amount'>
                                {formatMoney(paymentInfo.depositPrice, currencyOptions)}
                            </span>
                        </p>
                    )}
                    {BalanceLabel && paymentInfo.balanceDueDate && (
                        <p className='item'>
                            <Text field={BalanceLabel} />(
                            {formatDateL10n(paymentInfo.balanceDueDate, DATE_FORMATS.dateWithAbbrMonthName)})
                            <span data-tid='due-amount'>
                                {formatMoney(paymentInfo.balanceDueAmount, currencyOptions)}
                            </span>
                        </p>
                    )}
                    {TotalPriceLabel && !!totalPrice && (
                        <p className='item'>
                            <Text field={TotalPriceLabel} />
                            <span data-tid='total-price'>{formatMoney(totalPrice, currencyOptions)}</span>
                        </p>
                    )}
                </div>
            </div>
        </Popup>
    );
};

export default FeesPopup;
