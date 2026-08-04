import { FC, useEffect, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import isBackend from 'frontend/utils/isBackend';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import AmountForPay from 'frontend/components/common/AmountForPay';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconPen from 'frontend/components/icons-new/EditLine';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { IPaymentCreditFields } from 'frontend/components/renderings/Payment/interfaces';

import styles from './UseCredit.module.scss';

export interface IUseCreditProps {
    fields: IPaymentCreditFields | undefined;
    isDisabled?: boolean;
    rendering?: ISitecoreComponent['rendering'];
}

export const UseCredit: FC<IUseCreditProps> = ({ fields, isDisabled, rendering }) => {
    const {
        hasCredit,
        userCreditAmount,
        totalCreditAmount,
        isCreditUsed,
        usedCredit,
        isActive,
        userCreditError,
        currency,
        utiliseCredit,
        toggleUseCredit,
        editUseCredit,
        getPhrase,
        formatMoney,
        isPayBalancePage,
    } = useStore((stores: IHolidaysStores) => ({
        hasCredit: stores.payStore.hasCredit,
        userCreditAmount: stores.payStore.userCreditAmount,
        totalCreditAmount: stores.payStore.totalCreditAmount,
        isCreditUsed: stores.payStore.isCreditUsed,
        usedCredit: stores.payStore.usedCredit,
        isActive: stores.payStore.isUseCreditActive,
        userCreditError: stores.payStore.userCreditError,
        currency: stores.payStore.currency,
        utiliseCredit: stores.payStore.useCredit,
        toggleUseCredit: stores.payStore.toggleUseCredit,
        editUseCredit: stores.payStore.editUseCredit,
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        isPayBalancePage: stores.layoutStore.isPayBalancePage,
    }));

    const [amount, setAmount] = useState(0);

    const isApplyDisabled = amount <= 0;

    const onChangeAmount = (newAmount: number) => {
        setAmount(newAmount);
    };

    const onApply = () => {
        utiliseCredit(amount);
    };

    useEffect(() => {
        onChangeAmount(totalCreditAmount);
    }, [totalCreditAmount]);

    useEffect(() => {
        const disposer = reaction(
            () => isActive || isCreditUsed,
            isChecked => {
                if (!isChecked && amount !== totalCreditAmount) {
                    onChangeAmount(totalCreditAmount);
                }
            },
        );

        return () => {
            disposer();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, isCreditUsed, totalCreditAmount]);

    const { UseCreditTitle, UseCreditDescription, UseCreditFormTitle } = fields || {};

    const description = UseCreditDescription?.value
        ? {
              value:
                  Tokenizer.replaceToken(
                      UseCreditDescription.value,
                      Tokens.Amount,
                      formatMoney(userCreditAmount, { currency }),
                  ) ?? UseCreditDescription.value,
          }
        : UseCreditDescription;

    if (!hasCredit) {
        if (userCreditError) {
            return (
                <div className='rounded-container use-credit'>
                    <>
                        <div className='use-credit__header'>
                            <div className='use-credit__title'>
                                {getPhrase(SitecoreDictionary.HolidayCreditTitlesHolidayCredit)}
                            </div>
                        </div>

                        <>
                            <hr />
                            <div className='use-credit__error-desc'>
                                <i className='error-message__icon'>
                                    <SvgWarningFilled />
                                </i>{' '}
                                {getPhrase(SitecoreDictionary.HolidayCreditErrorMessagesCreditIsDisabled)}
                            </div>
                        </>
                    </>
                </div>
            );
        }

        return null;
    }

    const isVoucherRedeemedBookingFlow = sessionStorage.getItem(WebStorageKeys.IsVoucherRedeemedBookingFlow);

    return (
        <>
            {isVoucherRedeemedBookingFlow && !isBackend() && (
                <div className='credit-info-block'>
                    {fields?.IconCreditInfoBlock?.value && (
                        <JSSImage field={fields.IconCreditInfoBlock} className='credit-info-block__icon' />
                    )}
                    {fields?.TextCreditInfoBlock?.value && (
                        <RichTextWithLinks
                            className='credit-info-block__text'
                            field={fields.TextCreditInfoBlock}
                            tag='p'
                        />
                    )}
                </div>
            )}
            <div
                className={classNames(
                    'rounded-container use-credit',
                    isActive && 'use-credit--active',
                    isCreditUsed && 'use-credit--used',
                    isDisabled && 'use-credit--disabled',
                )}
            >
                <div className='use-credit__header' data-tid='use-credit-header'>
                    <div className='use-credit__title'>
                        <Checkbox
                            medium
                            tick
                            label={UseCreditTitle?.value ?? ''}
                            checked={isActive || isCreditUsed}
                            disabled={isDisabled}
                            onChange={toggleUseCredit}
                        />
                    </div>
                    {isCreditUsed && (
                        <div className='use-credit__manage' data-tid='use-credit-manage'>
                            <div className='use-credit__amount' data-cs-mask data-tid='use-credit-amount'>
                                {formatMoney(usedCredit, {
                                    currency,
                                })}
                            </div>
                            <Button isText onClick={editUseCredit} disabled={isDisabled}>
                                <IconPen />
                                <span>{getPhrase(SitecoreDictionary.PaymentButtonsEdit)}</span>
                            </Button>
                        </div>
                    )}
                </div>

                {!isCreditUsed && description && (
                    <div data-cs-mask>
                        <hr />
                        <RichTextWithLinks
                            tag='div'
                            className={classNames('use-credit__about', { 'pb-4': isActive })}
                            field={description}
                        />
                        {isPayBalancePage && (
                            <Placeholder
                                name={PlaceholderNames.CreditExpiresBanner}
                                rendering={rendering}
                                className={styles.expiresCreditBanner}
                                data-tid='credit-expire-banner-placeholder'
                            />
                        )}
                    </div>
                )}

                {(isActive || isCreditUsed) && (
                    <div className={classNames('use-credit__body', isCreditUsed && 'd-none')}>
                        <AmountForPay
                            fullAmount={totalCreditAmount}
                            residualBalance={0}
                            onAmountChange={onChangeAmount}
                            title={UseCreditFormTitle?.value ?? ''}
                            currency={currency}
                            hideTotalLabel
                            isCredit
                        />
                        <div className='use-credit__body__button'>
                            <Button isMedium onClick={onApply} disabled={isApplyDisabled}>
                                {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default observer(UseCredit);
