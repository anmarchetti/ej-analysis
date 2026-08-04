import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { SignDisplay, TrailingZeroDisplay } from 'code/currency';
import { TIME_UNITS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import { IViewBookingsSitecoreFields } from 'frontend/components/renderings/RedeemVoucher/RedeemVoucher';

export interface IValidatedVoucherPopupProps {
    fields: IViewBookingsSitecoreFields;
}

const ValidatedVoucherPopup = ({ fields }: IValidatedVoucherPopupProps) => {
    const {
        getPhrase,
        userData,
        isScreenMedium,
        voucher,
        setValidatedVoucherPopupVisible,
        isValidatedVoucherPopupVisible,
        isVoucherCodeProcessing,
        redeemVoucher,
        formatMoney,
        marketCurrency,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        userData: stores.userStore.userData,
        isScreenMedium: stores.appStore.isScreenMedium,
        voucher: stores.redeemVoucherStore.voucher,
        setValidatedVoucherPopupVisible: stores.redeemVoucherStore.setValidatedVoucherPopupVisible,
        isValidatedVoucherPopupVisible: stores.redeemVoucherStore.isValidatedVoucherPopupVisible,
        isVoucherCodeProcessing: stores.redeemVoucherStore.isVoucherCodeProcessing,
        redeemVoucher: stores.redeemVoucherStore.redeemVoucher,
        formatMoney: stores.marketStore.formatMoney,
        marketCurrency: stores.marketStore.currency,
    }));

    if (!voucher) {
        return null;
    }

    const isVoucherFromAnotherMarket = voucher.currency !== marketCurrency;

    const goToFEQ = (e: MouseEvent) => {
        e.preventDefault();
        setValidatedVoucherPopupVisible(false);
        setTimeout(() => {
            const FQAElement = document.querySelector('.redeem-voucher__questions-title');
            FQAElement && scrollToElement(FQAElement as HTMLElement);
        }, TIME_UNITS.OneMillisecond);
    };

    const onApply = async () => {
        await redeemVoucher(voucher.voucherCode);
    };

    const renderContent = (
        <div>
            {fields.TitleValidatedPopup && <Text tag={'h3'} className='title' field={fields.TitleValidatedPopup} />}
            <div className='content'>
                {fields.VoucherWorthPopupLabel?.value && (
                    <RichTextWithLinks
                        tag='p'
                        className='text'
                        field={{
                            ...fields.VoucherWorthPopupLabel,
                            value: Tokenizer.replaceToken(
                                fields.VoucherWorthPopupLabel.value,
                                Tokens.Voucher,
                                voucher.voucherCode,
                            ),
                        }}
                    />
                )}

                {fields.VoucherCostPopupLabel?.value && (
                    <Text
                        tag='p'
                        className='voucher-cost'
                        field={{
                            ...fields.VoucherCostPopupLabel,
                            value: Tokenizer.replaceToken(
                                fields.VoucherCostPopupLabel.value,
                                Tokens.Price,
                                formatMoney(voucher.amount, {
                                    currency: voucher.currency,
                                    maximumFractionDigits: 0,
                                }),
                            ),
                        }}
                    />
                )}

                {isVoucherFromAnotherMarket && (
                    <RichTextWithLinks
                        dataId='message-for-voucher-with-different-currency'
                        field={fields.MessageForVoucherWithDifferentCurrency}
                        onLinkClick={goToFEQ}
                    />
                )}

                {fields.AddCredit?.value && (
                    <Text
                        tag='p'
                        className='text'
                        field={{
                            ...fields.VoucherWorthPopupLabel,
                            value: Tokenizer.replaceToken(fields.AddCredit.value, Tokens.Email, userData?.email || ''),
                        }}
                    />
                )}
            </div>
            <div className='credit-summary'>
                {voucher.userCurrentBalance ? (
                    <>
                        <div className='credit-summary__row credit-summary__new-credit'>
                            <div className='new-credit__label'>
                                {fields.VoucherName?.value && <RichTextWithLinks field={fields.VoucherName} />}
                            </div>
                            <span className='credit-summary__amount'>
                                {formatMoney(voucher.amount, {
                                    currency: voucher.currency,
                                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                    signDisplay: SignDisplay.Always,
                                })}
                            </span>
                        </div>
                        <div className='credit-summary__row credit-summary__previous-balance'>
                            <div>
                                {fields.PreviousCredit?.value && (
                                    <Text tag='span' className='label--bold' field={fields.PreviousCredit} />
                                )}
                                {fields.TooltipValidatedPopup?.value && (
                                    <Callout
                                        content={<RichTextWithLinks tag='div' field={fields.TooltipValidatedPopup} />}
                                        orientation={CalloutOrientation.Top}
                                        position={CalloutPosition.Center}
                                        isShownOnHover
                                    >
                                        <IconInfoCircle />
                                    </Callout>
                                )}
                            </div>
                            <span className='credit-summary__amount'>
                                {formatMoney(voucher.userCurrentBalance, {
                                    currency: voucher.currency,
                                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                })}
                            </span>
                        </div>
                    </>
                ) : null}

                <div className='credit-summary__row credit-summary__total'>
                    <Text field={fields.TotalCredit} tag='span' />
                    <span className='credit-summary__amount'>
                        {formatMoney(voucher.userNewBalance, {
                            currency: voucher.currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
    const buttons = (
        <>
            {!isVoucherCodeProcessing && (
                <Button
                    data-tid={'cancel-btn'}
                    onClick={() => setValidatedVoucherPopupVisible(false)}
                    isText
                    className='cancel-btn'
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                </Button>
            )}
            <Button onClick={() => onApply()} className='apply-btn' isLoading={isVoucherCodeProcessing}>
                {getPhrase(SitecoreDictionary.RedeemVoucherButtonsApplyHolidayCredit)}
            </Button>
        </>
    );

    return (
        <>
            {isScreenMedium ? (
                isValidatedVoucherPopupVisible ? (
                    <Popup
                        containerClass='redeem-popup voucher-validated-popup'
                        showCloseButton
                        onClose={() => setValidatedVoucherPopupVisible(false)}
                        footerContent={buttons}
                    >
                        {renderContent}
                    </Popup>
                ) : null
            ) : (
                <Drawer open={isValidatedVoucherPopupVisible} className='redeem-popup voucher-validated-popup'>
                    <div className='drawer__content'>{renderContent}</div>
                    <div className='drawer__actions'>{buttons}</div>
                </Drawer>
            )}
        </>
    );
};

export default observer(ValidatedVoucherPopup);
