import React, { useMemo } from 'react';
import classNames from 'classnames';

import { TrailingZeroDisplay } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import { gaClickPayDeposit, gaClickPayFullAmount } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';
import {
    getDepositDescriptionField,
    getFullPriceDescriptionField,
} from 'frontend/components/renderings/Payment/Payment.utils';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import PaymentMethodCard from './PaymentMethodCard';

export interface IPaymentMethodsProps {
    fields: IPaymentPageFields | undefined;
    isDisabled?: boolean;
}

export const PaymentMethods: React.FC<IPaymentMethodsProps> = ({ fields, isDisabled }) => {
    const {
        hasCredit,
        fullPrice,
        fullPricePP,
        depositPrice,
        defaultDepositPrice,
        isDeposit,
        selectFullPayment,
        selectDepositPayment,
        balanceDueDate,
        getPhrase,
        layout,
        currency,
        formatMoney,
        isTouristTaxEnabled,
        selectedOffer,
    } = useStore((stores: IHolidaysStores) => ({
        hasCredit: stores.payStore.hasCredit,
        fullPrice: stores.paymentStore.fullPrice,
        fullPricePP: stores.paymentStore.fullPricePP,
        depositPrice: stores.paymentStore.depositPrice,
        defaultDepositPrice: stores.marketStore.defaultDepositPrice,
        isDeposit: stores.paymentStore.isDeposit,
        selectFullPayment: stores.paymentStore.selectFullPayment,
        selectDepositPayment: stores.paymentStore.selectDepositPayment,
        balanceDueDate: stores.paymentStore.balanceDueDate,
        getPhrase: stores.layoutStore.getPhrase,
        layout: stores.layoutStore.layout,
        currency: stores.paymentStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        selectedOffer: stores.bookingStore.selectedOffer,
    }));
    const { pushTrackingEvent } = usePaymentTracking();

    const isPricePPShown = fullPrice !== fullPricePP;
    const touristTax = selectedOffer?.touristTax ?? 0;
    const isTaxDisplayed = isTouristTaxEnabled && touristTax > 0;

    const depositDescriptionField = useMemo((): ISitecoreField<string> => {
        const depositDescription = getDepositDescriptionField(isPricePPShown, isTaxDisplayed, fields);

        if (!layout.sitecore.context.pageEditing) {
            depositDescription.value =
                Tokenizer.replaceTokens(depositDescription.value, {
                    [Tokens.DepositPricePP]: defaultDepositPrice,
                    [Tokens.Amount]: formatMoney(fullPrice - depositPrice, {
                        currency,
                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                    }),
                    [Tokens.Date]: balanceDueDate ? formatDateL10n(balanceDueDate, DATE_FORMATS.L) : '',
                }) || depositDescription.value;
        }

        return depositDescription;
    }, [
        isTaxDisplayed,
        fields,
        isPricePPShown,
        fullPrice,
        depositPrice,
        defaultDepositPrice,
        layout,
        balanceDueDate,
        formatMoney,
        currency,
    ]);

    const payFullAmountDescription = getFullPriceDescriptionField(isTaxDisplayed, fields);

    const handleSelectDepositPayment = (): void => {
        if (!isDisabled) {
            pushTrackingEvent(gaClickPayDeposit);
            selectDepositPayment();
        }
    };

    const handleSelectFullPayment = (): void => {
        if (!isDisabled) {
            pushTrackingEvent(gaClickPayFullAmount);
            selectFullPayment();
        }
    };

    const renderPayDeposit = (): JSX.Element => (
        <PaymentMethodCard
            checkboxId={'pay-deposit'}
            title={getPhrase(SitecoreDictionary.PaymentLabelsPayWithDeposit)}
            isSelected={isDeposit}
            onSelect={handleSelectDepositPayment}
            key={'pay-deposit'}
            data-tid='pay-deposit'
        >
            {!balanceDueDate && (
                <ErrorMessage
                    message={getPhrase(SitecoreDictionary.PaymentTitlesPayWithDepositAttentionHeader)}
                    description={
                        fields?.PayWithDepositAttention ? (
                            <RichTextWithLinks field={fields.PayWithDepositAttention} tag='span' />
                        ) : undefined
                    }
                    icon={<IconInfoCircle />}
                    IsNotification
                />
            )}

            <div className='payment-details' data-cs-mask>
                <RichTextWithLinks className={'payment-description'} field={depositDescriptionField} />
                <div className='payment-sum' data-cs-mask>
                    <div className='price'>
                        <span className='price-big '>
                            {formatMoney(depositPrice, {
                                currency,
                                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                            })}
                            <span className='price-big__subtext' />
                        </span>
                    </div>
                    {isPricePPShown && (
                        <PriceLabel
                            tag='div'
                            className='price-sub'
                            price={defaultDepositPrice}
                            priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPerson}
                        />
                    )}
                </div>
            </div>
        </PaymentMethodCard>
    );

    const renderPayFull = (): JSX.Element => (
        <PaymentMethodCard
            checkboxId={'pay-full'}
            title={getPhrase(SitecoreDictionary.PaymentLabelsPayFullAmount)}
            isSelected={!isDeposit}
            onSelect={handleSelectFullPayment}
            key={'pay-full'}
            data-tid='pay-full'
        >
            <div className='payment-details'>
                <RichTextWithLinks className={'payment-description'} field={payFullAmountDescription} />
                <div className='payment-sum' data-cs-mask>
                    <div className='price'>
                        <span className='price-big '>
                            {formatMoney(fullPrice, {
                                currency,
                                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                            })}
                        </span>
                    </div>
                    {isPricePPShown && (
                        <PriceLabel
                            tag='div'
                            className='price-sub'
                            price={formatMoney(fullPricePP, {
                                currency,
                                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                            })}
                            priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPerson}
                        />
                    )}
                </div>
            </div>
        </PaymentMethodCard>
    );

    const wrapperClassname = classNames('payment-methods', isDisabled && 'is-disabled');
    const methods = hasCredit ? [renderPayFull(), renderPayDeposit()] : [renderPayDeposit(), renderPayFull()];

    return (
        <div className={wrapperClassname} data-tid='payment-methods-wrapper'>
            {methods}
        </div>
    );
};

export default PaymentMethods;
