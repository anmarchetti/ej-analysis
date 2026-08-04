import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { CreditType } from 'models/enum/CreditType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import PaymentBaseOption from 'frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption';
import PaymentOptionBreakdown from 'frontend/components/common/PriceOptions/PaymentOptionBreakdown/PaymentOptionBreakdown';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import {
    getRefundPopupContent,
    getRefundPopupContentTrade,
    RefundPopups,
} from 'frontend/components/renderings/CancelBooking/CancelBooking.utils';
import RefundOptionPopup from 'frontend/components/renderings/CancelBooking/components/RefundOptionPopup/RefundOptionPopup';
import { IExplanationPopup } from 'frontend/components/renderings/CancelBooking/components/RefundOptions/RefundOptions';

import styles from './RefundOptionsOTUC.module.scss';

export interface IRefundOption {
    CashLabel: ISitecoreField<string>;
    CreditLabel: ISitecoreField<string>;
    OptionTitle: ISitecoreField<string>;
    Popups: ISitecoreChildren<IExplanationPopup>[];
    RefundUniqueId: ISitecoreField<string>;
    TotalLabel: ISitecoreField<string>;
}

export interface IRefundOptionsOTUCFields {
    Children: ISitecoreChildren<IRefundOption>[];
    DepositOnlyCloseToDepartureDescription: ISitecoreField<string>;
    DepositOnlyPaidDescription: ISitecoreField<string>;
    NoPaymentMadeDescription: ISitecoreField<string>;
    NoRefundDescription: ISitecoreField<string>;
    NoRefundTitle: ISitecoreField<string>;
    PaidLessThanTotalChargeDescription: ISitecoreField<string>;
}

export type TRefundOptionsProps = {
    fields: IRefundOptionsOTUCFields;
};

export const RefundOptionsOTUC: FC<TRefundOptionsProps> = ({ fields }) => {
    const {
        selectedRefundType,
        setSelectedRefundType,
        cancellationSummary,
        booking,
        allowRefundsForXOrMoreDaysBeforeDeparture,
        formatMoney,
        depositPerPassenger,
        getPhrase,
        isTradePortal,
        isFlightAndHotelPackage,
    } = useStore((stores: TStores) => ({
        selectedRefundType: stores.holidayCreditStore.selectedRefundOTUC,
        setSelectedRefundType: stores.holidayCreditStore.setSelectedRefundOTUC,
        cancellationSummary: stores.holidayCreditStore.cancellationSummary,
        booking: stores.holidayCreditStore.booking,
        allowRefundsForXOrMoreDaysBeforeDeparture: isHolidayStore(stores)
            ? stores.layoutStore.allowRefundsForXOrMoreDaysBeforeDeparture
            : 0,
        formatMoney: stores.marketStore.formatMoney,
        depositPerPassenger: stores.holidayCreditStore.depositPerPassenger,
        getPhrase: stores.layoutStore.getPhrase,
        isTradePortal: stores.layoutStore.isTradePortal,
        isFlightAndHotelPackage: isHolidayStore(stores) ? stores.holidayCreditStore.isFlightAndHotelPackage : false,
    }));

    if (!cancellationSummary || !booking) return null;

    const popupType = isTradePortal
        ? getRefundPopupContentTrade(cancellationSummary, booking.paymentInfo.depositPrice)
        : getRefundPopupContent(
              cancellationSummary,
              booking.paymentInfo,
              allowRefundsForXOrMoreDaysBeforeDeparture,
              cancellationSummary.isDestinationRulesApplied,
              isFlightAndHotelPackage,
          );

    if (
        [
            RefundPopups.FlightPlusHotelNonRefundable,
            RefundPopups.DepositLess60Days,
            RefundPopups.DepositFullOTUC,
            RefundPopups.TradeBookingNoPaymentMade,
            RefundPopups.TradeBookingDepositOnlyPaid,
            RefundPopups.TradeBookingPaidLessThanTotalCharge,
        ].includes(popupType)
    ) {
        const price = formatMoney(depositPerPassenger, {
            currency: booking.paymentInfo.currency,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });
        const pricePP = Tokenizer.replaceToken(
            getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
            Tokens.Price,
            price,
        );

        const getContent = (): string => {
            switch (popupType) {
                case RefundPopups.TradeBookingNoPaymentMade:
                    return fields.NoPaymentMadeDescription.value;
                case RefundPopups.TradeBookingDepositOnlyPaid:
                    return fields.DepositOnlyPaidDescription.value;
                case RefundPopups.TradeBookingPaidLessThanTotalCharge:
                    return fields.PaidLessThanTotalChargeDescription.value;
                case RefundPopups.DepositLess60Days:
                    return fields.DepositOnlyCloseToDepartureDescription.value;
                default:
                    return fields.NoRefundDescription.value;
            }
        };

        const content = {
            value: Tokenizer.replaceToken(getContent(), Tokens.DepositPricePP, pricePP),
        };

        return (
            <div className={styles.infoContainer} data-tid='no-refund-block'>
                <div className={styles.infoTitleContainer}>
                    <IconInfoCircle />
                    <Text
                        field={fields.NoRefundTitle}
                        tag='h4'
                        className={styles.infoTitle}
                        data-tid='no-refund-title'
                    />
                </div>
                <RichTextWithLinks field={content} className={styles.text} dataId='no-refund-text' />
            </div>
        );
    }

    if (!cancellationSummary.refunds.length || !fields.Children.length) return null;

    const { refunds, currency } = cancellationSummary;
    const refundCurrency = CurrencyCode[currency];

    return (
        <div className={styles.sizeContainer} data-tid='refund-options'>
            <div className={styles.container}>
                {refunds.map(refund => {
                    let refundType;
                    const refundContent = fields.Children.find(content => {
                        refundType = CreditType[content.fields.RefundUniqueId.value];

                        return refundType === refund.refundOption;
                    });

                    if (!refundContent?.fields) return null;

                    const { OptionTitle, TotalLabel, CreditLabel, CashLabel, Popups } = refundContent.fields;

                    const { credit, oneTimeUseCredit, originalPayment } = refund;
                    const creditTotal = credit + oneTimeUseCredit;
                    const popup = Popups.find(popup => popup.fields?.PopupUniqueId?.value === popupType);

                    return (
                        <PaymentBaseOption
                            key={refundType}
                            checkboxId={`refund-option-${refundType}`}
                            title={OptionTitle.value}
                            isSelected={selectedRefundType?.refundOption === refundType}
                            onChange={(): void => setSelectedRefundType(refund)}
                            price={refund.total}
                            priceDescription={TotalLabel.value}
                            currency={refundCurrency}
                        >
                            <div className={styles.breakdowns}>
                                {creditTotal > 0 && (
                                    <PaymentOptionBreakdown
                                        label={CreditLabel.value}
                                        value={creditTotal}
                                        className={styles.option}
                                        currency={refundCurrency}
                                    />
                                )}
                                {!!originalPayment && originalPayment > 0 && (
                                    <PaymentOptionBreakdown
                                        label={CashLabel.value}
                                        value={originalPayment}
                                        className={styles.option}
                                        currency={refundCurrency}
                                    />
                                )}
                                {popup && <RefundOptionPopup fields={popup.fields} />}
                            </div>
                        </PaymentBaseOption>
                    );
                })}
            </div>
        </div>
    );
};

export default observer(RefundOptionsOTUC);
