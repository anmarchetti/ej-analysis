import React, { useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTotalBookingRefund } from 'frontend/utils/viewBooking.utils';
import { IBookingRefund } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IRefundCardsFields } from 'frontend/components/renderings/CreditConfirm/CreditConfirm';
import PaymentMethodCard from 'frontend/components/renderings/Payment/components/PaymentMethodCard';

interface IRefundOptions {
    currency: CurrencyCode | undefined;
    fields: IRefundCardsFields;
    isCreditOnlyRefund: boolean;
    onChangeRefundType: (isCreditOnly: boolean) => void;
    refund: IBookingRefund;
}

const REFUND_INFO_POPUP_ID = 'refund-info-popup';

export const RefundOptions = ({ fields, refund, currency, isCreditOnlyRefund, onChangeRefundType }: IRefundOptions) => {
    const { getPhrase, isEditMode, formatMoney } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isEditMode: stores.layoutStore.isEditMode,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const [isRefundPopupShown, toggleRefundPopup] = useState(false);

    const creditField = !isEditMode
        ? {
              value: Tokenizer.replaceToken(
                  fields.CreditCardDescription?.value,
                  Tokens.CreditAmount,
                  `<strong data-cs-mask="true">${formatMoney(refund.credit.credit || 0, {
                      currency,
                      trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                  })}</strong>`,
              ),
          }
        : fields.CreditCardDescription;

    const refundField = !isEditMode
        ? {
              value: Tokenizer.replaceTokens(fields.RefundCardDescription?.value, {
                  [Tokens.CashAmount]: `<strong data-cs-mask="true">${formatMoney(refund.refund.cash || 0, {
                      currency,
                      trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                  })}</strong>`,
                  [Tokens.CreditAmount]: `<strong data-cs-mask="true">${formatMoney(refund.refund.credit || 0, {
                      currency,
                      trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                  })}</strong>`,
              }),
          }
        : fields.RefundCardDescription;

    /**
     * Open Refund Info Popup by clicking if target link has anchor to it
     */
    const onRefundLinkClick = (e: MouseEvent) => {
        const target = e.target as HTMLAnchorElement;
        const url = target ? target.dataset?.path ?? target.href : null;

        if (url === `#${REFUND_INFO_POPUP_ID}`) {
            e.stopPropagation();
            e.preventDefault();
            toggleRefundPopup(true);
        }
    };

    const renderBreakdown = (labelDictionary: string, value: number = 0, isTotal: boolean = false) => (
        <div className={classNames('refund-option-breakdown', isTotal && 'refund-option-breakdown--total')}>
            <div className='refund-option-breakdown__label'>{getPhrase(labelDictionary)}</div>
            <div className='refund-option-breakdown__value' data-cs-mask>
                {formatMoney(value, { currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger })}
            </div>
        </div>
    );

    return (
        <div className='refund-options'>
            <h2 className='credit-confirm__subtitle'>{getPhrase(SitecoreDictionary.CreditConfirmRefundCardsTitle)}</h2>
            <div className='payment-methods'>
                <PaymentMethodCard
                    checkboxId='credit-option'
                    title={getPhrase(SitecoreDictionary.CreditConfirmRefundCardsCreditCardTitle)}
                    isSelected={isCreditOnlyRefund}
                    onSelect={() => onChangeRefundType(true)}
                >
                    {creditField && (
                        <div data-cs-mask>
                            <RichTextWithLinks field={creditField} className='credit-description' />
                        </div>
                    )}
                    <div className='refund-option-breakdowns'>
                        {renderBreakdown(
                            SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount,
                            refund.credit.credit,
                        )}
                        {renderBreakdown(
                            SitecoreDictionary.CreditConfirmRefundCardsTotal,
                            getTotalBookingRefund(true, refund),
                            true,
                        )}
                    </div>
                </PaymentMethodCard>

                <PaymentMethodCard
                    checkboxId='refund-option'
                    title={getPhrase(SitecoreDictionary.CreditConfirmRefundCardsRefundCardTitle)}
                    isSelected={!isCreditOnlyRefund}
                    onSelect={() => onChangeRefundType(false)}
                >
                    {refundField && (
                        <RichTextWithLinks
                            field={refundField}
                            onLinkClick={onRefundLinkClick}
                            className='refund-description'
                        />
                    )}
                    <div className='refund-option-breakdowns'>
                        {renderBreakdown(
                            SitecoreDictionary.CreditConfirmRefundCardsCashRefundAmount,
                            refund.refund.cash,
                        )}
                        {renderBreakdown(
                            SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount,
                            refund.refund.credit,
                        )}
                        {renderBreakdown(
                            SitecoreDictionary.CreditConfirmRefundCardsTotal,
                            getTotalBookingRefund(false, refund),
                            true,
                        )}
                    </div>
                </PaymentMethodCard>
            </div>

            {isRefundPopupShown && (
                <Popup
                    showCloseButton
                    id={REFUND_INFO_POPUP_ID}
                    title={getPhrase(SitecoreDictionary.CreditConfirmRefundCardsRefundPopupTitle)}
                    onClose={() => toggleRefundPopup(false)}
                >
                    {fields.RefundPopupInfo && <RichTextWithLinks field={fields.RefundPopupInfo} />}
                </Popup>
            )}
        </div>
    );
};

export default observer(RefundOptions);
